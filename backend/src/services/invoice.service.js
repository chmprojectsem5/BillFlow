const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Counter = require('../models/Counter');
const Business = require('../models/Business');
const Customer = require('../models/Customer');
const Item = require('../models/Item');
const TaxConfig = require('../models/TaxConfig');
const { calculateGST, determineSupplyType, PRICING_MODE, TAX_TREATMENT } = require('./gstCalculation.service');
const AppError = require('../utils/AppError');

/**
 * Perform all authoritative calculations for an invoice payload and generate the snapshots.
 * Returns the fully computed invoice object (without saving).
 */
const calculateInvoice = async (businessId, customerId, itemsPayload) => {
  // 1. Fetch Business (needed for state comparison and invoice prefix snapshotting)
  const business = await Business.findById(businessId);
  if (!business) throw new AppError('Business not found', 404);

  let customer = null;
  let customerSnapshot = null;
  let supplyType = 'INTRA_STATE'; // Default

  // 2. Fetch Customer (optional for preview, but required for creation)
  if (customerId) {
    customer = await Customer.findOne({ _id: customerId, businessId });
    if (!customer) throw new AppError('Customer not found or does not belong to this business', 404);
    
    customerSnapshot = {
      customerId: customer._id,
      name: customer.name,
      customerType: customer.customerType,
      gstin: customer.gstin,
      pan: customer.pan,
      billingAddress: customer.billingAddress,
      city: customer.city,
      state: customer.state,
      pinCode: customer.pinCode,
      country: customer.country,
      email: customer.email,
      phone: customer.phone
    };

    supplyType = determineSupplyType(business.state, customer.state);
  }

  // 3. Process Line Items
  const itemsSnapshot = [];
  let subTotal = 0;
  let discountTotal = 0;
  let taxableTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  for (const payloadItem of itemsPayload) {
    const item = await Item.findOne({ _id: payloadItem.itemId, businessId });
    if (!item) throw new AppError(`Item not found (ID: ${payloadItem.itemId})`, 404);

    // Determine unit price
    const unitPrice = payloadItem.unitPriceOverride !== undefined 
      ? payloadItem.unitPriceOverride 
      : item.unitPrice;

    const quantity = payloadItem.quantity;
    const discount = payloadItem.discount || 0;
    const pricingMode = item.taxType === 'Inclusive' ? PRICING_MODE.INCLUSIVE : PRICING_MODE.EXCLUSIVE;

    const grossAmount = Math.round(unitPrice * quantity);
    
    if (discount > grossAmount) {
      throw new AppError(`Discount (${discount}) cannot be greater than gross amount (${grossAmount}) for item ${item.name}`, 400);
    }

    const amountAfterDiscount = grossAmount - discount;

    // Fetch tax config if item has HSN/SAC
    let taxTreatment = TAX_TREATMENT.TAXABLE; // Default assumption if no config implies taxable, but wait, Phase 8 says:
    // "If required tax configuration is missing for a taxable item... return a clear validation error"
    let gstRate = 0;
    let cgstRate = 0;
    let sgstRate = 0;
    let igstRate = 0;
    let classificationType = 'HSN'; // Fallback if no tax config found, but we will require it if it has gst config

    if (item.hsnSac) {
      const taxConfig = await TaxConfig.findOne({ businessId, hsnSac: item.hsnSac });
      if (!taxConfig) {
        throw new AppError(`Tax configuration missing for HSN/SAC ${item.hsnSac} (Item: ${item.name})`, 400);
      }
      
      taxTreatment = taxConfig.taxTreatment;
      gstRate = taxConfig.gstRate;
      classificationType = taxConfig.classificationType;
      
      if (taxTreatment === TAX_TREATMENT.TAXABLE) {
        if (supplyType === 'INTRA_STATE') {
          cgstRate = gstRate / 2;
          sgstRate = gstRate / 2;
        } else {
          igstRate = gstRate;
        }
      }
    } else {
      // If no HSN/SAC provided on item, we assume 0% Non-GST or require it. 
      // Safe fallback for items without GST configuration is NON_GST or 0% EXEMPT.
      // Let's assume NON_GST for items not configured for tax.
      taxTreatment = TAX_TREATMENT.NON_GST;
      gstRate = 0;
    }

    // Phase 8 Engine Calculation
    const taxCalculation = calculateGST({
      amountPaise: amountAfterDiscount,
      gstRate,
      pricingMode,
      supplyType,
      taxTreatment
    });

    itemsSnapshot.push({
      itemId: item._id,
      type: item.type,
      name: item.name,
      description: item.description,
      sku: item.sku,
      hsnSac: item.hsnSac,
      classificationType,
      taxTreatment,
      quantity,
      unit: item.unit,
      unitPrice,
      pricingMode,
      gstRate,
      cgstRate,
      sgstRate,
      igstRate,
      discount,
      taxableValue: taxCalculation.taxableAmount,
      cgst: taxCalculation.cgst,
      sgst: taxCalculation.sgst,
      igst: taxCalculation.igst,
      taxAmount: taxCalculation.totalGST,
      lineTotal: taxCalculation.total
    });

    // Aggregate totals
    subTotal += grossAmount;
    discountTotal += discount;
    taxableTotal += taxCalculation.taxableAmount;
    cgstTotal += taxCalculation.cgst;
    sgstTotal += taxCalculation.sgst;
    igstTotal += taxCalculation.igst;
    taxTotal += taxCalculation.totalGST;
    grandTotal += taxCalculation.total;
  }

  // Ensure balance calculation
  const paymentStatus = {
    paidAmount: 0,
    balanceDue: grandTotal
  };

  return {
    customerSnapshot,
    businessSnapshot: {
      name: business.name,
      gstin: business.gstin,
      address: business.address,
      state: business.state
    },
    items: itemsSnapshot,
    summary: {
      subTotal,
      discountTotal,
      taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      grandTotal
    },
    paymentStatus
  };
};

