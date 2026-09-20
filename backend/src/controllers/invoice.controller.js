const invoiceService = require('../services/invoice.service');
const Invoice = require('../models/Invoice');
const AppError = require('../utils/AppError');

/**
 * Ephemeral calculation endpoint for frontend preview
 */
const calculatePreview = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const validatedData = req.body;
    
    // We allow customerId to be omitted in the preview if the user hasn't selected one yet.
    // However, if omitted, we might not get correct IGST vs CGST/SGST split.
    const calculatedData = await invoiceService.calculateInvoice(businessId, validatedData.customerId, validatedData.items);
    
    res.status(200).json({
      status: 'success',
      data: {
        preview: calculatedData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new draft invoice
 */
const createDraft = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const validatedData = req.body;
    
    const invoice = await invoiceService.createDraftInvoice(businessId, validatedData);
    
    res.status(201).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing draft invoice
 */
const updateDraft = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const invoiceId = req.params.id;
    const validatedData = req.body;
    
    // Prevent overriding protected fields
    delete validatedData.businessId;
    delete validatedData.invoiceNumber;
    delete validatedData.status;

    const invoice = await invoiceService.updateDraftInvoice(businessId, invoiceId, validatedData);
    
    res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all invoices for the authenticated business
 */
const getInvoices = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    
    // In later phases, add pagination/filtering
    const invoices = await Invoice.find({ businessId }).sort('-createdAt');
    
    res.status(200).json({
      status: 'success',
      results: invoices.length,
      data: {
        invoices
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific invoice by ID
 */
const getInvoiceById = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const invoiceId = req.params.id;
    
    const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
    if (!invoice) throw new AppError('Invoice not found', 404);
    
    res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Finalize a draft invoice
 */
const finalize = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const invoiceId = req.params.id;
    
    const invoice = await invoiceService.finalizeInvoice(businessId, invoiceId);
    
    res.status(200).json({
      status: 'success',
      data: {
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculatePreview,
  createDraft,
  updateDraft,
  getInvoices,
  getInvoiceById,
  finalize
};
