import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import InvoiceHeader from '../components/invoice/InvoiceHeader';
import InvoiceMeta from '../components/invoice/InvoiceMeta';
import BillToSection from '../components/invoice/BillToSection';
import InvoiceItemsTable from '../components/invoice/InvoiceItemsTable';
import InvoiceTotals from '../components/invoice/InvoiceTotals';
import PaymentSection from '../components/invoice/PaymentSection';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';

const InvoiceViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
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
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-rose-50 border border-rose-200/80 p-6 rounded-2xl text-center">
          <svg className="w-10 h-10 text-rose-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-slate-900 font-semibold text-base">{error || 'Invoice not found'}</p>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="secondary"
            size="sm"
            className="mt-4"
          >
            Return to Dashboard
          </Button>
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
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob'
      });

      const rawData = response.data;

      if (rawData.type === 'application/json') {
        const text = await rawData.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.error || errorData.message || 'Failed to generate PDF');
      }

      let filename = `Invoice-${invoice.invoiceNumber || id}.pdf`;
      const disposition = response.headers?.['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
      }

      // Explicitly construct application/pdf Blob
      const blob = new Blob([rawData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Delay cleanup so browser download manager has time to resolve the blob URL
      setTimeout(() => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 pb-16 min-h-screen bg-slate-50/70 print:bg-white print:p-0 print:m-0 max-w-5xl mx-auto print:max-w-none print:w-full antialiased">
      {/* Action Bar - Hidden during print */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/90">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/invoices')}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            Back to Invoices
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <div>
            <span className="text-xs text-slate-500 block">Viewing Invoice</span>
            <span className="font-bold text-slate-900 font-mono text-sm">
              {invoice.invoiceNumber || 'Draft Invoice'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {invoice.status === 'Draft' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate(`/invoices/new?edit=${invoice._id}`)}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              Edit Draft
            </Button>
          )}
          <Button
            id="download-pdf-btn"
            variant="success"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            }
          >
            {downloadingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            }
          >
            Print
          </Button>
        </div>
      </div>

      {/* Invoice Document Paper */}
      <div className="bg-white shadow-xs rounded-2xl overflow-hidden border border-slate-200/90 print:shadow-none print:rounded-none print:border-none print:overflow-visible print:w-full">
        <div className="p-8 sm:p-12 print:p-0 print:m-0">
          <InvoiceHeader businessSnapshot={invoice.businessSnapshot} />
          <InvoiceMeta invoice={invoice} />
          <BillToSection customerSnapshot={invoice.customerSnapshot} invoice={invoice} />
          <InvoiceItemsTable items={invoice.items} />
          <InvoiceTotals summary={invoice.summary} />

          {/* Notes and Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="mt-8 print:mt-4 border-t border-slate-200 pt-8 print:pt-4 grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 text-xs text-slate-600 print:break-inside-avoid print:page-break-inside-avoid">
              {invoice.notes && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 print:mb-1 uppercase tracking-wider text-[11px]">Notes</h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2 print:mb-1 uppercase tracking-wider text-[11px]">Terms & Conditions</h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
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
