const mongoose = require('mongoose');

const invoiceItemSnapshotSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  type: { type: String, enum: ['Product', 'Service'] },
  name: { type: String, required: true },
  hsnSac: { type: String },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String },
  unitPrice: { type: Number, required: true, min: 0 }, // paise
  taxType: { type: String, enum: ['Inclusive', 'Exclusive'] },
  gstRate: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 }, // paise
  taxableValue: { type: Number, required: true, min: 0 }, // paise
  cgst: { type: Number, default: 0, min: 0 }, // paise
  sgst: { type: Number, default: 0, min: 0 }, // paise
  igst: { type: Number, default: 0, min: 0 }, // paise
  taxAmount: { type: Number, required: true, min: 0 }, // paise
  lineTotal: { type: Number, required: true, min: 0 } // paise
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true,
    index: true 
  },
  invoiceNumber: { type: String, required: true },
  date: { type: Date, required: true },
  dueDate: { type: Date },
  status: { 
    type: String, 
    enum: ['Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue'],
    default: 'Draft'
  },
  customerSnapshot: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    name: { type: String, required: true },
    gstin: { type: String },
    billingAddress: { type: String },
    state: { type: String },
    email: { type: String }
  },
  businessSnapshot: { // For historical locking of business identity
    name: { type: String, required: true },
    gstin: { type: String },
    address: { type: String },
    state: { type: String }
  },
  items: [invoiceItemSnapshotSchema],
  summary: {
    subTotal: { type: Number, required: true, min: 0 }, // paise
    discountTotal: { type: Number, default: 0, min: 0 }, // paise
    taxableTotal: { type: Number, required: true, min: 0 }, // paise
    cgstTotal: { type: Number, default: 0, min: 0 }, // paise
    sgstTotal: { type: Number, default: 0, min: 0 }, // paise
    igstTotal: { type: Number, default: 0, min: 0 }, // paise
    taxTotal: { type: Number, required: true, min: 0 }, // paise
    grandTotal: { type: Number, required: true, min: 0 } // paise
  },
  paymentStatus: {
    paidAmount: { type: Number, default: 0, min: 0 }, // paise
    balanceDue: { type: Number, required: true, min: 0 } // paise
  },
  notes: { type: String },
  terms: { type: String }
}, { timestamps: true });

// Ensure invoice numbers are unique per business, preventing exact duplicates
invoiceSchema.index({ businessId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ businessId: 1, date: -1 });
invoiceSchema.index({ businessId: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
