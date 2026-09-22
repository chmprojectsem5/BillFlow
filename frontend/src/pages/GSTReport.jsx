import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import reportApi from '../services/reportApi';
import { formatCurrency } from '../utils/formatters';

const GSTReport = () => {
  const { user, business, logout } = useAuth();
  
  const getInitialDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
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
  const [summary, setSummary] = useState(null);
  const [rateWise, setRateWise] = useState(null);
  const [hsnWise, setHsnWise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [hsnPage, setHsnPage] = useState(1);
  const hsnLimit = 10;

  const fetchReport = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const [sumRes, rateRes, hsnRes] = await Promise.all([
        reportApi.getGSTSummary(dates.startDate, dates.endDate),
        reportApi.getGSTRateWise(dates.startDate, dates.endDate),
        reportApi.getGSTHSNWise(dates.startDate, dates.endDate, page, hsnLimit)
      ]);

      setSummary(sumRes);
      setRateWise(rateRes);
      setHsnWise(hsnRes);
      setHsnPage(page);
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate report');
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
    fetchReport(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">GST Report</h1>
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

        {summary && !loading && (
          <div className="space-y-8">
            {/* GST Summary */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Total Tax Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-gray-500">CGST</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.cgstTotal)}</p>
                </div>
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-gray-500">SGST</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.sgstTotal)}</p>
                </div>
                <div className="p-6 text-center">
                  <p className="text-sm font-medium text-gray-500">IGST</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(summary.igstTotal)}</p>
                </div>
                <div className="p-6 text-center bg-indigo-50">
                  <p className="text-sm font-bold text-indigo-800">Total Tax</p>
                  <p className="mt-2 text-2xl font-bold text-indigo-900">{formatCurrency(summary.totalTax)}</p>
                </div>
              </div>
            </div>

            {/* Rate Wise */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Rate-wise Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Treatment</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Value</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CGST</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SGST</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IGST</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tax</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rateWise && rateWise.length > 0 ? (
                      rateWise.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.gstRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.taxTreatment}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(row.taxableValue)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(row.cgst)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(row.sgst)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(row.igst)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-indigo-700">{formatCurrency(row.taxAmount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No data available for this period.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HSN Wise */}
            {hsnWise && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">HSN/SAC-wise Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN/SAC Code</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty Sold</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Taxable Value</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">CGST</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">SGST</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">IGST</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {hsnWise.data && hsnWise.data.length > 0 ? (
                        hsnWise.data.map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.classificationType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.hsnSac}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{row.quantity}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(row.taxableValue)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(row.cgst)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(row.sgst)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">{formatCurrency(row.igst)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-indigo-700">{formatCurrency(row.taxAmount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">No data available for this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                {hsnWise.pagination && hsnWise.pagination.totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => fetchReport(hsnPage - 1)}
                        disabled={hsnPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchReport(hsnPage + 1)}
                        disabled={hsnPage === hsnWise.pagination.totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing page <span className="font-medium">{hsnPage}</span> of <span className="font-medium">{hsnWise.pagination.totalPages}</span>
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                          <button
                            onClick={() => fetchReport(hsnPage - 1)}
                            disabled={hsnPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => fetchReport(hsnPage + 1)}
                            disabled={hsnPage === hsnWise.pagination.totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default GSTReport;
