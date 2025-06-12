import Policy from '../models/Policy.js';
import Customer from '../models/Customer.js';
import Confirmation from '../models/confirmation.js';

// ✅ 1. Manually Create Policy
export const createPolicy = async (req, res) => {
  try {
    console.log('creating policy ')
    const newPolicy = new Policy(req.body);
    const saved = await newPolicy.save();
    console.log("policy created")
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ 2. Get all finalized policies
export const getAllPolicies = async (req, res) => {
  try {
    const policies = await Policy.find().sort({ createdAt: -1 });
    res.status(200).json(policies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 3. Get policy preview by confirmation ID (used before finalize)
export const getPolicyPreview = async (req, res) => {
  try {
    const confirmation = await Confirmation.findById(req.params.id).populate('customerId');
    if (!confirmation) return res.status(404).json({ message: 'Confirmation not found' });

    const { policyNumber, expiryDate, paymentDate } = confirmation;
    const { customerName, vehicleNumber } = confirmation.customerId;

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
    res.status(500).json({ error: err.message });
  }
};

// ✅ 4. Finalize: Move from Confirmation → Policy (archive style)
export const finalizePolicy = async (req, res) => {
  try {
    console.log("📥 Finalizing policy...");

    const confirmation = await Confirmation.findById(req.params.id).populate('customerId');
    if (!confirmation) return res.status(404).json({ message: 'Confirmation not found' });

    const { policyNumber, expiryDate, paymentDate } = confirmation;
    const { customerName, vehicleNumber } = confirmation.customerId;

    const durationYears = new Date(expiryDate).getFullYear() - new Date(paymentDate).getFullYear();

    const policyData = {
      policyId: policyNumber,
      customerName,
      vehicleNumber,
      duration: `${durationYears} Years`,
      startDate: paymentDate,
      expiryDate: expiryDate,
      status: req.body.status || "Active"
    };

    const policy = new Policy(policyData);
    await policy.save();

    // Archive: Delete confirmation entry
    await Confirmation.findByIdAndDelete(req.params.id);

    res.status(201).json(policy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ 5. Update policy by ID
export const updatePolicy = async (req, res) => {
  try {
    const updatedPolicy = await Policy.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPolicy) return res.status(404).json({ message: 'Policy not found' });
    res.status(200).json(updatedPolicy);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
