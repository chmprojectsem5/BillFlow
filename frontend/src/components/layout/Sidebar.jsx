import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/business-profile', label: 'Business Profile' },
  { path: '/customers', label: 'Customers' },
  { path: '/items', label: 'Products & Services' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/invoices', label: 'Invoice History' },
  { path: '/tax-config', label: 'Tax Config' },
  { path: '/reports', label: 'Reports' },
];

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <div className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center shrink-0">
        <span className="font-bold text-xl">BillFlow-Pro</span>
        <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none p-2" aria-label="Toggle Menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`${isOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-indigo-900 text-indigo-100 flex-shrink-0 flex flex-col`}>
        <div className="hidden md:flex items-center justify-center h-16 border-b border-indigo-800">
          <Link to="/dashboard" className="text-white text-xl font-bold hover:text-indigo-200">
            BillFlow-Pro
          </Link>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 mt-4 border-t border-indigo-800">
            <Link
              to="/invoices/new"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-900 bg-white hover:bg-indigo-50"
            >
              + Create Invoice
            </Link>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
