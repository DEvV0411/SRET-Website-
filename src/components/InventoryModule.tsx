import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { InventoryItem, School, ProgrammeName } from '../types';
import { Plus, ArrowDown, ArrowUp, Package, AlertTriangle, Clipboard } from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const { hasPermission, t } = useAuth();
  
  // States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<'Inward' | 'Outward'>('Outward');
  
  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState(1);
  const [prog, setProg] = useState<ProgrammeName>('Vocational');
  const [assignedSchool, setAssignedSchool] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    loadInventory();
    window.addEventListener('omp_db_pulled', loadInventory);
    return () => {
      window.removeEventListener('omp_db_pulled', loadInventory);
    };
  }, []);

  const loadInventory = () => {
    setInventory(db.getInventory());
    setSchools(db.getSchools());
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || qty <= 0) return;

    const item = db.getInventory().find(i => i.id === selectedItemId);
    if (!item) return;

    // Calculate next stock
    const change = logType === 'Inward' ? qty : -qty;
    const nextStock = Math.max(item.currentStock + change, 0);

    const newLog = {
      id: 'log' + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split('T')[0],
      type: logType,
      quantity: qty,
      program: logType === 'Outward' ? prog : undefined,
      assignedTo: logType === 'Outward' ? assignedSchool : undefined,
      remarks: remarks || undefined
    };

    const updatedItem: InventoryItem = {
      ...item,
      currentStock: nextStock,
      logs: [newLog, ...item.logs]
    };

    db.saveInventoryItem(updatedItem);
    loadInventory();
    setShowLogModal(false);

    // Reset states
    setQty(1);
    setRemarks('');
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('inventory')}</h1>
          <p className="text-sm text-slate-500 mt-1">Training kits, equipment, and learning materials registry</p>
        </div>
        {hasPermission('Manage Inventory') && (
          <button 
            onClick={() => { setLogType('Outward'); setShowLogModal(true); }}
            className="btn-primary"
          >
            <Plus size={18} />
            <span>Log Transaction</span>
          </button>
        )}
      </div>

      {/* Grid of stock items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {inventory.map(item => {
          const isBelowThreshold = item.currentStock < item.minThreshold;
          return (
            <div 
              key={item.id}
              className={`bg-white dark:bg-dark-surface p-5 border rounded-md shadow-sm flex flex-col justify-between h-40 ${
                isBelowThreshold 
                  ? 'border-2 border-red-500/50 shadow-red-500/5' 
                  : 'border-slate-200 dark:border-dark-border'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-mono block">{item.id}</span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate w-44">{item.name}</h3>
                  <span className="text-[9px] bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 font-semibold px-1.5 py-0.5 rounded mt-1.5 inline-block">
                    {item.type}
                  </span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isBelowThreshold ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                }`}>
                  <Package size={16} />
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-slate-100 dark:border-dark-border/60 pt-3 mt-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Current Balance</span>
                  <span className={`text-xl font-extrabold ${isBelowThreshold ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                    {item.currentStock} {item.unit}
                  </span>
                </div>
                {isBelowThreshold ? (
                  <div className="flex items-center gap-1 text-[10px] text-red-500 font-semibold animate-pulse">
                    <AlertTriangle size={12} />
                    <span>Low Stock (Min {item.minThreshold})</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400">Min limit: {item.minThreshold}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Logs ledger table */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border flex justify-between items-center bg-slate-50 dark:bg-dark-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction History</h2>
          <Clipboard size={16} className="text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-dark-card/60 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Date</th>
                <th className="p-3">Item</th>
                <th className="p-3">Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Allocation / Target</th>
                <th className="p-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-300">
              {inventory.flatMap(item => 
                item.logs.map(log => ({ ...log, itemName: item.name, itemUnit: item.unit }))
              )
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(log => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <td className="p-3 font-mono">{log.date}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{log.itemName}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.type === 'Inward' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {log.type === 'Inward' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                      {log.type}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{log.quantity} {log.itemUnit}</td>
                  <td className="p-3">
                    {log.type === 'Outward' ? (
                      <div>
                        <span className="font-semibold text-slate-950 dark:text-slate-200">
                          {schools.find(s => s.code === log.assignedTo)?.name || log.assignedTo}
                        </span>
                        {log.program && (
                          <span className="block text-[10px] text-slate-500 font-medium">Prog: {log.program}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">HQ Store Inflow</span>
                    )}
                  </td>
                  <td className="p-3 text-[11px] text-slate-500 italic max-w-xs truncate">{log.remarks || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- TRANSACTION MODAL --- */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[450px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h2 className="text-base font-bold font-heading mb-4 text-slate-900 dark:text-white">Log Stock Transaction</h2>

            {/* Inward/Outward Tab slider */}
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-dark-card p-1 rounded-md mb-4 border border-slate-200 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setLogType('Outward')}
                className={`py-1.5 rounded text-xs font-bold transition-all ${
                  logType === 'Outward' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                Stock Outward (Distribution)
              </button>
              <button
                type="button"
                onClick={() => setLogType('Inward')}
                className={`py-1.5 rounded text-xs font-bold transition-all ${
                  logType === 'Inward' 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                Stock Inward (Purchase/Supply)
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              
              {/* Item selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Item *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose item...</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.currentStock})</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Quantity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              {/* Outward distribution scopes */}
              {logType === 'Outward' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Target School *</label>
                      <select
                        required
                        value={assignedSchool}
                        onChange={(e) => setAssignedSchool(e.target.value)}
                        className="input-field"
                      >
                        <option value="">Select...</option>
                        {schools.map(s => (
                          <option key={s.code} value={s.code}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned Programme *</label>
                      <select
                        required
                        value={prog}
                        onChange={(e) => setProg(e.target.value as any)}
                        className="input-field"
                      >
                        <option value="Vocational">Vocational</option>
                        <option value="Pre-Vocational">Pre-Vocational</option>
                        <option value="Udyam">Udyam</option>
                        <option value="Magic Touch">Magic Touch</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks / Reference</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Invoice #203, student labs allocation"
                  className="input-field"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-border/60">
                <button 
                  type="button" 
                  onClick={() => setShowLogModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Save Entry
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
