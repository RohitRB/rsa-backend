// controllers/customerController.js (UPDATED)
import db from '../config/firebase.js'; // <-- CHANGED: Import db directly here

const customersCollection = db.collection('customers'); // Reference to your Firestore collection

// Create a new customer
export const createCustomer = async (req, res) => { // <-- CHANGED: Export directly
  try {
    const newCustomerData = {
      customerName: req.body.customerName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address || '',
      city: req.body.city || '',
      vehicleNumber: req.body.vehicleNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (!newCustomerData.customerName || !newCustomerData.email || !newCustomerData.phoneNumber || !newCustomerData.vehicleNumber) {
      return res.status(400).json({ error: 'Customer name, email, phone number, and vehicle number are required.' });
    }

    const docRef = await customersCollection.add(newCustomerData);
    const savedCustomer = { id: docRef.id, ...newCustomerData };

    res.status(201).json(savedCustomer);
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all customers
export const getCustomers = async (req, res) => { // <-- CHANGED: Export directly
  try {
    const snapshot = await customersCollection.orderBy('createdAt', 'desc').get();
    const customers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get single customer by ID
export const getCustomerById = async (req, res) => { // <-- CHANGED: Export directly
  try {
    const customerId = req.params.id;
    const customerDoc = await customersCollection.doc(customerId).get();

    if (!customerDoc.exists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.status(200).json({ id: customerDoc.id, ...customerDoc.data() });
  } catch (err) {
    console.error('Error fetching customer by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update customer
export const updateCustomer = async (req, res) => { // <-- CHANGED: Export directly
  try {
    const customerId = req.params.id;
    const updates = { ...req.body, updatedAt: new Date() };

    const customerDocRef = customersCollection.doc(customerId);
    const customerDoc = await customerDocRef.get();

    if (!customerDoc.exists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customerDocRef.update(updates);

    const updatedCustomerDoc = await customerDocRef.get();
    res.status(200).json({ id: updatedCustomerDoc.id, ...updatedCustomerDoc.data() });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => { // <-- CHANGED: Export directly
  try {
    const customerId = req.params.id;
    const customerDocRef = customersCollection.doc(customerId);
    const customerDoc = await customerDocRef.get();

    if (!customerDoc.exists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await customerDocRef.delete();
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: err.message });
  }
};