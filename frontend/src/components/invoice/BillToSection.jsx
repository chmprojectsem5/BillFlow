import React from 'react';

const BillToSection = ({ customerSnapshot }) => {
  if (!customerSnapshot) return null;

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 pb-1">
        Bill To
      </h3>
      <div className="text-gray-900">
        <p className="font-bold text-lg">{customerSnapshot.name}</p>
        <div className="text-sm text-gray-600 space-y-1 mt-1">
          {customerSnapshot.billingAddress && <p>{customerSnapshot.billingAddress}</p>}
          {(customerSnapshot.city || customerSnapshot.state || customerSnapshot.pinCode) && (
            <p>
              {[customerSnapshot.city, customerSnapshot.state, customerSnapshot.pinCode].filter(Boolean).join(', ')}
            </p>
          )}
          {customerSnapshot.country && <p>{customerSnapshot.country}</p>}
          
          <div className="mt-3 space-y-1">
            {customerSnapshot.gstin && (
              <p><span className="font-medium text-gray-700">GSTIN:</span> {customerSnapshot.gstin}</p>
            )}
            {customerSnapshot.pan && (
              <p><span className="font-medium text-gray-700">PAN:</span> {customerSnapshot.pan}</p>
            )}
            {customerSnapshot.email && (
              <p><span className="font-medium text-gray-700">Email:</span> {customerSnapshot.email}</p>
            )}
            {customerSnapshot.phone && (
              <p><span className="font-medium text-gray-700">Phone:</span> {customerSnapshot.phone}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillToSection;
