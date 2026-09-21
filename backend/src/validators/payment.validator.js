const { z } = require('zod');

const createPaymentSchema = z.object({
  amount: z.number().int('Amount must be an integer').positive('Amount must be strictly positive'),
  paymentDate: z.string().datetime('Invalid payment date'),
  method: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Cheque']),
  referenceNumber: z.string().max(100, 'Reference number too long').optional(),
  notes: z.string().max(500, 'Notes too long').optional()
});

module.exports = {
  createPaymentSchema
};
