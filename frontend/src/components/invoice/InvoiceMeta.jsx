import React from 'react';
import { formatDate } from '../../utils/formatters';

const InvoiceMeta = ({ invoice }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice No.</p>
        <p className="text-gray-900 font-medium">{invoice.invoiceNumber}</p>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</p>
        <p className="text-gray-900 font-medium">{formatDate(invoice.date)}</p>
      </div>
      {invoice.dueDate && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</p>
          <p className="text-gray-900 font-medium">{formatDate(invoice.dueDate)}</p>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
        <p className="text-gray-900 font-medium">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
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
