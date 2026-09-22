import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import reportApi from '../services/reportApi';
import { formatCurrency, formatDate } from '../utils/formatters';

const SalesReport = () => {
  const { user, business, logout } = useAuth();
  
  // Default date range: current month
  const getInitialDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Format YYYY-MM-DD
    const formatYMD = (d) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    
    return {
      startDate: formatYMD(firstDay),
      endDate: formatYMD(today)
    };
  };

  const [dates, setDates] = useState(getInitialDates());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await reportApi.getSalesReport(dates.startDate, dates.endDate);
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate report');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line
  }, []);

  const handleGenerate = (e) => {
    e.preventDefault();
    fetchReport();
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.name} — {business?.name}</span>
            <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-lg shadow items-center">
          <Link to="/reports" className="text-gray-600 hover:text-gray-900 font-medium">&larr; Back to Reports</Link>
        </nav>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                required
                value={dates.startDate}
                onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                required
                value={dates.endDate}
                onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>

        {data && !loading && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Sales Overview ({dates.startDate} to {dates.endDate})
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Invoices Generated</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold">{data.invoiceCount}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
                  <dt className="text-sm font-medium text-gray-500">Total Taxable Value</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatCurrency(data.taxableTotal)}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Total Tax Added</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatCurrency(data.taxTotal)}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-indigo-50">
                  <dt className="text-sm font-medium text-indigo-800">Total Sales (Gross)</dt>
                  <dd className="mt-1 text-lg font-bold text-indigo-900 sm:mt-0 sm:col-span-2">{formatCurrency(data.salesTotal)}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-green-700">Amount Collected</dt>
                  <dd className="mt-1 text-sm font-medium text-green-900 sm:mt-0 sm:col-span-2">{formatCurrency(data.paidAgainstIncludedInvoices)}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-red-50">
                  <dt className="text-sm font-medium text-red-700">Outstanding Balance</dt>
                  <dd className="mt-1 text-sm font-medium text-red-900 sm:mt-0 sm:col-span-2">{formatCurrency(data.balanceDueOnIncludedInvoices)}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SalesReport;
