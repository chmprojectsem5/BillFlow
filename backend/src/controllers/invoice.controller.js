const invoiceService = require('../services/invoice.service');
const pdfService = require('../services/pdf.service');
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
    
    // Pagination parameters
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    
    // Validate and enforce limits
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    // Calculate total count
    const total = await Invoice.countDocuments({ businessId });

    // Fetch projected invoices with deterministic ordering
    const invoices = await Invoice.find({ businessId })
      .select('-items -businessSnapshot -notes -terms') // Exclude large fields
      .sort({ date: -1, createdAt: -1, _id: -1 }) // Deterministic ordering
      .skip(skip)
      .limit(limit);
    
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      status: 'success',
      data: {
        invoices,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
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

/**
 * Generate and download PDF for a specific invoice
 */
const downloadPdf = async (req, res, next) => {
  try {
    const businessId = req.user.businessId;
    const invoiceId = req.params.id;
    
    const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
    if (!invoice) throw new AppError('Invoice not found', 404);
    
    // Generate secure filename
    const rawNumber = invoice.invoiceNumber || invoice._id.toString();
    const safeFilename = encodeURIComponent(rawNumber.replace(/[^a-zA-Z0-9_-]/g, ''));

    const pdfDoc = await pdfService.generateInvoicePdf(invoice);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Invoice-${safeFilename}.pdf"`);

    const chunks = [];
    pdfDoc.on('data', chunk => chunks.push(chunk));
    pdfDoc.on('end', () => {
      const result = Buffer.concat(chunks);
      res.setHeader('Content-Length', result.length);
      res.send(result);
    });
    pdfDoc.end();
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
  finalize,
  downloadPdf
};
