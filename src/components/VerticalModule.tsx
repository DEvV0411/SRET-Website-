import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { 
  Student, School, Session, LessonPlan, TimetableEntry, 
  InventoryItem, SystemAlert, User, ProgrammeName, SessionStatus
} from '../types';
import { 
  LayoutDashboard, Users, BookOpen, Package, FileText, Plus, Search, Filter, 
  ShieldCheck, ClipboardCheck, ArrowUpRight, GraduationCap, Phone, MapPin, 
  ClipboardList, AlertTriangle, CheckCircle, Calendar, RefreshCw, Eye,
  School as SchoolIcon, Camera, UploadCloud, Trash
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, Legend, Cell 
} from 'recharts';

interface VerticalModuleProps {
  programme: ProgrammeName;
}

export const VerticalModule: React.FC<VerticalModuleProps> = ({ programme }) => {
  const { currentUser, t } = useAuth();
  
  // Navigation tabs
  const [subTab, setSubTab] = useState<'dashboard' | 'students' | 'trainers' | 'attendance' | 'inventory' | 'reports' | 'timetable' | 'verification'>('dashboard');

  // Core Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);

  // Filtering / Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [standardFilter, setStandardFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Forms
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showMarkConductedModal, setShowMarkConductedModal] = useState(false);
  const [activeConductSession, setActiveConductSession] = useState<Session | null>(null);
  const [conductPresentCount, setConductPresentCount] = useState(20);
  const [conductRemarks, setConductRemarks] = useState('');
  const [conductIssues, setConductIssues] = useState('');
  const [conductLessonPlanId, setConductLessonPlanId] = useState('');
  const [conductPhotoBlob, setConductPhotoBlob] = useState<string | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // New Student state
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    name: '',
    rollNumber: '',
    gender: 'Male',
    dob: '',
    mobileNumber: '',
    parentName: '',
    parentContact: '',
    address: '',
    village: '',
    taluka: '',
    district: '',
    schoolCode: '',
    standard: '9th',
    attendancePercentage: 100,
    baselineScore: 50,
    endlineScore: undefined,
    aspirations: '',
    postStatus: 'Employment',
    alumniStatus: 'Active'
  });

  useEffect(() => {
    loadData();
    window.addEventListener('omp_db_pulled', loadData);
    window.addEventListener('omp_session_conducted_update', loadData);
    return () => {
      window.removeEventListener('omp_db_pulled', loadData);
      window.removeEventListener('omp_session_conducted_update', loadData);
    };
  }, [programme]);

  const loadData = () => {
    // 1. Get Schools running this programme
    const allSchools = db.getSchools();
    const runningSchools = allSchools.filter(s => s.runningProgrammes.includes(programme));
    setSchools(runningSchools);

    const runningSchoolCodes = runningSchools.map(s => s.code);

    // 2. Get Students belonging to those schools
    const allStudents = db.getStudents();
    const verticalStudents = allStudents.filter(s => runningSchoolCodes.includes(s.schoolCode));
    setStudents(verticalStudents);

    // 3. Get Sessions for this vertical
    const allSessions = db.getSessions();
    let verticalSessions = allSessions.filter(s => s.programme === programme);
    if (currentUser?.role === 'trainer') {
      verticalSessions = verticalSessions.filter(s => s.trainerUsername === currentUser.username);
    }
    setSessions(verticalSessions);

    // 4. Get Timetable allotments
    const allTimetable = db.getTimetable();
    const allUsers = db.getUsers();
    // Filter allotments where the school runs this programme
    let verticalAllotment = allTimetable.filter(t => {
      const sch = allSchools.find(s => s.name.toLowerCase().trim() === t.schoolName.toLowerCase().trim());
      if (sch) {
        return sch.runningProgrammes.includes(programme);
      }
      // Fallback: Check if teacher name matches a user assigned to this programme
      const teacher = allUsers.find(u => u.name.toLowerCase().includes(t.teacherName.toLowerCase()));
      if (teacher) {
        return teacher.assignedProgramme === programme || teacher.assignedProgramme === 'All';
      }
      return false;
    });
    if (currentUser?.role === 'trainer') {
      verticalAllotment = verticalAllotment.filter(t => 
        currentUser.name.toLowerCase().includes(t.teacherName.toLowerCase())
      );
    }
    setTimetable(verticalAllotment);

    // 5. Get Inventory logs specific to this vertical
    const allInventory = db.getInventory();
    setInventory(allInventory);

    // 6. Get Trainers assigned to this vertical
    const verticalTrainers = allUsers.filter(u => u.role === 'trainer' && (u.assignedProgramme === programme || u.assignedProgramme === 'All'));
    setTrainers(verticalTrainers);
  };

  // Student Actions
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.schoolCode) return;

    const saved: Student = {
      ...(newStudent as Student),
      studentId: 'STU_' + Math.floor(1000 + Math.random() * 9000),
      enrollmentDate: new Date().toISOString().split('T')[0],
      attendancePercentage: Number(newStudent.attendancePercentage) || 100,
      exams: [],
      certificates: [],
      suggestedCourses: [],
      governmentSchemeParticipation: []
    };

    db.saveStudent(saved);
    loadData();
    setShowAddStudent(false);
    setNewStudent({
      name: '',
      rollNumber: '',
      gender: 'Male',
      dob: '',
      mobileNumber: '',
      parentName: '',
      parentContact: '',
      address: '',
      village: '',
      taluka: '',
      district: '',
      schoolCode: '',
      standard: '9th',
      attendancePercentage: 100,
      baselineScore: 50,
      postStatus: 'Employment',
      alumniStatus: 'Active'
    });
  };

  // Conduct Class Form Submission
  const handleMarkConductedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConductSession) return;

    const updated: Session = {
      ...activeConductSession,
      status: 'Conducted',
      conductedAt: new Date().toISOString(),
      conductedBy: currentUser?.name || 'Trainer',
      studentsPresentCount: conductPresentCount,
      remarks: conductRemarks,
      issuesFaced: conductIssues,
      lessonPlanId: conductLessonPlanId,
      photoUrl: conductPhotoBlob || undefined
    };

    db.saveSession(updated);
    
    // Add Alert notification
    const alert: SystemAlert = {
      id: 'ALT_' + Math.floor(100 + Math.random() * 900),
      type: 'class_conducted',
      severity: 'medium',
      message: `${currentUser?.name || 'Trainer'} conducted class for ${db.getSchoolByCode(activeConductSession.schoolCode)?.name || 'School'} (Subject: ${activeConductSession.subject})`,
      programme,
      schoolCode: activeConductSession.schoolCode,
      createdAt: new Date().toISOString(),
      isResolved: false
    };
    db.addAlert(alert);

    setShowMarkConductedModal(false);
    setActiveConductSession(null);
    setConductRemarks('');
    setConductIssues('');
    setConductLessonPlanId('');
    setConductPhotoBlob(null);
    loadData();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 800;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setConductPhotoBlob(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Verify / Verify Complete Actions
  const handleWorkflowTransition = (session: Session, nextStatus: 'Verified' | 'Completed') => {
    const updated: Session = {
      ...session,
      status: nextStatus,
      verifiedAt: nextStatus === 'Verified' ? new Date().toISOString() : session.verifiedAt,
      verifiedBy: nextStatus === 'Verified' ? currentUser?.name : session.verifiedBy,
      completedAt: nextStatus === 'Completed' ? new Date().toISOString() : session.completedAt,
      completedBy: nextStatus === 'Completed' ? currentUser?.name : session.completedBy
    };
    db.saveSession(updated);
    
    // Log Audit
    db.writeAuditLog(
      currentUser?.name || 'Admin',
      `Session verification: ${nextStatus}`,
      `Verified session ID ${session.id} for ${programme}`,
      JSON.stringify(session),
      JSON.stringify(updated)
    );
    loadData();
  };

  // Filters for Students
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSchool = schoolFilter === 'All' || s.schoolCode === schoolFilter;
    const matchesStandard = standardFilter === 'All' || s.standard === standardFilter;
    return matchesSearch && matchesSchool && matchesStandard;
  });

  // Filters for Sessions
  const filteredSessions = sessions.filter(s => {
    const matchesSchool = schoolFilter === 'All' || s.schoolCode === schoolFilter;
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSchool && matchesStatus;
  });

  // Calculate stats
  const totalStudentsCount = students.length;
  const activeTrainersCount = trainers.length;
  const conductedSessions = sessions.filter(s => s.status === 'Completed' || s.status === 'Conducted' || s.status === 'Verified').length;
  const totalTargetSessions = schools.reduce((sum, s) => sum + s.sessionsTarget, 0);

  // Recharts Chart Data
  // Syllabus completion data (chapters)
  const chartSyllabusData = schools.map(sch => {
    const schSessions = sessions.filter(s => s.schoolCode === sch.code);
    return {
      schoolName: sch.name.split(' ')[0],
      conducted: schSessions.filter(s => ['Conducted', 'Verified', 'Completed'].includes(s.status)).length,
      target: sch.sessionsTarget
    };
  });

  // Attendance rate by school
  const chartAttendanceData = schools.map(sch => {
    const schStudents = students.filter(s => s.schoolCode === sch.code);
    const avgAttendance = schStudents.length > 0 
      ? Math.round(schStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / schStudents.length)
      : 80;
    return {
      name: sch.name.split(' ')[0],
      attendance: avgAttendance
    };
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-200 dark:border-dark-border gap-4">
        <div>
          <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {programme} Vertical
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
            {programme} MIS Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview, students, trainers, attendance logs, and workflow verification engine
          </p>
        </div>

        {/* Subtabs Menu */}
        <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-dark-card p-1 rounded-lg border border-slate-200 dark:border-dark-border text-xs font-bold">
          {(['dashboard', 'students', 'trainers', 'attendance', 'inventory', 'reports', 'timetable', 'verification'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSubTab(tab)}
              className={`px-3 py-1.5 rounded-md transition-all uppercase text-[10px] ${
                subTab === tab
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== TAB 1: OVERVIEW DASHBOARD ==================== */}
      {subTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                <GraduationCap size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Total Students</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{totalStudentsCount}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Active Trainers</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{activeTrainersCount}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
                <ClipboardList size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Sessions Conducted</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {conductedSessions} <span className="text-xs text-slate-400 font-medium">/ {totalTargetSessions} Target</span>
                </h3>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:bg-dark-border rounded-lg shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                <CheckCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Weekly Compliance</p>
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">92%</h3>
              </div>
            </div>
          </div>

          {/* Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm">
              <h3 className="text-xs font-extrabold uppercase text-slate-500 mb-4">Syllabus Progress (Target vs Conducted)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartSyllabusData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="schoolName" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="conducted" fill="#4f46e5" name="Conducted" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#94a3b8" name="Target" opacity={0.3} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm">
              <h3 className="text-xs font-extrabold uppercase text-slate-500 mb-4">Average Attendance Rate by school</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartAttendanceData}>
                    <defs>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} domain={[60, 100]} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="attendance" stroke="#10b981" fillOpacity={1} fill="url(#colorAtt)" name="Attendance %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: STUDENT MANAGEMENT ==================== */}
      {subTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9"
                />
              </div>
              <select
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
                className="input-field max-w-[200px]"
              >
                <option value="All">All Schools</option>
                {schools.map(s => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
              <select
                value={standardFilter}
                onChange={(e) => setStandardFilter(e.target.value)}
                className="input-field max-w-[150px]"
              >
                <option value="All">All Standards</option>
                <option value="9th">9th Standard</option>
                <option value="10th">10th Standard</option>
                <option value="11th">11th Standard</option>
                <option value="12th">12th Standard</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddStudent(true)}
                className="btn-primary shrink-0"
              >
                <Plus size={16} />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Student Grid list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
              const sch = schools.find(s => s.code === student.schoolCode);
              return (
                <div 
                  key={student.studentId}
                  className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{student.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{student.studentId} • Roll: {student.rollNumber}</p>
                      </div>
                      <span className="text-[9px] bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 font-bold px-1.5 py-0.5 rounded">
                        {student.standard}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                      <div className="flex items-center gap-1.5">
                        <SchoolIcon size={12} className="text-slate-400" />
                        <span>{sch?.name || 'School Code: ' + student.schoolCode}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-slate-400" />
                        <span>{student.village}, {student.taluka}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-dark-border/40 pt-3 mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Attendance</p>
                      <p className={`text-xs font-bold ${student.attendancePercentage >= 85 ? 'text-green-500' : 'text-amber-500'}`}>
                        {student.attendancePercentage}%
                      </p>
                    </div>

                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: TRAINER MANAGEMENT ==================== */}
      {subTab === 'trainers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trainers.map(trainer => (
            <div 
              key={trainer.username}
              className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-dark-border/45 pb-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary text-white font-bold flex items-center justify-center">
                    {trainer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{trainer.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">@{trainer.username}</p>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] font-medium text-slate-600 dark:text-slate-350">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-20 shrink-0">Districts:</span>
                    <span>{trainer.assignedDistricts.join(', ') || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-20 shrink-0">Status:</span>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-500/10 text-green-500 border border-green-500/20 rounded">
                      Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Location telemetry summary if present */}
              {trainer.lastKnownLocation && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border/45 text-[10px] text-slate-500 font-mono">
                  <p className="font-semibold text-slate-400 mb-1">Last GPS Position</p>
                  <p>Lat: {trainer.lastKnownLocation.lat.toFixed(4)}, Lng: {trainer.lastKnownLocation.lng.toFixed(4)}</p>
                  <p className="text-[9px] mt-0.5 text-slate-400">At: {new Date(trainer.lastKnownLocation.timestamp).toLocaleTimeString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ==================== TAB 4: ATTENDANCE MANAGEMENT ==================== */}
      {subTab === 'attendance' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-300">Timetable Scheduler & Daily Execution Logs</span>
            <span className="text-[10px] text-primary">{timetable.length} Active allotments</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-dark-card/40 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold">
                  <th className="p-3">School Name</th>
                  <th className="p-3">Day of Week</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Teacher</th>
                  <th className="p-3 text-right">Execution status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-350">
                {timetable.map(allotment => {
                  const matchingSch = schools.find(s => s.name.toLowerCase().trim() === allotment.schoolName.toLowerCase().trim()) ||
                                      db.getSchools().find(s => s.name.toLowerCase().trim() === allotment.schoolName.toLowerCase().trim());
                  const schoolCode = matchingSch ? matchingSch.code : (allotment.schoolCode || 'S101');

                  const reportedSession = sessions.find(
                    s => s.schoolCode === schoolCode && 
                         s.date === new Date().toISOString().split('T')[0]
                  );
                  return (
                    <tr key={allotment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{allotment.schoolName}</td>
                      <td className="p-3 text-amber-500">{allotment.dayOfWeek}</td>
                      <td className="p-3">{allotment.group}</td>
                      <td className="p-3">{allotment.teacherName}</td>
                      <td className="p-3 text-right">
                        {reportedSession ? (
                          <span className="px-2 py-0.5 bg-green-500/10 text-green-500 border border-green-500/20 rounded font-bold uppercase text-[9px]">
                            {reportedSession.status}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              const mockSess: Session = {
                                id: 'SES_' + Math.floor(100 + Math.random() * 900),
                                programme,
                                schoolCode: schoolCode,
                                date: new Date().toISOString().split('T')[0],
                                time: '10:00 AM',
                                trainerUsername: currentUser?.username || 'trainer',
                                subject: allotment.trade || 'LP Session',
                                lessonPlanId: '',
                                status: 'Scheduled',
                                attendancePresent: [],
                                attendanceAbsent: []
                              };
                              setActiveConductSession(mockSess);
                              setConductLessonPlanId('');
                              setConductPhotoBlob(null);
                              setShowMarkConductedModal(true);
                            }}
                            className="btn-primary py-0.5 px-2 text-[10px]"
                          >
                            Mark Conducted
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: INVENTORY VISIBILITY ==================== */}
      {subTab === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventory.map(item => (
              <div 
                key={item.id}
                className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start border-b border-slate-100 dark:border-dark-border/40 pb-2 mb-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h3>
                    <span className="text-[9px] bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-500 font-bold px-1.5 py-0.5 rounded">
                      {item.type}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Stock Quantity</p>
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">{item.currentStock} {item.unit}</p>
                    </div>
                    {item.currentStock < item.minThreshold && (
                      <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                        <AlertTriangle size={14} />
                        <span>Low Stock</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== TAB 6: REPORTS & ANALYTICS ==================== */}
      {subTab === 'reports' && (
        <div className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-lg shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border/45 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Reports and Exports Panel</h3>
            <button className="btn-primary text-[10px] py-1 px-3">Export to PDF</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-350">
            <div className="space-y-2 border border-slate-100 dark:border-dark-border/50 p-4 rounded bg-slate-50/20 dark:bg-dark-card/10">
              <h4 className="font-extrabold text-slate-900 dark:text-white">Active Talukas Summary</h4>
              <p>Dharampur: 4 Schools</p>
              <p>Valsad: 2 Schools</p>
              <p>Kaprada: 1 School</p>
            </div>
            
            <div className="space-y-2 border border-slate-100 dark:border-dark-border/50 p-4 rounded bg-slate-50/20 dark:bg-dark-card/10">
              <h4 className="font-extrabold text-slate-900 dark:text-white">Chapter Deliveries</h4>
              <p>Completed Chapters: 14 chapters across all modules</p>
              <p>Worksheets Submitted: 82 worksheets compiled</p>
              <p>Baseline Assessment Average: 68.2%</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 7: TIMETABLE allotments ==================== */}
      {subTab === 'timetable' && (
        <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-card flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
            <span>Group Allotments and Teacher Weekly schedule</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-dark-card/40 border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold">
                  <th className="p-3">Allotment ID</th>
                  <th className="p-3">Group</th>
                  <th className="p-3">Teacher</th>
                  <th className="p-3">School Name</th>
                  <th className="p-3">District</th>
                  <th className="p-3">Taluka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-350">
                {timetable.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="p-3 font-mono text-slate-400">{entry.id}</td>
                    <td className="p-3 font-bold text-primary">{entry.group}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{entry.teacherName}</td>
                    <td className="p-3 font-semibold">{entry.schoolName}</td>
                    <td className="p-3">{entry.district}</td>
                    <td className="p-3">{entry.taluka}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 8: WORKFLOW VERIFICATION ==================== */}
      {subTab === 'verification' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Syllabus Verification lifecycle Tracker</span>
              <span className="text-[10px] bg-secondary/10 border border-secondary/20 text-secondary px-2 py-0.5 rounded">4 Stages</span>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sessions.map(sess => {
                  const school = db.getSchoolByCode(sess.schoolCode);
                  return (
                    <div key={sess.id} className="p-4 border border-slate-200 dark:border-dark-border rounded bg-slate-50 dark:bg-dark-card/30 flex flex-col justify-between h-auto min-h-[190px]">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{sess.id}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            sess.status === 'Completed' ? 'bg-green-500/10 text-green-500' :
                            sess.status === 'Verified' ? 'bg-blue-500/10 text-blue-500' :
                            sess.status === 'Conducted' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {sess.status === 'Scheduled' ? 'Awaiting Class Conducted' : sess.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-2">
                          {school?.name || sess.schoolCode}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Date: <span className="font-bold font-mono">{sess.date}</span> at <span className="font-bold">{sess.time}</span>
                        </p>

                        <div className="mt-3 text-[11px] space-y-1 font-semibold text-slate-700 dark:text-slate-355">
                          <p>
                            <span className="text-slate-400">Lesson Plan:</span> {
                               db.getLessonPlans().find(p => p.id === sess.lessonPlanId)?.chapter || sess.lessonPlanId || 'N/A'
                             } ({sess.subject})
                          </p>
                          {sess.conductedBy && (
                            <p>
                              <span className="text-slate-400">Conducted By:</span> {sess.conductedBy}
                            </p>
                          )}
                          {sess.remarks && (
                            <p className="italic text-[10px] text-slate-500">
                              "Remarks: {sess.remarks}"
                            </p>
                          )}
                        </div>
                        {sess.photoUrl && (
                           <div className="mt-2.5">
                             <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Classroom Photo</span>
                             <div className="relative rounded overflow-hidden border border-slate-200 dark:border-dark-border max-h-[80px] shadow-sm">
                               <img 
                                 src={sess.photoUrl} 
                                 alt="Classroom Observation" 
                                 className="w-full h-16 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                 onClick={() => setActivePhotoUrl(sess.photoUrl || null)}
                               />
                             </div>
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
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD STUDENT MODAL --- */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[500px] rounded-lg shadow-xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddStudent(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold"
            >
              Close
            </button>
            <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Add New Student Profile</h2>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Student Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="input-field"
                    placeholder="e.g. Rahul Patel"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                    className="input-field"
                    placeholder="e.g. 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Standard *</label>
                  <select
                    value={newStudent.standard}
                    onChange={(e) => setNewStudent({...newStudent, standard: e.target.value})}
                    className="input-field"
                  >
                    <option value="9th">9th Standard</option>
                    <option value="10th">10th Standard</option>
                    <option value="11th">11th Standard</option>
                    <option value="12th">12th Standard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Assigned School *</label>
                  <select
                    required
                    value={newStudent.schoolCode}
                    onChange={(e) => setNewStudent({...newStudent, schoolCode: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select school...</option>
                    {schools.map(s => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={newStudent.mobileNumber}
                    onChange={(e) => setNewStudent({...newStudent, mobileNumber: e.target.value})}
                    className="input-field"
                    placeholder="+91 99..."
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newStudent.dob}
                    onChange={(e) => setNewStudent({...newStudent, dob: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Village</label>
                  <input
                    type="text"
                    value={newStudent.village}
                    onChange={(e) => setNewStudent({...newStudent, village: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Taluka</label>
                  <input
                    type="text"
                    value={newStudent.taluka}
                    onChange={(e) => setNewStudent({...newStudent, taluka: e.target.value})}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">District</label>
                  <input
                    type="text"
                    value={newStudent.district}
                    onChange={(e) => setNewStudent({...newStudent, district: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <button type="button" onClick={() => setShowAddStudent(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MARK CONDUCTED MODAL --- */}
      {showMarkConductedModal && activeConductSession && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[400px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowMarkConductedModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold"
            >
              Close
            </button>
            <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Report Class Execution</h2>

            <form onSubmit={handleMarkConductedSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-500 mb-1">Present Students Count *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={conductPresentCount}
                  onChange={(e) => setConductPresentCount(Number(e.target.value))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Select Lesson Plan (LPS) *</label>
                <select
                  value={conductLessonPlanId}
                  onChange={(e) => setConductLessonPlanId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">-- Choose Lesson Plan --</option>
                  {db.getLessonPlans()
                    .filter(p => p.programme === programme)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.chapter} ({p.subject})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Classroom Observation Photo</label>
                {conductPhotoBlob ? (
                  <div className="relative rounded overflow-hidden border border-slate-300 dark:border-slate-600 max-w-[150px] mx-auto shadow">
                    <img src={conductPhotoBlob} alt="Classroom preview" className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => setConductPhotoBlob(null)}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-750 text-white rounded-full transition-all flex items-center justify-center border border-white"
                      title="Remove Photo"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <label className="relative overflow-hidden flex-1 flex flex-col items-center justify-center py-2 border border-dashed border-slate-300 dark:border-dark-border hover:border-primary hover:bg-primary/5 text-slate-500 hover:text-primary rounded font-bold cursor-pointer gap-1">
                      <Camera size={14} />
                      <span>Take Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>

                    <label className="relative overflow-hidden flex-1 flex flex-col items-center justify-center py-2 border border-dashed border-slate-300 dark:border-dark-border hover:border-primary hover:bg-primary/5 text-slate-500 hover:text-primary rounded font-bold cursor-pointer gap-1">
                      <UploadCloud size={14} />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Trainer Remarks *</label>
                <textarea
                  required
                  value={conductRemarks}
                  onChange={(e) => setConductRemarks(e.target.value)}
                  className="input-field h-20 resize-none"
                  placeholder="Enter session details, topics covered..."
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Issues Faced (if any)</label>
                <input
                  type="text"
                  value={conductIssues}
                  onChange={(e) => setConductIssues(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Electricity failure, None"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-dark-border/40">
                <button type="button" onClick={() => setShowMarkConductedModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit Class Report</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STUDENT DETAILS MODAL --- */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[450px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold"
            >
              Close
            </button>
            <h2 className="text-base font-bold mb-4 text-slate-900 dark:text-white">Student Academic Profile</h2>

            <div className="space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-355">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border/45 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Student ID: {selectedStudent.studentId}</p>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                  {selectedStudent.standard} Standard
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Guardian Name</p>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-white">{selectedStudent.parentName}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Contact Contact</p>
                  <p className="mt-0.5 font-mono">{selectedStudent.parentContact || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Baseline Score</p>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-white">{selectedStudent.baselineScore || 0}%</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Endline Score</p>
                  <p className="mt-0.5 font-bold text-slate-800 dark:text-white">{selectedStudent.endlineScore || 'Pending'}%</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold">Career Aspirations</p>
                <p className="mt-0.5 font-medium italic">"{selectedStudent.aspirations || 'No record uploaded'}"</p>
              </div>

              <div>
                <p className="text-[9px] text-slate-400 uppercase font-bold">Taluka & Taluka District</p>
                <p className="mt-0.5 font-medium">{selectedStudent.village}, {selectedStudent.taluka}, {selectedStudent.district}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox modal overlay */}
      {activePhotoUrl && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 cursor-pointer animate-fadeIn"
          onClick={() => setActivePhotoUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-white dark:bg-dark-surface p-2 rounded-lg border border-slate-200 dark:border-dark-border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setActivePhotoUrl(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black text-white w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all text-xs z-10"
            >
              ✕
            </button>
            <img 
              src={activePhotoUrl} 
              alt="Classroom Observation Fullscreen" 
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </div>
      )}

    </div>
  );
};
