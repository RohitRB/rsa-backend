import express from 'express';
import {
  createPolicy,
  getAllPolicies,
  getPolicyPreview,
  finalizePolicy,
  updatePolicy
} from '../controllers/policyController.js';

const router = express.Router();

router.post('/', createPolicy);                          // Manually create policy
router.get('/', getAllPolicies);                         // All policies
router.get('/preview/:id', getPolicyPreview);            // Preview from confirmation
router.post('/finalize/:id', finalizePolicy);            // Finalize + move
router.put('/:id', updatePolicy);                        // Update policy

export default router;
