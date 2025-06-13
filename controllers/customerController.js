// controllers/customerController.js (UPDATED)
// No longer import Customer from '../models/Customer.js';

// This file now exports a function that accepts 'db' (Firestore instance)
// and returns an object containing the controller functions.
const customerController = (db) => {
  const customersCollection = db.collection('customers'); // Reference to your Firestore collection

  // Create a new customer
  const createCustomer = async (req, res) => {
    try {
      const newCustomerData = {
        customerName: req.body.customerName,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address || '', // Provide default or handle if optional
        city: req.body.city || '',
        vehicleNumber: req.body.vehicleNumber,
        createdAt: new Date(), // Manually add timestamp
        updatedAt: new Date()  // Manually add timestamp
      };

      // Basic validation (Firestore doesn't do schema validation automatically)
      if (!newCustomerData.customerName || !newCustomerData.email || !newCustomerData.phoneNumber || !newCustomerData.vehicleNumber) {
        return res.status(400).json({ error: 'Customer name, email, phone number, and vehicle number are required.' });
      }

      // Add a new document to the 'customers' collection
      const docRef = await customersCollection.add(newCustomerData);
      const savedCustomer = { id: docRef.id, ...newCustomerData }; // Add the Firestore-generated ID

      res.status(201).json(savedCustomer);
    } catch (err) {
      console.error('Error creating customer:', err); // Log the full error for debugging
      res.status(500).json({ error: err.message });
    }
  };

  // Get all customers
  const getCustomers = async (req, res) => {
    try {
      // Get all documents from the 'customers' collection
      // .orderBy('createdAt', 'desc') for sorting by creation time, latest first
      const snapshot = await customersCollection.orderBy('createdAt', 'desc').get();
      const customers = snapshot.docs.map(doc => ({
        id: doc.id, // Firestore document ID
        ...doc.data() // The document's data
      }));
      res.status(200).json(customers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // Get single customer by ID
  const getCustomerById = async (req, res) => {
    try {
      const customerId = req.params.id;
      const customerDoc = await customersCollection.doc(customerId).get(); // Get a single document by ID

      if (!customerDoc.exists) { // Check if the document exists
        return res.status(404).json({ message: 'Customer not found' });
      }

      res.status(200).json({ id: customerDoc.id, ...customerDoc.data() });
    } catch (err) {
      console.error('Error fetching customer by ID:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // Update customer
  const updateCustomer = async (req, res) => {
    try {
      const customerId = req.params.id;
      const updates = { ...req.body, updatedAt: new Date() }; // Add update timestamp

      // Check if the document exists first (optional, but good practice for updates)
      const customerDocRef = customersCollection.doc(customerId);
      const customerDoc = await customerDocRef.get();

      if (!customerDoc.exists) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      await customerDocRef.update(updates); // Update the document

      // Fetch the updated document to return the latest data
      const updatedCustomerDoc = await customerDocRef.get();
      res.status(200).json({ id: updatedCustomerDoc.id, ...updatedCustomerDoc.data() });
    } catch (err) {
      console.error('Error updating customer:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // Delete customer
  const deleteCustomer = async (req, res) => {
    try {
      const customerId = req.params.id;
      const customerDocRef = customersCollection.doc(customerId);
      const customerDoc = await customerDocRef.get(); // Check if exists

      if (!customerDoc.exists) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      await customerDocRef.delete(); // Delete the document
      res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (err) {
      console.error('Error deleting customer:', err);
      res.status(500).json({ error: err.message });
    }
  };

  // Export the controller functions
  return {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
  };
};

export default customerController; // <-- CHANGED: Export the function