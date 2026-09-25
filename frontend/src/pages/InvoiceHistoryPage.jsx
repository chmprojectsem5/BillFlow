import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency, formatDate } from '../utils/formatters';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const InvoiceHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;
  const searchStr = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const sort = searchParams.get('sort') || 'date';
  const order = searchParams.get('order') || 'desc';

  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrevious: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  
  const [searchInput, setSearchInput] = useState(searchStr);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchStr) {
        updateParams({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, searchStr]);

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    for (const key in newParams) {
      if (newParams[key] === '' || newParams[key] === null) {
        params.delete(key);
      } else {
        params.set(key, newParams[key]);
      }
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({ page, limit: pagination.limit || 20 });
      if (searchStr) queryParams.set('search', searchStr);
      if (statusFilter) queryParams.set('status', statusFilter);
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);
      if (sort) queryParams.set('sort', sort);
      if (order) queryParams.set('order', order);

      const res = await axios.get(`http://localhost:5000/api/v1/invoices?${queryParams.toString()}`, {
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
    fetchInvoices();
  }, [page, searchStr, statusFilter, startDate, endDate, sort, order]);

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
      case 'Draft': return <Badge status="default">Draft</Badge>;
      case 'Unpaid': return <Badge status="warning">Unpaid</Badge>;
      case 'Partially Paid': return <Badge status="info">Partially Paid</Badge>;
      case 'Paid': return <Badge status="success">Paid</Badge>;
      case 'Overdue': return <Badge status="danger">Overdue</Badge>;
      case 'Cancelled': return <Badge status="danger">Cancelled</Badge>;
      default: return <Badge status="default">{status}</Badge>;
    }
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Invoice History</h1>
        <Button onClick={() => navigate('/invoices/new')}>+ Create New Invoice</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-auto flex-1 min-w-[200px]">
            <Input 
              type="text" 
              placeholder="Search Invoice #, Customer..." 
              value={searchInput} 
              onChange={e => setSearchInput(e.target.value)} 
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={statusFilter} 
              onChange={e => updateParams({ status: e.target.value, page: 1 })}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Input 
              label="From"
              type="date" 
              value={startDate} 
              onChange={e => updateParams({ startDate: e.target.value, page: 1 })}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Input 
              label="To"
              type="date" 
              value={endDate} 
              onChange={e => updateParams({ endDate: e.target.value, page: 1 })}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={sort} 
              onChange={e => updateParams({ sort: e.target.value, page: 1 })}
            >
              <option value="date">Date</option>
              <option value="invoiceNumber">Invoice #</option>
              <option value="grandTotal">Total Amount</option>
              <option value="createdAt">Created At</option>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={order} 
              onChange={e => updateParams({ order: e.target.value, page: 1 })}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Button variant="secondary" onClick={clearFilters} className="w-full">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-4 text-lg">No invoices found.</p>
          <Button onClick={() => navigate('/invoices/new')}>Create your first invoice</Button>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <Thead>
              <Tr>
                <Th>Invoice</Th>
                <Th>Customer</Th>
                <Th>Status</Th>
                <Th className="text-right">Taxable</Th>
                <Th className="text-right">GST</Th>
                <Th className="text-right">Total</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoices.map((invoice) => (
                <Tr key={invoice._id}>
                  <Td>
                    <div className="font-medium text-gray-900">{invoice.invoiceNumber || 'Draft'}</div>
                    <div className="text-gray-500">{formatDate(invoice.date)}</div>
                  </Td>
                  <Td className="font-medium">{invoice.customerSnapshot?.name || 'Unknown'}</Td>
                  <Td>{getStatusBadge(invoice.status)}</Td>
                  <Td className="text-right text-gray-500">
                    {formatCurrency(invoice.summary?.taxableTotal)}
                  </Td>
                  <Td className="text-right text-gray-500">
                    {formatCurrency(invoice.summary?.taxTotal)}
                  </Td>
                  <Td className="text-right font-medium text-gray-900">
                    {formatCurrency(invoice.summary?.grandTotal)}
                  </Td>
                  <Td className="text-right space-x-3">
                    <Link 
                      to={`/invoices/${invoice._id}`} 
                      className="text-indigo-600 hover:text-indigo-900 font-medium inline-block"
                    >
                      View
                    </Link>
                    {invoice.status === 'Draft' ? (
                      <Link 
                        to={`/invoices/new?edit=${invoice._id}`} 
                        className="text-blue-600 hover:text-blue-900 font-medium inline-block"
                      >
                        Edit
                      </Link>
                    ) : (
                      <button 
                        onClick={() => handleDownloadPdf(invoice)}
                        disabled={downloadingId === invoice._id}
                        className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                      >
                        {downloadingId === invoice._id ? 'Downloading...' : 'PDF'}
                      </button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}
      
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Showing page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
          </span>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              size="sm"
              disabled={!pagination.hasPrevious}
              onClick={() => updateParams({ page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => updateParams({ page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistoryPage;
