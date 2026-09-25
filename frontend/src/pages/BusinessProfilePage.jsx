import React, { useState, useEffect } from 'react';

import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

const BusinessProfilePage = () => {
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
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md mb-6 ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Business Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Business Name *" name="name" value={form.name} onChange={handleChange} required />
              <Input label="GSTIN" name="gstin" value={form.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
              <Input label="PAN" name="pan" value={form.pan} onChange={handleChange} placeholder="AAAAA0000A" />
              <Input label="Phone" name="phone" value={form.phone} onChange={handleChange} />
              <Input label="Business Email" type="email" name="email" value={form.email} onChange={handleChange} />
              <Input label="Website" name="website" value={form.website} onChange={handleChange} />
            </div>
          </div>

          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input label="Address" name="address" value={form.address} onChange={handleChange} />
              </div>
              <Input label="City" name="city" value={form.city} onChange={handleChange} />
              <Input label="State" name="state" value={form.state} onChange={handleChange} />
              <Input label="PIN Code" name="pinCode" value={form.pinCode} onChange={handleChange} />
              <Input label="Country" name="country" value={form.country} onChange={handleChange} />
            </div>
          </div>

          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Bank Name" 
                value={form.bankDetails.bankName}
                onChange={e => handleNestedChange('bankDetails', 'bankName', e.target.value)} 
              />
              <Input 
                label="Account Number" 
                value={form.bankDetails.accountNumber}
                onChange={e => handleNestedChange('bankDetails', 'accountNumber', e.target.value)} 
              />
              <Input 
                label="IFSC Code" 
                value={form.bankDetails.ifsc}
                onChange={e => handleNestedChange('bankDetails', 'ifsc', e.target.value)} 
                placeholder="SBIN0000001" 
              />
              <Input 
                label="Branch Name" 
                value={form.bankDetails.branchName}
                onChange={e => handleNestedChange('bankDetails', 'branchName', e.target.value)} 
              />
              <Input 
                label="Account Holder Name" 
                value={form.bankDetails.accountName}
                onChange={e => handleNestedChange('bankDetails', 'accountName', e.target.value)} 
              />
            </div>
          </div>

          <div className="pb-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Invoice Prefix" 
                value={form.invoiceSettings.prefix}
                onChange={e => handleNestedChange('invoiceSettings', 'prefix', e.target.value)} 
              />
              <Input 
                label="Default Due Days" 
                type="number" 
                min="0" 
                max="365"
                value={form.invoiceSettings.defaultDueDays}
                onChange={e => handleNestedChange('invoiceSettings', 'defaultDueDays', parseInt(e.target.value) || 0)} 
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Notes / Terms</label>
                <textarea 
                  rows="3" 
                  value={form.invoiceSettings.notes}
                  onChange={e => handleNestedChange('invoiceSettings', 'notes', e.target.value)} 
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          <div className="pb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Logo</h2>
            <div className="grid grid-cols-1 gap-6">
              <Input 
                label="Logo URL / Reference" 
                name="logoUrl" 
                value={form.logoUrl} 
                onChange={handleChange}
                placeholder="https://example.com/logo.png" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessProfilePage;
