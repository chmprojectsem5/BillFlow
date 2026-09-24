import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';

const emptyProductForm = {
  name: '', type: 'Product', description: '', sku: '', unit: 'pcs',
  unitPrice: '', costPrice: '', currentStock: '', lowStockThreshold: '',
  isActive: true, notes: ''
};

const emptyServiceForm = {
  name: '', type: 'Service', description: '', unit: 'hr',
  unitPrice: '', isActive: true, notes: ''
};

const formatPaise = (paise) => {
  if (paise == null) return '-';
  return `₹${(paise / 100).toFixed(2)}`;
};

const ItemsPage = () => {
  const { user, business, logout } = useAuth();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;
  const searchStr = searchParams.get('search') || '';
  const filterType = searchParams.get('type') || ''; // '' = All, 'Product', 'Service'
  const isActiveStr = searchParams.get('isActive') || ''; // '' = All, 'true' = Active, 'false' = Inactive
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, hasNext: false, hasPrevious: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchInput, setSearchInput] = useState(searchStr);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ ...emptyProductForm });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchStr) {
        updateParams({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchItems();
  }, [page, searchStr, filterType, isActiveStr, sort, order]);

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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/items', {
        params: { page, search: searchStr, type: filterType, isActive: isActiveStr, sort, order }
      });
      setItems(res.data.data.items);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError('Failed to fetch items.');
    } finally {
      setLoading(false);
    }
  };

  

  const openAddModal = (type = 'Product') => {
    setEditingItem(null);
    setFormData(type === 'Service' ? { ...emptyServiceForm } : { ...emptyProductForm });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    if (item.type === 'Service') {
      setFormData({
        name: item.name || '', type: 'Service',
        description: item.description || '', unit: item.unit || 'hr',
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
        isActive: item.isActive ?? true, notes: item.notes || ''
      });
    } else {
      setFormData({
        name: item.name || '', type: 'Product',
        description: item.description || '', sku: item.sku || '', unit: item.unit || 'pcs',
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
        costPrice: item.costPrice != null ? String(item.costPrice) : '',
        currentStock: item.currentStock != null ? String(item.currentStock) : '',
        lowStockThreshold: item.lowStockThreshold != null ? String(item.lowStockThreshold) : '',
        isActive: item.isActive ?? true, notes: item.notes || ''
      });
    }
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    if (inputType === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'type') {
      // Switching type resets the form
      setFormData(value === 'Service' ? { ...emptyServiceForm } : { ...emptyProductForm });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');

    try {
      // Build payload with correct number types
      const payload = { ...formData };
      payload.unitPrice = parseInt(payload.unitPrice, 10);
      if (isNaN(payload.unitPrice)) {
        setFormError('Selling price is required and must be a number.');
        setIsSaving(false);
        return;
      }

      if (formData.type === 'Product') {
        if (payload.costPrice !== '' && payload.costPrice != null) {
          payload.costPrice = parseInt(payload.costPrice, 10);
        } else {
          delete payload.costPrice;
        }
        if (payload.currentStock !== '' && payload.currentStock != null) {
          payload.currentStock = parseInt(payload.currentStock, 10);
        } else {
          delete payload.currentStock;
        }
        if (payload.lowStockThreshold !== '' && payload.lowStockThreshold != null) {
          payload.lowStockThreshold = parseInt(payload.lowStockThreshold, 10);
        } else {
          delete payload.lowStockThreshold;
        }
        if (payload.sku === '') delete payload.sku;
      }

      if (editingItem) {
        await api.patch(`/items/${editingItem._id}`, payload);
      } else {
        await api.post('/items', payload);
      }
      await fetchItems();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Operation failed.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/items/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  if (loading) return <div className="page-loading">Loading items...</div>;

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
          <h2>Products & Services</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => openAddModal('Product')} className="auth-btn btn-sm">Add Product</button>
            <button onClick={() => openAddModal('Service')} className="auth-btn btn-sm secondary">Add Service</button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {['', 'Product', 'Service'].map(t => (
            <button
              key={t || 'All'}
              className={`filter-tab ${filterType === t ? 'active' : ''}`}
              onClick={() => updateParams({ type: t, page: 1 })}
            >
              {t === '' ? 'All Items' : t + 's'}
            </button>
          ))}
        </div>

        <div className="filter-controls" style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search name, SKU..." 
            value={searchInput} 
            onChange={e => setSearchInput(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <select 
            value={isActiveStr} 
            onChange={e => updateParams({ isActive: e.target.value, page: 1 })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select 
            value={sort} 
            onChange={e => updateParams({ sort: e.target.value, page: 1 })}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="createdAt">Date Added</option>
            <option value="name">Name</option>
            <option value="unitPrice">Price</option>
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

        {items.length === 0 ? (
          <div className="empty-state">
            <p>{filterType === '' ? 'No items found matching your criteria.' : `No ${filterType.toLowerCase()}s found.`}</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Unit</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id} style={!item.isActive ? { opacity: 0.5 } : {}}>
                    <td>{item.name}</td>
                    <td>
                      <span className={`type-badge ${item.type.toLowerCase()}`}>{item.type}</span>
                    </td>
                    <td>{item.sku || '-'}</td>
                    <td>{formatPaise(item.unitPrice)}</td>
                    <td>{item.unit || '-'}</td>
                    <td>
                      {item.type === 'Product'
                        ? (item.currentStock != null ? item.currentStock : '-')
                        : <span className="text-gray">N/A</span>
                      }
                    </td>
                    <td>
                      <span className={`status-badge ${item.isActive ? 'active' : 'inactive'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button onClick={() => openEditModal(item)} className="action-btn edit">Edit</button>
                      <button onClick={() => handleDelete(item._id)} className="action-btn delete">Delete</button>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? `Edit ${formData.type}` : `Add ${formData.type}`}</h3>
              <button onClick={closeModal} className="modal-close">&times;</button>
            </div>

            {formError && <div className="profile-msg error">{formError}</div>}

            <form onSubmit={handleSubmit} className="modal-form">
              <fieldset className="profile-section">
                <legend>General</legend>
                <div className="form-grid">
                  {!editingItem && (
                    <div className="form-group">
                      <label>Item Type *</label>
                      <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="Product">Product</option>
                        <option value="Service">Service</option>
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label>{formData.type === 'Service' ? 'Service Name' : 'Product Name'} *</label>
                    <input name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea name="description" rows="2" value={formData.description} onChange={handleChange} />
                  </div>
                  {formData.type === 'Product' && (
                    <div className="form-group">
                      <label>SKU / Code</label>
                      <input name="sku" value={formData.sku} onChange={handleChange} />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Unit</label>
                    <input name="unit" value={formData.unit} onChange={handleChange} placeholder={formData.type === 'Service' ? 'hr' : 'pcs'} />
                  </div>
                </div>
              </fieldset>

              <fieldset className="profile-section">
                <legend>Pricing (in paise)</legend>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Selling Price (paise) *</label>
                    <input type="number" name="unitPrice" value={formData.unitPrice} onChange={handleChange} min="0" required />
                  </div>
                  {formData.type === 'Product' && (
                    <div className="form-group">
                      <label>Cost Price (paise)</label>
                      <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} min="0" />
                    </div>
                  )}
                </div>
              </fieldset>

              {formData.type === 'Product' && (
                <fieldset className="profile-section">
                  <legend>Stock</legend>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Current Stock</label>
                      <input type="number" name="currentStock" value={formData.currentStock} onChange={handleChange} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Low Stock Threshold</label>
                      <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} min="0" />
                    </div>
                  </div>
                </fieldset>
              )}

              <fieldset className="profile-section">
                <legend>Status & Notes</legend>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                      Active
                    </label>
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

export default ItemsPage;
