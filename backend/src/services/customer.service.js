const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');

/**
 * Get all customers for the authenticated business.
 */
const getCustomers = async (businessId) => {
  return await Customer.find({ businessId }).sort({ createdAt: -1 });
};

/**
 * Get a single customer by ID, ensuring it belongs to the business.
 */
const getCustomerById = async (businessId, customerId) => {
  const customer = await Customer.findOne({ _id: customerId, businessId });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return customer;
};

/**
 * Create a new customer for the authenticated business.
 */
const createCustomer = async (businessId, data) => {
  const customer = await Customer.create({
    ...data,
    businessId // Override any client-provided businessId
  });
  return customer;
};

/**
 * Update a customer, ensuring it belongs to the business.
 */
const updateCustomer = async (businessId, customerId, updateData) => {
  // Strip protected fields
  delete updateData._id;
  delete updateData.businessId;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, businessId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return customer;
};

/**
 * Delete a customer, ensuring it belongs to the business.
 */
const deleteCustomer = async (businessId, customerId) => {
  const customer = await Customer.findOneAndDelete({ _id: customerId, businessId });
  if (!customer) {
    throw new AppError('Customer not found', 404);
  }
  return customer;
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
