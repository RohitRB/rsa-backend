// routes/policyRoutes.js (UPDATED)
import express from 'express';

// This file now exports a function that accepts 'db' as an argument
const policyRoutes = (db) => {
  const router = express.Router();

  // Import controller functions here, so they can be configured with 'db'
  // We will make these controller functions into functions that accept 'db'
  // and return the actual handler.
  const {
    createPolicy,
    getAllPolicies,
    getPolicyPreview,
    finalizePolicy,
    updatePolicy
  } = require('../controllers/policyController.js')(db); // <-- CHANGED: Pass db here

  router.post('/', createPolicy);
  router.get('/', getAllPolicies);
  router.get('/preview/:id', getPolicyPreview);
  router.post('/finalize/:id', finalizePolicy);
  router.put('/:id', updatePolicy);

  return router;
};

export default policyRoutes; // <-- CHANGED: Export the function