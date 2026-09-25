import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import InvoiceHeader from '../components/invoice/InvoiceHeader';
import InvoiceMeta from '../components/invoice/InvoiceMeta';
import BillToSection from '../components/invoice/BillToSection';
import InvoiceItemsTable from '../components/invoice/InvoiceItemsTable';
import InvoiceTotals from '../components/invoice/InvoiceTotals';
import PaymentSection from '../components/invoice/PaymentSection';
import Button from '../components/ui/Button';

const InvoiceViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchInvoice = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/v1/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoice(res.data.data.invoice);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load invoice. It may not exist or you do not have permission.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-500">Loading invoice...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/invoices/${id}/pdf`, {
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
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="pb-12 print:bg-white print:py-0 max-w-5xl mx-auto">
      {/* Action Bar - Hidden during print */}
      <div className="mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
        >
          &larr; Back
        </button>
        <div className="flex flex-wrap gap-3">
          {invoice.status === 'Draft' && (
            <Button 
              variant="secondary"
              onClick={() => navigate(`/invoices/new?edit=${invoice._id}`)}
            >
              Edit Draft
            </Button>
          )}
          <Button 
            variant="success"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
          >
            {downloadingPdf ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button 
            onClick={handlePrint}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Invoice Document Paper */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 print:shadow-none print:rounded-none print:border-none">
        <div className="p-8 sm:p-12">
          
          <InvoiceHeader businessSnapshot={invoice.businessSnapshot} />
          <InvoiceMeta invoice={invoice} />
          <BillToSection customerSnapshot={invoice.customerSnapshot} />
          <InvoiceItemsTable items={invoice.items} />
          <InvoiceTotals summary={invoice.summary} />
          
          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="mt-8 border-t border-gray-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
              {invoice.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-xs">Notes</h4>
                  <p className="whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 uppercase tracking-wider text-xs">Terms & Conditions</h4>
                  <p className="whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Payment Section */}
          <PaymentSection invoice={invoice} onPaymentSuccess={fetchInvoice} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewPage;
