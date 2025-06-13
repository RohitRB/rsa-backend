// routes/confirmationRoutes.js (No changes needed)
import express from 'express';
import {
  createConfirmation,
  getAllConfirmations,
  getConfirmationById,
  updateConfirmation,
  deleteConfirmation
} from '../controllers/confirmationController.js';

const router = express.Router();

router.post('/create', createConfirmation);
router.get('/', getAllConfirmations); // Get all
router.get('/:id', getConfirmationById); // Get by ID
router.put('/:id', updateConfirmation); // Edit/Update
router.delete('/:id', deleteConfirmation); // Delete

export default router;