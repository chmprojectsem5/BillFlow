import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Card } from '../components/ui/Card';

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
    <div className="pb-12 max-w-5xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Draft Invoice' : 'Create Invoice'}</h1>
      </div>
      
      {error && <div className="bg-red-50 text-red-700 p-4 mb-6 rounded-md border border-red-200">{error}</div>}

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Invoice Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Select 
              label="Customer"
              value={selectedCustomer} 
              onChange={e => setSelectedCustomer(e.target.value)}
            >
              <option value="">-- Select Customer --</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Input 
              label="Date"
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-8 overflow-visible">
        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Line Items</h2>
        <div className="space-y-4">
          {lineItems.map((li, index) => (
            <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-start bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="w-full md:flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
                <select 
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  value={li.itemId}
                  onChange={e => handleLineChange(index, 'itemId', e.target.value)}
                >
                  <option value="">-- Select Item --</option>
                  {items.map(item => (
                    <option key={item._id} value={item._id}>{item.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="w-full sm:w-auto min-w-[80px]">
                <Input 
                  label="Qty"
                  type="number" 
                  value={li.quantity}
                  min="0.001"
                  step="0.001"
                  onChange={e => handleLineChange(index, 'quantity', e.target.value)}
                />
              </div>

              <div className="w-full sm:w-auto min-w-[150px]">
                <Input 
                  label="Override Price (Paise)"
                  type="number" 
                  value={li.unitPriceOverride}
                  onChange={e => handleLineChange(index, 'unitPriceOverride', e.target.value)}
                />
              </div>
              
              <div className="w-full sm:w-auto min-w-[130px]">
                <Input 
                  label="Discount (Paise)"
                  type="number" 
                  value={li.discount}
                  onChange={e => handleLineChange(index, 'discount', e.target.value)}
                />
              </div>

              <div className="w-full sm:w-auto flex items-end pt-6">
                <Button 
                  variant="danger"
                  onClick={() => removeLineItem(index)}
                  className="w-full sm:w-auto"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Button 
              variant="secondary"
              onClick={addLineItem}
            >
              + Add Line Item
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Server Preview */}
      {preview && (
        <Card className="p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Calculations (Preview)</h2>
          <div className="space-y-3 text-sm max-w-md ml-auto">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium text-gray-900">₹{(preview.summary.subTotal / 100).toFixed(2)}</span>
            </div>
            {preview.summary.discountTotal > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-₹{(preview.summary.discountTotal / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t border-gray-100">
              <span>Taxable Value:</span>
              <span>₹{(preview.summary.taxableTotal / 100).toFixed(2)}</span>
            </div>
            
            {preview.summary.cgstTotal > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>CGST:</span>
                <span>₹{(preview.summary.cgstTotal / 100).toFixed(2)}</span>
              </div>
            )}
            {preview.summary.sgstTotal > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>SGST:</span>
                <span>₹{(preview.summary.sgstTotal / 100).toFixed(2)}</span>
              </div>
            )}
            {preview.summary.igstTotal > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>IGST:</span>
                <span>₹{(preview.summary.igstTotal / 100).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold text-lg pt-4 border-t border-gray-200 mt-2 text-indigo-900">
              <span>Grand Total:</span>
              <span>₹{(preview.summary.grandTotal / 100).toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-wrap gap-4 justify-end">
        <Button 
          variant="secondary"
          onClick={saveDraft}
          disabled={loading || !selectedCustomer}
        >
          Save Draft
        </Button>
        <Button 
          onClick={finalizeInvoice}
          disabled={loading || !selectedCustomer}
        >
          Finalize Invoice
        </Button>
      </div>

    </div>
  );
};

export default InvoiceCreatePage;
