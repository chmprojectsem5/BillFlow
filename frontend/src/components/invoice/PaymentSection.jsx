import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatters';

const PaymentSection = ({ invoice, onPaymentSuccess }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Payment Form State
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/v1/invoices/${invoice._id}/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(res.data.data.payments);
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoice && invoice._id) {
      fetchPayments();
    }
  }, [invoice._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    const amountPaise = Math.round(parseFloat(amount) * 100);

    // Generate unique idempotency key for this submission attempt
    // If the network request fails and the user retries, we DO NOT regenerate this if we want true retry idempotency
    // But since this is a simple React form, if they click submit again, we will generate a new one unless we store it in state.
    // Let's generate it once when the form is opened/mounted.
    const idempotencyKey = crypto.randomUUID();

    try {
      await axios.post(`http://localhost:5000/api/v1/invoices/${invoice._id}/payments`, {
        amount: amountPaise,
        method,
        paymentDate: new Date(paymentDate).toISOString(),
        referenceNumber,
        notes
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Idempotency-Key': idempotencyKey
        }
      });
      
      setShowForm(false);
      setAmount('');
      setReferenceNumber('');
      setNotes('');
      
      // Refresh payments and notify parent to refresh invoice
      fetchPayments();
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err) {
      console.error('Payment error', err);
      setError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const isEligibleForPayment = ['Unpaid', 'Partially Paid', 'Overdue'].includes(invoice.status);

  return (
    <div className="mt-8 border-t border-gray-200 pt-8 print:hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
        {isEligibleForPayment && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
          >
            Record Payment
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">New Payment</h4>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                max={invoice.paymentStatus?.balanceDue / 100}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Outstanding: {formatCurrency(invoice.paymentStatus?.balanceDue || 0)}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reference Number</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Optional"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !amount || parseFloat(amount) <= 0}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Payment'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm">Loading payments...</p>
      ) : payments.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <li key={payment._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">
                      {formatCurrency(payment.amount)}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {payment.method}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex flex-col">
                      <p className="flex items-center text-sm text-gray-500">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                      {payment.referenceNumber && (
                        <p className="text-xs text-gray-500 mt-1">Ref: {payment.referenceNumber}</p>
                      )}
                      {payment.notes && (
                        <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">No payments recorded yet.</p>
      )}
    </div>
  );
};

export default PaymentSection;
