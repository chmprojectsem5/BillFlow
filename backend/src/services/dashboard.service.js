const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Item = require('../models/Item');
const env = require('../config/env');

/**
 * Get high-level business dashboard summary
 * Date boundaries are dynamically computed inside MongoDB using the APP_TIMEZONE.
 * @param {string} businessId 
 */
const getDashboardSummary = async (businessId) => {
  // Determine the current year and month in the target timezone
  const now = new Date();
  const timeZone = env.timezone; // Defaults to 'Asia/Kolkata'
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'numeric' }).formatToParts(now);
  const currentYear = parseInt(parts.find(p => p.type === 'year').value, 10);
  const currentMonth = parseInt(parts.find(p => p.type === 'month').value, 10);

  const businessObjectId = new mongoose.Types.ObjectId(businessId);

  // 1. INVOICE METRICS
  // Sales, Count, GST, Outstanding from finalized/non-Draft invoices in current calendar month
  const invoiceStats = await Invoice.aggregate([
    {
      $match: {
        businessId: businessObjectId,
        status: { $ne: 'Draft' },
        $expr: {
          $and: [
            { $eq: [{ $year: { date: "$date", timezone: timeZone } }, currentYear] },
            { $eq: [{ $month: { date: "$date", timezone: timeZone } }, currentMonth] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        invoiceCount: { $sum: 1 },
        salesTotal: { $sum: "$summary.grandTotal" },
        outstandingAmount: { $sum: "$paymentStatus.balanceDue" },
        taxTotal: { $sum: "$summary.taxTotal" }
      }
    }
  ]);

  const invoiceData = invoiceStats[0] || { invoiceCount: 0, salesTotal: 0, outstandingAmount: 0, taxTotal: 0 };

  // 2. PAYMENT METRICS
  // Paid This Month from Payments recorded in current calendar month
  const paymentStats = await Payment.aggregate([
    {
      $match: {
        businessId: businessObjectId,
        $expr: {
          $and: [
            { $eq: [{ $year: { date: "$paymentDate", timezone: timeZone } }, currentYear] },
            { $eq: [{ $month: { date: "$paymentDate", timezone: timeZone } }, currentMonth] }
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        paidTotal: { $sum: "$amount" }
      }
    }
  ]);

  const paymentData = paymentStats[0] || { paidTotal: 0 };

  // 3. INVENTORY METRICS
  // Active Products only
  const [lowStockCount, outOfStockCount] = await Promise.all([
    Item.countDocuments({
      businessId: businessObjectId,
      type: 'Product',
      isActive: true,
      $expr: {
        $and: [
          { $ne: [{ $type: "$currentStock" }, "null"] },
          { $ne: [{ $type: "$lowStockThreshold" }, "null"] },
          { $gt: ["$currentStock", 0] },
          { $lte: ["$currentStock", "$lowStockThreshold"] }
        ]
      }
    }),
    Item.countDocuments({
      businessId: businessObjectId,
      type: 'Product',
      isActive: true,
      currentStock: 0
    })
  ]);

  // 4. RECENT INVOICES
  const recentInvoices = await Invoice.find({ businessId: businessObjectId })
    .sort({ date: -1, createdAt: -1 })
    .limit(5)
    .select('invoiceNumber date customerSnapshot.name status summary.grandTotal')
    .lean();

  return {
    kpis: {
      salesTotal: invoiceData.salesTotal,
      invoiceCount: invoiceData.invoiceCount,
      paidTotal: paymentData.paidTotal,
      outstandingAmount: invoiceData.outstandingAmount,
      taxTotal: invoiceData.taxTotal,
      lowStockCount,
      outOfStockCount
    },
    recentInvoices,
    period: {
      year: currentYear,
      month: currentMonth,
      timeZone
    }
  };
};

module.exports = {
  getDashboardSummary
};
