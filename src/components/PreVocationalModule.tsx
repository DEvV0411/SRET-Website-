import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { Session, TimetableEntry, ActivityLog, School, SystemAlert } from '../types';
import { 
  Database, Calendar, Users, School as SchoolIcon, Play, 
  CheckCircle, ShieldCheck, ClipboardCheck, ArrowUpRight, 
  Search, Upload, Plus, FileSpreadsheet, AlertCircle, RefreshCw, 
  Trash, Eye, Bell, Lock 
} from 'lucide-react';

export const PreVocationalModule: React.FC = () => {
  const { currentUser, hasPermission, t } = useAuth();
  
  // Navigation sub-tabs
  const [subTab, setSubTab] = useState<'dashboard' | 'timetable' | 'sessions' | 'audit'>('dashboard');
  
  // Roster and schedules lists
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  
  // Timetable filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [selectedDay, setSelectedDay] = useState('All');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [selectedTaluka, setSelectedTaluka] = useState('All');

  // Timetable Manual Adder form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<TimetableEntry>>({
    group: 'Ecco 1',
    teacherName: '',
    dayOfWeek: 'Monday',
    schoolName: '',
    district: 'Valsad',
    taluka: 'Dharampur'
  });

  // Timetable Upload simulation states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Class Conducted Modal states for trainers
  const [showConductedModal, setShowConductedModal] = useState(false);
  const [activeTrainerSession, setActiveTrainerSession] = useState<Session | null>(null);
  const [presentStudents, setPresentStudents] = useState<number>(25);
  const [trainerRemarks, setTrainerRemarks] = useState('');
  const [issuesFaced, setIssuesFaced] = useState('');
  const [photoBlob, setPhotoBlob] = useState<string | null>(null);

  // Real-time update listeners
  useEffect(() => {
    loadData();

    // Listen to real-time session completion updates
    const handleRealTimeUpdate = () => {
      console.log('[Real-time Broker] Broadcast received, recalculating metrics...');
      loadData();
    };

    window.addEventListener('omp_session_conducted_update', handleRealTimeUpdate);
    window.addEventListener('omp_alerts_change', handleRealTimeUpdate);
    return () => {
      window.removeEventListener('omp_session_conducted_update', handleRealTimeUpdate);
      window.removeEventListener('omp_alerts_change', handleRealTimeUpdate);
    };
  }, []);

  const loadData = () => {
    setTimetable(db.getTimetable());
    
    // Auto-create or load Pre-Vocational specific sessions
    let rawSessions = db.getSessions().filter(s => s.programme === 'Pre-Vocational');
    
    // If no Pre-Vocational sessions exist, let's auto-generate a couple of demo sessions from the pre-seeded timetable!
    if (rawSessions.length === 0) {
      const schedule = db.getTimetable();
      const generated: Session[] = schedule.slice(0, 5).map((entry, idx) => ({
        id: `PV_SES_${100 + idx}`,
        programme: 'Pre-Vocational',
        schoolCode: 'S102', // Limdi / Pre-Voc
        date: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
        time: '10:00 AM',
        trainerUsername: entry.teacherName.toLowerCase() === 'sunita' ? 'trainer.rahul' : 'trainer.john',
        subject: 'Intro to Safety and Hand Tools',
        lessonPlanId: 'LP303',
        status: idx === 0 ? 'Scheduled' : idx === 1 ? 'Conducted' : 'Completed',
        attendancePresent: [],
        attendanceAbsent: [],
        groupName: entry.group
      }));
      
      // Save them in DB to initialize
      generated.forEach(s => db.saveSession(s));
      rawSessions = generated;
    }
    setSessions(rawSessions);
    setAuditLogs(db.getAuditLogs());
  };

  // 4-Stage Session workflow transitions (Trainer: Conducted, Admin/Coord: Verified, Completed)
  const handleWorkflowTransition = (session: Session, nextStatus: 'Verified' | 'Completed') => {
    if (!currentUser) return;
    
    const previous = JSON.stringify(session);
    const updated: Session = {
      ...session,
      status: nextStatus,
      verifiedAt: nextStatus === 'Verified' ? new Date().toISOString() : session.verifiedAt,
      verifiedBy: nextStatus === 'Verified' ? currentUser.name : session.verifiedBy,
      completedAt: nextStatus === 'Completed' ? new Date().toISOString() : session.completedAt,
      completedBy: nextStatus === 'Completed' ? currentUser.name : session.completedBy
    };
    
    db.saveSession(updated);
    loadData();
    
    // Log action to audits
    db.writeAuditLog(
      currentUser.name,
      `Session Workflow Status: ${nextStatus}`,
      `Transitioned Session ID ${session.id} status to ${nextStatus}`,
      previous,
      JSON.stringify(updated)
    );

    // Alert Super Admin
    const notification: SystemAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'class_conducted',
      severity: 'low',
      message: `Workflow Action: Session ${session.id} marked as ${nextStatus} by ${currentUser.name}.`,
      programme: 'Pre-Vocational',
      schoolCode: session.schoolCode,
      createdAt: new Date().toISOString(),
      isResolved: false
    };
    db.addAlert(notification);
    
    window.dispatchEvent(new Event('omp_session_conducted_update'));
    window.dispatchEvent(new CustomEvent('omp_toast_message', { 
      detail: `Session marked as ${nextStatus} successfully!` 
    }));
  };

  // Submit Class Conducted Form (Trainer View)
  const handleTrainerConductedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrainerSession || !currentUser) return;

    const previous = JSON.stringify(activeTrainerSession);
    const updated: Session = {
      ...activeTrainerSession,
      status: 'Conducted',
      conductedAt: new Date().toISOString(),
      conductedBy: currentUser.name,
      studentsPresentCount: presentStudents,
      remarks: trainerRemarks,
      issuesFaced: issuesFaced,
      photoUrl: photoBlob || undefined
    };

    db.saveSession(updated);
    setShowConductedModal(false);
    loadData();

    // Log audit trail
    db.writeAuditLog(
      currentUser.name,
      'Session Conducted Submission',
      `Submitted class execution details for school: ${activeTrainerSession.schoolCode}`,
      previous,
      JSON.stringify(updated)
    );

    // Instant Notification Alert to Super Admin
    const notification: SystemAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'class_conducted',
      severity: 'high',
      message: `Alert: Class conducted by ${currentUser.name} at School ${activeTrainerSession.schoolCode}. remarks: "${trainerRemarks || 'None'}"`,
      programme: 'Pre-Vocational',
      schoolCode: activeTrainerSession.schoolCode,
      createdAt: new Date().toISOString(),
      isResolved: false
    };
    db.addAlert(notification);

    // Dispatch global real-time event
    window.dispatchEvent(new Event('omp_session_conducted_update'));
    
    // Reset Form
    setTrainerRemarks('');
    setIssuesFaced('');
    setPhotoBlob(null);

    window.dispatchEvent(new CustomEvent('omp_toast_message', { 
      detail: 'Class Conducted reported! Pending coordinator verification.' 
    }));
  };

  // Timetable manual add submission
  const handleManualTimetableAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.teacherName || !newEntry.schoolName) return;

    const entryToSave: TimetableEntry = {
      id: 'tt_' + Math.floor(60 + Math.random() * 999),
      group: newEntry.group || 'Ecco 1',
      teacherName: newEntry.teacherName,
      dayOfWeek: newEntry.dayOfWeek as any,
      schoolName: newEntry.schoolName,
      district: newEntry.district,
      taluka: newEntry.taluka
    };

    db.saveTimetableEntry(entryToSave);
    loadData();
    setShowAddForm(false);
    
    // Reset
    setNewEntry({
      group: 'Ecco 1',
      teacherName: '',
      dayOfWeek: 'Monday',
      schoolName: '',
      district: 'Valsad',
      taluka: 'Dharampur'
    });
  };

  // Timetable excel file import simulation
  const handleExcelImportSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Invalid file format. Please upload spreadsheet Excel (.xlsx) or CSV files.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            
            // Insert 4 new timetable schedule records parsed from spreadsheet simulation
            const parsedEntries: TimetableEntry[] = [
              { id: 'tt_csv1', group: 'Ecco 1', teacherName: 'Krunal', dayOfWeek: 'Wednesday', schoolName: 'Dhamni Mukhya Shala', district: 'Valsad', taluka: 'Dharampur' },
              { id: 'tt_csv2', group: 'Ecco 2', teacherName: 'Mahendra', dayOfWeek: 'Wednesday', schoolName: 'Naniba ashram shala', district: 'Valsad', taluka: 'Dharampur' },
              { id: 'tt_csv3', group: 'Ecco 3', teacherName: 'Sunita', dayOfWeek: 'Wednesday', schoolName: 'Karanjveri Primary school', district: 'Valsad', taluka: 'Dharampur' }
            ];

            // Append to current timetable database
            const combined = [...db.getTimetable(), ...parsedEntries];
            db.importTimetable(combined);
            loadData();

            window.dispatchEvent(new CustomEvent('omp_toast_message', { 
              detail: `Spreadsheet '${file.name}' imported! 3 new allotments parsed.` 
            }));
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  // Seed photo simulation
  const triggerCameraPhotoMock = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=400'
    ];
    const picked = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setPhotoBlob(picked);
  };

  // Helper filters lists
  const teacherOptions = Array.from(new Set(timetable.map(t => t.teacherName)));
  const schoolOptions = Array.from(new Set(timetable.map(t => t.schoolName)));
  const groupOptions = Array.from(new Set(timetable.map(t => t.group)));
  const dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const districtOptions = Array.from(new Set(timetable.map(t => t.district || 'Valsad')));
  const talukaOptions = Array.from(new Set(timetable.map(t => t.taluka || 'Dharampur')));

  // Filter schedule grid
  const filteredSchedule = timetable.filter(entry => {
    const matchSearch = searchQuery.trim() === '' || 
      entry.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.schoolName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchTeacher = selectedTeacher === 'All' || entry.teacherName === selectedTeacher;
    const matchSchool = selectedSchool === 'All' || entry.schoolName === selectedSchool;
    const matchGroup = selectedGroup === 'All' || entry.group === selectedGroup;
    const matchDay = selectedDay === 'All' || entry.dayOfWeek === selectedDay;
    const matchDist = selectedDistrict === 'All' || (entry.district || 'Valsad') === selectedDistrict;
    const matchTaluka = selectedTaluka === 'All' || (entry.taluka || 'Dharampur') === selectedTaluka;

    return matchSearch && matchTeacher && matchSchool && matchGroup && matchDay && matchDist && matchTaluka;
  });

  // Trainer Schedule (Sunita trainer mockup)
  const isTrainerRole = currentUser?.role === 'trainer';
  // Standardize day lookup matching timetable
  const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = new Date().getDay();
  // For presentation convenience, if weekend todayIndex defaults to Monday (1)
  const currentWeekday = todayIndex === 0 || todayIndex === 6 ? 'Monday' : weekdayNames[todayIndex];

  // Resolve today's school for trainer (Sunita maps to 'trainer.rahul' inside auth for demo)
  const trainerName = currentUser?.name.includes('Rahul') ? 'Sunita' : currentUser?.name.includes('Admin') ? 'Sunita' : 'Krunal';
  const todaysTimetable = timetable.find(t => t.teacherName === trainerName && t.dayOfWeek === currentWeekday);

  // Retrieve today's session status matching school
  const activeSessionForToday = todaysTimetable 
    ? sessions.find(s => s.schoolCode === 'S102' && s.date === new Date().toISOString().split('T')[0]) 
    : null;

  // Dashboard Stats calculations
  const totalStudents = db.getStudents().filter(s => {
    const sch = db.getSchoolByCode(s.schoolCode);
    return sch?.runningProgrammes.includes('Pre-Vocational');
  }).length;
  
  const totalSchools = db.getSchools().filter(s => s.runningProgrammes.includes('Pre-Vocational')).length;
  const totalTeachers = teacherOptions.length;
  
  const sessionsConductedToday = sessions.filter(s => 
    s.date === new Date().toISOString().split('T')[0] && 
    (s.status === 'Conducted' || s.status === 'Verified' || s.status === 'Completed')
  ).length;
  
  const sessionsPendingToday = sessions.filter(s => 
    s.date === new Date().toISOString().split('T')[0] && s.status === 'Scheduled'
  ).length;

  return (
    <div className="space-y-6">
      
      {/* Sub-tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-dark-border">
        <button
          onClick={() => setSubTab('dashboard')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            subTab === 'dashboard' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Overview Dashboard
        </button>
        <button
          onClick={() => setSubTab('timetable')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            subTab === 'timetable' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Ecco Allotment Timetable
        </button>
        <button
          onClick={() => setSubTab('sessions')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            subTab === 'sessions' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Workflow Verification
        </button>
        {currentUser?.role === 'super_admin' && (
          <button
            onClick={() => setSubTab('audit')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
              subTab === 'audit' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Audit Activity Logs
          </button>
        )}
      </div>

      {/* ==================== TAB 1: OVERVIEW DASHBOARD ==================== */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* KPI Dashboard Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Students</span>
              <div className="flex items-center gap-2 mt-2">
                <Users size={16} className="text-primary shrink-0" />
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">{totalStudents || 85}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Schools</span>
              <div className="flex items-center gap-2 mt-2">
                <SchoolIcon size={16} className="text-secondary shrink-0" />
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">{totalSchools || 12}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pre-Voc Teachers</span>
              <div className="flex items-center gap-2 mt-2">
                <Users size={16} className="text-accent shrink-0" />
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-heading">{totalTeachers || 12}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Conducted Today</span>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle size={16} className="text-green-500 shrink-0" />
                <span className="text-xl font-extrabold text-green-600 dark:text-green-500 font-heading">{sessionsConductedToday}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Today</span>
              <div className="flex items-center gap-2 mt-2">
                <RefreshCw size={16} className="text-amber-500 shrink-0" />
                <span className="text-xl font-extrabold text-amber-550 dark:text-amber-500 font-heading">{sessionsPendingToday}</span>
              </div>
            </div>

          </div>

          {/* Core chart layouts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Weekly Progress HTML SVG chart */}
            <div className="lg:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Progress Allotment</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Ecco Clusters</span>
              </div>

              {/* Progress columns list representing Ecco 1, Ecco 2, Ecco 3 */}
              <div className="relative h-44 flex items-end justify-around border-b border-slate-200 dark:border-dark-border pb-1">
                <div className="flex flex-col items-center flex-1 group">
                  <div className="text-[10px] text-slate-800 dark:text-white font-bold mb-1">18/22</div>
                  <div className="w-14 bg-gradient-to-t from-primary/70 to-primary rounded-t h-32" />
                  <span className="text-[10px] font-semibold mt-2 text-slate-500">Ecco 1 Group</span>
                </div>
                <div className="flex flex-col items-center flex-1 group">
                  <div className="text-[10px] text-slate-800 dark:text-white font-bold mb-1">15/20</div>
                  <div className="w-14 bg-gradient-to-t from-secondary/70 to-secondary rounded-t h-24" />
                  <span className="text-[10px] font-semibold mt-2 text-slate-500">Ecco 2 Group</span>
                </div>
                <div className="flex flex-col items-center flex-1 group">
                  <div className="text-[10px] text-slate-800 dark:text-white font-bold mb-1">19/20</div>
                  <div className="w-14 bg-gradient-to-t from-accent/70 to-accent rounded-t h-36" />
                  <span className="text-[10px] font-semibold mt-2 text-slate-500">Ecco 3 Group</span>
                </div>
              </div>
            </div>

            {/* School Coverage Trackers list */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">School Coverage Target</h3>
              
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-white">Kanya Ashram Shala Tanki</span>
                    <span className="text-slate-400">80%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-white">Khanda Primary school</span>
                    <span className="text-slate-400">65%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800 dark:text-white">SRVV Tamchhadi</span>
                    <span className="text-slate-400">95%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Alert alerts widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Live Notifications alerts */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-dark-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Admin Notifications</h3>
                <Bell size={16} className="text-primary" />
              </div>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {db.getAlerts().filter(a => a.programme === 'Pre-Vocational').map(alert => (
                  <div key={alert.id} className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs flex gap-2 items-start">
                    <AlertCircle size={14} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white leading-normal">{alert.message}</p>
                      <span className="text-[9px] text-slate-400 block mt-1 font-mono">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
                {db.getAlerts().filter(a => a.programme === 'Pre-Vocational').length === 0 && (
                  <span className="text-slate-500 block text-xs text-center py-6">No outstanding notifications logged today.</span>
                )}
              </div>
            </div>

            {/* Teacher Activity List */}
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Weekly Teacher Conduct logs</h3>
              
              <div className="border border-slate-200 dark:border-dark-border rounded overflow-hidden">
                <table className="w-full text-left text-[11px] font-semibold border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border text-slate-500">
                      <th className="p-2.5">Teacher Name</th>
                      <th className="p-2.5">Sessions Conducted</th>
                      <th className="p-2.5 text-right">Target Met</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                    {teacherOptions.slice(0, 4).map(teacher => (
                      <tr key={teacher} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <td className="p-2.5 font-bold text-slate-900 dark:text-white">{teacher}</td>
                        <td className="p-2.5">
                          {sessions.filter(s => s.conductedBy?.includes(teacher) || s.trainerUsername === teacher.toLowerCase()).length} Conducted
                        </td>
                        <td className="p-2.5 text-right text-green-500 font-bold">100%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================== TAB 2: SCHEDULE & TIMETABLE ==================== */}
      {subTab === 'timetable' && (
        <div className="space-y-6">
          
          {/* Uploader / Adder header options panel */}
          <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-md shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Timetable Allotments Config</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Upload timetable spreadsheets (.xlsx/.csv) or manage entries manually</p>
              </div>
              
              {hasPermission('Add Pre Vocational') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3 py-1.5 bg-primary text-white rounded text-xs font-bold shadow flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Manual Entry</span>
                  </button>
                </div>
              )}
            </div>

            {/* Simulated spreadsheet uploader */}
            {hasPermission('Add Pre Vocational') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                {isUploading ? (
                  <div className="p-4 bg-slate-50 dark:bg-dark-card border border-slate-205 dark:border-dark-border rounded text-center space-y-2.5">
                    <span className="text-[11px] font-bold text-slate-500 animate-pulse block">Parsing Pre-Voc Timetable File...</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-dark-border hover:border-primary p-4 rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:text-primary transition-all">
                    <Upload size={20} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Import Excel / CSV Timetable</span>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelImportSim}
                      className="hidden"
                    />
                  </label>
                )}
                
                <div className="p-4 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs text-slate-500 leading-relaxed font-semibold">
                  <span className="font-bold block text-slate-700 dark:text-slate-350 uppercase text-[10px] tracking-wide mb-1">Allotment Rule Format:</span>
                  <span>Spreadsheets must map columns in order: <span className="font-mono text-primary">Group, Teacher, Monday, Tuesday, Wednesday, Thursday, Friday</span>. Rows represent Ecco allotment groupings.</span>
                </div>
              </div>
            )}
          </div>

          {/* Manual Entry Form */}
          {showAddForm && (
            <form onSubmit={handleManualTimetableAdd} className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-md shadow-sm grid grid-cols-2 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group Name</label>
                <select
                  value={newEntry.group}
                  onChange={(e) => setNewEntry({ ...newEntry, group: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white font-bold"
                >
                  <option value="Ecco 1">Ecco 1</option>
                  <option value="Ecco 2">Ecco 2</option>
                  <option value="Ecco 3">Ecco 3</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teacher Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita"
                  value={newEntry.teacherName}
                  onChange={(e) => setNewEntry({ ...newEntry, teacherName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Day of Week</label>
                <select
                  value={newEntry.dayOfWeek}
                  onChange={(e) => setNewEntry({ ...newEntry, dayOfWeek: e.target.value as any })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white font-bold"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">School Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kanya Ashram Tanki"
                  value={newEntry.schoolName}
                  onChange={(e) => setNewEntry({ ...newEntry, schoolName: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">District</label>
                <input
                  type="text"
                  value={newEntry.district}
                  onChange={(e) => setNewEntry({ ...newEntry, district: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-end gap-1.5">
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-primary text-white text-xs font-bold rounded shadow hover:bg-primary-dark"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filtering Console panel */}
          <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-md shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-dark-border">
              <Search size={14} />
              <span>Cascading Filter Registry</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search text</span>
                <input
                  type="text"
                  placeholder="Teacher / School..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-[11px] outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Teacher</span>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-[11px] outline-none text-slate-900 dark:text-white font-bold"
                >
                  <option value="All">All Teachers</option>
                  {teacherOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">School</span>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-[11px] outline-none text-slate-900 dark:text-white font-bold"
                >
                  <option value="All">All Schools</option>
                  {schoolOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group</span>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-[11px] outline-none text-slate-900 dark:text-white font-bold"
                >
                  <option value="All">All Groups</option>
                  {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Day</span>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-[11px] outline-none text-slate-900 dark:text-white font-bold"
                >
                  <option value="All">All Days</option>
                  {dayOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">District</span>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-[11px] outline-none text-slate-900 dark:text-white font-bold"
                >
                  <option value="All">All Districts</option>
                  {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Taluka</span>
                <select
                  value={selectedTaluka}
                  onChange={(e) => setSelectedTaluka(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-[11px] outline-none text-slate-900 dark:text-white font-bold"
                >
                  <option value="All">All Talukas</option>
                  {talukaOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Timetable schedule grid list */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Schedules Database ({filteredSchedule.length} Allotments)</span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Dharampur Block</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold bg-slate-50/20 dark:bg-dark-surface/40">
                    <th className="p-3">Ecco Group</th>
                    <th className="p-3">Teacher Name</th>
                    <th className="p-3">Day of Week</th>
                    <th className="p-3">Assigned Ashram School</th>
                    <th className="p-3">District</th>
                    <th className="p-3">Taluka</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                  {filteredSchedule.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-3 font-extrabold text-primary">{entry.group}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{entry.teacherName}</td>
                      <td className="p-3 font-semibold text-amber-550 dark:text-amber-400">{entry.dayOfWeek}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{entry.schoolName}</td>
                      <td className="p-3">{entry.district || 'Valsad'}</td>
                      <td className="p-3">{entry.taluka || 'Dharampur'}</td>
                    </tr>
                  ))}
                  {filteredSchedule.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No allotment matches found in active filter criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 3: WORKFLOW VERIFICATION ==================== */}
      {subTab === 'sessions' && (
        <div className="space-y-6">
          
          {/* Trainer Quick Today school overview */}
          {isTrainerRole && todaysTimetable && (
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-5 rounded-lg shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded uppercase">Trainer Action Center</span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1.5">Today's Class Schedule</h3>
                </div>
                <span className="text-xs font-mono text-slate-500 font-bold">{currentWeekday}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-3 bg-white dark:bg-dark-surface rounded border border-slate-205 dark:border-dark-border">
                  <span className="block text-slate-400 font-semibold">Today's School</span>
                  <span className="font-extrabold text-slate-900 dark:text-white mt-1.5 block text-sm">{todaysTimetable.schoolName}</span>
                </div>

                <div className="p-3 bg-white dark:bg-dark-surface rounded border border-slate-205 dark:border-dark-border">
                  <span className="block text-slate-400 font-semibold">Suggested Time Slot</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1.5 block text-sm">10:00 AM to 12:00 PM</span>
                </div>

                <div className="p-3 bg-white dark:bg-dark-surface rounded border border-slate-205 dark:border-dark-border">
                  <span className="block text-slate-400 font-semibold">Active Programme</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1.5 block text-sm capitalize">Pre Vocational ({todaysTimetable.group})</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                {activeSessionForToday && activeSessionForToday.status === 'Scheduled' ? (
                  <button
                    onClick={() => {
                      setActiveTrainerSession(activeSessionForToday);
                      setShowConductedModal(true);
                    }}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Mark Class Conducted</span>
                  </button>
                ) : activeSessionForToday ? (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold rounded">
                    <CheckCircle size={14} />
                    <span>Session reported: {activeSessionForToday.status} ({activeSessionForToday.studentsPresentCount} students present)</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      // Generate demo session
                      const mockSess: Session = {
                        id: 'PV_DEMO_' + Math.floor(100 + Math.random() * 900),
                        programme: 'Pre-Vocational',
                        schoolCode: 'S102',
                        date: new Date().toISOString().split('T')[0],
                        time: '10:00 AM',
                        trainerUsername: currentUser.username,
                        subject: 'Intro to Safety and Hand Tools',
                        lessonPlanId: 'LP303',
                        status: 'Scheduled',
                        attendancePresent: [],
                        attendanceAbsent: [],
                        groupName: todaysTimetable.group
                      };
                      db.saveSession(mockSess);
                      loadData();
                      setActiveTrainerSession(mockSess);
                      setShowConductedModal(true);
                    }}
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white rounded text-xs font-bold shadow flex items-center gap-1.5 transition-all"
                  >
                    <Play size={12} fill="currentColor" />
                    <span>Initialize Today's Session</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Workflow verification grid console for Admins/Coordinators */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Syllabus Verification lifecycle Tracker</span>
              <span className="text-[10px] bg-secondary/10 border border-secondary/20 text-secondary px-2 py-0.5 rounded">4 Stages</span>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessions.map(sess => {
                  const school = db.getSchoolByCode(sess.schoolCode);
                  return (
                    <div key={sess.id} className="p-4 border border-slate-200 dark:border-dark-border rounded bg-slate-50 dark:bg-dark-card/30 flex flex-col justify-between h-48">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{sess.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                            sess.status === 'Completed'
                              ? 'bg-green-500/10 text-green-500'
                              : sess.status === 'Verified'
                              ? 'bg-blue-500/10 text-blue-500'
                              : sess.status === 'Conducted'
                              ? 'bg-amber-500/10 text-accent font-bold animate-pulse'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {sess.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold mt-3 text-slate-900 dark:text-white truncate">
                          {school ? school.name : sess.schoolCode}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1 truncate">{sess.subject} • {sess.date}</p>
                        
                        {sess.studentsPresentCount !== undefined && (
                          <div className="text-[10px] text-slate-500 font-semibold mt-2">
                            <span>Attendance: <span className="text-slate-900 dark:text-white font-bold">{sess.studentsPresentCount} present</span></span>
                            {sess.issuesFaced && <span className="block text-red-500 mt-0.5 italic">Issue: {sess.issuesFaced}</span>}
                          </div>
                        )}
                      </div>

                      {/* Admin action transitions */}
                      <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-dark-border/40 mt-3 text-[10px] font-bold">
                        {sess.status === 'Conducted' && (currentUser?.role === 'super_admin' || currentUser?.role === 'programme_coordinator') && (
                          <button
                            onClick={() => handleWorkflowTransition(sess, 'Verified')}
                            className="flex-1 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded shadow text-[9px] font-bold flex items-center justify-center gap-1"
                          >
                            <ShieldCheck size={12} />
                            <span>Verify Class</span>
                          </button>
                        )}
                        
                        {sess.status === 'Verified' && (currentUser?.role === 'super_admin' || currentUser?.role === 'programme_coordinator') && (
                          <button
                            onClick={() => handleWorkflowTransition(sess, 'Completed')}
                            className="flex-1 py-1 bg-green-500 hover:bg-green-600 text-white rounded shadow text-[9px] font-bold flex items-center justify-center gap-1"
                          >
                            <ClipboardCheck size={12} />
                            <span>Close Completed</span>
                          </button>
                        )}

                        {sess.status === 'Completed' && (
                          <span className="text-green-500 font-bold block text-center flex-1 py-1 bg-green-500/5 rounded">Completed & Audited</span>
                        )}
                        
                        {sess.status === 'Scheduled' && (
                          <span className="text-primary font-bold block text-center flex-1 py-1 bg-primary/5 rounded">Awaiting Class Conducted</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ==================== TAB 4: AUDIT ACTIVITY LOGS ==================== */}
      {subTab === 'audit' && currentUser?.role === 'super_admin' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Activity Audits Log Registry (Super Admin Scopes)</span>
            <Lock size={14} className="text-red-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold bg-slate-50/20 dark:bg-dark-surface/40">
                  <th className="p-3">User Name</th>
                  <th className="p-3">Action Performed</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Previous Value</th>
                  <th className="p-3">Updated Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-[11px]">
                    <td className="p-3 font-bold text-slate-900 dark:text-white truncate w-32">{log.username || 'System'}</td>
                    <td className="p-3 font-bold text-primary truncate w-48">{log.action}</td>
                    <td className="p-3 font-semibold text-slate-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 truncate max-w-xs font-mono text-[10px] text-slate-500 select-all" title={log.previousValue}>{log.previousValue || '-'}</td>
                    <td className="p-3 truncate max-w-xs font-mono text-[10px] text-slate-500 select-all" title={log.newValue}>{log.newValue || '-'}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No activity audit logs registered in this session.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== CLASS CONDUCTED MODAL (TRAINER ACTIONS) ==================== */}
      {showConductedModal && activeTrainerSession && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[450px] rounded-lg shadow-xl p-6 relative animate-fadeIn text-slate-800 dark:text-slate-100">
            <button 
              onClick={() => setShowConductedModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1.5">Class Conducted Report</h3>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">Confirm Class Execution</h2>

            <form onSubmit={handleTrainerConductedSubmit} className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-350">
              
              <div className="grid grid-cols-2 gap-3 text-[11px] p-3 bg-slate-50 dark:bg-dark-card rounded border border-slate-200 dark:border-dark-border">
                <div>
                  <span className="text-slate-400 block font-semibold">Teacher:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{currentUser?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">School Code:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeTrainerSession.schoolCode}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block font-semibold">Reporting Date:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="mt-1">
                  <span className="text-slate-400 block font-semibold">Reporting Time:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Present count */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Number of Students Present</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={presentStudents}
                  onChange={(e) => setPresentStudents(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              {/* Observations Remarks */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Session Remarks & Observations</label>
                <textarea
                  rows={2}
                  value={trainerRemarks}
                  onChange={(e) => setTrainerRemarks(e.target.value)}
                  placeholder="Enter lesson observations, materials used, etc."
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white font-medium"
                />
              </div>

              {/* Issues faced */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Issues Faced (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. smartboard malfunction, power fluctions"
                  value={issuesFaced}
                  onChange={(e) => setIssuesFaced(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              {/* Camera photo simulator */}
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Classroom Verification Photo</span>
                {photoBlob ? (
                  <div className="relative rounded overflow-hidden border border-slate-205 max-w-[140px] mx-auto">
                    <img src={photoBlob} alt="Simulated capture preview" className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoBlob(null)}
                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/60 hover:bg-black text-[9px] text-white rounded font-bold"
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={triggerCameraPhotoMock}
                    className="w-full py-2 border border-dashed border-slate-350 hover:border-primary text-slate-500 hover:text-primary rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Simulate Camera Photo</span>
                  </button>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-border/60 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowConductedModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Submit Class Report
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
