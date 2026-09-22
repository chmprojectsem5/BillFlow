import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Reports = () => {
  const { user, business, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 pb-12">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reports Hub</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.name} — {business?.name}</span>
            <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-lg shadow items-center">
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">&larr; Back to Dashboard</Link>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sales Report</h2>
              <p className="text-gray-600 mb-6">
                View your business's sales performance, total invoiced amounts, collected payments, and outstanding balances across any custom date range up to one year.
              </p>
            </div>
            <Link 
              to="/reports/sales" 
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Generate Sales Report
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">GST Report</h2>
              <p className="text-gray-600 mb-6">
                Access detailed GST summaries, rate-wise breakdowns, and HSN/SAC-wise tax aggregations required for GST filing and compliance.
              </p>
            </div>
            <Link 
              to="/reports/gst" 
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Generate GST Report
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
