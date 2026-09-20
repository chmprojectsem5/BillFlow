const { z } = require('zod');

// Schema for an item in the invoice payload
const invoiceItemSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Item ID'),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0'),
  discount: z.number().int('Discount must be an integer (paise)').min(0, 'Discount cannot be negative').default(0),
  unitPriceOverride: z.number().int('unitPriceOverride must be an integer (paise)').min(0, 'unitPriceOverride cannot be negative').optional()
});

// Schema for Draft Invoice Creation
const createDraftInvoiceSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer ID'),
  date: z.string().datetime({ message: 'Invalid ISO date string for date' }),
  dueDate: z.string().datetime({ message: 'Invalid ISO date string for dueDate' }).optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000).optional(),
  terms: z.string().max(1000).optional()
});

// Schema for Draft Invoice Update (same as create, but optional fields where it makes sense, though typically it's a full replace)
const updateDraftInvoiceSchema = createDraftInvoiceSchema.partial();

// Schema for ephemeral calculation (can omit date/terms etc., just needs customer and items)
const calculateInvoiceSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer ID').optional(), // Sometimes frontend hasn't picked customer yet
  items: z.array(invoiceItemSchema)
});

module.exports = {
  createDraftInvoiceSchema,
  updateDraftInvoiceSchema,
  calculateInvoiceSchema
};
