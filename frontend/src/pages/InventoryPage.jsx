import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import { Card } from '../components/ui/Card';

const InventoryPage = () => {

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
      console.error(err);
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
    switch (status) {
      case 'IN_STOCK': return <Badge status="success">In Stock</Badge>;
      case 'LOW_STOCK': return <Badge status="warning">Low Stock</Badge>;
      case 'OUT_OF_STOCK': return <Badge status="danger">Out of Stock</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 border border-red-200">
          {error}
        </div>
      )}

      {inventory.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-4 text-lg">No products found.</p>
          <p className="text-gray-500">Add products in the <Link to="/items" className="text-indigo-600 hover:text-indigo-800">Items</Link> page first.</p>
        </div>
      ) : (
        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Unit</Th>
                <Th>Stock</Th>
                <Th>Threshold</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inventory.map(item => (
                <React.Fragment key={item._id}>
                  <Tr>
                    <Td className="font-medium">{item.name}</Td>
                    <Td className="text-gray-500">{item.sku || '-'}</Td>
                    <Td className="text-gray-500">{item.unit || '-'}</Td>
                    <Td className="font-bold">{item.currentStock}</Td>
                    <Td className="text-gray-500">{item.lowStockThreshold || '-'}</Td>
                    <Td>{statusBadge(item.stockStatus)}</Td>
                    <Td>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => { setStockInItem(item); setShowStockIn(true); setStockInError(''); }} 
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Stock In
                        </button>
                        <button 
                          onClick={() => { setAdjustItem(item); setAdjustStock(String(item.currentStock)); setShowAdjust(true); setAdjustError(''); }} 
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Adjust
                        </button>
                        <button 
                          onClick={() => fetchMovements(item._id)} 
                          className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                          {selectedItem === item._id ? 'Hide' : 'History'}
                        </button>
                      </div>
                    </Td>
                  </Tr>
                  {selectedItem === item._id && (
                    <Tr key={`${item._id}-history`} className="bg-gray-50">
                      <Td colSpan="7" className="p-0 border-0">
                        <div className="p-4 max-h-[300px] overflow-y-auto border-b border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Movement History</h4>
                          {movementsLoading ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                          ) : movements.length === 0 ? (
                            <p className="text-sm text-gray-500">No movements recorded.</p>
                          ) : (
                            <table className="min-w-full divide-y divide-gray-200 text-sm border border-gray-200 rounded-md overflow-hidden bg-white">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Before</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">After</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reference</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Note</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {movements.map(m => (
                                  <tr key={m._id}>
                                    <td className="px-3 py-2 text-gray-500">{formatDate(m.createdAt)}</td>
                                    <td className="px-3 py-2">
                                      <span className={`font-semibold ${
                                        m.movementType === 'IN' ? 'text-green-600' : 
                                        m.movementType === 'OUT' ? 'text-red-600' : 'text-blue-600'
                                      }`}>
                                        {m.movementType}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">{m.quantity}</td>
                                    <td className="px-3 py-2 text-right text-gray-500">{m.balanceBefore}</td>
                                    <td className="px-3 py-2 text-right font-medium">{m.balanceAfter}</td>
                                    <td className="px-3 py-2 text-gray-500">
                                      {m.referenceType}{m.referenceId ? ` #${String(m.referenceId).slice(-6)}` : ''}
                                    </td>
                                    <td className="px-3 py-2 text-gray-500">{m.note || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  )}
                </React.Fragment>
              ))}
            </Tbody>
          </Table>
        </Card>
      )}

      {/* Stock In Modal */}
      <Modal
        isOpen={showStockIn}
        onClose={() => setShowStockIn(false)}
        title={`Stock In — ${stockInItem?.name}`}
      >
        {stockInError && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
            {stockInError}
          </div>
        )}
        <form onSubmit={handleStockIn} className="space-y-4">
          <Input 
            label="Quantity *" 
            type="number" 
            step="0.01" 
            min="0.01" 
            value={stockInQty} 
            onChange={e => setStockInQty(e.target.value)} 
            required 
          />
          <Input 
            label="Note" 
            value={stockInNote} 
            onChange={e => setStockInNote(e.target.value)} 
            placeholder="Optional note" 
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowStockIn(false)}>Cancel</Button>
            <Button type="submit" disabled={stockInSaving}>{stockInSaving ? 'Saving...' : 'Add Stock'}</Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Modal */}
      <Modal
        isOpen={showAdjust}
        onClose={() => setShowAdjust(false)}
        title={`Adjust Stock — ${adjustItem?.name}`}
      >
        {adjustError && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200">
            {adjustError}
          </div>
        )}
        <form onSubmit={handleAdjust} className="space-y-4">
          <Input 
            label="New Stock (physical count) *" 
            type="number" 
            step="0.01" 
            min="0" 
            value={adjustStock} 
            onChange={e => setAdjustStock(e.target.value)} 
            required 
          />
          <Input 
            label="Note" 
            value={adjustNote} 
            onChange={e => setAdjustNote(e.target.value)} 
            placeholder="Reason for adjustment" 
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowAdjust(false)}>Cancel</Button>
            <Button type="submit" disabled={adjustSaving}>{adjustSaving ? 'Saving...' : 'Save Adjustment'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryPage;
