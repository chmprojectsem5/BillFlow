const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true
  },
  invoiceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Invoice', 
    required: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true, 
    min: [0, 'Amount cannot be negative'] // paise
  },
  paymentDate: { type: Date, required: true },
  method: { 
    type: String, 
    enum: ['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque'],
    required: true
  },
  referenceNumber: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