/**
 * Creates a new DRAFT invoice
 */
const createDraftInvoice = async (businessId, payload) => {
  const { customerId, date, dueDate, notes, terms, items: itemsPayload } = payload;
  
  if (!customerId) throw new AppError('customerId is required to save an invoice', 400);

  const calculatedData = await calculateInvoice(businessId, customerId, itemsPayload);

  // We assign a temporary string for invoiceNumber since it is required by schema. 
  // It will be overwritten upon finalization. 
  // Draft prefix to ensure it doesn't conflict with finalized sequence.
  const tempInvoiceNumber = `DRAFT-${new mongoose.Types.ObjectId().toString().slice(-6).toUpperCase()}`;

  const invoice = new Invoice({
    businessId,
    invoiceNumber: tempInvoiceNumber,
    date,
    dueDate,
    status: 'Draft',
    customerSnapshot: calculatedData.customerSnapshot,
    businessSnapshot: calculatedData.businessSnapshot,
    items: calculatedData.items,
    summary: calculatedData.summary,
    paymentStatus: calculatedData.paymentStatus,
    notes,
    terms
  });

  await invoice.save();
  return invoice;
};

/**
 * Updates an existing DRAFT invoice
 */
const updateDraftInvoice = async (businessId, invoiceId, payload) => {
  const invoice = await Invoice.findOne({ _id: invoiceId, businessId });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.status !== 'Draft') throw new AppError('Only Draft invoices can be updated', 400);

  // Default to existing customer/items if not provided in payload (though usually it's full replacement)
  const customerId = payload.customerId || invoice.customerSnapshot.customerId;
  
  let calculatedData = null;
  
  // If items changed, recalculate. If not, preserve existing snapshots.
  if (payload.items && payload.items.length > 0) {
    calculatedData = await calculateInvoice(businessId, customerId, payload.items);
  } else if (payload.customerId && payload.customerId !== invoice.customerSnapshot.customerId.toString()) {
    // If only customer changed but we don't have items payload, we can't easily recalculate supplyType/IGST without pulling existing items.
    // Let's require items payload if customer changes to ensure safe tax recalculation.
    throw new AppError('When updating customer, items array must be provided to recalculate taxes', 400);
  }

  if (calculatedData) {
    invoice.customerSnapshot = calculatedData.customerSnapshot;
    invoice.businessSnapshot = calculatedData.businessSnapshot;
    invoice.items = calculatedData.items;
    invoice.summary = calculatedData.summary;
    invoice.paymentStatus = calculatedData.paymentStatus;
  }

  if (payload.date) invoice.date = payload.date;
  if (payload.dueDate !== undefined) invoice.dueDate = payload.dueDate;
  if (payload.notes !== undefined) invoice.notes = payload.notes;
  if (payload.terms !== undefined) invoice.terms = payload.terms;

  await invoice.save();
  return invoice;
};

/**
 * Finalizes a DRAFT invoice.
 * Generates an atomic invoice number and locks the financial document.
 * Returns the invoice if already FINALIZED.
 */
const finalizeInvoice = async (businessId, invoiceId) => {
  const business = await Business.findById(businessId);
  if (!business) throw new AppError('Business not found', 404);

  const prefix = business.invoiceSettings?.prefix || 'INV-';

  // Find invoice
  let invoice = await Invoice.findOne({ _id: invoiceId, businessId });
  if (!invoice) throw new AppError('Invoice not found', 404);

  // Idempotency: If already finalized, just return it (NO duplicate stock deduction)
  if (invoice.status === 'Unpaid' || invoice.status === 'Paid' || invoice.status === 'Partially Paid') {
    return invoice;
  }

  if (invoice.status !== 'Draft') {
    throw new AppError(`Cannot finalize invoice in status: ${invoice.status}`, 400);
  }

  // Use a transaction for atomic finalization + stock deduction
  const inventoryService = require('./inventory.service');
  const session = await mongoose.startSession();
  try {
    let finalizedInvoice;
    await session.withTransaction(async () => {
      // 1. Allocate sequence number atomically
      const counterResult = await Counter.findOneAndUpdate(
        { businessId },
        { $inc: { sequenceValue: 1 } },
        { upsert: true, returnDocument: 'after', session }
      );

      const seqStr = String(counterResult.sequenceValue).padStart(4, '0');
      const finalInvoiceNumber = `${prefix}${seqStr}`;

      // 2. Update the invoice atomically (guarding against concurrent finalizations)
      const updateResult = await Invoice.findOneAndUpdate(
        { _id: invoiceId, businessId, status: 'Draft' }, // Crucial guard condition
        { 
          $set: { 
            status: 'Unpaid',
            invoiceNumber: finalInvoiceNumber 
          } 
        },
        { returnDocument: 'after', session }
      );

      if (!updateResult) {
        // Another thread finalized it — fetch the current state
        finalizedInvoice = await Invoice.findOne({ _id: invoiceId, businessId }).session(session);
        return;
      }

      // 3. Deduct stock for Product line items
      await inventoryService.deductStockForInvoice(businessId, updateResult, session);

      finalizedInvoice = updateResult;
    });

    return finalizedInvoice;
  } finally {
    session.endSession();
  }
};

module.exports = {
  calculateInvoice,
  createDraftInvoice,
  updateDraftInvoice,
  finalizeInvoice
};
