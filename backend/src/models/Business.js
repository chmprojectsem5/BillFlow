const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  state: { type: String, trim: true },
  gstin: { 
    type: String, 
    trim: true,
    match: [/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN format'] 
  },
  pan: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { 
    type: String, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  website: { type: String, trim: true },
  logoUrl: { type: String },
  bankDetails: {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    ifsc: { type: String, trim: true },
    bankName: { type: String, trim: true }
  },
  invoiceSettings: {
    prefix: { type: String, default: 'INV-' },
    defaultDueDays: { type: Number, default: 7 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Business', businessSchema);
