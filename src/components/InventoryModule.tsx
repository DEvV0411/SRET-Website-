import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { InventoryItem, School, ProgrammeName, InventoryLog } from '../types';
import { Plus, ArrowDown, ArrowUp, Package, AlertTriangle, Clipboard, Search, Filter, FileText } from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const { currentUser, hasPermission, t } = useAuth();
  
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

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // Inward vs Outward

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

    const newLog: InventoryLog = {
      id: 'log_' + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split('T')[0],
      type: logType,
      quantity: qty,
      program: logType === 'Outward' ? prog : undefined,
      assignedTo: logType === 'Outward' ? assignedSchool : undefined,
      remarks: `${remarks || ''} (Added by: ${currentUser?.name || 'Staff'})`
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

  // Filter Stock items
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.type === categoryFilter;
    
    // Vertical-specific logs visibility
    if (verticalFilter !== 'All') {
      const hasLogForVertical = item.logs.some(l => l.program === verticalFilter);
      if (!hasLogForVertical) return false;
    }

    return matchesSearch && matchesCategory;
  });

  // Flat logs array for the ledger
  const flatLogs = inventory.flatMap(item => 
    item.logs.map(log => ({
      ...log,
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.type,
      itemUnit: item.unit
    }))
  ).filter(log => {
    const matchesVertical = verticalFilter === 'All' || log.program === verticalFilter;
    const matchesStatus = statusFilter === 'All' || log.type === statusFilter;
    const matchesSearch = log.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVertical && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('inventory')}</h1>
          <p className="text-sm text-slate-500 mt-1">Training kits, equipment, and learning materials registry</p>
        </div>
        {hasPermission('Manage Inventory') && (
          <div className="flex gap-2">
            <button 
              onClick={() => { setLogType('Inward'); setShowLogModal(true); }}
              className="btn-secondary py-1.5 px-3 text-xs"
            >
              <Plus size={14} />
              <span>Log Inward (Stock Entry)</span>
            </button>
            <button 
              onClick={() => { setLogType('Outward'); setShowLogModal(true); }}
              className="btn-primary py-1.5 px-3 text-xs"
            >
              <Plus size={14} />
              <span>Log Outward (Clearance)</span>
            </button>
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap gap-3 bg-slate-50 dark:bg-dark-card/20 p-3 rounded border border-slate-200 dark:border-dark-border text-xs font-semibold">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-8 py-1.5 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Vertical:</span>
          <select value={verticalFilter} onChange={(e) => setVerticalFilter(e.target.value)} className="input-field py-1">
            <option value="All">All Verticals</option>
            <option value="Pre-Vocational">Pre-Vocational</option>
            <option value="Vocational">Vocational</option>
            <option value="Udyam">Udyam</option>
            <option value="Magic Touch">MagicTouch</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Category:</span>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field py-1">
            <option value="All">All Categories</option>
            <option value="Equipment">Equipment</option>
            <option value="Training Kit">Training Kit</option>
            <option value="Book">Book</option>
            <option value="Stationery">Stationery</option>
            <option value="Consumable">Consumable</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Status:</span>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field py-1">
            <option value="All">All Transactions</option>
            <option value="Inward">Inward</option>
            <option value="Outward">Outward</option>
          </select>
        </div>

        <div className="flex gap-1.5">
          <button onClick={() => alert('Exporting to Excel...')} className="btn-secondary py-1 px-3 text-[10px] flex items-center gap-1">
            <FileText size={12} />
            <span>Excel</span>
          </button>
          <button onClick={() => alert('Exporting to PDF...')} className="btn-secondary py-1 px-3 text-[10px] flex items-center gap-1">
            <FileText size={12} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Grid of stock items */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredInventory.map(item => {
          const isBelowThreshold = item.currentStock < item.minThreshold;
          return (
            <div 
              key={item.id}
              className={`bg-white dark:bg-dark-surface p-5 border rounded-md shadow-sm flex flex-col justify-between h-40 ${
                isBelowThreshold 
                  ? 'border-red-250 bg-red-500/5 dark:border-red-550/20' 
                  : 'border-slate-200 dark:border-dark-border'
              }`}
            >
              <div>
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-dark-border/40 pb-2 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[150px]" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-[9px] text-slate-400 mt-0.5">{item.id}</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 font-bold px-1.5 py-0.5 rounded">
                    {item.type}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Available Stock</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {item.currentStock} <span className="text-xs text-slate-400 font-bold">{item.unit}</span>
                    </p>
                  </div>
                  {isBelowThreshold && (
                    <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-extrabold bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded animate-pulse">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>Low Stock</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction log ledger */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border flex justify-between items-center bg-slate-50 dark:bg-dark-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Ledger Logs</h2>
          <Clipboard size={16} className="text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-dark-card/60 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Transaction Date</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Flow Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Vertical</th>
                <th className="p-3">Assigned School</th>
                <th className="p-3 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-305">
              {flatLogs
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="p-3 font-mono">{log.date}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{log.itemName}</td>
                    <td className="p-3">{log.itemCategory}</td>
                    <td className="p-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold flex items-center gap-1 w-fit ${
                        log.type === 'Inward' 
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {log.type === 'Inward' ? <ArrowDown size={10} /> : <ArrowUp size={10} />}
                        <span>{log.type}</span>
                      </span>
                    </td>
                    <td className="p-3 font-bold">{log.quantity} {log.itemUnit}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{log.program || 'N/A'}</td>
                    <td className="p-3 font-bold text-slate-700 dark:text-white">
                      {log.assignedTo ? schools.find(s => s.code === log.assignedTo)?.name || log.assignedTo : 'Central Warehouse'}
                    </td>
                    <td className="p-3 text-right text-slate-500 italic max-w-xs truncate" title={log.remarks}>{log.remarks || 'No remarks'}</td>
                  </tr>
                ))}
              {flatLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">No transaction records found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD TRANSACTION LOG MODAL --- */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[400px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowLogModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h2 className="text-base font-bold font-heading mb-4 text-slate-900 dark:text-white">
              Log {logType} Stock Transaction
            </h2>

            <form onSubmit={handleLogSubmit} className="space-y-4 text-xs font-medium">
              
              {/* Select Item */}
              <div>
                <label className="block text-slate-500 mb-1">Select Item *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose stock item...</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>{i.name} (Stock: {i.currentStock} {i.unit})</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-slate-500 mb-1">Transaction Quantity *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              {logType === 'Outward' && (
                <>
                  {/* Select Programme */}
                  <div>
                    <label className="block text-slate-500 mb-1">Target Vertical *</label>
                    <select
                      value={prog}
                      onChange={(e) => setProg(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="Pre-Vocational">Pre-Vocational</option>
                      <option value="Vocational">Vocational</option>
                      <option value="Udyam">Udyam</option>
                      <option value="Magic Touch">MagicTouch</option>
                    </select>
                  </div>

                  {/* Select school */}
                  <div>
                    <label className="block text-slate-500 mb-1">Assign to school *</label>
                    <select
                      required
                      value={assignedSchool}
                      onChange={(e) => setAssignedSchool(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Choose school...</option>
                      {schools.map(s => (
                        <option key={s.code} value={s.code}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Remarks */}
              <div>
                <label className="block text-slate-500 mb-1">Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="input-field h-16 resize-none"
                  placeholder="Reference number, delivery note details..."
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
                  Log Transaction
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
