import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const InvoiceTotals = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
      {/* Optional: GST Summary Breakup for Tax Details */}
      <div className="w-full md:w-1/2">
        {summary.taxTotal > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tax Summary</h4>
            <div className="space-y-2 text-sm text-gray-600">
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
              <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between font-semibold text-gray-900">
                <span>Total Tax</span>
                <span>{formatCurrency(summary.taxTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Totals */}
      <div className="w-full md:w-1/2 lg:w-1/3">
        <div className="space-y-3 text-sm text-gray-600">
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
          
          <div className="pt-4 mt-4 border-t-2 border-gray-900 flex justify-between items-center">
            <span className="text-base font-bold text-gray-900 uppercase">Grand Total</span>
            <span className="text-xl font-bold text-indigo-600">{formatCurrency(summary.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTotals;
