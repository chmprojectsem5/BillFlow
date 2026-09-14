import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const BusinessProfilePage = () => {
  const { user, business: authBusiness, logout } = useAuth();
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', pinCode: '', country: 'India',
    gstin: '', pan: '', phone: '', email: '', website: '', logoUrl: '',
    bankDetails: { bankName: '', accountNumber: '', ifsc: '', branchName: '', accountName: '' },
    invoiceSettings: { prefix: 'INV-', defaultDueDays: 7, notes: '' }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/business/profile');
        const biz = res.data.data.business;
        setForm({
          name: biz.name || '',
          address: biz.address || '',
          city: biz.city || '',
          state: biz.state || '',
          pinCode: biz.pinCode || '',
          country: biz.country || 'India',
          gstin: biz.gstin || '',
          pan: biz.pan || '',
          phone: biz.phone || '',
          email: biz.email || '',
          website: biz.website || '',
          logoUrl: biz.logoUrl || '',
          bankDetails: {
            bankName: biz.bankDetails?.bankName || '',
            accountNumber: biz.bankDetails?.accountNumber || '',
            ifsc: biz.bankDetails?.ifsc || '',
            branchName: biz.bankDetails?.branchName || '',
            accountName: biz.bankDetails?.accountName || ''
          },
          invoiceSettings: {
            prefix: biz.invoiceSettings?.prefix || 'INV-',
            defaultDueDays: biz.invoiceSettings?.defaultDueDays ?? 7,
            notes: biz.invoiceSettings?.notes || ''
          }
        });
      } catch {
        setMessage({ text: 'Failed to load business profile.', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await api.patch('/business/profile', form);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0]?.message || 'Update failed.';
      setMessage({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1><Link to="/dashboard" className="header-link">BillFlow-Pro</Link></h1>
        <div className="dashboard-user-info">
          <span>{user?.name} — {authBusiness?.name}</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="profile-main">
        <h2>Business Profile</h2>

        {message.text && (
          <div className={`profile-msg ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          {/* BUSINESS DETAILS */}
          <fieldset className="profile-section">
            <legend>Business Details</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="bp-name">Business Name *</label>
                <input id="bp-name" name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="bp-gstin">GSTIN</label>
                <input id="bp-gstin" name="gstin" value={form.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div className="form-group">
                <label htmlFor="bp-pan">PAN</label>
                <input id="bp-pan" name="pan" value={form.pan} onChange={handleChange} placeholder="AAAAA0000A" />
              </div>
              <div className="form-group">
                <label htmlFor="bp-phone">Phone</label>
                <input id="bp-phone" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-email">Business Email</label>
                <input id="bp-email" name="email" type="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-website">Website</label>
                <input id="bp-website" name="website" value={form.website} onChange={handleChange} />
              </div>
            </div>
          </fieldset>

          {/* ADDRESS */}
          <fieldset className="profile-section">
            <legend>Address</legend>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="bp-address">Address</label>
                <input id="bp-address" name="address" value={form.address} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-city">City</label>
                <input id="bp-city" name="city" value={form.city} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-state">State</label>
                <input id="bp-state" name="state" value={form.state} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-pinCode">PIN Code</label>
                <input id="bp-pinCode" name="pinCode" value={form.pinCode} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-country">Country</label>
                <input id="bp-country" name="country" value={form.country} onChange={handleChange} />
              </div>
            </div>
          </fieldset>

          {/* BANK DETAILS */}
          <fieldset className="profile-section">
            <legend>Bank Details</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="bp-bankName">Bank Name</label>
                <input id="bp-bankName" value={form.bankDetails.bankName}
                  onChange={e => handleNestedChange('bankDetails', 'bankName', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-accountNumber">Account Number</label>
                <input id="bp-accountNumber" value={form.bankDetails.accountNumber}
                  onChange={e => handleNestedChange('bankDetails', 'accountNumber', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-ifsc">IFSC Code</label>
                <input id="bp-ifsc" value={form.bankDetails.ifsc}
                  onChange={e => handleNestedChange('bankDetails', 'ifsc', e.target.value)} placeholder="SBIN0000001" />
              </div>
              <div className="form-group">
                <label htmlFor="bp-branchName">Branch Name</label>
                <input id="bp-branchName" value={form.bankDetails.branchName}
                  onChange={e => handleNestedChange('bankDetails', 'branchName', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-accountName">Account Holder Name</label>
                <input id="bp-accountName" value={form.bankDetails.accountName}
                  onChange={e => handleNestedChange('bankDetails', 'accountName', e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* INVOICE SETTINGS */}
          <fieldset className="profile-section">
            <legend>Invoice Settings</legend>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="bp-prefix">Invoice Prefix</label>
                <input id="bp-prefix" value={form.invoiceSettings.prefix}
                  onChange={e => handleNestedChange('invoiceSettings', 'prefix', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="bp-dueDays">Default Due Days</label>
                <input id="bp-dueDays" type="number" min="0" max="365"
                  value={form.invoiceSettings.defaultDueDays}
                  onChange={e => handleNestedChange('invoiceSettings', 'defaultDueDays', parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group full-width">
                <label htmlFor="bp-notes">Invoice Notes / Terms</label>
                <textarea id="bp-notes" rows="3" value={form.invoiceSettings.notes}
                  onChange={e => handleNestedChange('invoiceSettings', 'notes', e.target.value)} />
              </div>
            </div>
          </fieldset>

          {/* LOGO */}
          <fieldset className="profile-section">
            <legend>Logo</legend>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="bp-logoUrl">Logo URL / Reference</label>
                <input id="bp-logoUrl" name="logoUrl" value={form.logoUrl} onChange={handleChange}
                  placeholder="https://example.com/logo.png" />
              </div>
            </div>
          </fieldset>

          <button type="submit" className="auth-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default BusinessProfilePage;
