import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const InvoiceCreatePage = () => {
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [lineItems, setLineItems] = useState([
    { itemId: '', quantity: 1, discount: 0, unitPriceOverride: '' }
  ]);
  
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const editInvoiceId = queryParams.get('edit');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editInvoiceId) {
      setIsEditing(true);
      fetchInvoiceToEdit(editInvoiceId);
    }
  }, [editInvoiceId]);

  const fetchInvoiceToEdit = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/invoices/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        const inv = data.data.invoice;
        if (inv.status !== 'Draft') {
          setError('Cannot edit a finalized invoice.');
          setLoading(false);
          return;
        }
        
        setSelectedCustomer(inv.customerSnapshot?.customerId || '');
        setDate(inv.date ? inv.date.split('T')[0] : '');
        setDueDate(inv.dueDate ? inv.dueDate.split('T')[0] : '');
        setNotes(inv.notes || '');
        
        if (inv.items && inv.items.length > 0) {
          setLineItems(inv.items.map(item => ({
            itemId: item.itemId,
            quantity: item.quantity,
            discount: item.discount,
            unitPriceOverride: item.unitPrice
          })));
        }
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
    fetchItems();
  }, []);

  const fetchCustomers = async () => {
    const res = await fetch('/api/v1/customers', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (res.ok) setCustomers(data.data.customers);
  };

  const fetchItems = async () => {
    const res = await fetch('/api/v1/items', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (res.ok) setItems(data.data.items);
  };

  // Trigger calculation when relevant fields change
  useEffect(() => {
    const validLineItems = lineItems.filter(li => li.itemId && li.quantity > 0);
    if (validLineItems.length > 0) {
      calculatePreview(validLineItems);
    } else {
      setPreview(null);
    }
  }, [lineItems, selectedCustomer]);

  const calculatePreview = async (validLineItems) => {
    try {
      const payload = {
        customerId: selectedCustomer || undefined,
        items: validLineItems.map(li => ({
          itemId: li.itemId,
          quantity: Number(li.quantity),
          discount: Number(li.discount) || 0,
          ...(li.unitPriceOverride !== '' && { unitPriceOverride: Number(li.unitPriceOverride) })
        }))
      };

      const res = await fetch('/api/v1/invoices/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        setPreview(data.data.preview);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLineChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    setLineItems(newItems);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { itemId: '', quantity: 1, discount: 0, unitPriceOverride: '' }]);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const saveDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const validLineItems = lineItems.filter(li => li.itemId && li.quantity > 0);
      const payload = {
        customerId: selectedCustomer,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes,
        items: validLineItems.map(li => ({
          itemId: li.itemId,
          quantity: Number(li.quantity),
          discount: Number(li.discount) || 0,
          ...(li.unitPriceOverride !== '' && { unitPriceOverride: Number(li.unitPriceOverride) })
        }))
      };

      const url = isEditing ? `/api/v1/invoices/${editInvoiceId}` : '/api/v1/invoices';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert('Draft saved! ID: ' + data.data.invoice._id);
        navigate('/invoices/' + data.data.invoice._id);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const finalizeInvoice = async () => {
    // Basic implementation: Create Draft, then immediately finalize.
    // In a real app you might have a draft list, click into it, then hit finalize.
    setLoading(true);
    setError(null);
    try {
      const validLineItems = lineItems.filter(li => li.itemId && li.quantity > 0);
      const payload = {
        customerId: selectedCustomer,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes,
        items: validLineItems.map(li => ({
          itemId: li.itemId,
          quantity: Number(li.quantity),
          discount: Number(li.discount) || 0,
          ...(li.unitPriceOverride !== '' && { unitPriceOverride: Number(li.unitPriceOverride) })
        }))
      };

      const draftUrl = isEditing ? `/api/v1/invoices/${editInvoiceId}` : '/api/v1/invoices';
      const draftMethod = isEditing ? 'PATCH' : 'POST';

      // 1. Create or update draft
      const draftRes = await fetch(draftUrl, {
        method: draftMethod,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      const draftData = await draftRes.json();
      if (!draftRes.ok) throw new Error(draftData.message);

      const draftId = draftData.data.invoice._id;

      // 2. Finalize
      const finalizeRes = await fetch(`/api/v1/invoices/${draftId}/finalize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const finalizeData = await finalizeRes.json();
      if (!finalizeRes.ok) throw new Error(finalizeData.message);

      alert('Invoice Finalized! Number: ' + finalizeData.data.invoice.invoiceNumber);
      navigate('/invoices/' + finalizeData.data.invoice._id);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{isEditing ? 'Edit Draft Invoice' : 'Create Invoice'}</h1>
      
      {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-1 font-semibold">Customer</label>
          <select 
            className="w-full border p-2 rounded"
            value={selectedCustomer} 
            onChange={e => setSelectedCustomer(e.target.value)}
          >
            <option value="">-- Select Customer --</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-semibold">Date</label>
          <input 
            type="date" 
            className="w-full border p-2 rounded"
            value={date} 
            onChange={e => setDate(e.target.value)} 
          />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Line Items</h2>
        <div className="bg-gray-50 p-4 rounded border">
          {lineItems.map((li, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              <select 
                className="border p-2 rounded flex-1"
                value={li.itemId}
                onChange={e => handleLineChange(index, 'itemId', e.target.value)}
              >
                <option value="">-- Select Item --</option>
                {items.map(item => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
              
              <input 
                type="number" 
                placeholder="Qty"
                className="border p-2 rounded w-20"
                value={li.quantity}
                min="0.001"
                step="0.001"
                onChange={e => handleLineChange(index, 'quantity', e.target.value)}
              />

              <input 
                type="number" 
                placeholder="Override Price (Paise)"
                className="border p-2 rounded w-48"
                value={li.unitPriceOverride}
                onChange={e => handleLineChange(index, 'unitPriceOverride', e.target.value)}
              />
              
              <input 
                type="number" 
                placeholder="Discount (Paise)"
                className="border p-2 rounded w-40"
                value={li.discount}
                onChange={e => handleLineChange(index, 'discount', e.target.value)}
              />

              <button 
                className="bg-red-500 text-white px-3 py-2 rounded"
                onClick={() => removeLineItem(index)}
              >
                X
              </button>
            </div>
          ))}
          <button 
            className="mt-2 bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold"
            onClick={addLineItem}
          >
            + Add Line Item
          </button>
        </div>
      </div>

      {/* Live Server Preview */}
      {preview && (
        <div className="mb-6 bg-white p-4 rounded shadow border">
          <h2 className="text-lg font-bold mb-4">Calculations (Server Authoritative)</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>₹{(preview.summary.subTotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>-₹{(preview.summary.discountTotal / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Taxable Value:</span>
              <span>₹{(preview.summary.taxableTotal / 100).toFixed(2)}</span>
            </div>
            
            {preview.summary.cgstTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>CGST:</span>
                <span>₹{(preview.summary.cgstTotal / 100).toFixed(2)}</span>
              </div>
            )}
            {preview.summary.sgstTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>SGST:</span>
                <span>₹{(preview.summary.sgstTotal / 100).toFixed(2)}</span>
              </div>
            )}
            {preview.summary.igstTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>IGST:</span>
                <span>₹{(preview.summary.igstTotal / 100).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
              <span>Grand Total:</span>
              <span>₹{(preview.summary.grandTotal / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button 
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded font-semibold disabled:opacity-50"
          onClick={saveDraft}
          disabled={loading || !selectedCustomer}
        >
          Save Draft
        </button>
        <button 
          className="bg-green-600 text-white px-6 py-2 rounded font-semibold disabled:opacity-50"
          onClick={finalizeInvoice}
          disabled={loading || !selectedCustomer}
        >
          Finalize Invoice
        </button>
      </div>

    </div>
  );
};

export default InvoiceCreatePage;
