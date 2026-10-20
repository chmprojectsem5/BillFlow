import React from 'react';

const BillToSection = ({ customerSnapshot, invoice }) => {
  if (!customerSnapshot && !invoice) return null;

  const snapshot = customerSnapshot || invoice?.customerSnapshot;
  const isRegistered = snapshot?.billingMode === 'GST-Registered' || Boolean(snapshot?.gstin);
  const placeOfSupply = invoice?.placeOfSupply || snapshot?.placeOfSupply;
  const stateCode = invoice?.placeOfSupplyStateCode || snapshot?.placeOfSupplyStateCode;

  return (
    <div className="mb-8 print:mb-3">
      <h3 className="text-sm print:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 print:mb-1 border-b border-gray-200 pb-1 flex justify-between items-center">
        <span>{isRegistered ? 'Bill To (Registered Recipient)' : 'Customer / Recipient'}</span>
        {placeOfSupply && (
          <span className="text-xs print:text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 normal-case">
            Place of Supply: {placeOfSupply}{stateCode ? ` (${stateCode})` : ''}
          </span>
        )}
      </h3>
      <div className="text-gray-900">
        <p className="font-bold text-lg print:text-sm">{snapshot?.name || 'Walk-in / Counter Sale'}</p>
        <div className="text-sm print:text-xs text-gray-600 space-y-1 print:space-y-0.5 mt-1">
          {snapshot?.billingAddress && <p>{snapshot.billingAddress}</p>}
          {(snapshot?.city || snapshot?.state || snapshot?.pinCode) && (
            <p>
              {[snapshot.city, snapshot.state, snapshot.pinCode].filter(Boolean).join(', ')}
            </p>
          )}
          {snapshot?.country && snapshot.country !== 'India' && <p>{snapshot.country}</p>}

          <div className="mt-3 print:mt-1.5 space-y-1 print:space-y-0.5">
            {isRegistered && snapshot?.gstin && (
              <p><span className="font-medium text-gray-700">GSTIN:</span> <span className="font-mono">{snapshot.gstin}</span></p>
            )}
            {isRegistered && snapshot?.pan && (
              <p><span className="font-medium text-gray-700">PAN:</span> <span className="font-mono">{snapshot.pan}</span></p>
            )}
            {snapshot?.phone && (
              <p><span className="font-medium text-gray-700">Phone:</span> {snapshot.phone}</p>
            )}
            {snapshot?.email && (
              <p><span className="font-medium text-gray-700">Email:</span> {snapshot.email}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillToSection;
