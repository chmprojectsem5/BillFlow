const mongoose = require('mongoose');

const taxConfigSchema = new mongoose.Schema({
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true
  },
  hsnSac: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['Goods', 'Services'], required: true },
  gstRate: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Prevent duplicate HSN configurations per business
taxConfigSchema.index({ businessId: 1, hsnSac: 1 }, { unique: true });

module.exports = mongoose.model('TaxConfig', taxConfigSchema);
