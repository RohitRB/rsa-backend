// index.js (UPDATED with Payment Verification and Firestore Saving)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './config/firebase.js'; // Firestore DB instance
import customerRoutes from './routes/customerRoutes.js';
import confirmationRoutes from './routes/confirmationRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import Razorpay from 'razorpay';
import crypto from 'crypto'; // Import crypto for signature verification

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Razorpay setup
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Use environment variable for key_id
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Use environment variable for key_secret
});

// IMPORTANT: Define environment variables RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on Render/Vercel backend
// RAZORPAY_KEY_ID = rzp_live_yYGWUPovOauhOx
// RAZORPAY_KEY_SECRET = m5wQh8cIXTJ92UJeoHhwtLxa


// Existing /create-order endpoint (creates a Razorpay order, sends amount in paisa)
app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body; // Amount received in Rupees from frontend
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const options = {
      amount: Math.round(amount * 100), // Convert to paisa and round to nearest integer
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    console.log('✅ Order created:', order);
    res.json(order);
  } catch (error) {
    console.error('❌ Failed to create Razorpay order:', error);
    res.status(500).json({ error: 'Something went wrong on the server' });
  }
});

// NEW: Endpoint to verify payment and save policy/customer to Firestore
app.post('/api/payments/verify-and-save', async (req, res) => {
  console.log('Received verification request:', req.body);
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    policyData, // Full policy object from frontend
    customerData // Full customer object from frontend
  } = req.body;

  // Basic validation
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !policyData || !customerData) {
    console.log('Missing verification fields');
    return res.status(400).json({ success: false, message: 'Missing payment verification details or policy/customer data.' });
  }

  // --- 1. Verify Payment Signature ---
  try {
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                .update(body.toString())
                                .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.log('Payment signature mismatch (unauthentic)');
      return res.status(400).json({ success: false, message: 'Payment verification failed: Signature mismatch.' });
    }

    console.log('✅ Payment signature verified successfully!');

    // --- 2. Save Customer to Firestore (or update if exists) ---
    const customersCollection = db.collection('customers');
    let customerDocRef;
    let existingCustomerSnapshot = await customersCollection
      .where('phoneNumber', '==', customerData.phoneNumber)
      .limit(1)
      .get();

    if (existingCustomerSnapshot.empty) {
      // Customer does not exist, create new
      const newCustomerEntry = {
        ...customerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      customerDocRef = await customersCollection.add(newCustomerEntry);
      console.log('✅ New customer added to Firestore:', customerDocRef.id);
    } else {
      // Customer exists, update existing one
      customerDocRef = existingCustomerSnapshot.docs[0].ref;
      await customerDocRef.update({ ...customerData, updatedAt: new Date() });
      console.log('✅ Existing customer updated in Firestore:', customerDocRef.id);
    }

    // --- 3. Save Policy to Firestore ---
    const policiesCollection = db.collection('policies');
    const newPolicyEntry = {
      ...policyData, // Use the policyData passed from frontend
      customerId: customerDocRef.id, // Link policy to customer
      razorpay_payment_id,
      razorpay_order_id,
      status: 'Active', // Explicitly set status to Active on successful payment
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const policyDocRef = await policiesCollection.add(newPolicyEntry);
    console.log('✅ New policy added to Firestore:', policyDocRef.id);

    // --- 4. Trigger Email Sending (Will be implemented in a later step) ---
    // Placeholder for email logic
    console.log('📧 Email sending logic placeholder.');

    // --- 5. Trigger PDF Generation (Will be implemented in a later step) ---
    // Placeholder for PDF logic
    console.log('📄 PDF generation logic placeholder.');


    res.status(200).json({
      success: true,
      message: 'Payment verified and policy saved successfully!',
      policyId: policyDocRef.id,
      customerId: customerDocRef.id
    });

  } catch (error) {
    console.error('❌ Error during payment verification or saving policy:', error);
    res.status(500).json({ success: false, message: `Payment verification or saving failed: ${error.message}` });
  }
});

app.get('/', (req, res) => {
  res.send('Firebase backend is running!');
});

// Use routes directly, as 'db' is now imported within controllers
app.use('/api/customers', customerRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/confirmations', confirmationRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
