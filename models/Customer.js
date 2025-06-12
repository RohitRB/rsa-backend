import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  vehicleNumber: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);
