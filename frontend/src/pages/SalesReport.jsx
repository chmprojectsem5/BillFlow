import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import reportApi from '../services/reportApi';
import { formatCurrency } from '../utils/formatters';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card } from '../components/ui/Card';

const SalesReport = () => {
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
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
      </div>

      <div className="mb-8">
        <Link to="/reports" className="text-indigo-600 hover:text-indigo-900 font-medium">&larr; Back to Reports</Link>
      </div>

      <Card className="p-6 mb-8">
        <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              label="Start Date"
              type="date"
              required
              value={dates.startDate}
              onChange={(e) => setDates({ ...dates, startDate: e.target.value })}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <Input
              label="End Date"
              type="date"
              required
              value={dates.endDate}
              onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </form>
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
            {error}
          </div>
        )}
      </Card>

      {data && !loading && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Sales Overview ({dates.startDate} to {dates.endDate})
            </h3>
          </div>
          <div className="px-6 py-2">
            <dl className="divide-y divide-gray-200">
              <div className="py-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500 col-span-1">Invoices Generated</dt>
                <dd className="text-sm text-gray-900 col-span-2 font-bold">{data.invoiceCount}</dd>
              </div>
              <div className="py-4 grid grid-cols-3 gap-4 bg-gray-50 -mx-6 px-6">
                <dt className="text-sm font-medium text-gray-500 col-span-1">Total Taxable Value</dt>
                <dd className="text-sm text-gray-900 col-span-2">{formatCurrency(data.taxableTotal)}</dd>
              </div>
              <div className="py-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500 col-span-1">Total Tax Added</dt>
                <dd className="text-sm text-gray-900 col-span-2">{formatCurrency(data.taxTotal)}</dd>
              </div>
              <div className="py-4 grid grid-cols-3 gap-4 bg-indigo-50 -mx-6 px-6">
                <dt className="text-sm font-bold text-indigo-800 col-span-1">Total Sales (Gross)</dt>
                <dd className="text-lg font-bold text-indigo-900 col-span-2">{formatCurrency(data.salesTotal)}</dd>
              </div>
              <div className="py-4 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-green-700 col-span-1">Amount Collected</dt>
                <dd className="text-sm font-medium text-green-900 col-span-2">{formatCurrency(data.paidAgainstIncludedInvoices)}</dd>
              </div>
              <div className="py-4 grid grid-cols-3 gap-4 bg-red-50 -mx-6 px-6">
                <dt className="text-sm font-medium text-red-700 col-span-1">Outstanding Balance</dt>
                <dd className="text-sm font-medium text-red-900 col-span-2">{formatCurrency(data.balanceDueOnIncludedInvoices)}</dd>
              </div>
            </dl>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SalesReport;
