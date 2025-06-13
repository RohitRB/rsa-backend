// routes/policyRoutes.js (UPDATED - Reverted to simpler structure)
import express from 'express';
import { // <-- CHANGED: Direct import of functions
  createPolicy,
  getAllPolicies,
  getPolicyPreview,
  finalizePolicy,
  updatePolicy
} from '../controllers/policyController.js'; // <-- CHANGED: No longer passing db here

const router = express.Router();

router.post('/', createPolicy);
router.get('/', getAllPolicies);
router.get('/preview/:id', getPolicyPreview);
router.post('/finalize/:id', finalizePolicy);
router.put('/:id', updatePolicy);

export default router; // <-- CHANGED: Export the router directly