import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

const Header = () => {
  const { user, business, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm shrink-0">
      <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center h-16">
        <div className="flex-1">
          {/* Optional breadcrumbs or page title could go here */}
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            <span className="text-xs text-gray-500">{business?.name}</span>
          </div>
          <Button variant="danger" size="sm" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
