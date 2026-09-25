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
    min: [0, 'Selling price cannot be negative'],
    validate: { validator: function(v) { return v == null || Number.isInteger(v); }, message: '{VALUE} is not an integer' }
    // Stored in paise natively 
  },
  costPrice: {
    type: Number,
    default: null,
    min: [0, 'Cost price cannot be negative'],
    validate: { validator: function(v) { return v == null || Number.isInteger(v); }, message: '{VALUE} is not an integer' }
    // Stored in paise natively
  },
  gstRate: { 
    type: Number, 
    min: 0,
    default: null
    // Will be required by Phase 8 GST engine
  },
  taxType: {
    type: String,
    enum: ['Inclusive', 'Exclusive'],
    default: null
    // Will be required by Phase 8 GST engine
  },
  currentStock: { 
    type: Number,
    default: null
  },
  lowStockThreshold: { 
    type: Number,
    default: null
  },
  isActive: { type: Boolean, default: true },
  notes: { type: String, trim: true }
}, { timestamps: true });

// Enforce conditional logic for Services (No Inventory)
itemSchema.pre('save', function() {
  if (this.type === 'Service') {
    this.currentStock = null;
    this.lowStockThreshold = null;
    this.costPrice = null;
  }
});

itemSchema.index({ businessId: 1, type: 1 });
itemSchema.index({ businessId: 1, name: 1 });
// Business-scoped SKU uniqueness (sparse: allows null/missing SKU)
itemSchema.index({ businessId: 1, sku: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Item', itemSchema);
