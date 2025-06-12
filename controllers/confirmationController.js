import Confirmation from '../models/confirmation.js';
import { v4 as uuidv4 } from 'uuid';

// Create confirmation (already implemented)
export const createConfirmation = async (req, res) => {
  try {
    const { policyType, amount, expiryDate, customerId } = req.body;
    const policyNumber = 'RSA-' + uuidv4().split('-')[0].toUpperCase();

    const confirmation = new Confirmation({
      policyNumber,
      policyType,
      amount,
      expiryDate,
      customerId
    });

    const savedConfirmation = await confirmation.save();
    res.status(201).json(savedConfirmation);
  } catch (err) {
    console.log('catching error',err)
    res.status(500).json({ error: err.message });
  }
};

// Get all confirmations
export const getAllConfirmations = async (req, res) => {
  try {
    const confirmations = await Confirmation.find().populate('customerId');
    res.status(200).json(confirmations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get confirmation by ID
export const getConfirmationById = async (req, res) => {
  try {
    const confirmation = await Confirmation.findById(req.params.id).populate('customerId');
    if (!confirmation) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }
    res.status(200).json(confirmation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update confirmation
export const updateConfirmation = async (req, res) => {
  try {
    const updated = await Confirmation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete confirmation
export const deleteConfirmation = async (req, res) => {
  try {
    const deleted = await Confirmation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Confirmation not found' });
    }
    res.status(200).json({ message: 'Confirmation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
