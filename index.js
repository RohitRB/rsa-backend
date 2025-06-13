// index.js (UPDATED)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import connectDB from './config/db.js';
import db from './config/firebase.js'; // <-- CHANGED: Import db directly
import customerRoutes from './routes/customerRoutes.js';
import confirmationRoutes from './routes/confirmationRoutes.js';
import policyRoutes from './routes/policyRoutes.js';
import Razorpay from 'razorpay';


dotenv.config();

// The Firebase Admin SDK is now initialized and 'db' is available via import
// const db = connectFirebase(); // <-- REMOVED: No longer call connectFirebase here

const app = express();
app.use(cors());
app.use(express.json());

// Razorpay setup (unchanged)
const razorpay = new Razorpay({
  key_id: 'rzp_live_yYGWUPovOauhOx',
  key_secret: 'm5wQh8cIXTJ92UJeoHhwtLxa',
});

app.post('/create-order', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    console.log('✅ Order created:', order);
    res.json(order);
  } catch (error) {
    console.error('❌ Failed to create Razorpay order:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.get('/', (req, res) => {
  res.send('Firebase backend is running!');
});

// Use routes directly, as 'db' is now imported within controllers
app.use('/api/customers', customerRoutes); // <-- CHANGED: No longer pass db here
app.use('/api/policies', policyRoutes);   // <-- CHANGED: No longer pass db here
app.use('/api/confirmations', confirmationRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});