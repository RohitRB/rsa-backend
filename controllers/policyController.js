// controllers/policyController.js (UPDATED)
// No longer import Mongoose models here (Policy, Customer, Confirmation)

// This file now exports a function that accepts 'db' (Firestore instance)
// and returns an object containing the controller functions.
const policyController = (db) => {
  const policiesCollection = db.collection('policies'); // Reference to your Firestore policies collection
  const customersCollection = db.collection('customers'); // Reference to your Firestore customers collection
  const confirmationsCollection = db.collection('confirmations'); // Reference to your Firestore confirmations collection

  // ✅ 1. Manually Create Policy
  const createPolicy = async (req, res) => {
    try {
      console.log('creating policy ');

      // Firestore document structure for a new policy, correcting field names
      const newPolicyData = {
        policyId: req.body.policyId,
        customerNumber: req.body.customerNumber, // Corrected from customeNumber
        customerName: req.body.customerName, // Corrected from duratiorName
        vehicleNumber: req.body.vehicleNumber, // Corrected from vehiclen
        startDate: new Date(req.body.startDate),
        expiryDate: new Date(req.body.expiryDate),
        status: req.body.status || 'Active', // Default to Active if not provided
        createdAt: new Date(), // Manually add timestamp
        updatedAt: new Date()  // Manually add timestamp
      };

      // Basic validation for required fields
      if (!newPolicyData.policyId || !newPolicyData.customerNumber || !newPolicyData.customerName || !newPolicyData.vehicleNumber || !newPolicyData.startDate || !newPolicyData.expiryDate) {
        return res.status(400).json({ error: 'Missing required policy fields: policyId, customerNumber, customerName, vehicleNumber, startDate, expiryDate.' });
      }

      // Check for unique policyId before creating
      const existingPolicy = await policiesCollection.where('policyId', '==', newPolicyData.policyId).limit(1).get();
      if (!existingPolicy.empty) {
          return res.status(409).json({ error: 'Policy with this ID already exists.' });
      }

      const docRef = await policiesCollection.add(newPolicyData); // Add new document
      const savedPolicy = { id: docRef.id, ...newPolicyData }; // Include Firestore-generated ID

      console.log("policy created");
      res.status(201).json(savedPolicy);
    } catch (err) {
      console.error('Error creating policy:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // ✅ 2. Get all finalized policies
  const getAllPolicies = async (req, res) => {
    try {
      // Get all documents from the 'policies' collection, sorted by creation time
      const snapshot = await policiesCollection.orderBy('createdAt', 'desc').get();
      const policies = snapshot.docs.map(doc => ({
        id: doc.id, // Firestore document ID
        ...doc.data() // The document's data
      }));
      res.status(200).json(policies);
    } catch (err) {
      console.error('Error fetching all policies:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // ✅ 3. Get policy preview by confirmation ID (used before finalize)
  const getPolicyPreview = async (req, res) => {
    try {
      const confirmationId = req.params.id;
      const confirmationDoc = await confirmationsCollection.doc(confirmationId).get();

      if (!confirmationDoc.exists) {
        return res.status(404).json({ message: 'Confirmation not found' });
      }

      const confirmationData = confirmationDoc.data();
      // Ensure confirmationData.customerId is a string ID
      if (!confirmationData.customerId) {
        return res.status(400).json({ message: 'Confirmation missing customer ID.' });
      }

      const customerDoc = await customersCollection.doc(confirmationData.customerId).get();
      if (!customerDoc.exists) {
        return res.status(404).json({ message: 'Customer associated with confirmation not found.' });
      }

      const customerData = customerDoc.data();

      const { policyNumber, expiryDate, paymentDate } = confirmationData;
      const { customerName, vehicleNumber } = customerData; // From the fetched customer data

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
  const finalizePolicy = async (req, res) => {
    try {
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

      // Check for unique policyId before finalizing
      const existingPolicy = await policiesCollection.where('policyId', '==', policyData.policyId).limit(1).get();
      if (!existingPolicy.empty) {
          return res.status(409).json({ error: 'Policy with this ID already exists. Cannot finalize.' });
      }

      const policyDocRef = await policiesCollection.add(policyData); // Add new policy document
      const finalizedPolicy = { id: policyDocRef.id, ...policyData };

      // Archive: Delete confirmation entry
      await confirmationsCollection.doc(confirmationId).delete();

      res.status(201).json(finalizedPolicy);
    } catch (err) {
      console.error('Error finalizing policy:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // ✅ 5. Update policy by ID
  const updatePolicy = async (req, res) => {
    try {
      const policyId = req.params.id; // This is the Firestore document ID for the policy
      const updates = { ...req.body, updatedAt: new Date() };

      const policyDocRef = policiesCollection.doc(policyId);
      const policyDoc = await policyDocRef.get();

      if (!policyDoc.exists) {
        return res.status(404).json({ message: 'Policy not found' });
      }

      await policyDocRef.update(updates); // Update the document

      // Fetch the updated document to return the latest data
      const updatedPolicyDoc = await policyDocRef.get();
      res.status(200).json({ id: updatedPolicyDoc.id, ...updatedPolicyDoc.data() });
    } catch (err) {
      console.error('Error updating policy:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // Export the controller functions
  return {
    createPolicy,
    getAllPolicies,
    getPolicyPreview,
    finalizePolicy,
    updatePolicy
  };
};

export default policyController; // <-- CHANGED: Export the function