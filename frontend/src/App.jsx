import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BusinessProfilePage from './pages/BusinessProfilePage';
import CustomersPage from './pages/CustomersPage';
import ItemsPage from './pages/ItemsPage';
import TaxConfigPage from './pages/TaxConfigPage';
import InvoiceCreatePage from './pages/InvoiceCreatePage';
import InvoiceViewPage from './pages/InvoiceViewPage';
import InvoiceHistoryPage from './pages/InvoiceHistoryPage';
import InventoryPage from './pages/InventoryPage';
import Reports from './pages/Reports';
import SalesReport from './pages/SalesReport';
import GSTReport from './pages/GSTReport';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Application Shell Pages */}
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
          <Route path="/business-profile" element={<ProtectedRoute><AppLayout><BusinessProfilePage /></AppLayout></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><AppLayout><CustomersPage /></AppLayout></ProtectedRoute>} />
          <Route path="/items" element={<ProtectedRoute><AppLayout><ItemsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/tax-config" element={<ProtectedRoute><AppLayout><TaxConfigPage /></AppLayout></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><AppLayout><InvoiceHistoryPage /></AppLayout></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><AppLayout><InventoryPage /></AppLayout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><AppLayout><Reports /></AppLayout></ProtectedRoute>} />
          <Route path="/reports/sales" element={<ProtectedRoute><AppLayout><SalesReport /></AppLayout></ProtectedRoute>} />
          <Route path="/reports/gst" element={<ProtectedRoute><AppLayout><GSTReport /></AppLayout></ProtectedRoute>} />
          
          {/* Standalone / Document Pages */}
          <Route path="/invoices/new" element={<ProtectedRoute><InvoiceCreatePage /></ProtectedRoute>} />
          <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceViewPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
