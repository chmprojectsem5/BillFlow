import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const CustomersPage = () => {
  const { user, business, logout } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', customerType: 'Business', phone: '', email: '', billingAddress: '',
    city: '', state: '', pinCode: '', country: 'India', gstin: '', pan: '', notes: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data.data.customers);
    } catch (err) {
      setError('Failed to fetch customers.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '', customerType: 'Business', phone: '', email: '', billingAddress: '',
      city: '', state: '', pinCode: '', country: 'India', gstin: '', pan: '', notes: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name || '',
      customerType: customer.customerType || 'Business',
      phone: customer.phone || '',
      email: customer.email || '',
      billingAddress: customer.billingAddress || '',
      city: customer.city || '',
      state: customer.state || '',
      pinCode: customer.pinCode || '',
      country: customer.country || 'India',
      gstin: customer.gstin || '',
      pan: customer.pan || '',
      notes: customer.notes || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');
    try {
      if (editingCustomer) {
        await api.patch(`/customers/${editingCustomer._id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      await fetchCustomers();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Operation failed.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert('Failed to delete customer.');
    }
  };

  if (loading) {
    return <div className="page-loading">Loading customers...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1><Link to="/dashboard" className="header-link">BillFlow-Pro</Link></h1>
        <div className="dashboard-user-info">
          <span>{user?.name} — {business?.name}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="page-header">
          <h2>Customers</h2>
          <button onClick={openAddModal} className="auth-btn btn-sm">Add Customer</button>
        </div>

        {error && <div className="profile-msg error">{error}</div>}

        {customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found. Add your first customer.</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>GSTIN</th>
                  <th>City</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c._id}>
                    <td>{c.name}</td>
                    <td>{c.customerType}</td>
                    <td>
                      <div>{c.phone}</div>
                      <div className="text-sm text-gray">{c.email}</div>
                    </td>
                    <td>{c.gstin || '-'}</td>
                    <td>{c.city || '-'}</td>
                    <td className="actions-cell">
                      <button onClick={() => openEditModal(c)} className="action-btn edit">Edit</button>
                      <button onClick={() => handleDelete(c._id)} className="action-btn delete">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Overlay */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</h3>
              <button onClick={closeModal} className="modal-close">&times;</button>
            </div>
            
            {formError && <div className="profile-msg error">{formError}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <fieldset className="profile-section">
                <legend>Customer Details</legend>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name / Business Name *</label>
                    <input name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Customer Type</label>
                    <select name="customerType" value={formData.customerType} onChange={handleChange}>
                      <option value="Business">Business</option>
                      <option value="Individual">Individual</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              <fieldset className="profile-section">
                <legend>Contact</legend>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="profile-section">
                <legend>Address</legend>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Billing Address</label>
                    <input name="billingAddress" value={formData.billingAddress} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={formData.city} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input name="state" value={formData.state} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>PIN Code</label>
                    <input name="pinCode" value={formData.pinCode} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input name="country" value={formData.country} onChange={handleChange} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="profile-section">
                <legend>Tax Details & Additional</legend>
                <div className="form-grid">
                  <div className="form-group">
                    <label>GSTIN</label>
                    <input name="gstin" value={formData.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
                  </div>
                  <div className="form-group">
                    <label>PAN</label>
                    <input name="pan" value={formData.pan} onChange={handleChange} placeholder="AAAAA0000A" />
                  </div>
                  <div className="form-group full-width">
                    <label>Notes</label>
                    <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} />
                  </div>
                </div>
              </fieldset>

              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="auth-btn secondary">Cancel</button>
                <button type="submit" className="auth-btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
