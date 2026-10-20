import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const InvoiceItemsTable = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8 print:mb-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 print:overflow-visible print:rounded-none print:border print:border-gray-300">
        <table className="min-w-full divide-y divide-gray-200 print:min-w-0 print:w-full print:table-fixed print:divide-gray-300">
          <colgroup className="hidden print:table-column-group">
            <col className="w-[4%]" />
            <col className="w-[27%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[7%]" />
            <col className="w-[10%]" />
            <col className="w-[7%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className="bg-gray-50 print:bg-gray-100">
            <tr>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-left print:text-center text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Sr.</th>
              <th scope="col" className="px-4 py-3 print:px-1.5 print:py-1.5 text-left text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Item Details</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right print:text-center text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">HSN/SAC</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Qty</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Rate</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Disc.</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Taxable</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right print:text-center text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">GST%</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">GST Amt</th>
              <th scope="col" className="px-4 py-3 print:px-1 print:py-1.5 text-right text-xs print:text-[10px] font-semibold text-gray-600 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 print:divide-gray-200">
            {items.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap print:whitespace-normal text-sm print:text-[10px] text-gray-500 print:text-center">
                  {index + 1}
                </td>
                <td className="px-4 py-3 print:px-1.5 print:py-1 text-sm print:text-[10px] text-gray-900 break-words">
                  <div className="font-medium print:font-semibold leading-tight">{item.name}</div>
                  {item.description && <div className="text-gray-500 text-xs print:text-[9px] mt-0.5 leading-tight">{item.description}</div>}
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-500 text-right print:text-center">
                  {item.hsnSac || '-'}
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-900 text-right">
                  {item.quantity} {item.unit || ''}
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-900 text-right">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-900 text-right">
                  {item.discount > 0 ? formatCurrency(item.discount) : '-'}
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-900 text-right font-medium">
                  {formatCurrency(item.taxableValue)}
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-500 text-right print:text-center">
                  {item.gstRate}%
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-900 text-right">
                  {formatCurrency(item.taxAmount)}
                </td>
                <td className="px-4 py-3 print:px-1 print:py-1 whitespace-nowrap text-sm print:text-[10px] text-gray-900 text-right font-semibold">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceItemsTable;
