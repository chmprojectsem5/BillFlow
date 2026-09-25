import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/summary');
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
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
    const { kpis } = data;

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
          <Card key={idx} className="p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">{card.label}</h3>
            <p className={`text-2xl font-bold text-gray-900 ${card.className || ''}`}>{card.value}</p>
          </Card>
        ))}
      </div>
    );
  };

  const renderRecentInvoices = () => {
    if (!data) return null;
    const invoices = data.recentInvoices;

    if (invoices.length === 0) {
      return (
        <Card className="p-8 text-center">
          <p className="text-gray-500">No recent invoices.</p>
        </Card>
      );
    }

    return (
      <Card>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Invoices</h3>
          <Link to="/invoices" className="text-sm text-indigo-600 hover:text-indigo-900 font-medium">View All</Link>
        </div>
        <Table>
          <Thead>
            <Tr>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {invoices.map((invoice) => {
              let statusBadge = 'default';
              if (invoice.status === 'Paid') statusBadge = 'success';
              else if (invoice.status === 'Partially Paid') statusBadge = 'info';
              else if (invoice.status === 'Overdue' || invoice.status === 'Cancelled') statusBadge = 'danger';

              return (
                <Tr key={invoice._id}>
                  <Td className="font-medium">{invoice.invoiceNumber || 'Draft'}</Td>
                  <Td className="text-gray-500">{formatDate(invoice.date)}</Td>
                  <Td className="text-gray-500">{invoice.customerSnapshot?.name || 'Unknown'}</Td>
                  <Td>
                    <Badge status={statusBadge}>{invoice.status}</Badge>
                  </Td>
                  <Td className="text-right font-medium">{formatCurrency(invoice.summary?.grandTotal || 0)}</Td>
                  <Td className="text-right space-x-3">
                    <Link to={`/invoices/${invoice._id}`} className="text-indigo-600 hover:text-indigo-900 font-medium">View</Link>
                    {invoice.status === 'Draft' ? (
                      <Link to={`/invoices/new?edit=${invoice._id}`} className="text-blue-600 hover:text-blue-900 font-medium">Edit</Link>
                    ) : (
                      <button 
                        onClick={() => handleDownloadPdf(invoice)}
                        disabled={downloadingId === invoice._id}
                        className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                      >
                        {downloadingId === invoice._id ? '...' : 'PDF'}
                      </button>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      ) : (
        <>
          {renderKPIs()}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {renderRecentInvoices()}
            </div>
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-4">
                  <Link to="/invoices/new" className="block text-indigo-600 hover:text-indigo-900 font-medium">Create new invoice &rarr;</Link>
                  <Link to="/inventory" className="block text-indigo-600 hover:text-indigo-900 font-medium">Manage stock &rarr;</Link>
                  <Link to="/customers" className="block text-indigo-600 hover:text-indigo-900 font-medium">View customer list &rarr;</Link>
                  <Link to="/reports" className="block text-indigo-600 hover:text-indigo-900 font-medium">View financial reports &rarr;</Link>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
