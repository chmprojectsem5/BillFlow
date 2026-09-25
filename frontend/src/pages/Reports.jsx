import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';

const Reports = () => {
  return (
    <div className="pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports Hub</h1>
      </div>

      <div className="mb-8">
        <Link to="/dashboard" className="text-indigo-600 hover:text-indigo-900 font-medium">&larr; Back to Dashboard</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sales Report</h2>
            <p className="text-gray-600 mb-6">
              View your business's sales performance, total invoiced amounts, collected payments, and outstanding balances across any custom date range up to one year.
            </p>
          </div>
          <Link to="/reports/sales" className="inline-block w-full">
            <Button className="w-full justify-center">Generate Sales Report</Button>
          </Link>
        </Card>

        <Card className="p-6 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">GST Report</h2>
            <p className="text-gray-600 mb-6">
              Access detailed GST summaries, rate-wise breakdowns, and HSN/SAC-wise tax aggregations required for GST filing and compliance.
            </p>
          </div>
          <Link to="/reports/gst" className="inline-block w-full">
            <Button className="w-full justify-center">Generate GST Report</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
