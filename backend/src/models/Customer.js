const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true 
  },
  name: { type: String, required: true, trim: true },
  customerType: { 
    type: String, 
    enum: ['Individual', 'Business'],
    default: 'Business' 
  },
  phone: { type: String, trim: true },
  email: { 
    type: String, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  billingAddress: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pinCode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'India' },
  gstin: { 
    type: String, 
    trim: true,
    uppercase: true,
    match: [/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN format'] 
  },
  pan: { 
    type: String, 
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN format']
  },
  notes: { type: String, trim: true }
}, { timestamps: true });

// Customers must be unique by email/GSTIN per business (optional, but good for search)
customerSchema.index({ businessId: 1, email: 1 });
customerSchema.index({ businessId: 1, name: 1 });

module.exports = mongoose.model('Customer', customerSchema);
