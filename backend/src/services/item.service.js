const Item = require('../models/Item');
const AppError = require('../utils/AppError');

/**
 * Get all items for the authenticated business.
 */
const getItems = async (businessId) => {
  return await Item.find({ businessId }).sort({ createdAt: -1 });
};

/**
 * Get a single item by ID, ensuring it belongs to the business.
 */
const getItemById = async (businessId, itemId) => {
  const item = await Item.findOne({ _id: itemId, businessId });
  if (!item) {
    throw new AppError('Item not found', 404);
  }
  return item;
};

/**
 * Create a new item for the authenticated business.
 */
const createItem = async (businessId, data) => {
  // Enforce Service rules before creation
  if (data.type === 'Service') {
    data.currentStock = null;
    data.lowStockThreshold = null;
    data.costPrice = null;
  }

  const item = await Item.create({
    ...data,
    businessId // Server-derived, never trust client
  });
  return item;
};

/**
 * Update an item, ensuring it belongs to the business.
 */
const updateItem = async (businessId, itemId, updateData) => {
  // Strip protected fields
  delete updateData._id;
  delete updateData.businessId;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  // Determine the effective type: either from the update or from the existing record
  let effectiveType = updateData.type;
  if (!effectiveType) {
    const existing = await Item.findOne({ _id: itemId, businessId });
    if (!existing) {
      throw new AppError('Item not found', 404);
    }
    effectiveType = existing.type;
  }

  // Enforce Service rules
  if (effectiveType === 'Service') {
    updateData.currentStock = null;
    updateData.lowStockThreshold = null;
    updateData.costPrice = null;
  }

  const item = await Item.findOneAndUpdate(
    { _id: itemId, businessId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!item) {
    throw new AppError('Item not found', 404);
  }
  return item;
};

/**
 * Delete an item, ensuring it belongs to the business.
 */
const deleteItem = async (businessId, itemId) => {
  const item = await Item.findOneAndDelete({ _id: itemId, businessId });
  if (!item) {
    throw new AppError('Item not found', 404);
  }
  return item;
};

module.exports = {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};
