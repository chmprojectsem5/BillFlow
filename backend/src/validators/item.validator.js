const { z } = require('zod');

// Schema for POST (Create)
const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  type: z.enum(['Product', 'Service'], { message: 'Type must be Product or Service' }),
  description: z.string().max(1000).optional(),
  sku: z.string().max(50).optional().or(z.literal('')),
  unit: z.string().max(50).optional(),
  hsnSac: z.string().max(20).optional().or(z.literal('')),
  unitPrice: z.number().int('Selling price must be an integer (paise)').min(0, 'Selling price cannot be negative'),
  costPrice: z.number().int('Cost price must be an integer (paise)').min(0, 'Cost price cannot be negative').nullable().optional(),
  currentStock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').nullable().optional(),
  lowStockThreshold: z.number().int('Threshold must be an integer').min(0, 'Threshold cannot be negative').nullable().optional(),
  taxType: z.enum(['Inclusive', 'Exclusive']).optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).optional()
}).strict();

const updateItemSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(200).optional(),
  type: z.enum(['Product', 'Service'], { message: 'Type must be Product or Service' }).optional(),
  description: z.string().max(1000).optional(),
  sku: z.string().max(50).optional().or(z.literal('')),
  unit: z.string().max(50).optional(),
  hsnSac: z.string().max(20).optional().or(z.literal('')),
  unitPrice: z.number().int('Selling price must be an integer (paise)').min(0, 'Selling price cannot be negative').optional(),
  costPrice: z.number().int('Cost price must be an integer (paise)').min(0, 'Cost price cannot be negative').nullable().optional(),
  currentStock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').nullable().optional(),
  lowStockThreshold: z.number().int('Threshold must be an integer').min(0, 'Threshold cannot be negative').nullable().optional(),
  taxType: z.enum(['Inclusive', 'Exclusive']).optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().max(2000).optional()
}).strict();

// Schema for GET (List) query parameters
const itemQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be 1 or greater').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be 1 or greater').max(100, 'Limit cannot exceed 100').default(20),
  search: z.string().max(50).optional(),
  type: z.enum(['Product', 'Service']).optional(),
  isActive: z.enum(['true', 'false']).optional(),
  sort: z.enum(['name', 'unitPrice', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional()
}).strict();

module.exports = { createItemSchema, updateItemSchema, itemQuerySchema };
