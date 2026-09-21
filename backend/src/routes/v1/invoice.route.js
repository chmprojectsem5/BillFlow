const express = require('express');
const { protect } = require('../../middleware/auth');
const invoiceController = require('../../controllers/invoice.controller');
const validateRequest = require('../../middleware/validateRequest');
const { createDraftInvoiceSchema, updateDraftInvoiceSchema, calculateInvoiceSchema } = require('../../validators/invoice.validator');

const router = express.Router();

// All invoice routes require authentication
router.use(protect);

router.post('/calculate', validateRequest(calculateInvoiceSchema), invoiceController.calculatePreview);
router.get('/:id/pdf', invoiceController.downloadPdf);
router.post('/:id/finalize', invoiceController.finalize);

router.route('/')
  .get(invoiceController.getInvoices)
  .post(validateRequest(createDraftInvoiceSchema), invoiceController.createDraft);

router.route('/:id')
  .get(invoiceController.getInvoiceById)
  .patch(validateRequest(updateDraftInvoiceSchema), invoiceController.updateDraft);

module.exports = router;
