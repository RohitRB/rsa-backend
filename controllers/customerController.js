import Customer from '../models/Customer.js';

// Create a new customer
export const createCustomer = async (req, res) => {
  try {
    const newCustomer = new Customer(req.body);
    const savedCustomer = await newCustomer.save();
    res.status(201).json(savedCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.status(200).json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single customer by ID (optional)
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.status(200).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json(updatedCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
