import React from 'react';

const InvoiceHeader = ({ businessSnapshot }) => {
  if (!businessSnapshot) return null;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start border-b border-gray-200 pb-6 mb-6 print:flex-row print:justify-between print:pb-3 print:mb-3">
      <div className="flex-1">
        <h1 className="text-3xl print:text-2xl font-bold text-gray-900 tracking-tight">{businessSnapshot.name}</h1>
        <div className="mt-2 print:mt-1 text-sm print:text-xs text-gray-600 space-y-1 print:space-y-0.5">
          {businessSnapshot.address && <p>{businessSnapshot.address}</p>}
          {businessSnapshot.state && <p>{businessSnapshot.state}</p>}
          {businessSnapshot.gstin && (
            <p className="font-medium text-gray-700 mt-2 print:mt-1">
              GSTIN: <span className="font-normal">{businessSnapshot.gstin}</span>
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 md:mt-0 md:text-right print:mt-0 print:text-right">
        <h2 className="text-4xl print:text-2xl font-bold text-indigo-600 tracking-wider uppercase mb-1">INVOICE</h2>
      </div>
    </div>
  );
};

export default InvoiceHeader;
