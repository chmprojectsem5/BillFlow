const mongoose = require('mongoose');
const Money = require('../utils/money');
const { serializeMonetary } = require('../utils/serializer');

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
    type: mongoose.Schema.Types.Decimal128,
    required: [true, 'Payment amount is required'],
    get: v => Money.fromDecimal128(v, { isOptional: false }),
    set: v => Money.toDecimal128(v, { isOptional: false, fieldName: 'amount' })
  },
  paymentDate: { type: Date, required: true },
  method: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque'],
    required: true
  },
  referenceNumber: { type: String },
  notes: { type: String }
}, {
  timestamps: true,
  toJSON: { getters: true, transform: (doc, ret) => serializeMonetary(ret) },
  toObject: { getters: true }
});

// Prevent duplicate submissions at the database level for the same business
paymentSchema.index({ businessId: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
