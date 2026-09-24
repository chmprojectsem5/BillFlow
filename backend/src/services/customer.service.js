const Customer = require('../models/Customer');
const AppError = require('../utils/AppError');

/**
 * Get all customers for the authenticated business.
 */
const getCustomers = async (businessId, query = {}) => {
  const { page = 1, limit = 20, search, customerType, sort = 'createdAt', order = 'desc' } = query;
  
  const filter = { businessId };
  
  if (customerType) {
    filter.customerType = customerType;
  }
  
  if (search) {
    const escapedSearch = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } },
      { gstin: { $regex: escapedSearch, $options: 'i' } }
    ];
  }

  const sortDirection = order === 'asc' ? 1 : -1;
  const sortObj = { [sort]: sortDirection, _id: -1 };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Customer.find(filter).sort(sortObj).skip(skip).limit(limit),
    Customer.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    }
  };
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
