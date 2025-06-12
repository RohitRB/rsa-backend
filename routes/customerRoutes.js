import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';

const router = express.Router();

router.post('/create', createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);        // Update customer
router.delete('/:id', deleteCustomer);     // Delete customer

export default router;
