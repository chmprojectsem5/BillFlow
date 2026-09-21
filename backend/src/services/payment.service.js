const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');

/**
 * Record a payment securely with a MongoDB Transaction.
 * 
 * @param {string} businessId 
 * @param {string} invoiceId 
 * @param {object} paymentData 
 * @param {string} idempotencyKey 
 */
const recordPayment = async (businessId, invoiceId, paymentData, idempotencyKey) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Atomically update the invoice ONLY IF balance is sufficient and status allows
    const updatedInvoice = await Invoice.findOneAndUpdate(
      {
        _id: invoiceId,
        businessId,
        'paymentStatus.balanceDue': { $gte: paymentData.amount },
        status: { $in: ['Unpaid', 'Partially Paid', 'Overdue'] }
      },
      [
        {
          $set: {
            'paymentStatus.paidAmount': { $add: ['$paymentStatus.paidAmount', paymentData.amount] },
            'paymentStatus.balanceDue': { $subtract: ['$paymentStatus.balanceDue', paymentData.amount] }
          }
        },
        {
          $set: {
            status: {
              $cond: {
                if: { $eq: ['$paymentStatus.balanceDue', 0] },
                then: 'Paid',
                else: 'Partially Paid'
              }
            }
          }
        }
      ],
      { session, new: true, runValidators: true, updatePipeline: true }
    );

    if (!updatedInvoice) {
      // Check if invoice exists at all to throw correct error
      const existingInvoice = await Invoice.findOne({ _id: invoiceId, businessId }).session(session);
      if (!existingInvoice) {
        throw new AppError('Invoice not found', 404);
      }
      if (['Draft', 'Paid'].includes(existingInvoice.status)) {
        throw new AppError(`Cannot record payment for a ${existingInvoice.status} invoice`, 400);
      }
      throw new AppError('Payment amount exceeds current outstanding balance', 400);
    }

    // 2. Create the Payment document
    const payment = new Payment({
      businessId,
      invoiceId,
      idempotencyKey,
      amount: paymentData.amount,
      paymentDate: paymentData.paymentDate,
      method: paymentData.method,
      referenceNumber: paymentData.referenceNumber,
      notes: paymentData.notes
    });

    await payment.save({ session });

    await session.commitTransaction();

    return { payment, invoice: updatedInvoice };

  } catch (error) {
    await session.abortTransaction();
    if (error.code === 11000) {
      // Duplicate idempotencyKey
      throw new AppError('A payment request with this idempotency key was already processed', 409);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get payment history for an invoice
 */
const getPaymentsForInvoice = async (businessId, invoiceId) => {
  // First ensure invoice exists and belongs to business
  const invoice = await Invoice.findOne({ _id: invoiceId, businessId }).select('_id');
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const payments = await Payment.find({ businessId, invoiceId })
    .sort('-paymentDate -createdAt');

  return payments;
};

module.exports = {
  recordPayment,
  getPaymentsForInvoice
};
