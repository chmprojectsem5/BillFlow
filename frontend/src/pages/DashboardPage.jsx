import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, business, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>BillFlow-Pro</h1>
        <div className="dashboard-user-info">
          <span>{user?.name} — {business?.name}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>
      <main className="dashboard-main">
        <h2>Welcome, {user?.name}</h2>
        <p>Your dashboard will be built in upcoming phases.</p>
        <nav className="dashboard-nav">
          <Link to="/business-profile" className="nav-link">Business Profile</Link>
          <Link to="/customers" className="nav-link">Customers</Link>
        </nav>
      </main>
    </div>
  );
};

export default DashboardPage;
