const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true
  },
  itemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Item', 
    required: true,
    index: true
  },
  movementType: { 
    type: String, 
    enum: ['IN', 'OUT', 'ADJUSTMENT', 'REVERSAL'],
    required: true
  },
  quantity: { 
    type: Number, 
    required: true 
  },
  referenceType: { 
    type: String, 
    enum: ['Invoice', 'Purchase', 'Manual', 'Return'],
    required: true
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId // E.g., Invoice ID
  },
  previousStock: { type: Number },
  resultingStock: { type: Number },
  reason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
