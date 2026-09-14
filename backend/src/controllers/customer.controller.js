const customerService = require('../services/customer.service');

const getCustomers = async (req, res, next) => {
  try {
    const customers = await customerService.getCustomers(req.user.businessId);
    res.status(200).json({
      success: true,
      data: { customers }
    });
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.getCustomerById(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

const createCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.user.businessId, req.body);
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.user.businessId, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

const deleteCustomer = async (req, res, next) => {
  try {
    await customerService.deleteCustomer(req.user.businessId, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
