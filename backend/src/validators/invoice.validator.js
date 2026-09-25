const { z } = require('zod');

// Schema for an item in the invoice payload
const invoiceItemSchema = z.object({
  itemId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Item ID'),
  quantity: z.number().min(0.001, 'Quantity must be greater than 0').max(999999, 'Quantity too large'),
  discount: z.number().int('Discount must be an integer (paise)').min(0, 'Discount cannot be negative').max(99999999, 'Discount too large').default(0),
  unitPriceOverride: z.number().int('unitPriceOverride must be an integer (paise)').min(0, 'unitPriceOverride cannot be negative').max(99999999, 'unitPriceOverride too large').optional()
}).strict();

// Schema for Draft Invoice Creation
const createDraftInvoiceSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer ID'),
  date: z.string().datetime({ message: 'Invalid ISO date string for date' }),
  dueDate: z.string().datetime({ message: 'Invalid ISO date string for dueDate' }).optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000).optional(),
  terms: z.string().max(1000).optional()
}).strict();

// Schema for Draft Invoice Update (same as create, but optional fields where it makes sense, though typically it's a full replace)
const updateDraftInvoiceSchema = createDraftInvoiceSchema.partial().strict();

const calculateInvoiceSchema = z.object({
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer ID').optional(), // Sometimes frontend hasn't picked customer yet
  items: z.array(invoiceItemSchema)
}).strict();

// Schema for GET (List) query parameters
const invoiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be 1 or greater').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be 1 or greater').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(50).optional(),
  status: z.enum(['Draft', 'Unpaid', 'Partially Paid', 'Paid', 'Overdue']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid startDate format, must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid endDate format, must be YYYY-MM-DD').optional(),
  customerId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Customer ID').optional(),
  sort: z.enum(['date', 'invoiceNumber', 'grandTotal', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional()
}).strict();

module.exports = {
  createDraftInvoiceSchema,
  updateDraftInvoiceSchema,
  calculateInvoiceSchema,
  invoiceQuerySchema
};
