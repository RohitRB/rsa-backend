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

    const newPolicyData = {
      policyId: req.body.policyId,
      customerNumber: req.body.customerNumber,
      customerName: req.body.customerName,
      vehicleNumber: req.body.vehicleNumber,
      startDate: new Date(req.body.startDate),
      expiryDate: new Date(req.body.expiryDate),
      status: req.body.status || 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!newPolicyData.policyId || !newPolicyData.customerNumber || !newPolicyData.customerName || !newPolicyData.vehicleNumber || !newPolicyData.startDate || !newPolicyData.expiryDate) {
      return res.status(400).json({ error: 'Missing required policy fields: policyId, customerNumber, customerName, vehicleNumber, startDate, expiryDate.' });
    }

    const existingPolicy = await policiesCollection.where('policyId', '==', newPolicyData.policyId).limit(1).get();
    if (!existingPolicy.empty) {
        return res.status(409).json({ error: 'Policy with this ID already exists.' });
    }

    const docRef = await policiesCollection.add(newPolicyData);
    const savedPolicy = { id: docRef.id, ...newPolicyData };

    console.log("policy created");
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
    // Only get active policies
    const snapshot = await policiesCollection
      .where('status', '==', 'Active')
      .orderBy('createdAt', 'desc')
      .get();
    const policies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(policies);
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

    const { policyNumber, expiryDate, paymentDate } = confirmationData;
    const { customerName, vehicleNumber } = customerData;

    const durationYears = new Date(expiryDate).getFullYear() - new Date(paymentDate).getFullYear();

    const policyData = {
      policyId: policyNumber,
      customerNumber: customerData.phoneNumber, // Assuming phoneNumber is customerNumber
      customerName: customerName,
      vehicleNumber: vehicleNumber,
      duration: `${durationYears} Years`,
      startDate: paymentDate,
      expiryDate: expiryDate,
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

    // Find policy by policyId (policy number)
    const policyQuery = await policiesCollection
      .where('policyId', '==', policyNumber)
      .limit(1)
      .get();

    if (policyQuery.empty) {
      return res.status(404).json({ message: 'Policy not found. It may have already been deleted.' });
    }

    const policyDoc = policyQuery.docs[0];
    const policyId = policyDoc.id; // Get the Firestore document ID

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