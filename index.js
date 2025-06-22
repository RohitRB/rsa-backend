// index.js (UPDATED with Payment Verification and Firestore Saving, Razorpay Keys from Env)
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

// Razorpay setup - CRITICAL: Using environment variables only
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

// Check if Razorpay keys are available
if (!razorpayKeyId || !razorpayKeySecret) {
  console.error('❌ Razorpay keys are missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  console.error('The app will start but payment features will be disabled.');
  // Don't exit - let the app start for health checks
}

let razorpay = null;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.log('⚠️ Razorpay not initialized - payment features disabled');
}

// IMPORTANT: Define environment variables RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on Railway
// DO NOT hardcode these values in the source code


// Existing /create-order endpoint (creates a Razorpay order, sends amount in paisa)
app.post('/create-order', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        error: 'Payment service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.' 
      });
    }

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
    res.status(500).json({ error: `Something went wrong on the server: ${error.message}` });
  }
});

// NEW: Endpoint to verify payment and save policy/customer to Firestore
app.post('/api/payments/verify-and-save', async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        success: false, 
        message: 'Payment service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.' 
      });
    }

    if (!db) {
      return res.status(503).json({ 
        success: false, 
        message: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

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
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', razorpayKeySecret) // Use the same variable
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
      customerName: customerData.customerName,
      vehicleNumber: customerData.vehicleNumber,
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

// Admin Dashboard endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database service is not configured. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.' 
      });
    }

    const policiesCollection = db.collection('policies');
    const customersCollection = db.collection('customers');
    
    // Get all policies and customers
    const policiesSnapshot = await policiesCollection.get();
    const customersSnapshot = await customersCollection.get();
    
    const policies = [];
    const customers = [];
    
    policiesSnapshot.forEach(doc => {
      policies.push({ id: doc.id, ...doc.data() });
    });
    
    customersSnapshot.forEach(doc => {
      customers.push({ id: doc.id, ...doc.data() });
    });
    
    // Calculate stats
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    const activePolicies = policies.filter(policy => 
      policy.status === 'Active' && 
      new Date(policy.expiryDate) > today
    );
    
    const expiringPolicies = policies.filter(policy => {
      const expiryDate = new Date(policy.expiryDate);
      return expiryDate > today && expiryDate <= thirtyDaysFromNow;
    });
    
    const expiredPolicies = policies.filter(policy => 
      new Date(policy.expiryDate) <= today
    );
    
    // Get recent policies (last 5)
    const recentPolicies = policies
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(policy => ({
        _id: policy.id,
        policyId: policy.policyNumber || policy.id,
        customerName: policy.customerName || 'N/A',
        vehicleNumber: policy.vehicleNumber || 'N/A',
        startDate: policy.startDate || new Date(),
        expiryDate: policy.expiryDate || new Date(),
        status: policy.status || 'Active'
      }));
    
    const dashboardData = {
      totalPolicies: policies.length,
      activePolicies: activePolicies.length,
      expiringPolicies: expiringPolicies.length,
      expiredPolicies: expiredPolicies.length,
      totalCustomers: customers.length,
      recentPolicies: recentPolicies
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Use routes directly, as 'db' is now imported within controllers
app.use('/api/customers', customerRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/confirmations', confirmationRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});