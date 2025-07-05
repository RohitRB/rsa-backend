// controllers/policyController.js (UPDATED)
import db from '../config/firebase.js'; // <-- CHANGED: Import db directly here

// ✅ 1. Manually Create Policy
export const createPolicy = async (req, res) => { // <-- CHANGED: Export directly
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    console.log('creating policy ');

    // Calculate policy dates automatically
    const purchaseDate = new Date(); // Current date as purchase date
    const startDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from purchase
    const expiryDate = new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from start date

    const newPolicyData = {
      policyId: req.body.policyId,
      customerNumber: req.body.customerNumber,
      customerName: req.body.customerName,
      vehicleNumber: req.body.vehicleNumber,
      purchaseDate: purchaseDate, // Store purchase date
      startDate: startDate, // Auto-calculated: 30 days from purchase
      expiryDate: expiryDate, // Auto-calculated: 1 year from start date
      status: req.body.status || 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!newPolicyData.policyId || !newPolicyData.customerNumber || !newPolicyData.customerName || !newPolicyData.vehicleNumber) {
      return res.status(400).json({ error: 'Missing required policy fields: policyId, customerNumber, customerName, vehicleNumber.' });
    }

    const existingPolicy = await policiesCollection.where('policyId', '==', newPolicyData.policyId).limit(1).get();
    if (!existingPolicy.empty) {
        return res.status(409).json({ error: 'Policy with this ID already exists.' });
    }

    const docRef = await policiesCollection.add(newPolicyData);
    const savedPolicy = { id: docRef.id, ...newPolicyData };

    console.log("policy created with auto-calculated dates");
    res.status(201).json(savedPolicy);
  } catch (err) {
    console.error('Error creating policy:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 2. Get all finalized policies
export const getAllPolicies = async (req, res) => { // <-- CHANGED: Export directly
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    const customersCollection = db.collection('customers');
    
    // Get all policies and filter active ones in memory to avoid index requirement
    const snapshot = await policiesCollection
      .orderBy('createdAt', 'desc')
      .get();
    
    const policies = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(policy => policy.status === 'Active'); // Filter active policies in memory
    
    // Fetch customer details for each policy
    const policiesWithCustomerDetails = await Promise.all(
      policies.map(async (policy) => {
        let customerDetails = {
          customerName: policy.customerName || 'N/A',
          phoneNumber: policy.customerNumber || policy.phoneNumber || 'N/A',
          email: 'N/A',
          address: 'N/A',
          city: 'N/A',
          amount: policy.amount || 'N/A'
        };

        // Try to fetch customer details if customerId exists
        if (policy.customerId) {
          try {
            const customerDoc = await customersCollection.doc(policy.customerId).get();
            if (customerDoc.exists) {
              const customerData = customerDoc.data();
              customerDetails = {
                customerName: customerData.customerName || policy.customerName || 'N/A',
                phoneNumber: customerData.phoneNumber || policy.customerNumber || 'N/A',
                email: customerData.email || 'N/A',
                address: customerData.address || 'N/A',
                city: customerData.city || 'N/A',
                amount: policy.amount || customerData.amount || 'N/A'
              };
            }
          } catch (error) {
            console.log(`Error fetching customer details for policy ${policy.id}:`, error.message);
          }
        }

        return {
          ...policy,
          ...customerDetails
        };
      })
    );
    
    res.status(200).json(policiesWithCustomerDetails);
  } catch (err) {
    console.error('Error fetching all policies:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 3. Get policy preview by confirmation ID (used before finalize)
export const getPolicyPreview = async (req, res) => { // <-- CHANGED: Export directly
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const confirmationsCollection = db.collection('confirmations');
    const customersCollection = db.collection('customers');
    
    const confirmationId = req.params.id;
    const confirmationDoc = await confirmationsCollection.doc(confirmationId).get();

    if (!confirmationDoc.exists) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }

    const confirmationData = confirmationDoc.data();
    if (!confirmationData.customerId) {
      return res.status(400).json({ message: 'Confirmation missing customer ID.' });
    }

    const customerDoc = await customersCollection.doc(confirmationData.customerId).get();
    if (!customerDoc.exists) {
      return res.status(404).json({ message: 'Customer associated with confirmation not found.' });
    }

    const customerData = customerDoc.data();

    const { policyNumber, expiryDate, paymentDate } = confirmationData;
    const { customerName, vehicleNumber } = customerData;

    const start = new Date(paymentDate);
    const end = new Date(expiryDate);
    const durationYears = end.getFullYear() - start.getFullYear();

    const previewData = {
      policyId: policyNumber,
      customerName,
      vehicleNumber,
      duration: `${durationYears} Years`,
      startDate: paymentDate,
      expiryDate: expiryDate,
      status: 'Active'
    };

    res.status(200).json(previewData);
  } catch (err) {
    console.error('Error getting policy preview:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 4. Finalize: Move from Confirmation → Policy (archive style)
export const finalizePolicy = async (req, res) => { // <-- CHANGED: Export directly
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    const confirmationsCollection = db.collection('confirmations');
    const customersCollection = db.collection('customers');
    
    console.log("📥 Finalizing policy...");

    const confirmationId = req.params.id;
    const confirmationDoc = await confirmationsCollection.doc(confirmationId).get();

    if (!confirmationDoc.exists) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }

    const confirmationData = confirmationDoc.data();
    if (!confirmationData.customerId) {
      return res.status(400).json({ message: 'Confirmation missing customer ID.' });
    }

    const customerDoc = await customersCollection.doc(confirmationData.customerId).get();
    if (!customerDoc.exists) {
      return res.status(404).json({ message: 'Customer associated with confirmation not found.' });
    }

    const customerData = customerDoc.data();

    const { policyNumber } = confirmationData;
    const { customerName, vehicleNumber } = customerData;

    // Calculate policy dates automatically
    const purchaseDate = new Date(); // Current date as purchase date
    const startDate = new Date(purchaseDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from purchase
    const expiryDate = new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year from start date

    const policyData = {
      policyId: policyNumber,
      customerNumber: customerData.phoneNumber, // Assuming phoneNumber is customerNumber
      customerName: customerName,
      vehicleNumber: vehicleNumber,
      purchaseDate: purchaseDate, // Store purchase date
      startDate: startDate, // Auto-calculated: 30 days from purchase
      expiryDate: expiryDate, // Auto-calculated: 1 year from start date
      status: req.body.status || "Active",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingPolicy = await policiesCollection.where('policyId', '==', policyData.policyId).limit(1).get();
    if (!existingPolicy.empty) {
        return res.status(409).json({ error: 'Policy with this ID already exists. Cannot finalize.' });
    }

    const policyDocRef = await policiesCollection.add(policyData);
    const finalizedPolicy = { id: policyDocRef.id, ...policyData };

    await confirmationsCollection.doc(confirmationId).delete();

    res.status(201).json(finalizedPolicy);
  } catch (err) {
    console.error('Error finalizing policy:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 5. Update policy by ID
export const updatePolicy = async (req, res) => { // <-- CHANGED: Export directly
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    const policyId = req.params.id;
    const updates = { ...req.body, updatedAt: new Date() };

    const policyDocRef = policiesCollection.doc(policyId);
    const policyDoc = await policyDocRef.get();

    if (!policyDoc.exists) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    await policyDocRef.update(updates);

    const updatedPolicyDoc = await policyDocRef.get();
    res.status(200).json({ id: updatedPolicyDoc.id, ...updatedPolicyDoc.data() });
  } catch (err) {
    console.error('Error updating policy:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 6. Delete policy by Policy Number (not document ID)
export const deletePolicy = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    const policyNumber = req.params.id; // This is the policy number like "RSA-250703181340-114"

    console.log('🔍 Searching for policy with policyId:', policyNumber);

    // First, let's get all policies to debug
    const allPoliciesSnapshot = await policiesCollection.get();
    const allPolicies = allPoliciesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('📊 Total policies in database:', allPolicies.length);
    console.log('📋 Available policyIds:', allPolicies.map(p => p.policyId));
    console.log('📋 Available policyNumbers:', allPolicies.map(p => p.policyNumber));
    console.log('📋 Available policy_ids:', allPolicies.map(p => p.policy_id));

    // Try to find policy by multiple possible field names
    let policyQuery = await policiesCollection
      .where('policyId', '==', policyNumber)
      .limit(1)
      .get();

    if (policyQuery.empty) {
      // Try policyNumber field
      policyQuery = await policiesCollection
        .where('policyNumber', '==', policyNumber)
        .limit(1)
        .get();
    }

    if (policyQuery.empty) {
      // Try policy_id field
      policyQuery = await policiesCollection
        .where('policy_id', '==', policyNumber)
        .limit(1)
        .get();
    }

    if (policyQuery.empty) {
      // Enhanced debugging - check all possible field names
      const exactMatchPolicyId = allPolicies.find(p => p.policyId === policyNumber);
      const exactMatchPolicyNumber = allPolicies.find(p => p.policyNumber === policyNumber);
      const exactMatchPolicy_id = allPolicies.find(p => p.policy_id === policyNumber);
      
      const caseInsensitiveMatchPolicyId = allPolicies.find(p => 
        p.policyId && p.policyId.toLowerCase() === policyNumber.toLowerCase()
      );
      const caseInsensitiveMatchPolicyNumber = allPolicies.find(p => 
        p.policyNumber && p.policyNumber.toLowerCase() === policyNumber.toLowerCase()
      );
      
      console.log('❌ Policy not found with any field name');
      console.log('🔍 Exact match policyId:', exactMatchPolicyId ? 'Found' : 'Not found');
      console.log('🔍 Exact match policyNumber:', exactMatchPolicyNumber ? 'Found' : 'Not found');
      console.log('🔍 Exact match policy_id:', exactMatchPolicy_id ? 'Found' : 'Not found');
      
      // Return the first case-insensitive match if found
      if (caseInsensitiveMatchPolicyId && !exactMatchPolicyId) {
        return res.status(404).json({ 
          message: 'Policy found but case mismatch in policyId field. Please check the exact policy ID.',
          foundPolicyId: caseInsensitiveMatchPolicyId.policyId,
          requestedPolicyId: policyNumber
        });
      }

      if (caseInsensitiveMatchPolicyNumber && !exactMatchPolicyNumber) {
        return res.status(404).json({ 
          message: 'Policy found but case mismatch in policyNumber field. Please check the exact policy ID.',
          foundPolicyNumber: caseInsensitiveMatchPolicyNumber.policyNumber,
          requestedPolicyNumber: policyNumber
        });
      }

      return res.status(404).json({ 
        message: 'Policy not found. It may have already been deleted.',
        searchedPolicyId: policyNumber,
        availablePolicyIds: allPolicies.map(p => p.policyId).filter(Boolean),
        availablePolicyNumbers: allPolicies.map(p => p.policyNumber).filter(Boolean),
        availablePolicy_ids: allPolicies.map(p => p.policy_id).filter(Boolean)
      });
    }

    const policyDoc = policyQuery.docs[0];
    const policyId = policyDoc.id; // Get the Firestore document ID

    console.log('✅ Policy found:', policyDoc.data());

    // Delete the policy
    await policiesCollection.doc(policyId).delete();

    res.status(200).json({ 
      message: 'Policy deleted successfully',
      deletedPolicyId: policyId,
      deletedPolicyNumber: policyNumber
    });
  } catch (err) {
    console.error('Error deleting policy:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 7. Debug: Get all policies (including inactive) for troubleshooting
export const getAllPoliciesDebug = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    const snapshot = await policiesCollection
      .orderBy('createdAt', 'desc')
      .get();
    
    const policies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({
      totalPolicies: policies.length,
      activePolicies: policies.filter(p => p.status === 'Active').length,
      inactivePolicies: policies.filter(p => p.status !== 'Active').length,
      policies: policies
    });
  } catch (err) {
    console.error('Error fetching all policies (debug):', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ 8. Find specific policy by policyId for debugging
export const findPolicyById = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    const policyNumber = req.params.id;

    console.log('🔍 Searching for policy with policyId:', policyNumber);

    // Get all policies to debug
    const allPoliciesSnapshot = await policiesCollection.get();
    const allPolicies = allPoliciesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Find exact match in different field names
    const exactMatchPolicyId = allPolicies.find(p => p.policyId === policyNumber);
    const exactMatchPolicyNumber = allPolicies.find(p => p.policyNumber === policyNumber);
    const exactMatchPolicy_id = allPolicies.find(p => p.policy_id === policyNumber);
    
    // Find case-insensitive match
    const caseInsensitiveMatchPolicyId = allPolicies.find(p => 
      p.policyId && p.policyId.toLowerCase() === policyNumber.toLowerCase()
    );
    const caseInsensitiveMatchPolicyNumber = allPolicies.find(p => 
      p.policyNumber && p.policyNumber.toLowerCase() === policyNumber.toLowerCase()
    );

    // Find partial match
    const partialMatches = allPolicies.filter(p => 
      (p.policyId && p.policyId.includes(policyNumber)) ||
      (p.policyNumber && p.policyNumber.includes(policyNumber)) ||
      (p.policy_id && p.policy_id.includes(policyNumber))
    );

    res.status(200).json({
      searchedPolicyId: policyNumber,
      totalPolicies: allPolicies.length,
      exactMatchPolicyId: exactMatchPolicyId || null,
      exactMatchPolicyNumber: exactMatchPolicyNumber || null,
      exactMatchPolicy_id: exactMatchPolicy_id || null,
      caseInsensitiveMatchPolicyId: caseInsensitiveMatchPolicyId || null,
      caseInsensitiveMatchPolicyNumber: caseInsensitiveMatchPolicyNumber || null,
      partialMatches: partialMatches,
      allPolicyIds: allPolicies.map(p => p.policyId).filter(Boolean),
      allPolicyNumbers: allPolicies.map(p => p.policyNumber).filter(Boolean),
      allPolicy_ids: allPolicies.map(p => p.policy_id).filter(Boolean)
    });
  } catch (err) {
    console.error('Error finding policy:', err);
    res.status(500).json({ error: err.message });
  }
};