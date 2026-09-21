import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const InventoryPage = () => {
  const { user, business, logout } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Movement history
  const [selectedItem, setSelectedItem] = useState(null);
  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  
  // Stock In modal
  const [showStockIn, setShowStockIn] = useState(false);
  const [stockInItem, setStockInItem] = useState(null);
  const [stockInQty, setStockInQty] = useState('');
  const [stockInNote, setStockInNote] = useState('');
  const [stockInError, setStockInError] = useState('');
  const [stockInSaving, setStockInSaving] = useState(false);
  
  // Adjust modal
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustStock, setAdjustStock] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustError, setAdjustError] = useState('');
  const [adjustSaving, setAdjustSaving] = useState(false);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/inventory');
      setInventory(res.data.data.inventory);
      setError('');
    } catch (err) {
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (itemId) => {
    if (selectedItem === itemId) { setSelectedItem(null); return; }
    setSelectedItem(itemId);
    setMovementsLoading(true);
    try {
      const res = await api.get(`/inventory/${itemId}/movements`);
      setMovements(res.data.data.movements);
    } catch { setMovements([]); }
    finally { setMovementsLoading(false); }
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    setStockInSaving(true); setStockInError('');
    try {
      await api.post(`/inventory/${stockInItem._id}/stock-in`, {
        quantity: parseFloat(stockInQty),
        note: stockInNote || undefined
      });
      setShowStockIn(false);
      setStockInQty(''); setStockInNote('');
      await fetchInventory();
      if (selectedItem === stockInItem._id) fetchMovements(stockInItem._id).then(() => setSelectedItem(stockInItem._id));
    } catch (err) {
      setStockInError(err.response?.data?.message || 'Stock-in failed.');
    } finally { setStockInSaving(false); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setAdjustSaving(true); setAdjustError('');
    try {
      await api.post(`/inventory/${adjustItem._id}/adjust`, {
        newStock: parseFloat(adjustStock),
        note: adjustNote || undefined
      });
      setShowAdjust(false);
      setAdjustStock(''); setAdjustNote('');
      await fetchInventory();
      if (selectedItem === adjustItem._id) fetchMovements(adjustItem._id).then(() => setSelectedItem(adjustItem._id));
    } catch (err) {
      setAdjustError(err.response?.data?.message || 'Adjustment failed.');
    } finally { setAdjustSaving(false); }
  };

  const statusBadge = (status) => {
    const colors = { IN_STOCK: '#16a34a', LOW_STOCK: '#ea580c', OUT_OF_STOCK: '#dc2626' };
    const labels = { IN_STOCK: 'In Stock', LOW_STOCK: 'Low Stock', OUT_OF_STOCK: 'Out of Stock' };
    return (
      <span style={{ 
        background: colors[status] + '20', color: colors[status],
        padding: '2px 10px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem'
      }}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  if (loading) return <div className="page-loading">Loading inventory...</div>;

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
          <h2>Inventory</h2>
        </div>

        {error && <div className="profile-msg error">{error}</div>}

        {inventory.length === 0 ? (
          <div className="empty-state">
            <p>No products found. Add products in the <Link to="/items">Items</Link> page first.</p>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Unit</th>
                  <th>Stock</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map(item => (
                  <>
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>{item.sku || '-'}</td>
                      <td>{item.unit || '-'}</td>
                      <td style={{ fontWeight: 700 }}>{item.currentStock}</td>
                      <td>{item.lowStockThreshold || '-'}</td>
                      <td>{statusBadge(item.stockStatus)}</td>
                      <td className="actions-cell">
                        <button onClick={() => { setStockInItem(item); setShowStockIn(true); setStockInError(''); }} className="action-btn edit">Stock In</button>
                        <button onClick={() => { setAdjustItem(item); setAdjustStock(String(item.currentStock)); setShowAdjust(true); setAdjustError(''); }} className="action-btn edit">Adjust</button>
                        <button onClick={() => fetchMovements(item._id)} className="action-btn">{selectedItem === item._id ? 'Hide' : 'History'}</button>
                      </td>
                    </tr>
                    {selectedItem === item._id && (
                      <tr key={`${item._id}-history`}>
                        <td colSpan="7" style={{ padding: 0 }}>
                          <div style={{ padding: '0.5rem 1rem', background: '#f9fafb', maxHeight: '300px', overflow: 'auto' }}>
                            {movementsLoading ? <p>Loading...</p> : movements.length === 0 ? <p style={{ color: '#6b7280' }}>No movements recorded.</p> : (
                              <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                <thead><tr>
                                  <th>Date</th><th>Type</th><th>Qty</th><th>Before</th><th>After</th><th>Reference</th><th>Note</th>
                                </tr></thead>
                                <tbody>
                                  {movements.map(m => (
                                    <tr key={m._id}>
                                      <td>{formatDate(m.createdAt)}</td>
                                      <td><span style={{ fontWeight: 600, color: m.movementType === 'IN' ? '#16a34a' : m.movementType === 'OUT' ? '#dc2626' : '#2563eb' }}>{m.movementType}</span></td>
                                      <td>{m.quantity}</td>
                                      <td>{m.balanceBefore}</td>
                                      <td>{m.balanceAfter}</td>
                                      <td>{m.referenceType}{m.referenceId ? ` #${String(m.referenceId).slice(-6)}` : ''}</td>
                                      <td>{m.note || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Stock In Modal */}
      {showStockIn && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Stock In — {stockInItem?.name}</h3>
              <button onClick={() => setShowStockIn(false)} className="modal-close">&times;</button>
            </div>
            {stockInError && <div className="profile-msg error">{stockInError}</div>}
            <form onSubmit={handleStockIn} className="modal-form">
              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" step="0.01" min="0.01" value={stockInQty} onChange={e => setStockInQty(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input value={stockInNote} onChange={e => setStockInNote(e.target.value)} placeholder="Optional note" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowStockIn(false)} className="auth-btn secondary">Cancel</button>
                <button type="submit" className="auth-btn" disabled={stockInSaving}>{stockInSaving ? 'Saving...' : 'Add Stock'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjust && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Adjust Stock — {adjustItem?.name}</h3>
              <button onClick={() => setShowAdjust(false)} className="modal-close">&times;</button>
            </div>
            {adjustError && <div className="profile-msg error">{adjustError}</div>}
            <form onSubmit={handleAdjust} className="modal-form">
              <div className="form-group">
                <label>New Stock (physical count) *</label>
                <input type="number" step="0.01" min="0" value={adjustStock} onChange={e => setAdjustStock(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Reason for adjustment" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAdjust(false)} className="auth-btn secondary">Cancel</button>
                <button type="submit" className="auth-btn" disabled={adjustSaving}>{adjustSaving ? 'Saving...' : 'Save Adjustment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
