import React from 'react';
import { formatDate } from '../../utils/formatters';

const InvoiceMeta = ({ invoice }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100 print:grid-cols-4 print:gap-2 print:mb-3 print:p-2.5 print:rounded print:border-gray-200">
      <div>
        <p className="text-xs print:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Invoice No.</p>
        <p className="text-gray-900 font-medium print:text-xs">{invoice.invoiceNumber}</p>
      </div>
      <div>
        <p className="text-xs print:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date</p>
        <p className="text-gray-900 font-medium print:text-xs">{formatDate(invoice.date)}</p>
      </div>
      {invoice.dueDate ? (
        <div>
          <p className="text-xs print:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Due Date</p>
          <p className="text-gray-900 font-medium print:text-xs">{formatDate(invoice.dueDate)}</p>
        </div>
      ) : (
        <div>
          <p className="text-xs print:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Invoice Type</p>
          <p className="text-gray-900 font-medium print:text-xs">{invoice.billingMode || 'General Walk-in'}</p>
        </div>
      )}
      <div>
        <p className="text-xs print:text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</p>
        <p className="text-gray-900 font-medium print:text-xs">
          <span className={`inline-flex items-center px-2.5 py-0.5 print:px-2 print:py-0 rounded-full text-xs print:text-[10px] font-medium capitalize
            ${invoice.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
            ${invoice.status === 'Unpaid' ? 'bg-blue-100 text-blue-800' : ''}
            ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : ''}
            ${invoice.status === 'Partially Paid' ? 'bg-yellow-100 text-yellow-800' : ''}
            ${invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' : ''}
          `}>
            {invoice.status}
          </span>
        </p>
      </div>
    </div>
  );
};

export default InvoiceMeta;
