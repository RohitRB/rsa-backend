// controllers/confirmationController.js (UPDATED - Complete replacement)
import db from '../config/firebase.js'; // <-- ADDED: Import db directly
import { v4 as uuidv4 } from 'uuid'; // Keep UUID for policy number generation

// Create confirmation
export const createConfirmation = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const confirmationsCollection = db.collection('confirmations');
    const customersCollection = db.collection('customers');
    
    const { policyType, amount, expiryDate, customerId } = req.body;
    let policyNumber = 'RSA-' + uuidv4().split('-')[0].toUpperCase(); // Use let to allow regeneration

    // Validate required fields
    if (!policyType || !amount || !expiryDate || !customerId) {
        return res.status(400).json({ error: 'Policy type, amount, expiry date, and customer ID are required.' });
    }

    // Basic validation: Check if customerId actually exists
    const customerDoc = await customersCollection.doc(customerId).get();
    if (!customerDoc.exists) {
        return res.status(404).json({ message: 'Provided customerId does not exist.' });
    }

    const newConfirmationData = {
      policyNumber,
      policyType,
      amount: Number(amount), // Ensure amount is a number
      expiryDate: new Date(expiryDate), // Convert to Date object
      paymentDate: new Date(), // Set current date as default
      customerId: customerId, // Store just the ID string
      createdAt: new Date(), // Manually add timestamp
      updatedAt: new Date()  // Manually add timestamp
    };

    // Check for unique policyNumber before creating (simple retry for uniqueness)
    // In a production app, you might want a more robust unique ID generation or transaction.
    let attempt = 0;
    const MAX_ATTEMPTS = 5; // To prevent infinite loops in case of very high collision rate
    while (attempt < MAX_ATTEMPTS) {
        const existingConfirmation = await confirmationsCollection.where('policyNumber', '==', newConfirmationData.policyNumber).limit(1).get();
        if (existingConfirmation.empty) {
            break; // Unique policyNumber found
        }
        // If not unique, regenerate and try again
        newConfirmationData.policyNumber = 'RSA-' + uuidv4().split('-')[0].toUpperCase();
        console.warn(`Duplicate policy number '${policyNumber}' found, regenerating to '${newConfirmationData.policyNumber}'`);
        policyNumber = newConfirmationData.policyNumber; // Update original variable as well
        attempt++;
        if (attempt === MAX_ATTEMPTS) {
             return res.status(500).json({ error: 'Failed to generate a unique policy number after multiple attempts.' });
        }
    }

    const docRef = await confirmationsCollection.add(newConfirmationData); // Add new document
    const savedConfirmation = { id: docRef.id, ...newConfirmationData }; // Include Firestore-generated ID

    res.status(201).json(savedConfirmation);
  } catch (err) {
    console.error('Error creating confirmation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all confirmations
export const getAllConfirmations = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const confirmationsCollection = db.collection('confirmations');
    const customersCollection = db.collection('customers');
    
    const snapshot = await confirmationsCollection.orderBy('paymentDate', 'desc').get(); // Sort by payment date, latest first
    const confirmations = [];

    for (const doc of snapshot.docs) {
      const confirmationData = { id: doc.id, ...doc.data() };
      // Manually "populate" customerId
      if (confirmationData.customerId) {
        const customerDoc = await customersCollection.doc(confirmationData.customerId).get();
        if (customerDoc.exists) {
          confirmationData.customerDetails = { id: customerDoc.id, ...customerDoc.data() }; // Use customerDetails or similar key
          // You might want to remove the raw customerId if you only want the populated data
          // delete confirmationData.customerId;
        } else {
          // If customer not found, set customerDetails to null and keep customerId
          confirmationData.customerDetails = null;
        }
      }
      confirmations.push(confirmationData);
    }
    res.status(200).json(confirmations);
  } catch (err) {
    console.error('Error fetching all confirmations:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get confirmation by ID
export const getConfirmationById = async (req, res) => {
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

    const confirmationData = { id: confirmationDoc.id, ...confirmationDoc.data() };

    // Manually "populate" customerId
    if (confirmationData.customerId) {
      const customerDoc = await customersCollection.doc(confirmationData.customerId).get();
      if (customerDoc.exists) {
        confirmationData.customerDetails = { id: customerDoc.id, ...customerDoc.data() }; // Use customerDetails
        // delete confirmationData.customerId;
      } else {
        confirmationData.customerDetails = null;
      }
    }
    res.status(200).json(confirmationData);
  } catch (err) {
    console.error('Error fetching confirmation by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

// Update confirmation
export const updateConfirmation = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const confirmationsCollection = db.collection('confirmations');
    const customersCollection = db.collection('customers');
    
    const confirmationId = req.params.id;
    const updates = { ...req.body, updatedAt: new Date() }; // Add update timestamp

    // If customerId is being updated, validate it
    if (updates.customerId) {
        const customerDoc = await customersCollection.doc(updates.customerId).get();
        if (!customerDoc.exists) {
            return res.status(404).json({ message: 'Provided customerId for update does not exist.' });
        }
    }

    const confirmationDocRef = confirmationsCollection.doc(confirmationId);
    const confirmationDoc = await confirmationDocRef.get();

    if (!confirmationDoc.exists) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }

    await confirmationDocRef.update(updates); // Update the document

    // Fetch the updated document to return the latest data (and re-populate customer if needed)
    const updatedConfirmationDoc = await confirmationDocRef.get();
    const updatedConfirmationData = { id: updatedConfirmationDoc.id, ...updatedConfirmationDoc.data() };

    if (updatedConfirmationData.customerId) {
      const customerDoc = await customersCollection.doc(updatedConfirmationData.customerId).get();
      if (customerDoc.exists) {
        updatedConfirmationData.customerDetails = { id: customerDoc.id, ...customerDoc.data() };
      } else {
        updatedConfirmationData.customerDetails = null;
      }
    }

    res.status(200).json(updatedConfirmationData);
  } catch (err) {
    console.error('Error updating confirmation:', err);
    res.status(500).json({ error: err.message });
  }
};

// Delete confirmation
export const deleteConfirmation = async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const confirmationsCollection = db.collection('confirmations');
    const confirmationId = req.params.id;
    const confirmationDocRef = confirmationsCollection.doc(confirmationId);
    const confirmationDoc = await confirmationDocRef.get();

    if (!confirmationDoc.exists) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }

    await confirmationDocRef.delete(); // Delete the document
    res.status(200).json({ message: 'Confirmation deleted successfully' });
  } catch (err) {
    console.error('Error deleting confirmation:', err);
    res.status(500).json({ error: err.message });
  }
};