const { z } = require('zod');

// Schema for POST (Create)
const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  customerType: z.enum(['Individual', 'Business']).optional(),
  phone: z.string().max(15).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  billingAddress: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pinCode: z.string().max(10).optional(),
  country: z.string().max(100).optional(),
  gstin: z.string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  pan: z.string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN format')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(2000).optional()
}).strict();

// Schema for PATCH (Update)
const updateCustomerSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(200).optional(),
  customerType: z.enum(['Individual', 'Business']).optional(),
  phone: z.string().max(15).optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  billingAddress: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pinCode: z.string().max(10).optional(),
  country: z.string().max(100).optional(),
  gstin: z.string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Invalid GSTIN format')
    .optional()
    .or(z.literal('')),
  pan: z.string()
    .regex(/^[A-Z]{5}\d{4}[A-Z]{1}$/, 'Invalid PAN format')
    .optional()
    .or(z.literal('')),
  notes: z.string().max(2000).optional()
}).strict();

module.exports = { createCustomerSchema, updateCustomerSchema };
