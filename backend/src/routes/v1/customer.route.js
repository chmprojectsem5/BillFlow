const express = require('express');
const customerController = require('../../controllers/customer.controller');
const validateRequest = require('../../middleware/validateRequest');
const { createCustomerSchema, updateCustomerSchema, customerQuerySchema } = require('../../validators/customer.validator');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// All customer routes must be protected
router.use(protect);

router.route('/')
  .get(validateRequest(customerQuerySchema, 'query'), customerController.getCustomers)
  .post(validateRequest(createCustomerSchema), customerController.createCustomer);

router.route('/:id')
  .get(customerController.getCustomer)
  .patch(validateRequest(updateCustomerSchema), customerController.updateCustomer)
  .delete(customerController.deleteCustomer);

module.exports = router;
