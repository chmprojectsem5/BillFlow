import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatters';

const DashboardPage = () => {
  const { user, business, logout } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/dashboard/summary`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        const json = await res.json();
        
        if (!res.ok) {
          throw new Error(json.message || 'Failed to load dashboard data');
        }

        setData(json.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user.token]);

  const handleDownloadPdf = async (invoice) => {
    try {
      setDownloadingId(invoice._id);
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/invoices/${invoice._id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to download PDF');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      alert(err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const renderKPIs = () => {
    if (!data) return null;
    const { kpis, period } = data;

    const cards = [
      { label: 'Sales This Month', value: formatCurrency(kpis.salesTotal) },
      { label: 'Invoices This Month', value: kpis.invoiceCount },
      { label: 'Paid This Month', value: formatCurrency(kpis.paidTotal) },
      { label: 'Outstanding', value: formatCurrency(kpis.outstandingAmount) },
      { label: 'GST on Invoiced Sales', value: formatCurrency(kpis.taxTotal) },
      { label: 'Low Stock', value: kpis.lowStockCount, className: kpis.lowStockCount > 0 ? 'text-amber-600' : '' },
      { label: 'Out of Stock', value: kpis.outOfStockCount, className: kpis.outOfStockCount > 0 ? 'text-red-600' : '' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{card.label}</h3>
            <p className={`text-2xl font-bold text-gray-900 ${card.className || ''}`}>{card.value}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderRecentInvoices = () => {
    if (!data) return null;
    const invoices = data.recentInvoices;

    if (invoices.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No recent invoices.
        </div>
      );
    }

    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Invoices</h3>
          <Link to="/invoice-history" className="text-sm text-indigo-600 hover:text-indigo-900">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber || 'Draft'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.customerSnapshot?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                        invoice.status === 'Draft' ? 'bg-gray-100 text-gray-800' : 
                        invoice.status === 'Partially Paid' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatCurrency(invoice.summary?.grandTotal || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link to={`/invoices/${invoice._id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
                    {invoice.status === 'Draft' ? (
                      <Link to={`/invoices/new?edit=${invoice._id}`} className="text-blue-600 hover:text-blue-900">Continue Editing</Link>
                    ) : (
                      <button 
                        onClick={() => handleDownloadPdf(invoice)}
                        disabled={downloadingId === invoice._id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {downloadingId === invoice._id ? 'Downloading...' : 'PDF'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">BillFlow-Pro Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.name} — {business?.name}</span>
            <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-lg shadow items-center">
          <Link to="/business-profile" className="text-gray-600 hover:text-gray-900 font-medium">Business Profile</Link>
          <Link to="/customers" className="text-gray-600 hover:text-gray-900 font-medium">Customers</Link>
          <Link to="/items" className="text-gray-600 hover:text-gray-900 font-medium">Products & Services</Link>
          <Link to="/inventory" className="text-gray-600 hover:text-gray-900 font-medium">Inventory</Link>
          <Link to="/invoice-history" className="text-gray-600 hover:text-gray-900 font-medium">Invoice History</Link>
          <Link to="/tax-config" className="text-gray-600 hover:text-gray-900 font-medium">Tax Config</Link>
          <div className="flex-1"></div>
          <Link to="/invoices/new" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            + Create Invoice
          </Link>
        </nav>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            {renderKPIs()}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {renderRecentInvoices()}
              </div>
              <div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Links</h3>
                  <div className="space-y-4">
                    <Link to="/invoices/new" className="block text-indigo-600 hover:text-indigo-900">Create new invoice &rarr;</Link>
                    <Link to="/inventory" className="block text-indigo-600 hover:text-indigo-900">Manage stock &rarr;</Link>
                    <Link to="/customers" className="block text-indigo-600 hover:text-indigo-900">View customer list &rarr;</Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;
