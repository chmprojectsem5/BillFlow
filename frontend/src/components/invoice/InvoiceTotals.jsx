import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const InvoiceTotals = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8 print:flex-row print:justify-between print:items-start print:gap-4 print:mb-4 print:break-inside-avoid print:page-break-inside-avoid">
      {/* Optional: GST Summary Breakup for Tax Details */}
      <div className="w-full md:w-1/2 print:w-[48%] print:block print:break-inside-avoid">
        {summary.taxTotal > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-2.5 print:rounded print:border print:border-gray-300 print:bg-gray-50">
            <h4 className="text-xs print:text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3 print:mb-1.5">Tax Summary</h4>
            <div className="space-y-2 print:space-y-1 text-sm print:text-xs text-gray-600">
              {summary.cgstTotal > 0 && (
                <div className="flex justify-between">
                  <span>CGST</span>
                  <span className="font-medium text-gray-900">{formatCurrency(summary.cgstTotal)}</span>
                </div>
              )}
              {summary.sgstTotal > 0 && (
                <div className="flex justify-between">
                  <span>SGST</span>
                  <span className="font-medium text-gray-900">{formatCurrency(summary.sgstTotal)}</span>
                </div>
              )}
              {summary.igstTotal > 0 && (
                <div className="flex justify-between">
                  <span>IGST</span>
                  <span className="font-medium text-gray-900">{formatCurrency(summary.igstTotal)}</span>
                </div>
              )}
              <div className="pt-2 mt-2 print:pt-1 print:mt-1 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
                <span>Total Tax</span>
                <span>{formatCurrency(summary.taxTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Totals */}
      <div className="w-full md:w-1/2 lg:w-1/3 print:w-[46%] print:block print:break-inside-avoid">
        <div className="space-y-3 print:space-y-1 text-sm print:text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-gray-900">{formatCurrency(summary.subTotal)}</span>
          </div>
          
          {summary.discountTotal > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount</span>
              <span className="font-medium">-{formatCurrency(summary.discountTotal)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Taxable Amount</span>
            <span className="font-medium text-gray-900">{formatCurrency(summary.taxableTotal)}</span>
          </div>
          
          <div className="flex justify-between">
            <span>GST</span>
            <span className="font-medium text-gray-900">{formatCurrency(summary.taxTotal)}</span>
          </div>
          
          <div className="pt-4 mt-4 print:pt-2 print:mt-2 border-t-2 border-gray-900 flex justify-between items-center">
            <span className="text-base print:text-xs font-bold text-gray-900 uppercase">Grand Total</span>
            <span className="text-xl print:text-sm font-bold text-indigo-600">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotals;
