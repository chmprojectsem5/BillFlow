const express = require('express');
const itemController = require('../../controllers/item.controller');
const validateRequest = require('../../middleware/validateRequest');
const { createItemSchema, updateItemSchema } = require('../../validators/item.validator');
const { protect } = require('../../middleware/auth');

const router = express.Router();

// All item routes must be protected
router.use(protect);

router.route('/')
  .get(itemController.getItems)
  .post(validateRequest(createItemSchema), itemController.createItem);

router.route('/:id')
  .get(itemController.getItem)
  .patch(validateRequest(updateItemSchema), itemController.updateItem)
  .delete(itemController.deleteItem);

module.exports = router;
