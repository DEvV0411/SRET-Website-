import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { TransportRoute } from '../types';
import { Plus, Fuel, Truck, MapPin, Calendar, Compass } from 'lucide-react';

export const TransportModule: React.FC = () => {
  const { t } = useAuth();
  
  // States
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [showFuelModal, setShowFuelModal] = useState(false);

  // Form states
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [liters, setLiters] = useState(10);
  const [cost, setCost] = useState(950);
  const [odometer, setOdometer] = useState(1000);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setRoutes(db.getTransport());
  };

  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || liters <= 0 || cost <= 0) return;

    const route = db.getTransport().find(r => r.id === selectedVehicleId);
    if (!route) return;

    const newLog = {
      date: new Date().toISOString().split('T')[0],
      liters,
      cost,
      odometer
    };

    const updatedRoute: TransportRoute = {
      ...route,
      fuelLogs: [newLog, ...route.fuelLogs]
    };

    db.saveTransportRoute(updatedRoute);
    loadData();
    setShowFuelModal(false);

    // Reset forms
    setLiters(10);
    setCost(950);
    setOdometer(1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('transport')}</h1>
          <p className="text-sm text-slate-500 mt-1">Manage vehicles fleet logs, travel schedules, and fuel logs</p>
        </div>
        <button 
          onClick={() => setShowFuelModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Log Fuel Entry</span>
        </button>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {routes.map(route => (
          <div 
            key={route.id}
            className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-md shadow-sm relative flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border/40 pb-2 mb-3">
                <span className="text-[10px] font-bold text-primary font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                  {route.vehicleNumber}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{route.id}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-card text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Driver: {route.driverName}</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Contact: {route.driverContact}</p>
                </div>
              </div>

              <div className="space-y-2 mt-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                  <span>Route: {route.routeDetails}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span>Schedules: {route.scheduleDays.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Fuel Log mini stats */}
            {route.fuelLogs.length > 0 && (
              <div className="border-t border-slate-100 dark:border-dark-border/60 pt-3 mt-4 text-[10px] text-slate-500 flex justify-between items-center">
                <span className="flex items-center gap-1"><Fuel size={12} className="text-accent" /> Last Odometer: {route.fuelLogs[0].odometer} km</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Refill: {route.fuelLogs[0].liters} Liters</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Fuel Ledger logs table */}
      <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-dark-border flex justify-between items-center bg-slate-50 dark:bg-dark-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fuel Refill Logs</h2>
          <Fuel size={16} className="text-slate-400" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-dark-card/60 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Refill Date</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Quantity (Liters)</th>
                <th className="p-3">Total Cost (INR)</th>
                <th className="p-3">Odometer</th>
                <th className="p-3 font-mono text-right">Fuel Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-300">
              {routes.flatMap(route => 
                route.fuelLogs.map(log => ({ ...log, vehicleNum: route.vehicleNumber }))
              )
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                  <td className="p-3 font-mono">{log.date}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{log.vehicleNum}</td>
                  <td className="p-3 font-bold">{log.liters} L</td>
                  <td className="p-3">₹ {log.cost}</td>
                  <td className="p-3 font-mono">{log.odometer} km</td>
                  <td className="p-3 text-right font-mono font-bold text-slate-500">₹ {(log.cost / log.liters).toFixed(2)}/L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- FUEL LOG MODAL --- */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[400px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowFuelModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h2 className="text-base font-bold font-heading mb-4 text-slate-900 dark:text-white">Log Fuel Purchase</h2>

            <form onSubmit={handleFuelSubmit} className="space-y-4">
              
              {/* Select Vehicle */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Vehicle *</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose vehicle...</option>
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>{r.vehicleNumber} ({r.driverName})</option>
                  ))}
                </select>
              </div>

              {/* Liters */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Liters (Volume) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={liters}
                  onChange={(e) => setLiters(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              {/* Total Cost */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Total Cost (INR) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              {/* Odometer */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Odometer Reading (km) *</label>
                <input
                  type="number"
                  required
                  value={odometer}
                  onChange={(e) => setOdometer(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-border/60">
                <button 
                  type="button" 
                  onClick={() => setShowFuelModal(false)}
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
