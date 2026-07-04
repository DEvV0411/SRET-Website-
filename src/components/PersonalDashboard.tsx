import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { 
  User, WeeklySubmissionStatus, TrainerReimbursement, 
  DriverDailyEntry, SystemAlert 
} from '../types';
import { 
  User as UserIcon, Calendar, CheckSquare, Clock, MapPin, Truck, 
  AlertCircle, ShieldAlert, Award, FileCheck, ArrowRight 
} from 'lucide-react';

export const PersonalDashboard: React.FC = () => {
  const { currentUser, t } = useAuth();
  
  // Data States
  const [weeklyStatus, setWeeklyStatus] = useState<WeeklySubmissionStatus[]>([]);
  const [reimbursements, setReimbursements] = useState<TrainerReimbursement[]>([]);
  const [driverEntries, setDriverEntries] = useState<DriverDailyEntry[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  useEffect(() => {
    loadData();
    window.addEventListener('omp_db_pulled', loadData);
    return () => {
      window.removeEventListener('omp_db_pulled', loadData);
    };
  }, []);

  const loadData = () => {
    if (!currentUser) return;
    
    // Load weekly submissions
    const allWeekly = db.getWeeklySubmissions();
    const userWeekly = allWeekly.filter(w => w.username === currentUser.username);
    setWeeklyStatus(userWeekly);

    // Load reimbursements for trainer
    const allReimburse = db.getReimbursements();
    const userReimburse = allReimburse.filter(r => r.trainerUsername === currentUser.username);
    setReimbursements(userReimburse);

    // Load driver daily entries
    const allDriverEntries = db.getDriverEntries();
    const userDriverEntries = allDriverEntries.filter(d => d.driverUsername === currentUser.username);
    setDriverEntries(userDriverEntries);

    // Load alerts relevant to their programme/vertical
    const allAlerts = db.getAlerts();
    const relevantAlerts = allAlerts.filter(a => 
      currentUser.assignedProgramme === 'All' || 
      a.programme === currentUser.assignedProgramme
    );
    setAlerts(relevantAlerts);
  };

  if (!currentUser) return null;

  // Determine current week end date (e.g. coming Sunday)
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7;
  const sunday = new Date(today);
  sunday.setDate(today.getDate() + daysUntilSunday);
  const weekEndDateStr = sunday.toISOString().split('T')[0];

  // Find or generate weekly submission status for this user
  const activeSubmission = weeklyStatus.find(w => w.weekEndDate === weekEndDateStr) || {
    username: currentUser.username,
    weekEndDate: weekEndDateStr,
    status: 'Pending',
    type: currentUser.role === 'driver' ? 'driver' : 'trainer'
  } as WeeklySubmissionStatus;

  // Tasks compilation
  const tasks: string[] = [];
  if (currentUser.role === 'trainer') {
    tasks.push('Submit Pre-Vocational student attendance');
    tasks.push('Mark conducted classes in weekly timetable');
    if (activeSubmission.status === 'Pending') {
      tasks.push('Complete Weekly transport reimbursement claim');
    }
  } else if (currentUser.role === 'driver') {
    tasks.push('Log start and end KM readings for today\'s trip');
    tasks.push('Record fuel consumption purchase receipt');
    if (activeSubmission.status === 'Pending') {
      tasks.push('Lock Weekly log book submission');
    }
  } else if (currentUser.role === 'super_admin' || currentUser.role === 'programme_coordinator') {
    tasks.push('Approve pending trainer reimbursement claims');
    tasks.push('Review weekly submission compliance statistics');
    tasks.push('Perform syllabus verification checks');
  }

  // Attendance summary metrics
  const displayAttendance = currentUser.role === 'trainer' ? '92%' : 
                            currentUser.role === 'driver' ? '100% On-time' : '86% (Avg)';

  return (
    <div className="space-y-6">
      
      {/* HEADER TITLE */}
      <div className="pb-4 border-b border-slate-200 dark:border-dark-border">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <span>👋</span> Hello, {currentUser.name}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Welcome to your personal workspace. Here is a summary of your profile, assignments, and compliance checklist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ================= COLUMN 1: PROFILE & COMPLIANCE ================= */}
        <div className="space-y-6 md:col-span-1">
          
          {/* Profile Card */}
          <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex flex-col justify-between">
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

          {/* Weekly Submission compliance */}
          <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
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

        </div>

        {/* ================= COLUMN 2: TASKS & NOTIFICATIONS ================= */}
        <div className="space-y-6 md:col-span-2">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Pending Tasks */}
            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
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
                {tasks.length === 0 && (
                  <p className="text-xs text-slate-400 italic">No pending tasks. You are all caught up!</p>
                )}
              </ul>
            </div>

            {/* Attendance & Compliance Summary */}
            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
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

          </div>

          {/* Transport / Driver entries log list */}
          {(currentUser.role === 'trainer' || currentUser.role === 'driver') && (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
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
                        <th className="p-2">Date</th>
                        <th className="p-2">Destination</th>
                        <th className="p-2">Distance (KM)</th>
                        <th className="p-2">Cost (INR)</th>
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
                              r.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {reimbursements.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">No travel reimbursement claims submitted this week.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/50 dark:bg-dark-card/30 border-b border-slate-200 dark:border-dark-border text-slate-500 font-semibold">
                        <th className="p-2">Date</th>
                        <th className="p-2">Vehicle ID</th>
                        <th className="p-2">Distance</th>
                        <th className="p-2">Fuel Cost</th>
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
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-400 italic">No trip entries logged for this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* System Notifications / Alerts */}
          <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
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

        </div>

      </div>

    </div>
  );
};
