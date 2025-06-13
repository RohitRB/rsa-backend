// routes/customerRoutes.js (UPDATED - Reverted to simpler structure)
import express from 'express';
import { // <-- CHANGED: Direct import of functions
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js'; // <-- CHANGED: No longer passing db here

const router = express.Router();

router.post('/create', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router; // <-- CHANGED: Export the router directly