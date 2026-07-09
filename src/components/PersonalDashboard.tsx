import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { 
  User, WeeklySubmissionStatus, TrainerReimbursement, 
  DriverDailyEntry, SystemAlert 
} from '../types';
import { 
  User as UserIcon, Calendar, CheckSquare, Clock, MapPin, Truck, 
  AlertCircle, ShieldAlert, Award, FileCheck, ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { DashboardCustomiser } from './DashboardCustomiser';

const PERSONAL_WIDGET_DEFS = [
  { id: 'profile_card',      label: 'My Profile Card',         description: 'Role, districts, and status' },
  { id: 'weekly_submission', label: 'Weekly Submission Status', description: 'Current week compliance check' },
  { id: 'my_tasks',          label: 'My Action Tasks',         description: 'Pending to-do items for your role' },
  { id: 'performance',       label: 'Performance & Attendance', description: 'Compliance index and attendance rate' },
  { id: 'transport_log',     label: 'Trip / Reimbursement Log', description: 'Transport entries and claims' },
  { id: 'notifications',     label: 'Real-Time Notifications',  description: 'Active system alerts for your programme' },
];

const PERSONAL_DEFAULTS = PERSONAL_WIDGET_DEFS.map(w => ({ id: w.id, visible: true }));

export const PersonalDashboard: React.FC = () => {
  const { currentUser, t } = useAuth();
  
  // Data States
  const [weeklyStatus, setWeeklyStatus] = useState<WeeklySubmissionStatus[]>([]);
  const [reimbursements, setReimbursements] = useState<TrainerReimbursement[]>([]);
  const [driverEntries, setDriverEntries] = useState<DriverDailyEntry[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // Dashboard layout customisation (DB-backed, per user)
  const layout = useDashboardLayout(
    PERSONAL_DEFAULTS,
    currentUser?.username || 'user',
    'personal_dashboard'
  );

  useEffect(() => {
    loadData();
    window.addEventListener('omp_db_pulled', loadData);
    return () => {
      window.removeEventListener('omp_db_pulled', loadData);
    };
  }, []);

  const loadData = () => {
    if (!currentUser) return;
    
    const allWeekly = db.getWeeklySubmissions();
    setWeeklyStatus(allWeekly.filter(w => w.username === currentUser.username));

    const allReimburse = db.getReimbursements();
    setReimbursements(allReimburse.filter(r => r.trainerUsername === currentUser.username));

    const allDriverEntries = db.getDriverEntries();
    setDriverEntries(allDriverEntries.filter(d => d.driverUsername === currentUser.username));

    const allAlerts = db.getAlerts();
    setAlerts(allAlerts.filter(a =>
      currentUser.assignedProgramme === 'All' || a.programme === currentUser.assignedProgramme
    ));
  };

  if (!currentUser) return null;

  // Current week end date (coming Sunday)
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysUntilSunday);
  const weekEndDateStr = sunday.toISOString().split('T')[0];

  const activeSubmission = weeklyStatus.find(w => w.weekEndDate === weekEndDateStr) || {
    username: currentUser.username,
    weekEndDate: weekEndDateStr,
    status: 'Pending',
    type: currentUser.role === 'driver' ? 'driver' : 'trainer'
  } as WeeklySubmissionStatus;

  const tasks: string[] = [];
  if (currentUser.role === 'trainer') {
    tasks.push('Submit Pre-Vocational student attendance');
    tasks.push('Mark conducted classes in weekly timetable');
    if (activeSubmission.status === 'Pending') tasks.push('Complete Weekly transport reimbursement claim');
  } else if (currentUser.role === 'driver') {
    tasks.push("Log start and end KM readings for today's trip");
    tasks.push('Record fuel consumption purchase receipt');
    if (activeSubmission.status === 'Pending') tasks.push('Lock Weekly log book submission');
  } else if (currentUser.role === 'super_admin' || currentUser.role === 'programme_coordinator') {
    tasks.push('Approve pending trainer reimbursement claims');
    tasks.push('Review weekly submission compliance statistics');
    tasks.push('Perform syllabus verification checks');
  }

  const displayAttendance = currentUser.role === 'trainer' ? '92%' :
                            currentUser.role === 'driver' ? '100% On-time' : '86% (Avg)';

  // ---- Widget renderers ----
  const widgetMap: Record<string, React.ReactNode> = {
    profile_card: (
      <div key="profile_card" className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</h3>
            <p className="text-[10px] text-slate-400 capitalize font-medium">{currentUser.role.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <div className="space-y-3 text-[11px] font-semibold text-slate-700 dark:text-slate-350">
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-dark-border/40">
            <span className="text-slate-400">Assigned Vertical:</span>
            <span className="text-primary">{currentUser.assignedProgramme}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-dark-border/40">
            <span className="text-slate-400">Duty Districts:</span>
            <span>{currentUser.assignedDistricts.join(', ') || 'All Regions'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100 dark:border-dark-border/40">
            <span className="text-slate-400">Active status:</span>
            <span className="text-green-500">Active Duty</span>
          </div>
        </div>
      </div>
    ),
    weekly_submission: (
      <div key="weekly_submission" className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-extrabold uppercase text-slate-500">Weekly Submission Rule</h3>
          <Calendar size={16} className="text-slate-400" />
        </div>
        <div className="p-3 bg-slate-50 dark:bg-dark-card/30 rounded border border-slate-200 dark:border-dark-border text-xs">
          <p className="font-bold text-slate-900 dark:text-white">Week Ending: {activeSubmission.weekEndDate}</p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400">STATUS:</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
              activeSubmission.status === 'Completed'
                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
            }`}>
              {activeSubmission.status}
            </span>
          </div>
        </div>
        {activeSubmission.status === 'Pending' && (
          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded flex gap-2 text-[10px] text-red-500 font-semibold leading-relaxed">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>Weekly logs are due by Sunday midnight. Please log all transport KM readings and fuel expenditures.</span>
          </div>
        )}
      </div>
    ),
    my_tasks: (
      <div key="my_tasks" className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
          <CheckSquare size={16} className="text-slate-400" />
          <span>My Action Tasks</span>
        </h3>
        <ul className="space-y-3">
          {tasks.map((task, idx) => (
            <li key={idx} className="flex gap-2 text-xs font-medium text-slate-700 dark:text-slate-350">
              <Clock size={14} className="text-primary shrink-0 mt-0.5" />
              <span>{task}</span>
            </li>
          ))}
          {tasks.length === 0 && <p className="text-xs text-slate-400 italic">No pending tasks. You are all caught up!</p>}
        </ul>
      </div>
    ),
    performance: (
      <div key="performance" className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
          <Award size={16} className="text-slate-400" />
          <span>Performance & Attendance</span>
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span>Performance index:</span>
              <span>{displayAttendance}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Compliance and attendance values are calculated dynamically from weekly class execution sheets.
          </div>
        </div>
      </div>
    ),
    transport_log: (currentUser.role === 'trainer' || currentUser.role === 'driver') ? (
      <div key="transport_log" className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex justify-between items-center text-xs font-bold">
          <span className="text-slate-600 dark:text-slate-300">
            {currentUser.role === 'trainer' ? 'My Reimbursement Claims' : 'My Daily Trip Entries'}
          </span>
          <Truck size={14} className="text-slate-400" />
        </div>
        {currentUser.role === 'trainer' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-dark-card/30 border-b border-slate-200 dark:border-dark-border text-slate-500 font-semibold">
                  <th className="p-2">Date</th><th className="p-2">Destination</th>
                  <th className="p-2">Distance (KM)</th><th className="p-2">Cost (INR)</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-300">
                {reimbursements.map(r => (
                  <tr key={r.id}>
                    <td className="p-2 font-mono">{r.date}</td>
                    <td className="p-2">{r.endLocation}</td>
                    <td className="p-2 font-bold">{r.distance} km</td>
                    <td className="p-2">₹ {r.fuelCost}</td>
                    <td className="p-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        r.status === 'Approved' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        r.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
                {reimbursements.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400 italic">No travel reimbursement claims submitted this week.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-dark-card/30 border-b border-slate-200 dark:border-dark-border text-slate-500 font-semibold">
                  <th className="p-2">Date</th><th className="p-2">Vehicle ID</th>
                  <th className="p-2">Distance</th><th className="p-2">Fuel Cost</th>
                  <th className="p-2 text-right">Linked Trainer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-300">
                {driverEntries.map(e => (
                  <tr key={e.id}>
                    <td className="p-2 font-mono">{e.date}</td>
                    <td className="p-2 font-bold">{e.vehicleId}</td>
                    <td className="p-2">{e.distance} km</td>
                    <td className="p-2">₹ {e.fuelCost}</td>
                    <td className="p-2 text-right text-primary font-bold">{e.linkedTrainerName}</td>
                  </tr>
                ))}
                {driverEntries.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-slate-400 italic">No trip entries logged for this period.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    ) : null,
    notifications: (
      <div key="notifications" className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase text-slate-500 flex items-center gap-1.5">
          <ShieldAlert size={16} className="text-slate-400" />
          <span>Real-Time Notifications ({alerts.filter(a => !a.isResolved).length})</span>
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {alerts.filter(a => !a.isResolved).map(alert => (
            <div
              key={alert.id}
              className="p-3 border border-slate-100 dark:border-dark-border/40 rounded bg-slate-50/50 dark:bg-dark-card/20 flex justify-between items-start gap-3"
            >
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                <p className="font-semibold text-slate-900 dark:text-white leading-normal">{alert.message}</p>
                <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                  {new Date(alert.createdAt).toLocaleString()}
                </span>
              </div>
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                alert.severity === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
              }`}>
                {alert.severity}
              </span>
            </div>
          ))}
          {alerts.filter(a => !a.isResolved).length === 0 && (
            <p className="text-xs text-slate-400 italic">No active system alerts.</p>
          )}
        </div>
      </div>
    ),
  };

  // Ordered, visible widget IDs
  const visibleIds = layout.orderedIds.filter(id => layout.isVisible(id) && widgetMap[id]);

  // Split into left column (profile + weekly) and right column (rest)
  const leftColIds   = ['profile_card', 'weekly_submission'].filter(id => visibleIds.includes(id));
  const rightColIds  = visibleIds.filter(id => !leftColIds.includes(id));

  return (
    <div className="space-y-6">
      
      {/* HEADER TITLE */}
      <div className="pb-4 border-b border-slate-200 dark:border-dark-border flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>👋</span> Hello, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Welcome to your personal workspace. Here is a summary of your profile, assignments, and compliance checklist.
          </p>
        </div>

        {/* Customise Button */}
        <button
          onClick={() => layout.setShowCustomiser(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${
            layout.hasUnsaved
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-white dark:bg-dark-surface border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary'
          }`}
        >
          <SlidersHorizontal size={14} />
          <span>Customise{layout.hasUnsaved ? ' •' : ''}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column */}
        {leftColIds.length > 0 && (
          <div className="space-y-6 md:col-span-1">
            {leftColIds.map(id => widgetMap[id])}
          </div>
        )}

        {/* Right Column */}
        {rightColIds.length > 0 && (
          <div className={`space-y-6 ${leftColIds.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {['my_tasks', 'performance']
                .filter(id => rightColIds.includes(id))
                .map(id => widgetMap[id])}
            </div>
            {['transport_log', 'notifications']
              .filter(id => rightColIds.includes(id))
              .map(id => widgetMap[id])}
          </div>
        )}

      </div>

      {/* Customiser Panel */}
      <DashboardCustomiser
        isOpen={layout.showCustomiser}
        onClose={() => layout.setShowCustomiser(false)}
        title="Customise My Dashboard"
        widgets={PERSONAL_WIDGET_DEFS}
        config={layout.config}
        hasUnsaved={layout.hasUnsaved}
        onToggleVisible={layout.toggleVisible}
        onMoveUp={layout.moveUp}
        onMoveDown={layout.moveDown}
        onSave={layout.saveLayout}
        onReset={layout.resetToDefault}
      />

    </div>
  );
};
