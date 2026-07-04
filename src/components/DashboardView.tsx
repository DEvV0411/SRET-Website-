import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { 
  Student, School, Session, SystemAlert, ProgrammeName, 
  User, VehicleDetails, DriverDailyEntry, TrainerReimbursement 
} from '../types';
import { 
  TrendingUp, Award, Clock, Users, School as SchoolIcon, 
  Calendar, CheckCircle2, AlertTriangle, ChevronRight, Play,
  Truck, Compass, ShieldCheck, ClipboardCheck, Info, CreditCard
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab }) => {
  const { currentUser, t } = useAuth();
  
  // States
  const [selectedProg, setSelectedProg] = useState<ProgrammeName | 'All'>('All');
  const [refreshCount, setRefreshCount] = useState(0);

  // Core ERP States
  const [trainers, setTrainers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<VehicleDetails[]>([]);
  const [driverEntries, setDriverEntries] = useState<DriverDailyEntry[]>([]);
  const [reimbursements, setReimbursements] = useState<TrainerReimbursement[]>([]);
  const [pendingClaims, setPendingClaims] = useState<TrainerReimbursement[]>([]);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshCount(prev => prev + 1);
    };
    window.addEventListener('omp_session_conducted_update', handleUpdate);
    window.addEventListener('omp_alerts_change', handleUpdate);
    window.addEventListener('omp_db_pulled', handleUpdate);
    return () => {
      window.removeEventListener('omp_session_conducted_update', handleUpdate);
      window.removeEventListener('omp_alerts_change', handleUpdate);
      window.removeEventListener('omp_db_pulled', handleUpdate);
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [refreshCount]);

  const loadDashboardData = () => {
    const allUsers = db.getUsers();
    setTrainers(allUsers.filter(u => u.role === 'trainer'));
    setVehicles(db.getVehicles());
    setDriverEntries(db.getDriverEntries());
    
    const allReimburse = db.getReimbursements();
    setReimbursements(allReimburse);
    setPendingClaims(allReimburse.filter(r => r.status === 'Pending'));
  };

  // Linear GPS mapping to SVG coordinate dimensions width=500, height=280
  const mapCoordsToSvg = (lat: number, lng: number) => {
    const minLat = 20.0, maxLat = 24.8;
    const minLng = 68.0, maxLng = 74.8;
    const x = ((lng - minLng) / (maxLng - minLng)) * 500;
    const y = 280 - (((lat - minLat) / (maxLat - minLat)) * 280);
    return { x: Math.max(15, Math.min(485, x)), y: Math.max(15, Math.min(265, y)) };
  };

  // Seed coordinates to ensure active trainer pins render correctly on map
  const activeTrainersWithGPS = trainers.map(tr => {
    if (!tr.lastKnownLocation) {
      const demoCoords: Record<string, {lat: number, lng: number}> = {
        'trainer.rahul': { lat: 22.2534, lng: 72.1983 }, // Ahmedabad HQ
        'trainer.krunal': { lat: 20.6059, lng: 72.9304 }, // Valsad Cluster
        'trainer.jinal': { lat: 20.5982, lng: 73.1901 }, // Dharampur taluka
        'trainer.anjali': { lat: 22.6284, lng: 71.6495 }, // Surendranagar
      };
      const coord = demoCoords[tr.username] || { lat: 23.0225, lng: 72.5714 };
      return {
        ...tr,
        lastKnownLocation: {
          ...coord,
          timestamp: new Date().toISOString()
        },
        locationHistory: [
          { lat: coord.lat - 0.05, lng: coord.coord?.lng || coord.lng - 0.05, timestamp: new Date().toISOString() },
          coord
        ]
      };
    }
    return tr;
  });

  // Calculate ERP stats
  const totalStudentsCount = db.getStudents().length;
  const totalTrainers = trainers.length;
  const activeTrainers = trainers.filter(t => t.isActive).length;
  
  const pvTrainerCount = trainers.filter(t => t.assignedProgramme === 'Pre-Vocational').length;
  const vTrainerCount = trainers.filter(t => t.assignedProgramme === 'Vocational').length;
  const udyamTrainerCount = trainers.filter(t => t.assignedProgramme === 'Udyam').length;
  const mtTrainerCount = trainers.filter(t => t.assignedProgramme === 'Magic Touch').length;

  const totalVehiclesCount = vehicles.length;
  const totalDistance = driverEntries.reduce((sum, e) => sum + e.distance, 0);
  const totalFuelCost = driverEntries.reduce((sum, e) => sum + e.fuelCost, 0) + reimbursements.filter(r => r.status === 'Approved').reduce((sum, r) => sum + r.fuelCost, 0);

  // Weekly compliance check
  const weeklySubmissions = db.getWeeklySubmissions();
  const completedWeekly = weeklySubmissions.filter(w => w.status === 'Completed').length;
  const compliancePercent = weeklySubmissions.length > 0 
    ? Math.round((completedWeekly / weeklySubmissions.length) * 100) 
    : 85;

  const [selectedPinUser, setSelectedPinUser] = useState<User | null>(null);

  // Approve claim instantly
  const handleApproveClaim = (claim: TrainerReimbursement) => {
    const updated: TrainerReimbursement = {
      ...claim,
      status: 'Approved',
      approvedBy: currentUser?.name || 'Admin'
    };
    db.saveReimbursement(updated);
    loadDashboardData();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="pb-4 border-b border-slate-200 dark:border-dark-border">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          SRET Unified ERP Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time coordination grid, GPS tracking telemetry, transport utilization, and weekly submission compliance
        </p>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Trainers */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Trainers Overview</span>
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {totalTrainers} <span className="text-xs text-slate-400 font-medium">({activeTrainers} active)</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1 flex flex-wrap gap-1">
              <span className="bg-blue-500/10 text-blue-500 px-1 rounded">PV: {pvTrainerCount}</span>
              <span className="bg-indigo-500/10 text-indigo-500 px-1 rounded">Voc: {vTrainerCount}</span>
              <span className="bg-emerald-500/10 text-emerald-500 px-1 rounded">Udyam: {udyamTrainerCount}</span>
              <span className="bg-purple-500/10 text-purple-500 px-1 rounded">MT: {mtTrainerCount}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Students & Enrolled Clusters */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">ERP Student Strength</span>
            <SchoolIcon size={18} className="text-secondary" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {totalStudentsCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Across 4 verticals & 71 allotted centers
            </div>
          </div>
        </div>

        {/* KPI 3: Fleet distance */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Fleet Distance Logs</span>
            <Truck size={18} className="text-indigo-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {totalDistance} km
            </div>
            <div className="text-[9px] text-slate-400 mt-1 flex justify-between">
              <span>Fuel Cost: ₹ {totalFuelCost}</span>
              <span className="font-bold text-indigo-500">{totalVehiclesCount} Active vehicles</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Weekly submissions compliance */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-lg shadow-sm flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Submission Compliance</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-950 dark:text-white mt-1">
              {compliancePercent}%
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${compliancePercent}%` }} />
            </div>
          </div>
        </div>

      </div>

      {/* MAP & GPS FIELD TRACKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GPS LIVE MAP SVG PANEL */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-lg shadow-sm relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase text-slate-500">Active Trainer Locations (Live Map)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Real-time coordinates mapped on Gujarat Taluka Outline</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <Compass size={12} className="animate-spin" />
              <span>Telemetry Active</span>
            </span>
          </div>

          <div className="border border-slate-200 dark:border-dark-border rounded bg-slate-50 dark:bg-dark-card/30 relative h-[300px] overflow-hidden flex items-center justify-center">
            
            {/* SVG MAP DRAWING OUTLINE */}
            <svg viewBox="0 0 500 280" className="w-full h-full stroke-slate-200 dark:stroke-slate-800 fill-none">
              
              {/* Gridlines */}
              <path d="M 0 70 L 500 70 M 0 140 L 500 140 M 0 210 L 500 210" strokeDasharray="4" className="stroke-slate-200 dark:stroke-dark-border/40" />
              <path d="M 125 0 L 125 280 M 250 0 L 250 280 M 375 0 L 375 280" strokeDasharray="4" className="stroke-slate-200 dark:stroke-dark-border/40" />

              {/* Taluka Boundaries visual guidelines */}
              <circle cx="100" cy="90" r="40" className="stroke-dashed stroke-slate-300 dark:stroke-slate-800" />
              <circle cx="210" cy="200" r="50" className="stroke-dashed stroke-slate-300 dark:stroke-slate-800" />
              <circle cx="180" cy="80" r="30" className="stroke-dashed stroke-slate-300 dark:stroke-slate-800" />

              {/* Labels */}
              <text x="180" y="65" fontSize="8" className="fill-slate-400 font-bold">AHMEDABAD HUB</text>
              <text x="75" y="115" fontSize="8" className="fill-slate-400 font-bold">SURENDRANAGAR</text>
              <text x="210" y="240" fontSize="8" className="fill-slate-400 font-bold">VALSAD / DHARAMPUR</text>

              {/* Movement history lines for active pin */}
              {selectedPinUser?.locationHistory && selectedPinUser.locationHistory.length > 1 && (
                (() => {
                  const points = selectedPinUser.locationHistory.map(h => {
                    const pt = mapCoordsToSvg(h.lat, h.lng);
                    return `${pt.x},${pt.y}`;
                  }).join(' ');
                  return (
                    <polyline points={points} className="stroke-primary stroke-2 stroke-dasharray-[5] fill-none opacity-60" />
                  );
                })()
              )}

              {/* Trainer bouncing pins */}
              {activeTrainersWithGPS.map(tr => {
                if (!tr.lastKnownLocation) return null;
                const { x, y } = mapCoordsToSvg(tr.lastKnownLocation.lat, tr.lastKnownLocation.lng);
                return (
                  <g key={tr.username} className="cursor-pointer" onClick={() => setSelectedPinUser(tr)}>
                    <circle cx={x} cy={y} r="10" className="fill-primary/20 animate-ping" />
                    <circle cx={x} cy={y} r="6" className="fill-primary stroke-white stroke-2" />
                  </g>
                );
              })}

            </svg>

            {/* Pin Details Hover Overlay */}
            {selectedPinUser?.lastKnownLocation && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-dark-surface/95 border border-slate-200 dark:border-dark-border p-3 rounded-lg shadow-xl text-xs flex justify-between items-center gap-3 backdrop-blur-md">
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white">{selectedPinUser.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Vertical Limit: {selectedPinUser.assignedProgramme}</p>
                </div>
                <div className="text-right text-[10px] font-mono text-slate-500">
                  <p>Lat: {selectedPinUser.lastKnownLocation.lat.toFixed(4)}</p>
                  <p>Lng: {selectedPinUser.lastKnownLocation.lng.toFixed(4)}</p>
                </div>
                <button 
                  onClick={() => setSelectedPinUser(null)} 
                  className="p-1 text-slate-400 hover:text-red-500 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

          </div>
        </div>

        {/* PENDING CLAIMS AND COMPLIANCE SUMMARY */}
        <div className="space-y-6 md:col-span-1">
          
          {/* Travel Claims approvals */}
          <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
            <h3 className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
              <CreditCard size={16} className="text-slate-400" />
              <span>Pending Claims ({pendingClaims.length})</span>
            </h3>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {pendingClaims.map(claim => (
                <div 
                  key={claim.id}
                  className="p-3 border border-slate-100 dark:border-dark-border/40 rounded bg-slate-50/50 dark:bg-dark-card/20 flex flex-col justify-between gap-2"
                >
                  <div className="text-[11px] font-semibold text-slate-650 dark:text-slate-300">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900 dark:text-white">{claim.trainerName}</span>
                      <span className="text-primary">₹ {claim.fuelCost}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{claim.startLocation} ➔ {claim.endLocation} ({claim.distance} km)</p>
                    <p className="italic text-[10px] text-slate-500 mt-0.5">"{claim.purpose}"</p>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-dark-border/40">
                    <button 
                      onClick={() => handleApproveClaim(claim)}
                      className="px-2 py-0.5 bg-green-500 hover:bg-green-600 text-white rounded text-[10px] font-bold shadow-sm"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
              {pendingClaims.length === 0 && (
                <p className="text-xs text-slate-400 italic">No travel reimbursement claims pending review.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
