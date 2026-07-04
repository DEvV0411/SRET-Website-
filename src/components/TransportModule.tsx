import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { 
  DriverDetails, VehicleDetails, DriverDailyEntry, 
  TrainerReimbursement, WeeklySubmissionStatus, User, ProgrammeName 
} from '../types';
import { 
  Plus, Truck, Users, CreditCard, ClipboardList, Check, X, 
  MapPin, Calendar, DollarSign, Key, Fuel, Compass, AlertCircle 
} from 'lucide-react';

export const TransportModule: React.FC = () => {
  const { currentUser, t } = useAuth();
  
  // Navigation tabs (Role-dependent visibility)
  const isSuperOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'programme_coordinator' || currentUser?.role === 'programme_head';
  const isDriver = currentUser?.role === 'driver';
  const isTrainer = currentUser?.role === 'trainer';

  const defaultTab = isDriver ? 'driver_logs' : isTrainer ? 'reimbursement' : 'fleet';
  const [subTab, setSubTab] = useState<'fleet' | 'drivers' | 'driver_logs' | 'reimbursement' | 'reports'>(defaultTab as any);

  // Core Data States
  const [vehicles, setVehicles] = useState<VehicleDetails[]>([]);
  const [drivers, setDrivers] = useState<DriverDetails[]>([]);
  const [driverEntries, setDriverEntries] = useState<DriverDailyEntry[]>([]);
  const [reimbursements, setReimbursements] = useState<TrainerReimbursement[]>([]);
  const [weeklyStatus, setWeeklyStatus] = useState<WeeklySubmissionStatus[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);

  // Filter States
  const [selectedVerticalFilter, setSelectedVerticalFilter] = useState('All');
  const [selectedDriverFilter, setSelectedDriverFilter] = useState('All');

  // Modals & Form States
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showAddDriverEntry, setShowAddDriverEntry] = useState(false);
  const [showAddReimbursement, setShowAddReimbursement] = useState(false);

  // Form Fields
  // Vehicle
  const [vehNumber, setVehNumber] = useState('');
  const [vehType, setVehType] = useState<'Permanent' | 'Rental'>('Permanent');
  const [vehInsurance, setVehInsurance] = useState('');
  const [vehRC, setVehRC] = useState('');
  const [vehPUC, setVehPUC] = useState('');
  const [vehServiceDate, setVehServiceDate] = useState('');
  // Rental specific
  const [rentVendor, setRentVendor] = useState('');
  const [rentContact, setRentContact] = useState('');
  const [rentAgreement, setRentAgreement] = useState('');
  const [rentCharges, setRentCharges] = useState(2500);
  const [rentValidity, setRentValidity] = useState('');

  // Driver Details
  const [drvName, setDrvName] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvAddress, setDrvAddress] = useState('');
  const [drvEmergency, setDrvEmergency] = useState('');
  const [aadhaarFileSim, setAadhaarFileSim] = useState('Simulated Aadhaar uploaded');
  const [dlFileSim, setDlFileSim] = useState('Simulated Licence uploaded');

  // Driver Daily Entry
  const [entryStartKM, setEntryStartKM] = useState(1000);
  const [entryEndKM, setEntryEndKM] = useState(1080);
  const [entryFuelQty, setEntryFuelQty] = useState(10);
  const [entryFuelCost, setEntryFuelCost] = useState(950);
  const [entryVehicleId, setEntryVehicleId] = useState('');
  const [entryTrainerUsername, setEntryTrainerUsername] = useState('');
  const [entryVertical, setEntryVertical] = useState<ProgrammeName>('Pre-Vocational');

  // Reimbursement
  const [reimbStartLoc, setReimbStartLoc] = useState('');
  const [reimbEndLoc, setReimbEndLoc] = useState('');
  const [reimbDistance, setReimbDistance] = useState(30);
  const [reimbFuelQty, setReimbFuelQty] = useState(3);
  const [reimbFuelCost, setReimbFuelCost] = useState(285);
  const [reimbPurpose, setReimbPurpose] = useState('');
  const [reimbVertical, setReimbVertical] = useState<ProgrammeName>('Pre-Vocational');
  const [reimbRemarks, setReimbRemarks] = useState('');

  useEffect(() => {
    loadData();
    window.addEventListener('omp_db_pulled', loadData);
    return () => {
      window.removeEventListener('omp_db_pulled', loadData);
    };
  }, []);

  const loadData = () => {
    setVehicles(db.getVehicles());
    setDrivers(db.getDrivers());
    setDriverEntries(db.getDriverEntries());
    setReimbursements(db.getReimbursements());
    setWeeklyStatus(db.getWeeklySubmissions());
    
    // Get trainers for linkage selection
    const allUsers = db.getUsers();
    setTrainers(allUsers.filter(u => u.role === 'trainer'));
  };

  // Submit Vehicle
  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehNumber) return;

    const saved: VehicleDetails = {
      id: vehNumber.trim().toUpperCase(),
      vehicleNumber: vehNumber.trim().toUpperCase(),
      vehicleType: vehType,
      insuranceDetails: vehInsurance || 'Valid',
      rcDetails: vehRC || 'Active',
      pucDetails: vehPUC || 'Valid',
      serviceDueDate: vehServiceDate || '2026-12-31',
      vendorName: vehType === 'Rental' ? rentVendor : undefined,
      vendorContact: vehType === 'Rental' ? rentContact : undefined,
      rentalAgreementDetails: vehType === 'Rental' ? rentAgreement : undefined,
      rentalCharges: vehType === 'Rental' ? Number(rentCharges) : undefined,
      validityPeriod: vehType === 'Rental' ? rentValidity : undefined
    };

    db.saveVehicle(saved);
    setShowAddVehicle(false);
    loadData();
  };

  // Submit Driver Profile
  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drvName || !drvPhone) return;

    const driverUsername = 'driver.' + drvName.split(' ')[0].toLowerCase();
    const saved: DriverDetails = {
      id: driverUsername,
      name: drvName,
      mobileNumber: drvPhone,
      address: drvAddress,
      emergencyContact: drvEmergency,
      aadhaarUrl: aadhaarFileSim,
      licenceUrl: dlFileSim
    };

    db.saveDriver(saved);
    setShowAddDriver(false);
    loadData();
  };

  // Submit Driver Daily Entry
  const handleDriverEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryVehicleId || !entryTrainerUsername) return;

    const trainerUser = trainers.find(t => t.username === entryTrainerUsername);
    const distance = Math.max(entryEndKM - entryStartKM, 0);

    const saved: DriverDailyEntry = {
      id: 'DE_' + Math.floor(1000 + Math.random() * 9000),
      driverUsername: currentUser?.username || 'driver',
      driverName: currentUser?.name || 'Driver',
      startOdometer: entryStartKM,
      endOdometer: entryEndKM,
      distance,
      petrolQuantity: entryFuelQty,
      fuelCost: entryFuelCost,
      date: new Date().toISOString().split('T')[0],
      vehicleId: entryVehicleId,
      linkedTrainerUsername: entryTrainerUsername,
      linkedTrainerName: trainerUser?.name || 'Trainer',
      vertical: entryVertical
    };

    db.saveDriverEntry(saved);
    setShowAddDriverEntry(false);
    loadData();
  };

  // Submit Reimbursement claim
  const handleReimbursementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reimbStartLoc || !reimbEndLoc) return;

    const saved: TrainerReimbursement = {
      id: 'RE_' + Math.floor(1000 + Math.random() * 9000),
      trainerUsername: currentUser?.username || 'trainer',
      trainerName: currentUser?.name || 'Trainer',
      date: new Date().toISOString().split('T')[0],
      startLocation: reimbStartLoc,
      endLocation: reimbEndLoc,
      distance: reimbDistance,
      petrolQuantity: reimbFuelQty,
      fuelCost: reimbFuelCost,
      purpose: reimbPurpose,
      vertical: reimbVertical,
      status: 'Pending',
      remarks: reimbRemarks
    };

    db.saveReimbursement(saved);
    setShowAddReimbursement(false);
    loadData();
  };

  // Workflow decisions
  const handleReimbursementDecision = (claim: TrainerReimbursement, decision: 'Approved' | 'Rejected') => {
    const updated: TrainerReimbursement = {
      ...claim,
      status: decision,
      approvedBy: currentUser?.name
    };
    db.saveReimbursement(updated);
    loadData();
  };

  // Locks weekly submission compliance status
  const handleLockSubmission = () => {
    if (!currentUser) return;
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() + daysUntilSunday);
    const weekEndDateStr = sunday.toISOString().split('T')[0];

    const saved: WeeklySubmissionStatus = {
      id: 'WS_' + Math.floor(100 + Math.random() * 900),
      username: currentUser.username,
      weekEndDate: weekEndDateStr,
      status: 'Completed',
      submittedAt: new Date().toISOString(),
      type: currentUser.role === 'driver' ? 'driver' : 'trainer'
    };

    db.saveWeeklySubmission(saved);
    loadData();
  };

  // Filters calculation
  const filteredDriverEntries = driverEntries.filter(e => {
    const matchesVertical = selectedVerticalFilter === 'All' || e.vertical === selectedVerticalFilter;
    const matchesDriver = selectedDriverFilter === 'All' || e.driverUsername === selectedDriverFilter;
    return matchesVertical && matchesDriver;
  });

  const filteredReimbursements = reimbursements.filter(r => {
    const matchesVertical = selectedVerticalFilter === 'All' || r.vertical === selectedVerticalFilter;
    return matchesVertical;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-200 dark:border-dark-border gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="text-primary" />
            <span>Transport & Claims Platform</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage permanent/rental fleet logs, drivers profiles, travel entries, and reimbursement workflows
          </p>
        </div>

        {/* Workspace controls */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-dark-card p-1 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold">
          {isSuperOrAdmin && (
            <>
              <button onClick={() => setSubTab('fleet')} className={`px-3 py-1.5 rounded-md ${subTab === 'fleet' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>Fleet Registry</button>
              <button onClick={() => setSubTab('drivers')} className={`px-3 py-1.5 rounded-md ${subTab === 'drivers' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>Drivers Profiles</button>
            </>
          )}
          <button onClick={() => setSubTab('driver_logs')} className={`px-3 py-1.5 rounded-md ${subTab === 'driver_logs' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>Driver Logs</button>
          <button onClick={() => setSubTab('reimbursement')} className={`px-3 py-1.5 rounded-md ${subTab === 'reimbursement' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>Reimbursements</button>
          {isSuperOrAdmin && (
            <button onClick={() => setSubTab('reports')} className={`px-3 py-1.5 rounded-md ${subTab === 'reports' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}>Reports</button>
          )}
        </div>
      </div>

      {/* Quick filters on top of tables */}
      {(subTab === 'driver_logs' || subTab === 'reimbursement') && (
        <div className="flex flex-wrap gap-3 bg-slate-50 dark:bg-dark-card/20 p-3 rounded border border-slate-200 dark:border-dark-border text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Vertical Filter:</span>
            <select
              value={selectedVerticalFilter}
              onChange={(e) => setSelectedVerticalFilter(e.target.value)}
              className="input-field py-1"
            >
              <option value="All">All Verticals</option>
              <option value="Pre-Vocational">Pre-Vocational</option>
              <option value="Vocational">Vocational</option>
              <option value="Udyam">Udyam</option>
              <option value="Magic Touch">MagicTouch</option>
            </select>
          </div>

          {subTab === 'driver_logs' && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Driver Filter:</span>
              <select
                value={selectedDriverFilter}
                onChange={(e) => setSelectedDriverFilter(e.target.value)}
                className="input-field py-1"
              >
                <option value="All">All Drivers</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Locked Weekly submission trigger for Drivers/Trainers */}
          {(isDriver || isTrainer) && (
            <button 
              onClick={handleLockSubmission}
              className="ml-auto btn-primary py-1 px-3 text-[10px] bg-emerald-500 hover:bg-emerald-600"
            >
              Lock Weekly Logs
            </button>
          )}
        </div>
      )}

      {/* ==================== SUBTAB: VEHICLES FLEET ==================== */}
      {subTab === 'fleet' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddVehicle(true)} className="btn-primary">
              <Plus size={16} />
              <span>Add Vehicle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vehicles.map(v => (
              <div 
                key={v.id}
                className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-dark-border/40 pb-2 mb-3">
                    <span className="text-[10px] font-bold text-primary font-mono bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                      {v.vehicleNumber}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      v.vehicleType === 'Permanent' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {v.vehicleType}
                    </span>
                  </div>

                  <div className="space-y-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-4">
                    <p><span className="text-slate-400">Insurance:</span> {v.insuranceDetails}</p>
                    <p><span className="text-slate-400">RC Details:</span> {v.rcDetails}</p>
                    <p><span className="text-slate-400">PUC Status:</span> {v.pucDetails}</p>
                    <p><span className="text-slate-400">Service Due:</span> {v.serviceDueDate}</p>
                    {v.vendorName && (
                      <div className="pt-2 mt-2 border-t border-slate-100 dark:border-dark-border/40 text-slate-400">
                        <p><span className="font-bold">Vendor:</span> {v.vendorName} ({v.vendorContact})</p>
                        <p><span className="font-bold">Charges:</span> ₹ {v.rentalCharges}/Day</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUBTAB: DRIVERS REGISTRY ==================== */}
      {subTab === 'drivers' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowAddDriver(true)} className="btn-primary">
              <Plus size={16} />
              <span>Register Driver</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {drivers.map(d => (
              <div 
                key={d.id}
                className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 border-b border-slate-100 dark:border-dark-border/45 pb-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-dark-card font-bold flex items-center justify-center">
                      {d.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">{d.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Contact: {d.mobileNumber}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <p><span className="font-bold">Address:</span> {d.address}</p>
                    <p><span className="font-bold">Emergency No:</span> {d.emergencyContact}</p>
                    <p className="text-[9px] mt-2 font-mono text-emerald-500 font-bold">✓ Aadhaar & Driving Licence Verified</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SUBTAB: DRIVER DAILY ENTRIES ==================== */}
      {subTab === 'driver_logs' && (
        <div className="space-y-4">
          {isDriver && (
            <div className="flex justify-end">
              <button onClick={() => setShowAddDriverEntry(true)} className="btn-primary">
                <Plus size={16} />
                <span>Log Daily Entry</span>
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold">
                    <th className="p-3">Date</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Start ODO</th>
                    <th className="p-3">End ODO</th>
                    <th className="p-3">Distance (KM)</th>
                    <th className="p-3">Petrol (L)</th>
                    <th className="p-3">Fuel Cost</th>
                    <th className="p-3">Linked Trainer</th>
                    <th className="p-3 text-right">Vertical</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-350">
                  {filteredDriverEntries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-3 font-mono">{entry.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{entry.driverName}</td>
                      <td className="p-3 font-bold">{entry.vehicleId}</td>
                      <td className="p-3 font-mono">{entry.startOdometer} km</td>
                      <td className="p-3 font-mono">{entry.endOdometer} km</td>
                      <td className="p-3 font-bold text-primary">{entry.distance} km</td>
                      <td className="p-3">{entry.petrolQuantity} L</td>
                      <td className="p-3">₹ {entry.fuelCost}</td>
                      <td className="p-3 font-bold text-emerald-500">{entry.linkedTrainerName}</td>
                      <td className="p-3 text-right font-mono text-slate-400 text-[10px]">{entry.vertical}</td>
                    </tr>
                  ))}
                  {filteredDriverEntries.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 italic">No daily entries logged matching current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUBTAB: REIMBURSEMENTS ==================== */}
      {subTab === 'reimbursement' && (
        <div className="space-y-4">
          {isTrainer && (
            <div className="flex justify-end">
              <button onClick={() => setShowAddReimbursement(true)} className="btn-primary">
                <Plus size={16} />
                <span>Submit Reimbursement</span>
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold">
                    <th className="p-3">Date</th>
                    <th className="p-3">Trainer</th>
                    <th className="p-3">Start Location</th>
                    <th className="p-3">End Location</th>
                    <th className="p-3">Distance</th>
                    <th className="p-3">Fuel Cost</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Vertical</th>
                    <th className="p-3">Status</th>
                    {isSuperOrAdmin && <th className="p-3 text-right">Approval Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-350">
                  {filteredReimbursements.map(claim => (
                    <tr key={claim.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-3 font-mono">{claim.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{claim.trainerName}</td>
                      <td className="p-3">{claim.startLocation}</td>
                      <td className="p-3">{claim.endLocation}</td>
                      <td className="p-3 font-bold text-primary">{claim.distance} km</td>
                      <td className="p-3">₹ {claim.fuelCost}</td>
                      <td className="p-3 italic text-slate-500 text-[11px]">"{claim.purpose}"</td>
                      <td className="p-3 font-mono text-[10px]">{claim.vertical}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          claim.status === 'Approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          claim.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {claim.status}
                        </span>
                      </td>
                      {isSuperOrAdmin && (
                        <td className="p-3 text-right">
                          {claim.status === 'Pending' ? (
                            <div className="flex justify-end gap-1.5 text-[9px] font-bold">
                              <button 
                                onClick={() => handleReimbursementDecision(claim, 'Approved')}
                                className="p-1 text-green-500 hover:bg-green-500/5 border border-green-500/20 rounded shadow-sm flex items-center gap-0.5"
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                              <button 
                                onClick={() => handleReimbursementDecision(claim, 'Rejected')}
                                className="p-1 text-red-500 hover:bg-red-500/5 border border-red-500/20 rounded shadow-sm flex items-center gap-0.5"
                              >
                                <X size={12} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">By: {claim.approvedBy || 'Admin'}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                  {filteredReimbursements.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-6 text-center text-slate-400 italic">No reimbursement claims logged for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUBTAB: REPORTS ==================== */}
      {subTab === 'reports' && (
        <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-dark-border/40 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Operations Analytics</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold text-slate-600 dark:text-slate-350">
            <div className="p-4 border border-slate-100 dark:border-dark-border/50 rounded bg-slate-50/20 dark:bg-dark-card/10 space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px]">Distance Metrics</h4>
              <p>Total logged distance: 18,290 km</p>
              <p>Average daily distance: 145 km</p>
              <p>Rental vehicle contribution: 4,120 km (22%)</p>
            </div>

            <div className="p-4 border border-slate-100 dark:border-dark-border/50 rounded bg-slate-50/20 dark:bg-dark-card/10 space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px]">Fuel Utilization</h4>
              <p>Total fuel purchased: 1,540 Liters</p>
              <p>Total expenditures: ₹ 1,46,300</p>
              <p>Average fuel economy: 11.8 km/Liter</p>
            </div>

            <div className="p-4 border border-slate-100 dark:border-dark-border/50 rounded bg-slate-50/20 dark:bg-dark-card/10 space-y-2">
              <h4 className="font-extrabold text-slate-900 dark:text-white uppercase text-[10px]">Weekly Submission Lock Compliance</h4>
              <p>Completed Submissions: 8/10 profiles (80%)</p>
              <p>Pending Submissions: 2 profiles (20%)</p>
              <p>Submission deadline alert threshold: 48 Hours remaining</p>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD VEHICLE MODAL --- */}
      {showAddVehicle && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[450px] rounded-lg shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAddVehicle(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold">Close</button>
            <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Add Fleet Vehicle</h2>

            <form onSubmit={handleVehicleSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Vehicle Number *</label>
                  <input type="text" required value={vehNumber} onChange={(e) => setVehNumber(e.target.value)} className="input-field" placeholder="GJ-01-XX-9900" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Vehicle Type *</label>
                  <select value={vehType} onChange={(e) => setVehType(e.target.value as any)} className="input-field">
                    <option value="Permanent">Permanent Owned</option>
                    <option value="Rental">Rental Hired</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Insurance Policy Details</label>
                <input type="text" value={vehInsurance} onChange={(e) => setVehInsurance(e.target.value)} className="input-field" placeholder="Policy #, Validity..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">RC Status</label>
                  <input type="text" value={vehRC} onChange={(e) => setVehRC(e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">PUC Validity</label>
                  <input type="text" value={vehPUC} onChange={(e) => setVehPUC(e.target.value)} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Service Due Date</label>
                <input type="date" value={vehServiceDate} onChange={(e) => setVehServiceDate(e.target.value)} className="input-field" />
              </div>

              {vehType === 'Rental' && (
                <div className="pt-3 border-t border-slate-100 dark:border-dark-border/40 space-y-3">
                  <h4 className="font-bold text-slate-400 text-[10px] uppercase">Rental Vendor Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 mb-1">Vendor Name</label>
                      <input type="text" value={rentVendor} onChange={(e) => setRentVendor(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Vendor Phone</label>
                      <input type="text" value={rentContact} onChange={(e) => setRentContact(e.target.value)} className="input-field" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-slate-500 mb-1">Rental Agreement Details</label>
                      <input type="text" value={rentAgreement} onChange={(e) => setRentAgreement(e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-slate-500 mb-1">Charges/Day</label>
                      <input type="number" value={rentCharges} onChange={(e) => setRentCharges(Number(e.target.value))} className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Rental Agreement Validity</label>
                    <input type="date" value={rentValidity} onChange={(e) => setRentValidity(e.target.value)} className="input-field" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <button type="button" onClick={() => setShowAddVehicle(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- REGISTER DRIVER MODAL --- */}
      {showAddDriver && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[400px] rounded-lg shadow-xl p-6 relative">
            <button onClick={() => setShowAddDriver(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold">Close</button>
            <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Register Driver</h2>

            <form onSubmit={handleDriverSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-500 mb-1">Driver Name *</label>
                <input type="text" required value={drvName} onChange={(e) => setDrvName(e.target.value)} className="input-field" placeholder="e.g. Ramesh K." />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Mobile Number *</label>
                <input type="text" required value={drvPhone} onChange={(e) => setDrvPhone(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Address</label>
                <input type="text" value={drvAddress} onChange={(e) => setDrvAddress(e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Emergency Contact details *</label>
                <input type="text" required value={drvEmergency} onChange={(e) => setDrvEmergency(e.target.value)} className="input-field" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Aadhaar Card Upload</label>
                  <div className="py-2 text-[10px] border border-dashed border-slate-350 dark:border-dark-border text-center rounded bg-slate-50 dark:bg-dark-card/20">
                    Uploaded (Simulated)
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Licence Upload</label>
                  <div className="py-2 text-[10px] border border-dashed border-slate-350 dark:border-dark-border text-center rounded bg-slate-50 dark:bg-dark-card/20">
                    Uploaded (Simulated)
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowAddDriver(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Register Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD DRIVER DAILY LOG ENTRY MODAL --- */}
      {showAddDriverEntry && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[400px] rounded-lg shadow-xl p-6 relative">
            <button onClick={() => setShowAddDriverEntry(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold">Close</button>
            <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Daily Trip Log Entry</h2>

            <form onSubmit={handleDriverEntrySubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Start KM reading *</label>
                  <input type="number" required value={entryStartKM} onChange={(e) => setEntryStartKM(Number(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">End KM reading *</label>
                  <input type="number" required value={entryEndKM} onChange={(e) => setEntryEndKM(Number(e.target.value))} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Petrol Consumed (L) *</label>
                  <input type="number" required value={entryFuelQty} onChange={(e) => setEntryFuelQty(Number(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Fuel Purchase Cost *</label>
                  <input type="number" required value={entryFuelCost} onChange={(e) => setEntryFuelCost(Number(e.target.value))} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Vehicle Used *</label>
                  <select required value={entryVehicleId} onChange={(e) => setEntryVehicleId(e.target.value)} className="input-field">
                    <option value="">Choose vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.vehicleType})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Assigned Vertical *</label>
                  <select value={entryVertical} onChange={(e) => setEntryVertical(e.target.value as any)} className="input-field">
                    <option value="Pre-Vocational">Pre-Vocational</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Udyam">Udyam</option>
                    <option value="Magic Touch">MagicTouch</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Select Active Trainer *</label>
                <select required value={entryTrainerUsername} onChange={(e) => setEntryTrainerUsername(e.target.value)} className="input-field">
                  <option value="">Choose trainer...</option>
                  {trainers.map(t => (
                    <option key={t.username} value={t.username}>{t.name} ({t.assignedProgramme})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <button type="button" onClick={() => setShowAddDriverEntry(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Trip Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD REIMBURSEMENT MODAL --- */}
      {showAddReimbursement && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[400px] rounded-lg shadow-xl p-6 relative">
            <button onClick={() => setShowAddReimbursement(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold">Close</button>
            <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Submit Travel Claim</h2>

            <form onSubmit={handleReimbursementSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Start Location *</label>
                  <input type="text" required value={reimbStartLoc} onChange={(e) => setReimbStartLoc(e.target.value)} className="input-field" placeholder="Valsad HQ" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">End Location *</label>
                  <input type="text" required value={reimbEndLoc} onChange={(e) => setReimbEndLoc(e.target.value)} className="input-field" placeholder="School Name..." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Distance (KM) *</label>
                  <input type="number" required value={reimbDistance} onChange={(e) => setReimbDistance(Number(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Petrol (L) *</label>
                  <input type="number" required value={reimbFuelQty} onChange={(e) => setReimbFuelQty(Number(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Fuel Cost *</label>
                  <input type="number" required value={reimbFuelCost} onChange={(e) => setReimbFuelCost(Number(e.target.value))} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Assigned Vertical *</label>
                  <select value={reimbVertical} onChange={(e) => setReimbVertical(e.target.value as any)} className="input-field">
                    <option value="Pre-Vocational">Pre-Vocational</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Udyam">Udyam</option>
                    <option value="Magic Touch">MagicTouch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Remarks</label>
                  <input type="text" value={reimbRemarks} onChange={(e) => setReimbRemarks(e.target.value)} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Purpose of Travel *</label>
                <textarea required value={reimbPurpose} onChange={(e) => setReimbPurpose(e.target.value)} className="input-field h-16 resize-none" placeholder="Enter purpose of visit..." />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <button type="button" onClick={() => setShowAddReimbursement(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Claim</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
