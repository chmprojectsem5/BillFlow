import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import reportApi from '../services/reportApi';
import { formatCurrency } from '../utils/formatters';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';

const GSTReport = () => {
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
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">GST Report</h1>
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

      {summary && !loading && (
        <div className="space-y-8">
          {/* GST Summary */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Total Tax Summary</h3>
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
          </Card>

          {/* Rate Wise */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Rate-wise Breakdown</h3>
            </div>
            <Table>
              <Thead>
                <Tr>
                  <Th>GST Rate</Th>
                  <Th>Tax Treatment</Th>
                  <Th className="text-right">Taxable Value</Th>
                  <Th className="text-right">CGST</Th>
                  <Th className="text-right">SGST</Th>
                  <Th className="text-right">IGST</Th>
                  <Th className="text-right">Total Tax</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rateWise && rateWise.length > 0 ? (
                  rateWise.map((row, idx) => (
                    <Tr key={idx}>
                      <Td className="font-medium">{row.gstRate}%</Td>
                      <Td className="text-gray-500">{row.taxTreatment}</Td>
                      <Td className="text-right font-medium">{formatCurrency(row.taxableValue)}</Td>
                      <Td className="text-right text-gray-500">{formatCurrency(row.cgst)}</Td>
                      <Td className="text-right text-gray-500">{formatCurrency(row.sgst)}</Td>
                      <Td className="text-right text-gray-500">{formatCurrency(row.igst)}</Td>
                      <Td className="text-right font-bold text-indigo-700">{formatCurrency(row.taxAmount)}</Td>
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td colSpan="7" className="text-center text-gray-500 py-6">No data available for this period.</Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </Card>

          {/* HSN Wise */}
          {hsnWise && (
            <Card>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">HSN/SAC-wise Summary</h3>
              </div>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Type</Th>
                    <Th>HSN/SAC Code</Th>
                    <Th className="text-right">Qty Sold</Th>
                    <Th className="text-right">Taxable Value</Th>
                    <Th className="text-right">CGST</Th>
                    <Th className="text-right">SGST</Th>
                    <Th className="text-right">IGST</Th>
                    <Th className="text-right">Total Tax</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {hsnWise.data && hsnWise.data.length > 0 ? (
                    hsnWise.data.map((row, idx) => (
                      <Tr key={idx}>
                        <Td className="text-gray-500">{row.classificationType}</Td>
                        <Td className="font-medium">{row.hsnSac}</Td>
                        <Td className="text-right text-gray-500">{row.quantity}</Td>
                        <Td className="text-right font-medium">{formatCurrency(row.taxableValue)}</Td>
                        <Td className="text-right text-gray-500">{formatCurrency(row.cgst)}</Td>
                        <Td className="text-right text-gray-500">{formatCurrency(row.sgst)}</Td>
                        <Td className="text-right text-gray-500">{formatCurrency(row.igst)}</Td>
                        <Td className="text-right font-bold text-indigo-700">{formatCurrency(row.taxAmount)}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan="8" className="text-center text-gray-500 py-6">No data available for this period.</Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
              {/* Pagination */}
              {hsnWise.pagination && hsnWise.pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{hsnPage}</span> of <span className="font-medium">{hsnWise.pagination.totalPages}</span>
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchReport(hsnPage - 1)}
                      disabled={hsnPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fetchReport(hsnPage + 1)}
                      disabled={hsnPage === hsnWise.pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default GSTReport;
