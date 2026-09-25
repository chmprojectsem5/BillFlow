import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import Spinner from '../components/ui/Spinner';

const CustomersPage = () => {
 // removed logout, handled by AppLayout Header
  
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
  
  const [searchInput, setSearchInput] = useState(searchStr);

  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '', customerType: 'Business', phone: '', email: '', billingAddress: '',
    city: '', state: '', pinCode: '', country: 'India', gstin: '', pan: '', notes: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchStr) {
        updateParams({ search: searchInput, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, searchStr]);

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
      console.error(err);
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
      console.error(err);
      alert('Failed to delete customer.');
    }
  };

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Button onClick={openAddModal}>Add Customer</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-full sm:w-auto flex-1 min-w-[200px]">
            <Input 
              type="text" 
              placeholder="Search name, email, phone, GSTIN..." 
              value={searchInput} 
              onChange={e => setSearchInput(e.target.value)} 
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={customerType} 
              onChange={e => updateParams({ customerType: e.target.value, page: 1 })}
            >
              <option value="">All Types</option>
              <option value="Business">Business</option>
              <option value="Individual">Individual</option>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <Select 
              value={sort} 
              onChange={e => updateParams({ sort: e.target.value, page: 1 })}
            >
              <option value="createdAt">Date Added</option>
              <option value="name">Name</option>
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

      {customers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 text-lg">No customers found matching your criteria.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Type</Th>
                <Th>Contact</Th>
                <Th>GSTIN</Th>
                <Th>City</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {customers.map(c => (
                <Tr key={c._id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td>{c.customerType}</Td>
                  <Td>
                    <div>{c.phone}</div>
                    <div className="text-sm text-gray-500">{c.email}</div>
                  </Td>
                  <Td>{c.gstin || '-'}</Td>
                  <Td>{c.city || '-'}</Td>
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
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        {formError && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Customer Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Name / Business Name *" name="name" value={formData.name} onChange={handleChange} required />
              <Select label="Customer Type" name="customerType" value={formData.customerType} onChange={handleChange}>
                <option value="Business">Business</option>
                <option value="Individual">Individual</option>
              </Select>
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Contact</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
              <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Address</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Billing Address" name="billingAddress" value={formData.billingAddress} onChange={handleChange} />
              </div>
              <Input label="City" name="city" value={formData.city} onChange={handleChange} />
              <Input label="State" name="state" value={formData.state} onChange={handleChange} />
              <Input label="PIN Code" name="pinCode" value={formData.pinCode} onChange={handleChange} />
              <Input label="Country" name="country" value={formData.country} onChange={handleChange} />
            </div>
          </fieldset>

          <fieldset className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <legend className="text-sm font-semibold text-gray-700 px-2">Tax Details & Additional</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="GSTIN" name="gstin" value={formData.gstin} onChange={handleChange} placeholder="22AAAAA0000A1Z5" />
              <Input label="PAN" name="pan" value={formData.pan} onChange={handleChange} placeholder="AAAAA0000A" />
              <div className="md:col-span-2">
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

export default CustomersPage;
