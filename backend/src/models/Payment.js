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
  idempotencyKey: {
    type: String,
    required: true
  },
  amount: { 
    type: Number, 
    required: true, 
    min: [0, 'Amount cannot be negative'],
    validate: { validator: function(v) { return v == null || Number.isInteger(v); }, message: '{VALUE} is not an integer' } // paise
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

// Prevent duplicate submissions at the database level for the same business
paymentSchema.index({ businessId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
