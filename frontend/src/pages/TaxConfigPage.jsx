import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';

const emptyForm = {
  hsnSac: '', classificationType: 'HSN', description: '', gstRate: '',
  taxTreatment: 'TAXABLE', effectiveFrom: '', effectiveTo: '',
  sourceReference: '', isActive: true
};

const TaxConfigPage = () => {

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

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Tax Configuration</h1>
        <Button onClick={openAddModal}>Add HSN/SAC</Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Lookup Section */}
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">HSN/SAC Lookup</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-1/3 min-w-[120px]">
              <Select value={lookupType} onChange={(e) => setLookupType(e.target.value)}>
                <option value="code">By Code</option>
                <option value="description">By Description</option>
              </Select>
            </div>
            <div className="flex-1 flex gap-2">
              <div className="flex-1">
                <Input 
                  value={lookupQuery} 
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder={lookupType === 'code' ? 'e.g. 8471' : 'e.g. laptop'} 
                />
              </div>
              <Button type="button" onClick={handleLookup} disabled={lookupLoading}>
                {lookupLoading ? '...' : 'Search'}
              </Button>
            </div>
          </div>
          
          {lookupResults !== null && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              {lookupResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500 bg-gray-50">No results found.</div>
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Code</Th>
                      <Th>Type</Th>
                      <Th>Description</Th>
                      <Th>Rate</Th>
                      <Th>Treatment</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {lookupResults.map(r => (
                      <Tr key={r._id}>
                        <Td className="font-medium">{r.hsnSac}</Td>
                        <Td><Badge status={r.classificationType === 'HSN' ? 'info' : 'purple'}>{r.classificationType}</Badge></Td>
                        <Td>{r.description || '-'}</Td>
                        <Td>{r.gstRate}%</Td>
                        <Td>{r.taxTreatment}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </div>
          )}
        </Card>

        {/* GST Calculator */}
        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">GST Calculator</h2>
          <form onSubmit={handleCalc} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input 
              label="Amount (paise)" 
              type="number" 
              value={calcForm.amountPaise} 
              min="0"
              onChange={(e) => setCalcForm(p => ({ ...p, amountPaise: e.target.value }))} 
              required 
            />
            <Input 
              label="GST Rate (%)" 
              type="number" 
              value={calcForm.gstRate} 
              min="0" max="100" step="0.01"
              onChange={(e) => setCalcForm(p => ({ ...p, gstRate: e.target.value }))} 
              required 
            />
            <Select label="Pricing" value={calcForm.pricingMode} onChange={(e) => setCalcForm(p => ({ ...p, pricingMode: e.target.value }))}>
              <option value="EXCLUSIVE">Exclusive</option>
              <option value="INCLUSIVE">Inclusive</option>
            </Select>
            <Select label="Supply" value={calcForm.supplyType} onChange={(e) => setCalcForm(p => ({ ...p, supplyType: e.target.value }))}>
              <option value="INTRA_STATE">Intra-State</option>
              <option value="INTER_STATE">Inter-State</option>
            </Select>
            <div className="sm:col-span-2 pt-2">
              <Button type="submit" className="w-full sm:w-auto">Calculate</Button>
            </div>
          </form>

          {calcResult && !calcResult.error && (
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <Tbody>
                  <Tr><Td className="text-gray-600">Taxable Amount</Td><Td className="text-right font-medium">{fmt(calcResult.taxableAmount)}</Td></Tr>
                  <Tr><Td className="text-gray-600">CGST</Td><Td className="text-right">{fmt(calcResult.cgst)}</Td></Tr>
                  <Tr><Td className="text-gray-600">SGST</Td><Td className="text-right">{fmt(calcResult.sgst)}</Td></Tr>
                  <Tr><Td className="text-gray-600">IGST</Td><Td className="text-right">{fmt(calcResult.igst)}</Td></Tr>
                  <Tr className="bg-gray-50"><Td className="font-semibold text-gray-900">Total GST</Td><Td className="text-right font-semibold">{fmt(calcResult.totalGST)}</Td></Tr>
                  <Tr className="bg-gray-100"><Td className="font-bold text-gray-900">Grand Total</Td><Td className="text-right font-bold text-gray-900">{fmt(calcResult.total)}</Td></Tr>
                </Tbody>
              </Table>
            </div>
          )}
          {calcResult?.error && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
              {calcResult.error}
            </div>
          )}
        </Card>
      </div>

      {/* Config List */}
      <h2 className="text-lg font-medium text-gray-900 mb-4">Configured Classifications</h2>
      {configs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500">No tax configurations found.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>Code</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th>Rate</Th>
                <Th>Treatment</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {configs.map(c => (
                <Tr key={c._id} className={!c.isActive ? 'opacity-50 grayscale' : ''}>
                  <Td className="font-medium">{c.hsnSac}</Td>
                  <Td><Badge status={c.classificationType === 'HSN' ? 'info' : 'purple'}>{c.classificationType}</Badge></Td>
                  <Td className="text-gray-500">{c.description || '-'}</Td>
                  <Td className="font-medium">{c.gstRate}%</Td>
                  <Td>{c.taxTreatment}</Td>
                  <Td>
                    <Badge status={c.isActive ? 'success' : 'danger'}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-3">
                      <button onClick={() => openEditModal(c)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                      <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingConfig ? 'Edit Tax Config' : 'Add Tax Config'}
      >
        {formError && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Classification</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="HSN/SAC Code *" name="hsnSac" value={formData.hsnSac} onChange={handleChange} required placeholder="e.g. 84713010" />
              <Select label="Type *" name="classificationType" value={formData.classificationType} onChange={handleChange}>
                <option value="HSN">HSN (Goods)</option>
                <option value="SAC">SAC (Services)</option>
              </Select>
              <div className="md:col-span-2">
                <Input label="Description" name="description" value={formData.description} onChange={handleChange} />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Tax Configuration</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="GST Rate (%) *" type="number" name="gstRate" value={formData.gstRate} onChange={handleChange} min="0" max="100" step="0.01" required />
              <Select label="Tax Treatment" name="taxTreatment" value={formData.taxTreatment} onChange={handleChange}>
                <option value="TAXABLE">Taxable</option>
                <option value="NIL_RATED">Nil Rated</option>
                <option value="EXEMPT">Exempt</option>
                <option value="NON_GST">Non-GST</option>
              </Select>
              <Input label="Effective From" type="date" name="effectiveFrom" value={formData.effectiveFrom} onChange={handleChange} />
              <Input label="Effective To" type="date" name="effectiveTo" value={formData.effectiveTo} onChange={handleChange} />
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Additional</legend>
            <div className="grid grid-cols-1 gap-4">
              <Input label="Source Reference" name="sourceReference" value={formData.sourceReference} onChange={handleChange} placeholder="e.g. Reference data source" />
              <div className="flex items-center mt-2">
                <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded" /> 
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaxConfigPage;
