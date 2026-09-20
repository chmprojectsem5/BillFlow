import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const emptyForm = {
  hsnSac: '', classificationType: 'HSN', description: '', gstRate: '',
  taxTreatment: 'TAXABLE', effectiveFrom: '', effectiveTo: '',
  sourceReference: '', isActive: true
};

const TaxConfigPage = () => {
  const { user, business, logout } = useAuth();
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupType, setLookupType] = useState('code');
  const [lookupResults, setLookupResults] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Calculator state
  const [calcForm, setCalcForm] = useState({
    amountPaise: '', gstRate: '18', pricingMode: 'EXCLUSIVE', supplyType: 'INTRA_STATE'
  });
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => { fetchConfigs(); }, []);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/tax-config');
      setConfigs(res.data.data.taxConfigs);
    } catch { setError('Failed to fetch tax configurations.'); }
    finally { setLoading(false); }
  };

  const openAddModal = () => {
    setEditingConfig(null);
    setFormData({ ...emptyForm });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (config) => {
    setEditingConfig(config);
    setFormData({
      hsnSac: config.hsnSac || '',
      classificationType: config.classificationType || 'HSN',
      description: config.description || '',
      gstRate: config.gstRate != null ? String(config.gstRate) : '',
      taxTreatment: config.taxTreatment || 'TAXABLE',
      effectiveFrom: config.effectiveFrom ? config.effectiveFrom.split('T')[0] : '',
      effectiveTo: config.effectiveTo ? config.effectiveTo.split('T')[0] : '',
      sourceReference: config.sourceReference || '',
      isActive: config.isActive ?? true
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError('');
    try {
      const payload = { ...formData, gstRate: parseFloat(formData.gstRate) };
      if (payload.effectiveFrom) payload.effectiveFrom = new Date(payload.effectiveFrom).toISOString();
      else delete payload.effectiveFrom;
      if (payload.effectiveTo) payload.effectiveTo = new Date(payload.effectiveTo).toISOString();
      else delete payload.effectiveTo;
      if (!payload.sourceReference) delete payload.sourceReference;

      if (editingConfig) {
        await api.patch(`/tax-config/${editingConfig._id}`, payload);
      } else {
        await api.post('/tax-config', payload);
      }
      await fetchConfigs();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Operation failed.';
      setFormError(msg);
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this tax configuration?')) return;
    try {
      await api.delete(`/tax-config/${id}`);
      setConfigs(prev => prev.filter(c => c._id !== id));
    } catch { alert('Failed to delete.'); }
  };

  const handleLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    try {
      const param = lookupType === 'code' ? `code=${lookupQuery}` : `description=${lookupQuery}`;
      const res = await api.get(`/tax-config/lookup?${param}`);
      setLookupResults(res.data.data.results);
    } catch { setLookupResults([]); }
    finally { setLookupLoading(false); }
  };

  const handleCalc = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        amountPaise: parseInt(calcForm.amountPaise, 10),
        gstRate: parseFloat(calcForm.gstRate),
        pricingMode: calcForm.pricingMode,
        supplyType: calcForm.supplyType
      };
      const res = await api.post('/tax-config/calculate', payload);
      setCalcResult(res.data.data.calculation);
    } catch (err) {
      setCalcResult({ error: err.response?.data?.message || 'Calculation failed' });
    }
  };

  const fmt = (paise) => paise != null ? `₹${(paise / 100).toFixed(2)}` : '-';

  if (loading) return <div className="page-loading">Loading tax configurations...</div>;

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
          <h2>Tax Configuration</h2>
          <button onClick={openAddModal} className="auth-btn btn-sm">Add HSN/SAC</button>
        </div>

        {error && <div className="profile-msg error">{error}</div>}

        {/* Lookup Section */}
        <fieldset className="profile-section" style={{ marginBottom: '1.5rem' }}>
          <legend>HSN/SAC Lookup</legend>
          <div className="form-grid">
            <div className="form-group">
              <select value={lookupType} onChange={(e) => setLookupType(e.target.value)}>
                <option value="code">By Code</option>
                <option value="description">By Description</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', gap: '0.5rem' }}>
              <input value={lookupQuery} onChange={(e) => setLookupQuery(e.target.value)}
                placeholder={lookupType === 'code' ? 'e.g. 8471' : 'e.g. laptop'} />
              <button type="button" onClick={handleLookup} className="auth-btn btn-sm"
                disabled={lookupLoading}>{lookupLoading ? '...' : 'Search'}</button>
            </div>
          </div>
          {lookupResults !== null && (
            <div style={{ marginTop: '0.75rem' }}>
              {lookupResults.length === 0 ? (
                <p className="text-gray">No results found.</p>
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead><tr><th>Code</th><th>Type</th><th>Description</th><th>Rate</th><th>Treatment</th></tr></thead>
                    <tbody>
                      {lookupResults.map(r => (
                        <tr key={r._id}>
                          <td>{r.hsnSac}</td><td><span className={`type-badge ${r.classificationType.toLowerCase()}`}>{r.classificationType}</span></td>
                          <td>{r.description || '-'}</td><td>{r.gstRate}%</td><td>{r.taxTreatment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </fieldset>

        {/* GST Calculator */}
        <fieldset className="profile-section" style={{ marginBottom: '1.5rem' }}>
          <legend>GST Calculator</legend>
          <form onSubmit={handleCalc} className="form-grid">
            <div className="form-group">
              <label>Amount (paise)</label>
              <input type="number" value={calcForm.amountPaise} min="0"
                onChange={(e) => setCalcForm(p => ({ ...p, amountPaise: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>GST Rate (%)</label>
              <input type="number" value={calcForm.gstRate} min="0" max="100" step="0.01"
                onChange={(e) => setCalcForm(p => ({ ...p, gstRate: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Pricing</label>
              <select value={calcForm.pricingMode} onChange={(e) => setCalcForm(p => ({ ...p, pricingMode: e.target.value }))}>
                <option value="EXCLUSIVE">Exclusive</option>
                <option value="INCLUSIVE">Inclusive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Supply</label>
              <select value={calcForm.supplyType} onChange={(e) => setCalcForm(p => ({ ...p, supplyType: e.target.value }))}>
                <option value="INTRA_STATE">Intra-State</option>
                <option value="INTER_STATE">Inter-State</option>
              </select>
            </div>
            <div className="form-group">
              <button type="submit" className="auth-btn btn-sm">Calculate</button>
            </div>
          </form>
          {calcResult && !calcResult.error && (
            <div className="data-table-wrapper" style={{ marginTop: '0.75rem' }}>
              <table className="data-table">
                <tbody>
                  <tr><td>Taxable Amount</td><td>{fmt(calcResult.taxableAmount)}</td></tr>
                  <tr><td>CGST</td><td>{fmt(calcResult.cgst)}</td></tr>
                  <tr><td>SGST</td><td>{fmt(calcResult.sgst)}</td></tr>
                  <tr><td>IGST</td><td>{fmt(calcResult.igst)}</td></tr>
                  <tr><td><strong>Total GST</strong></td><td><strong>{fmt(calcResult.totalGST)}</strong></td></tr>
                  <tr><td><strong>Grand Total</strong></td><td><strong>{fmt(calcResult.total)}</strong></td></tr>
                </tbody>
              </table>
            </div>
          )}
          {calcResult?.error && <p className="profile-msg error">{calcResult.error}</p>}
        </fieldset>

        {/* Config List */}
        <h3 style={{ marginBottom: '1rem' }}>Configured Classifications</h3>
        {configs.length === 0 ? (
          <div className="empty-state"><p>No tax configurations found.</p></div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Code</th><th>Type</th><th>Description</th><th>Rate</th><th>Treatment</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {configs.map(c => (
                  <tr key={c._id} style={!c.isActive ? { opacity: 0.5 } : {}}>
                    <td>{c.hsnSac}</td>
                    <td><span className={`type-badge ${c.classificationType.toLowerCase()}`}>{c.classificationType}</span></td>
                    <td>{c.description || '-'}</td>
                    <td>{c.gstRate}%</td>
                    <td>{c.taxTreatment}</td>
                    <td><span className={`status-badge ${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingConfig ? 'Edit Tax Config' : 'Add Tax Config'}</h3>
              <button onClick={closeModal} className="modal-close">&times;</button>
            </div>
            {formError && <div className="profile-msg error">{formError}</div>}
            <form onSubmit={handleSubmit} className="modal-form">
              <fieldset className="profile-section">
                <legend>Classification</legend>
                <div className="form-grid">
                  <div className="form-group">
                    <label>HSN/SAC Code *</label>
                    <input name="hsnSac" value={formData.hsnSac} onChange={handleChange} required placeholder="e.g. 84713010" />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="classificationType" value={formData.classificationType} onChange={handleChange}>
                      <option value="HSN">HSN (Goods)</option>
                      <option value="SAC">SAC (Services)</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <input name="description" value={formData.description} onChange={handleChange} />
                  </div>
                </div>
              </fieldset>
              <fieldset className="profile-section">
                <legend>Tax Configuration</legend>
                <div className="form-grid">
                  <div className="form-group">
                    <label>GST Rate (%) *</label>
                    <input type="number" name="gstRate" value={formData.gstRate} onChange={handleChange} min="0" max="100" step="0.01" required />
                  </div>
                  <div className="form-group">
                    <label>Tax Treatment</label>
                    <select name="taxTreatment" value={formData.taxTreatment} onChange={handleChange}>
                      <option value="TAXABLE">Taxable</option>
                      <option value="NIL_RATED">Nil Rated</option>
                      <option value="EXEMPT">Exempt</option>
                      <option value="NON_GST">Non-GST</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Effective From</label>
                    <input type="date" name="effectiveFrom" value={formData.effectiveFrom} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Effective To</label>
                    <input type="date" name="effectiveTo" value={formData.effectiveTo} onChange={handleChange} />
                  </div>
                </div>
              </fieldset>
              <fieldset className="profile-section">
                <legend>Additional</legend>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Source Reference</label>
                    <input name="sourceReference" value={formData.sourceReference} onChange={handleChange} placeholder="e.g. Reference data source" />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} /> Active
                    </label>
                  </div>
                </div>
              </fieldset>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="auth-btn secondary">Cancel</button>
                <button type="submit" className="auth-btn" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxConfigPage;
