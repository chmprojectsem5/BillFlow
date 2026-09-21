import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency, formatDate } from '../utils/formatters';

const InvoiceHistoryPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  
  const navigate = useNavigate();

  const fetchInvoices = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const res = await axios.get(`http://localhost:5000/api/v1/invoices?page=${page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInvoices(res.data.data.invoices);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
      setError('Failed to load invoice history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, []);

  const handleDownloadPdf = async (invoice) => {
    try {
      setDownloadingId(invoice._id);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/invoices/${invoice._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      let filename = `Invoice-${invoice.invoiceNumber}.pdf`;
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) { 
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Draft': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Draft</span>;
      case 'Unpaid': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Unpaid</span>;
      case 'Partially Paid': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Partially Paid</span>;
      case 'Paid': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Paid</span>;
      case 'Overdue': return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Overdue</span>;
      default: return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoice History</h1>
        <Link 
          to="/invoices/new" 
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          + Create New Invoice
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg text-center py-12">
          <p className="text-gray-500 mb-4">No invoices found.</p>
          <Link 
            to="/invoices/new" 
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create your first invoice
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxable
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber || 'Draft'}</div>
                      <div className="text-sm text-gray-500">{formatDate(invoice.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.customerSnapshot?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(invoice.summary?.taxableTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {formatCurrency(invoice.summary?.taxTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.summary?.grandTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Link 
                        to={`/invoices/${invoice._id}`} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                      {invoice.status === 'Draft' ? (
                        <Link 
                          to={`/invoices/new?edit=${invoice._id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
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
          
          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => fetchInvoices(pagination.page - 1)}
                      disabled={!pagination.hasPrevious}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchInvoices(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
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
  );
};

export default InvoiceHistoryPage;
