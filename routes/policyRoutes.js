// routes/policyRoutes.js (UPDATED - Reverted to simpler structure)
import express from 'express';
import { // <-- CHANGED: Direct import of functions
  createPolicy,
  getAllPolicies,
  getPolicyPreview,
  finalizePolicy,
  updatePolicy,
  deletePolicy,
  getAllPoliciesDebug
} from '../controllers/policyController.js'; // <-- CHANGED: No longer passing db here

const router = express.Router();

router.post('/', createPolicy);
router.get('/', getAllPolicies);
router.get('/debug', getAllPoliciesDebug); // Debug endpoint
router.get('/preview/:id', getPolicyPreview);
router.post('/finalize/:id', finalizePolicy);
router.put('/:id', updatePolicy);
router.delete('/:id', deletePolicy);

export default router; // <-- CHANGED: Export the router directly