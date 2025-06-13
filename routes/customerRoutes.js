// routes/customerRoutes.js (UPDATED)
import express from 'express';
// We will move the imports for the controller functions inside the function
// to ensure they receive the 'db' instance.

// This file now exports a function that accepts 'db' as an argument
const customerRoutes = (db) => {
  const router = express.Router();

  // Import controller functions here, so they can be configured with 'db'
  // We will make these controller functions into functions that accept 'db'
  // and return the actual handler.
  const {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
  } = require('../controllers/customerController.js')(db); // <-- CHANGED: Pass db here

  router.post('/create', createCustomer);
  router.get('/', getCustomers);
  router.get('/:id', getCustomerById);
  router.put('/:id', updateCustomer);
  router.delete('/:id', deleteCustomer);

  return router;
};

export default customerRoutes; // <-- CHANGED: Export the function