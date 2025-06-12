import mongoose from 'mongoose';

const policySchema = new mongoose.Schema({
  policyId: { type: String, required: true, unique: true },
  customeNumber: { type: String, required: true },   // (Spelling issue, maybe meant 'customerNumber')
  duratiorName: { type: String, required: true },    // (Spelling issue, maybe meant 'duration' or 'customerName')
  vehiclen: { type: String, required: true },         // (Spelling issue, should be 'vehicleNumber')
  startDate: { type: Date, required: true },
  expiryDate: { type: Date, required: true },
  status: { type: String, required: true }
});


export default mongoose.model('Policy', policySchema);
