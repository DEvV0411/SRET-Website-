import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { 
  Student, School, Session, SystemAlert, ProgrammeName 
} from '../types';
import { 
  TrendingUp, Award, Clock, Users, School as SchoolIcon, 
  Calendar, CheckCircle2, AlertTriangle, ChevronRight, Play 
} from 'lucide-react';

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
  setSelectedSessionId?: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ setActiveTab, setSelectedSessionId }) => {
  const { currentUser, t } = useAuth();
  
  // States
  const [selectedProg, setSelectedProg] = useState<ProgrammeName | 'All'>('All');
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalSchools: 0,
    sessionsConducted: 0,
    sessionsMissed: 0,
    avgAttendance: 0,
    baselineAvg: 0,
    endlineAvg: 0
  });
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [pendingTasks, setPendingTasks] = useState<SystemAlert[]>([]);
  const [programmePerformance, setProgrammePerformance] = useState<{name: string, value: number}[]>([]);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setRefreshCount(prev => prev + 1);
    };
    window.addEventListener('omp_session_conducted_update', handleUpdate);
    window.addEventListener('omp_alerts_change', handleUpdate);
    return () => {
      window.removeEventListener('omp_session_conducted_update', handleUpdate);
      window.removeEventListener('omp_alerts_change', handleUpdate);
    };
  }, []);
  
  // Interactive checklist widget state
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Confirm Vocational attendance for S101 school', checked: false },
    { id: 2, text: 'Audit fuel refilling transaction ledger GJ-01-XX-9900', checked: false },
    { id: 3, text: 'Schedule counselling follow-up for Meena Parmar', checked: true },
    { id: 4, text: 'Verify breadboard inventory inward supply counts', checked: false },
  ]);

  const handleToggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, checked: !t.checked } : t));
  };

  // Automatically scope non-admin users
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'programme_head') {
        setSelectedProg(currentUser.assignedProgramme);
      } else if (currentUser.role === 'programme_coordinator') {
        setSelectedProg(currentUser.assignedProgramme);
      } else if (currentUser.role === 'trainer') {
        setSelectedProg(currentUser.assignedProgramme);
      }
    }
  }, [currentUser]);

  // Load and Filter Stats
  useEffect(() => {
    if (!currentUser) return;

    // 1. Fetch tables
    let rawStudents = db.getStudents();
    let rawSchools = db.getSchools();
    let rawSessions = db.getSessions();
    let rawAlerts = db.getAlerts().filter(a => !a.isResolved);

    // Apply role-based filtering (Trainers see assigned schools only)
    if (currentUser.role === 'trainer') {
      const assigned = currentUser.assignedSchools;
      rawStudents = rawStudents.filter(s => assigned.includes(s.schoolCode));
      rawSchools = rawSchools.filter(s => assigned.includes(s.code));
      rawSessions = rawSessions.filter(s => assigned.includes(s.schoolCode));
    } else if (currentUser.role === 'programme_coordinator') {
      const assigned = currentUser.assignedSchools;
      rawStudents = rawStudents.filter(s => assigned.includes(s.schoolCode));
      rawSchools = rawSchools.filter(s => assigned.includes(s.code));
      rawSessions = rawSessions.filter(s => assigned.includes(s.schoolCode));
    }

    // Apply program filtering
    const filterProg = selectedProg === 'All' ? null : selectedProg;
    
    if (filterProg) {
      rawStudents = rawStudents.filter(s => {
        // Students are linked to schools, filter by program running at the school or custom linkage
        const sch = rawSchools.find(sc => sc.code === s.schoolCode);
        return sch?.runningProgrammes.includes(filterProg);
      });
      rawSchools = rawSchools.filter(s => s.runningProgrammes.includes(filterProg));
      rawSessions = rawSessions.filter(s => s.programme === filterProg);
      rawAlerts = rawAlerts.filter(a => a.programme === filterProg);
    }

    // Calculations
    const totalStudents = rawStudents.length;
    const activeStudents = rawStudents.filter(s => s.alumniStatus === 'Active').length;
    const totalSchools = rawSchools.length;
    
    const sessionsConducted = rawSessions.filter(s => s.status === 'Conducted' || s.status === 'Verified' || s.status === 'Completed').length;
    const sessionsMissed = rawSessions.filter(s => s.status === 'Missed').length;
    
    // Attendance Avg calculation
    const totalAttPercent = rawStudents.reduce((acc, s) => acc + s.attendancePercentage, 0);
    const avgAttendance = totalStudents > 0 ? Math.round(totalAttPercent / totalStudents) : 0;

    // Academic baseline vs endline averages
    const scoredBaseline = rawStudents.filter(s => s.baselineScore !== undefined);
    const baselineAvg = scoredBaseline.length > 0 
      ? Math.round(scoredBaseline.reduce((acc, s) => acc + (s.baselineScore || 0), 0) / scoredBaseline.length) 
      : 0;

    const scoredEndline = rawStudents.filter(s => s.endlineScore !== undefined);
    const endlineAvg = scoredEndline.length > 0 
      ? Math.round(scoredEndline.reduce((acc, s) => acc + (s.endlineScore || 0), 0) / scoredEndline.length) 
      : 0;

    setStats({
      totalStudents,
      activeStudents,
      totalSchools,
      sessionsConducted,
      sessionsMissed,
      avgAttendance,
      baselineAvg,
      endlineAvg
    });

    // 2. Upcoming Sessions (limit to 3)
    const upcoming = rawSessions
      .filter(s => s.status === 'Scheduled')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
    setUpcomingSessions(upcoming);

    // 3. Pending alerts / tasks (limit to 4)
    setPendingTasks(rawAlerts.slice(0, 4));

    // 4. Comparative Programme metrics
    const progs: ProgrammeName[] = ['Vocational', 'Pre-Vocational', 'Udyam', 'Magic Touch'];
    const perf = progs.map(p => {
      const conducted = db.getSessions().filter(s => s.programme === p && (s.status === 'Conducted' || s.status === 'Verified' || s.status === 'Completed')).length;
      return { name: p, value: conducted };
    });
    setProgrammePerformance(perf);

  }, [selectedProg, currentUser, refreshCount]);

  const handleStartSession = (sessionId: string) => {
    if (setSelectedSessionId) {
      setSelectedSessionId(sessionId);
      setActiveTab('sessions');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dashboard Top Title with Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">
            {t('dashboard')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {currentUser?.assignedProgramme === 'All' 
              ? 'Multi-programme central analytics engine' 
              : `Scoped to ${currentUser?.assignedProgramme} programme data`}
          </p>
        </div>

        {/* Super Admins see dropdown filters */}
        {currentUser?.role === 'super_admin' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Programme:</span>
            <select
              value={selectedProg}
              onChange={(e) => setSelectedProg(e.target.value as any)}
              className="px-3 py-1.5 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md text-xs font-semibold focus:border-primary outline-none"
            >
              <option value="All">All Programmes</option>
              <option value="Vocational">Vocational</option>
              <option value="Pre-Vocational">Pre-Vocational</option>
              <option value="Udyam">Udyam</option>
              <option value="Magic Touch">Magic Touch</option>
            </select>
          </div>
        )}
      </div>

      {/* KPI Stats Cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Students */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('total_students')}</span>
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
              {stats.totalStudents}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
              <span className="text-green-500 font-bold">{stats.activeStudents} active</span>
              <span>• enrolled</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Schools */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('total_schools')}</span>
            <SchoolIcon size={18} className="text-secondary" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
              {stats.totalSchools}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Across {selectedProg === 'All' ? '4' : '2'} districts
            </div>
          </div>
        </div>

        {/* KPI 3: Sessions */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('sessions_conducted')}</span>
            <CheckCircle2 size={18} className="text-accent" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
              {stats.sessionsConducted}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
              {stats.sessionsMissed > 0 ? (
                <span className="text-red-500 font-bold">{stats.sessionsMissed} missed</span>
              ) : (
                <span className="text-green-500 font-bold">0 missed</span>
              )}
              <span>• scheduled target met</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Attendance */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-md shadow-sm relative overflow-hidden flex flex-col justify-between h-28">
          <div className="flex justify-between items-start text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('attendance_rate')}</span>
            <TrendingUp size={18} className="text-purple-500" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mt-1">
              {stats.avgAttendance}%
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className={`h-full rounded-full ${stats.avgAttendance > 80 ? 'bg-secondary' : 'bg-accent'}`} 
                style={{ width: `${stats.avgAttendance}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Row: Custom SVG Charts (Airtable / Notion style dashboard visualization) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graph Block 1: Monthly Trends (Custom HTML/SVG drawing for cross-browser, local-PWA safety) */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Program Performance Trends</h2>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> Live Sync data</span>
          </div>
          
          {/* Custom SVG line chart visualization with labels */}
          <div className="relative h-64 flex items-end justify-between pt-6 border-b border-l border-slate-200 dark:border-dark-border pb-1 pl-2">
            <div className="absolute top-0 left-0 w-full flex flex-col justify-between h-[90%] text-[9px] text-slate-400 pointer-events-none pr-2">
              <div className="border-t border-slate-100 dark:border-slate-800/40 w-full pt-1">20 sessions</div>
              <div className="border-t border-slate-100 dark:border-slate-800/40 w-full pt-1">10 sessions</div>
              <div className="border-t border-slate-100 dark:border-slate-800/40 w-full pt-1">0 sessions</div>
            </div>

            {/* Render bar charts representing sessions conducted per programme */}
            {programmePerformance.map((item, idx) => {
              const heightPercent = Math.min((item.value / 25) * 100, 100);
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                  <div className="text-[10px] font-bold text-slate-900 dark:text-white mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {item.value}
                  </div>
                  <div 
                    className="w-12 bg-gradient-to-t from-primary/70 to-primary rounded-t group-hover:from-primary group-hover:to-primary-light transition-all shadow shadow-primary/20"
                    style={{ height: `${Math.max(heightPercent, 10)}%` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-500 mt-2 truncate w-16 text-center">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph Block 2: Baseline vs Endline Score Improvement */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Academic Progress</h2>
            <Award size={16} className="text-secondary" />
          </div>

          <div className="space-y-6 my-auto py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Baseline Assessment Avg Score</span>
                <span className="text-slate-900 dark:text-white font-bold">{stats.baselineAvg}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-accent h-full rounded-full" style={{ width: `${stats.baselineAvg}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Endline Assessment Avg Score</span>
                <span className="text-slate-900 dark:text-white font-bold">{stats.endlineAvg}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: `${stats.endlineAvg}%` }} />
              </div>
            </div>

            {/* Improvement highlight */}
            {stats.endlineAvg > 0 && (
              <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-md text-xs text-secondary font-semibold flex items-center justify-between mt-2">
                <span>Core Skill Improvement Margin</span>
                <span className="text-sm font-extrabold">+{stats.endlineAvg - stats.baselineAvg}% Growth</span>
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-500 leading-tight">
            *Based on diagnostic psychometric examinations across Vocational, Pre-Vocational and Udyam.
          </p>
        </div>
      </div>

      {/* Row 3: Actionable Panels (Trainer session tools & administrative alerts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Mobile-focused trainer session list & quick click confirm */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Upcoming Session Targets</h2>
            <button 
              onClick={() => setActiveTab('sessions')}
              className="text-xs text-primary font-bold flex items-center hover:underline"
            >
              See all <ChevronRight size={14} />
            </button>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No upcoming scheduled sessions found.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(session => {
                const school = db.getSchoolByCode(session.schoolCode);
                return (
                  <div key={session.id} className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-md flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold px-1.5 py-0.5 rounded capitalize">
                          {session.programme}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{session.id}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white mt-1.5 truncate">
                        {school ? school.name : 'Unknown School'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {session.subject} • {session.date} ({session.time})
                      </p>
                    </div>

                    {/* Trainer fast Tap action button */}
                    <button
                      onClick={() => handleStartSession(session.id)}
                      className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded text-[10px] font-bold shadow flex items-center gap-1"
                    >
                      <Play size={10} fill="currentColor" />
                      <span>Start</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Administrative active alerts requiring immediate action */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">System Warnings ({pendingTasks.length})</h2>
            <AlertTriangle size={16} className="text-accent animate-bounce" />
          </div>

          {pendingTasks.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No outstanding alerts requiring response.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`p-3 border rounded-md text-xs leading-relaxed flex items-start gap-2.5 ${
                    task.severity === 'high' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : task.severity === 'medium'
                      ? 'bg-accent/10 border-accent/20 text-accent'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}
                >
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold capitalize text-[10px]">
                      {task.type.replace(/_/g, ' ')}
                    </p>
                    <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-medium">
                      {task.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Client Presentation Soothing Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Field Tasks Checklist */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Interactive Tasks Checklist</h2>
            <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded">Notion-Style</span>
          </div>
          <div className="space-y-3">
            {tasks.map(task => (
              <label 
                key={task.id}
                className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-dark-card hover:bg-slate-100/50 dark:hover:bg-slate-800/40 border border-slate-200 dark:border-dark-border rounded cursor-pointer transition-all"
              >
                <input
                  type="checkbox"
                  checked={task.checked}
                  onChange={() => handleToggleTask(task.id)}
                  className="rounded border-slate-300 dark:border-dark-border text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className={`text-xs font-semibold transition-all ${
                  task.checked 
                    ? 'line-through text-slate-400 dark:text-slate-550 font-normal italic' 
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Regional Performance Gauge */}
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Regional Cluster Performance</h2>
            <span className="text-[10px] bg-secondary/10 border border-secondary/20 text-secondary font-bold px-2 py-0.5 rounded">SaaS Gauge</span>
          </div>
          <div className="border border-slate-250 dark:border-dark-border rounded overflow-hidden">
            <table className="w-full text-left text-[11px] font-semibold border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border text-slate-500">
                  <th className="p-2.5">District Cluster</th>
                  <th className="p-2.5">Schools</th>
                  <th className="p-2.5">Avg Attendance</th>
                  <th className="p-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-750 dark:text-slate-300">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">Ahmedabad</td>
                  <td className="p-2.5">1 School (S101)</td>
                  <td className="p-2.5">88%</td>
                  <td className="p-2.5 text-right text-green-500">● Stable</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">Surendranagar</td>
                  <td className="p-2.5 font-bold text-red-500">1 School (S102)</td>
                  <td className="p-2.5 text-red-500 font-bold">68%</td>
                  <td className="p-2.5 text-right text-red-500 font-bold">● Critical Alert</td>
                </tr>
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">Aravalli</td>
                  <td className="p-2.5">1 School (S103)</td>
                  <td className="p-2.5">74%</td>
                  <td className="p-2.5 text-right text-amber-500">● Attention</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
