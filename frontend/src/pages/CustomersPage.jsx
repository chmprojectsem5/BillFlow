import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const CustomersPage = () => {
  const { user, business, logout } = useAuth();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;
  const searchStr = searchParams.get('search') || '';
  const customerType = searchParams.get('customerType') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, hasNext: false, hasPrevious: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local state for debouncing search input
  const [searchInput, setSearchInput] = useState(searchStr);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', customerType: 'Business', phone: '', email: '', billingAddress: '',
    city: '', state: '', pinCode: '', country: 'India', gstin: '', pan: '', notes: ''
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchStr) {
        updateParams({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchStr, customerType, sort, order]);

  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    for (const key in newParams) {
      if (newParams[key] === '' || newParams[key] === null) {
        params.delete(key);
      } else {
        params.set(key, newParams[key]);
      }
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers', {
        params: { page, search: searchStr, customerType, sort, order }
      });
      setCustomers(res.data.data.customers);
      setPagination(res.data.data.pagination);
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

        <div className="filter-controls" style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search name, email, phone, GSTIN..." 
            value={searchInput} 
            onChange={e => setSearchInput(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <select 
            value={customerType} 
            onChange={e => updateParams({ customerType: e.target.value, page: 1 })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">All Types</option>
            <option value="Business">Business</option>
            <option value="Individual">Individual</option>
          </select>
          <select 
            value={sort} 
            onChange={e => updateParams({ sort: e.target.value, page: 1 })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="createdAt">Date Added</option>
            <option value="name">Name</option>
          </select>
          <select 
            value={order} 
            onChange={e => updateParams({ order: e.target.value, page: 1 })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <button onClick={clearFilters} className="auth-btn btn-sm secondary">Clear Filters</button>
        </div>

        {error && <div className="profile-msg error">{error}</div>}

        {customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers found matching your criteria.</p>
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

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              Showing page {pagination.page} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                disabled={!pagination.hasPrevious} 
                onClick={() => updateParams({ page: pagination.page - 1 })}
                className="auth-btn btn-sm secondary"
              >
                Previous
              </button>
              <button 
                disabled={!pagination.hasNext} 
                onClick={() => updateParams({ page: pagination.page + 1 })}
                className="auth-btn btn-sm secondary"
              >
                Next
              </button>
            </div>
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
