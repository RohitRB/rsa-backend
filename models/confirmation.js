import mongoose from 'mongoose';

const confirmationSchema = new mongoose.Schema({
  policyNumber: { type: String, required: true, unique: true },
  policyType: { type: String, required: true },
  amount: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  paymentDate: { type: Date, default: Date.now },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true }
}, { timestamps: true });

export default mongoose.model('Confirmation', confirmationSchema);
