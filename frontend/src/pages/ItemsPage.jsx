import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

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

  
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;
  const searchStr = searchParams.get('search') || '';
  const filterType = searchParams.get('type') || ''; 
  const isActiveStr = searchParams.get('isActive') || ''; 
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
  }, [searchInput, searchStr]);

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
      console.error(err);
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
      console.error(err);
      alert('Failed to delete item.');
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
        <div className="flex gap-2">
          <Button onClick={() => openAddModal('Product')}>Add Product</Button>
          <Button variant="secondary" onClick={() => openAddModal('Service')}>Add Service</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'Product', 'Service'].map(t => (
          <button
            key={t || 'All'}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              filterType === t 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => updateParams({ type: t, page: 1 })}
          >
            {t === '' ? 'All Items' : t + 's'}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-auto flex-1 min-w-[200px]">
            <Input 
              type="text" 
              placeholder="Search name, SKU..." 
              value={searchInput} 
              onChange={e => setSearchInput(e.target.value)} 
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={isActiveStr} 
              onChange={e => updateParams({ isActive: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={sort} 
              onChange={e => updateParams({ sort: e.target.value, page: 1 })}
            >
              <option value="createdAt">Date Added</option>
              <option value="name">Name</option>
              <option value="unitPrice">Price</option>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={order} 
              onChange={e => updateParams({ order: e.target.value, page: 1 })}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Button variant="secondary" onClick={clearFilters} className="w-full sm:w-auto">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-lg">
            {filterType === '' ? 'No items found matching your criteria.' : `No ${filterType.toLowerCase()}s found.`}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>SKU</Th>
                <Th>Price</Th>
                <Th>Unit</Th>
                <Th>Stock</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map(item => (
                <Tr key={item._id} className={!item.isActive ? 'opacity-50 grayscale' : ''}>
                  <Td className="font-medium">{item.name}</Td>
                  <Td>
                    <Badge status={item.type === 'Product' ? 'info' : 'purple'}>{item.type}</Badge>
                  </Td>
                  <Td className="text-gray-500">{item.sku || '-'}</Td>
                  <Td className="font-medium">{formatPaise(item.unitPrice)}</Td>
                  <Td className="text-gray-500">{item.unit || '-'}</Td>
                  <Td>
                    {item.type === 'Product'
                      ? (item.currentStock != null ? <span className="font-medium">{item.currentStock}</span> : '-')
                      : <span className="text-gray-400">N/A</span>
                    }
                  </Td>
                  <Td>
                    <Badge status={item.isActive ? 'success' : 'danger'}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex gap-3">
                      <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900 font-medium">Edit</button>
                      <button onClick={() => handleDelete(item._id)} className="text-red-600 hover:text-red-900 font-medium">Delete</button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-gray-600">
            Showing page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="secondary"
              size="sm"
              disabled={!pagination.hasPrevious} 
              onClick={() => updateParams({ page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <Button 
              variant="secondary"
              size="sm"
              disabled={!pagination.hasNext} 
              onClick={() => updateParams({ page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingItem ? `Edit ${formData.type}` : `Add ${formData.type}`}
      >
        {formError && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">General</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingItem && (
                <Select label="Item Type *" name="type" value={formData.type} onChange={handleChange}>
                  <option value="Product">Product</option>
                  <option value="Service">Service</option>
                </Select>
              )}
              <Input 
                label={`${formData.type === 'Service' ? 'Service Name' : 'Product Name'} *`} 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows="2" 
                  value={formData.description} 
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              {formData.type === 'Product' && (
                <Input label="SKU / Code" name="sku" value={formData.sku} onChange={handleChange} />
              )}
              <Input 
                label="Unit" 
                name="unit" 
                value={formData.unit} 
                onChange={handleChange} 
                placeholder={formData.type === 'Service' ? 'hr' : 'pcs'} 
              />
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Pricing (in paise)</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Selling Price (paise) *" 
                type="number" 
                name="unitPrice" 
                value={formData.unitPrice} 
                onChange={handleChange} 
                min="0" 
                required 
              />
              {formData.type === 'Product' && (
                <Input 
                  label="Cost Price (paise)" 
                  type="number" 
                  name="costPrice" 
                  value={formData.costPrice} 
                  onChange={handleChange} 
                  min="0" 
                />
              )}
            </div>
          </fieldset>

          {formData.type === 'Product' && (
            <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <legend className="text-sm font-semibold text-gray-700 px-2">Stock</legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Current Stock" 
                  type="number" 
                  name="currentStock" 
                  value={formData.currentStock} 
                  onChange={handleChange} 
                  min="0" 
                />
                <Input 
                  label="Low Stock Threshold" 
                  type="number" 
                  name="lowStockThreshold" 
                  value={formData.lowStockThreshold} 
                  onChange={handleChange} 
                  min="0" 
                />
              </div>
            </fieldset>
          )}

          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Status & Notes</legend>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isActive"
                  name="isActive" 
                  checked={formData.isActive} 
                  onChange={handleChange} 
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  name="notes" 
                  rows="2" 
                  value={formData.notes} 
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ItemsPage;
