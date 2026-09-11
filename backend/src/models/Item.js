const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true 
  },
  type: {
    type: String,
    enum: ['Product', 'Service'],
    required: true
  },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  sku: { type: String, trim: true },
  unit: { type: String, trim: true },
  hsnSac: { type: String, trim: true },
  unitPrice: { 
    type: Number, 
    required: true,
    min: [0, 'Unit price cannot be negative'] 
    // Stored in paise natively 
  },
  gstRate: { 
    type: Number, 
    required: true,
    min: 0 
  },
  taxType: {
    type: String,
    enum: ['Inclusive', 'Exclusive'],
    required: true,
    default: 'Exclusive'
  },
  currentStock: { 
    type: Number,
    default: null
  },
  lowStockThreshold: { 
    type: Number,
    default: null
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Enforce conditional logic for Services (No Inventory)
itemSchema.pre('save', function(next) {
  if (this.type === 'Service') {
    this.currentStock = null;
    this.lowStockThreshold = null;
  }
  next();
});

itemSchema.index({ businessId: 1, type: 1 });
itemSchema.index({ businessId: 1, name: 1 });

module.exports = mongoose.model('Item', itemSchema);
