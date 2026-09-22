const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const env = require('../config/env');

const getBounds = (startDateStr, endDateStr, timeZone) => {
  const getOffsetMs = (date, tz) => {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
    return tzDate.getTime() - utcDate.getTime();
  };

  const start = new Date(startDateStr + 'T00:00:00Z'); 
  const startOffsetMs = getOffsetMs(start, timeZone);
  const startBound = new Date(start.getTime() - startOffsetMs);

  const end = new Date(endDateStr + 'T00:00:00Z');
  end.setUTCDate(end.getUTCDate() + 1);
  const endOffsetMs = getOffsetMs(end, timeZone);
  const endBound = new Date(end.getTime() - endOffsetMs);

  return { startBound, endBound };
};

const getBaseMatch = (businessId, startDate, endDate) => {
  const { startBound, endBound } = getBounds(startDate, endDate, env.timezone);
  return {
    businessId: new mongoose.Types.ObjectId(businessId),
    date: { $gte: startBound, $lt: endBound },
    status: { $ne: 'Draft' }
  };
};

const getSalesReport = async (businessId, startDate, endDate) => {
  const match = getBaseMatch(businessId, startDate, endDate);

  const stats = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        salesTotal: { $sum: "$summary.grandTotal" },
        taxableTotal: { $sum: "$summary.taxableTotal" },
        taxTotal: { $sum: "$summary.taxTotal" },
        invoiceCount: { $sum: 1 },
        paidAgainstIncludedInvoices: { $sum: "$paymentStatus.paidAmount" },
        balanceDueOnIncludedInvoices: { $sum: "$paymentStatus.balanceDue" }
      }
    }
  ]);

  return stats[0] || {
    salesTotal: 0,
    taxableTotal: 0,
    taxTotal: 0,
    invoiceCount: 0,
    paidAgainstIncludedInvoices: 0,
    balanceDueOnIncludedInvoices: 0
  };
};

const getGSTSummary = async (businessId, startDate, endDate) => {
  const match = getBaseMatch(businessId, startDate, endDate);

  const stats = await Invoice.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        cgstTotal: { $sum: "$summary.cgstTotal" },
        sgstTotal: { $sum: "$summary.sgstTotal" },
        igstTotal: { $sum: "$summary.igstTotal" },
        totalTax: { $sum: "$summary.taxTotal" }
      }
    }
  ]);

  return stats[0] || {
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    totalTax: 0
  };
};

const getGSTRateWise = async (businessId, startDate, endDate) => {
  const match = getBaseMatch(businessId, startDate, endDate);

  const stats = await Invoice.aggregate([
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          gstRate: "$items.gstRate",
          taxTreatment: "$items.taxTreatment"
        },
        taxableValue: { $sum: "$items.taxableValue" },
        cgst: { $sum: "$items.cgst" },
        sgst: { $sum: "$items.sgst" },
        igst: { $sum: "$items.igst" },
        taxAmount: { $sum: "$items.taxAmount" }
      }
    },
    {
      $project: {
        _id: 0,
        gstRate: "$_id.gstRate",
        taxTreatment: "$_id.taxTreatment",
        taxableValue: 1,
        cgst: 1,
        sgst: 1,
        igst: 1,
        taxAmount: 1
      }
    },
    { $sort: { gstRate: 1, taxTreatment: 1 } }
  ]);

  return stats;
};

const getGSTHSNWise = async (businessId, startDate, endDate, page = 1, limit = 50) => {
  const match = getBaseMatch(businessId, startDate, endDate);
  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: match },
    { $unwind: "$items" },
    {
      $addFields: {
        "items.hsnSac": {
          $cond: [
            { $or: [
              { $eq: ["$items.hsnSac", null] },
              { $eq: ["$items.hsnSac", ""] },
              { $not: ["$items.hsnSac"] }
            ]},
            "Uncategorized",
            "$items.hsnSac"
          ]
        }
      }
    },
    {
      $group: {
        _id: {
          classificationType: "$items.classificationType",
          hsnSac: "$items.hsnSac"
        },
        taxableValue: { $sum: "$items.taxableValue" },
        cgst: { $sum: "$items.cgst" },
        sgst: { $sum: "$items.sgst" },
        igst: { $sum: "$items.igst" },
        taxAmount: { $sum: "$items.taxAmount" },
        quantity: { $sum: "$items.quantity" }
      }
    },
    {
      $project: {
        _id: 0,
        classificationType: { $ifNull: ["$_id.classificationType", "Uncategorized"] },
        hsnSac: "$_id.hsnSac",
        taxableValue: 1,
        cgst: 1,
        sgst: 1,
        igst: 1,
        taxAmount: 1,
        quantity: 1
      }
    },
    { $sort: { classificationType: 1, hsnSac: 1 } }
  ];

  // We need total rows for pagination. Use a facet.
  const facetResult = await Invoice.aggregate([
    ...pipeline,
    {
      $facet: {
        metadata: [{ $count: "totalRows" }],
        data: [{ $skip: skip }, { $limit: limit }]
      }
    }
  ]);

  const result = facetResult[0];
  const totalRows = result.metadata.length > 0 ? result.metadata[0].totalRows : 0;
  const totalPages = Math.ceil(totalRows / limit);

  return {
    data: result.data,
    pagination: {
      page,
      limit,
      totalRows,
      totalPages
    }
  };
};

module.exports = {
  getSalesReport,
  getGSTSummary,
  getGSTRateWise,
  getGSTHSNWise
};
