import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { Session, School, Student, ProgrammeName, SessionStatus, SystemAlert } from '../types';
import { Calendar, Play, CheckCircle, XCircle, MapPin, Camera, AlertCircle, RefreshCw, UploadCloud, Trash, X } from 'lucide-react';

interface SessionModuleProps {
  selectedSessionId: string | null;
  setSelectedSessionId: (id: string | null) => void;
}

export const SessionModule: React.FC<SessionModuleProps> = ({ selectedSessionId, setSelectedSessionId }) => {
  const { currentUser, isOnline, t } = useAuth();
  
  // States
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  
  // Selection filters
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('All');
  const [selectedProgFilter, setSelectedProgFilter] = useState<ProgrammeName | 'All'>('All');
  
  // Session confirmation states (the 3-tap state)
  const [confirmStatus, setConfirmStatus] = useState<SessionStatus>('Completed'); // Tap 1
  const [presentStudentIds, setPresentStudentIds] = useState<string[]>([]); // Tap 2
  const [remarks, setRemarks] = useState('');
  const [photoBlob, setPhotoBlob] = useState<string | null>(null); // Camera simulation
  const [gpsCoords, setGpsCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);
  const [selectedLessonPlanId, setSelectedLessonPlanId] = useState('');

  useEffect(() => {
    loadSessions();
  }, [selectedSessionId]);

  useEffect(() => {
    const handleRealTimeUpdate = () => {
      loadSessions();
    };
    window.addEventListener('omp_session_conducted_update', handleRealTimeUpdate);
    window.addEventListener('omp_db_pulled', handleRealTimeUpdate);
    return () => {
      window.removeEventListener('omp_session_conducted_update', handleRealTimeUpdate);
      window.removeEventListener('omp_db_pulled', handleRealTimeUpdate);
    };
  }, []);

  const loadSessions = () => {
    let rawSessions = db.getSessions();
    const rawSchools = db.getSchools();
    
    // Scopes (Trainer only sees their sessions)
    if (currentUser?.role === 'trainer') {
      rawSessions = rawSessions.filter(s => s.trainerUsername === currentUser.username);
    } else if (currentUser?.role === 'programme_coordinator') {
      rawSessions = rawSessions.filter(s => currentUser.assignedSchools.includes(s.schoolCode));
    }

    setSessions(rawSessions);
    setSchools(rawSchools);

    // If a session ID was selected from another component (like dashboard quick-start)
    if (selectedSessionId) {
      const active = rawSessions.find(s => s.id === selectedSessionId);
      if (active) {
        handleStartSessionConfirm(active);
      }
    }
  };

  const handleStartSessionConfirm = (session: Session) => {
    setActiveSession(session);
    setConfirmStatus('Completed');
    setRemarks('');
    setPhotoBlob(null);
    setGpsCoords(null);
    setSelectedLessonPlanId(session.lessonPlanId || '');
    
    // Default all students at this school to "Present" for 1-tap convenience
    const schoolStudents = db.getStudents().filter(s => s.schoolCode === session.schoolCode);
    setPresentStudentIds(schoolStudents.map(s => s.studentId));
    
    // Auto-trigger GPS capture simulation
    setIsCapturingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsCapturingGps(false);
        },
        () => {
          // Fallback Dholera coords on check fail / offline
          setGpsCoords({ lat: 22.2534, lng: 72.1983 });
          setIsCapturingGps(false);
        },
        { timeout: 3000 }
      );
    } else {
      setGpsCoords({ lat: 22.2534, lng: 72.1983 });
      setIsCapturingGps(false);
    }
  };

  // Bulk Attendance Fast Select Toggles
  const handleToggleStudent = (studentId: string) => {
    if (presentStudentIds.includes(studentId)) {
      setPresentStudentIds(presentStudentIds.filter(id => id !== studentId));
    } else {
      setPresentStudentIds([...presentStudentIds, studentId]);
    }
  };

  const handleSelectAll = (schoolCode: string) => {
    const schoolStudents = db.getStudents().filter(s => s.schoolCode === schoolCode);
    setPresentStudentIds(schoolStudents.map(s => s.studentId));
  };

  const handleSelectNone = () => {
    setPresentStudentIds([]);
  };

  // Handle actual photo file upload or camera capture with client-side image compression
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

        // Resize image: cap max dimension at 800px
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
          // Compress to JPEG with 0.6 quality (60%)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setPhotoBlob(compressedBase64);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Submit Session Confirmation (Tap 3)
  const handleSubmitConfirmation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const schoolStudents = db.getStudents().filter(s => s.schoolCode === activeSession.schoolCode);
    const absentStudentIds = schoolStudents
      .map(s => s.studentId)
      .filter(id => !presentStudentIds.includes(id));

    const updatedSession: Session = {
      ...activeSession,
      status: confirmStatus,
      attendancePresent: presentStudentIds,
      attendanceAbsent: absentStudentIds,
      remarks,
      photoUrl: photoBlob || undefined,
      locationCoords: gpsCoords || undefined,
      conductedBy: activeSession.conductedBy || (confirmStatus === 'Completed' || confirmStatus === 'Conducted' ? currentUser?.name : undefined),
      conductedAt: activeSession.conductedAt || (confirmStatus === 'Completed' || confirmStatus === 'Conducted' ? new Date().toISOString() : undefined),
      studentsPresentCount: presentStudentIds.length,
      lessonPlanId: selectedLessonPlanId
    };

    const previous = JSON.stringify(activeSession);
    db.saveSession(updatedSession);
    
    // Log audit trail
    db.writeAuditLog(
      currentUser?.name || updatedSession.trainerUsername,
      'Session Conducted Submission',
      `Submitted class execution details for school: ${updatedSession.schoolCode}`,
      previous,
      JSON.stringify(updatedSession)
    );

    // Instant Notification Alert to Super Admin
    if (confirmStatus === 'Completed' || confirmStatus === 'Conducted') {
      const notification: SystemAlert = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'class_conducted',
        severity: 'high',
        message: `Alert: Class conducted by ${currentUser?.name || updatedSession.trainerUsername} at School ${updatedSession.schoolCode}. Remarks: "${remarks || 'None'}"`,
        programme: updatedSession.programme,
        schoolCode: updatedSession.schoolCode,
        createdAt: new Date().toISOString(),
        isResolved: false
      };
      db.addAlert(notification);
    }

    // Dispatch global real-time event
    window.dispatchEvent(new Event('omp_session_conducted_update'));
    
    // Audit update student attendance rates dynamically
    if (confirmStatus === 'Completed') {
      presentStudentIds.forEach(id => {
        const student = db.getStudentById(id);
        if (student) {
          // Increment mock attendance
          const nextVal = Math.min(student.attendancePercentage + 1, 100);
          student.attendancePercentage = nextVal;
          db.saveStudent(student);
        }
      });
      absentStudentIds.forEach(id => {
        const student = db.getStudentById(id);
        if (student) {
          const nextVal = Math.max(student.attendancePercentage - 3, 0);
          student.attendancePercentage = nextVal;
          db.saveStudent(student);
        }
      });
    }

    // Trigger visual cues
    if (!isOnline) {
      window.dispatchEvent(new CustomEvent('omp_toast_message', { 
        detail: 'Session confirmed! Saved locally. Will sync automatically once online.' 
      }));
    } else {
      window.dispatchEvent(new CustomEvent('omp_toast_message', { 
        detail: 'Session completed successfully and synced to OMP database.' 
      }));
    }

    // Clean states
    setSelectedSessionId(null);
    setActiveSession(null);
    loadSessions();
  };

  // Scoped list filters
  const filteredSessions = sessions.filter(session => {
    const matchesSchool = selectedSchoolFilter === 'All' || session.schoolCode === selectedSchoolFilter;
    const matchesProg = selectedProgFilter === 'All' || session.programme === selectedProgFilter;
    return matchesSchool && matchesProg;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('sessions')}</h1>
          <p className="text-sm text-slate-500 mt-1">Track educational calendar schedules and class details</p>
        </div>
      </div>

      {activeSession ? (
        /* ==================== 3-TAP MOBILE CONFIRMATION MODULE IN SMARTPHONE CONTAINER ==================== */
        <div className="flex flex-col items-center py-2 animate-fadeIn">
          <div className="relative mx-auto border-8 border-slate-800 bg-slate-900 rounded-[36px] shadow-2xl overflow-hidden w-[345px] h-[670px] flex flex-col pt-6 border-b-[12px]">
            
            {/* Phone Notch/Speaker */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-28 h-3.5 bg-slate-800 rounded-full z-50 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-950 rounded-full" />
            </div>
            
            {/* Phone Screen container */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3 bg-white dark:bg-dark-surface rounded-t-[16px] text-slate-800 dark:text-slate-200">
              
              <div className="flex justify-between items-start pb-2.5 border-b border-slate-100 dark:border-dark-border">
                <div className="min-w-0">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">PWA Smartphone Shell</span>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {schools.find(s => s.code === activeSession.schoolCode)?.name}
                  </h2>
                  <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                    {activeSession.programme} • {activeSession.subject}
                  </p>
                </div>
                <button 
                  onClick={() => { setActiveSession(null); setSelectedSessionId(null); }}
                  className="w-7 h-7 flex items-center justify-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-full transition-colors shadow-sm"
                  aria-label="Close session form"
                  type="button"
                >
                  <X size={12} />
                </button>
              </div>

              <form onSubmit={handleSubmitConfirmation} className="space-y-5 mt-4">
                
                {/* TAP 1: Select Session Status */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    1. Select Status
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmStatus('Completed')}
                      className={`py-2 rounded font-bold text-[10px] flex flex-col items-center gap-1 border transition-all ${
                        confirmStatus === 'Completed'
                          ? 'bg-secondary/10 border-secondary text-secondary scale-102 ring-2 ring-secondary/20'
                          : 'bg-slate-50 dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-500'
                      }`}
                    >
                      <CheckCircle size={14} />
                      Completed
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setConfirmStatus('Missed')}
                      className={`py-2 rounded font-bold text-[10px] flex flex-col items-center gap-1 border transition-all ${
                        confirmStatus === 'Missed'
                          ? 'bg-red-500/10 border-red-500 text-red-500 scale-102 ring-2 ring-red-500/20'
                          : 'bg-slate-50 dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-500'
                      }`}
                    >
                      <XCircle size={14} />
                      Missed
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmStatus('Postponed')}
                      className={`py-2 rounded font-bold text-[10px] flex flex-col items-center gap-1 border transition-all ${
                        confirmStatus === 'Postponed'
                          ? 'bg-accent/10 border-accent text-accent scale-102 ring-2 ring-accent/20'
                          : 'bg-slate-50 dark:bg-dark-card border-slate-200 dark:border-dark-border text-slate-500'
                      }`}
                    >
                      <Calendar size={14} />
                      Postpone
                    </button>
                  </div>
                </div>

                {/* TAP 2: Quick Student Attendance Checkbox Matrix */}
                {confirmStatus === 'Completed' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider">
                        2. Check Attendance
                      </span>
                      <div className="flex gap-1.5 font-bold">
                        <button
                          type="button"
                          onClick={() => handleSelectAll(activeSession.schoolCode)}
                          className="text-primary hover:underline"
                        >
                          All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={handleSelectNone}
                          className="text-primary hover:underline"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    {/* List of enrolled students at this school */}
                    <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-dark-border rounded-md bg-slate-50 dark:bg-dark-card divide-y divide-slate-100 dark:divide-dark-border">
                      {db.getStudents().filter(s => s.schoolCode === activeSession.schoolCode).map(student => {
                        const isChecked = presentStudentIds.includes(student.studentId);
                        return (
                          <label 
                            key={student.studentId}
                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold"
                          >
                            <span className="text-slate-850 dark:text-slate-300">{student.name}</span>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStudent(student.studentId)}
                              className="rounded border-slate-300 dark:border-dark-border text-primary focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Media uploads and remarks */}
                {confirmStatus === 'Completed' && (
                  <div className="space-y-3.5">
                    {/* Camera photo input */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Classroom Observation Photo</span>
                      {photoBlob ? (
                        <div className="relative rounded overflow-hidden border border-slate-300 dark:border-slate-600 max-w-[140px] mx-auto shadow-md">
                          <img src={photoBlob} alt="Classroom capture preview" className="w-full h-24 object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotoBlob(null)}
                            className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all flex items-center justify-center border border-white"
                            title="Remove Photo"
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <label className="relative overflow-hidden flex-1 flex flex-col items-center justify-center py-2.5 border border-dashed border-slate-300 dark:border-dark-border hover:border-primary hover:bg-primary/5 text-slate-500 hover:text-primary rounded text-[11px] font-bold transition-all cursor-pointer gap-1">
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

                          <label className="relative overflow-hidden flex-1 flex flex-col items-center justify-center py-2.5 border border-dashed border-slate-300 dark:border-dark-border hover:border-primary hover:bg-primary/5 text-slate-500 hover:text-primary rounded text-[11px] font-bold transition-all cursor-pointer gap-1">
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

                    {/* GPS Coordinates Simulation */}
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border p-1.5 rounded">
                      <MapPin size={10} className="text-primary shrink-0" />
                      {isCapturingGps ? (
                        <span className="flex items-center gap-1"><RefreshCw size={8} className="animate-spin" /> GPS syncing...</span>
                      ) : gpsCoords ? (
                        <span>GPS Checked: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</span>
                      ) : (
                        <span>GPS check failed</span>
                      )}
                    </div>

                    {/* Select Lesson Plan (LPS) */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Select Lesson Plan (LPS) *
                      </span>
                      <select
                        value={selectedLessonPlanId}
                        onChange={(e) => setSelectedLessonPlanId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-600 rounded text-[11px] outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-white font-semibold transition-all"
                        required={confirmStatus === 'Completed'}
                      >
                        <option value="">-- Choose Lesson Plan --</option>
                        {db.getLessonPlans()
                          .filter(p => p.programme === activeSession.programme)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.chapter} ({p.subject})
                            </option>
                          ))
                        }
                      </select>
                    </div>

                    {/* Remarks field */}
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Observations / Remarks</span>
                      <textarea
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Type any trainer remarks..."
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-dark-card border border-slate-300 dark:border-slate-600 rounded text-[11px] outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-900 dark:text-white font-semibold transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Offline notice warning inside confirmation */}
                {!isOnline && (
                  <div className="p-2 bg-accent/10 border border-accent/20 rounded text-[10px] text-accent flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p className="leading-tight">
                      Stored locally. Will auto-upload once internet returns.
                    </p>
                  </div>
                )}

                {/* TAP 3: Submit Confirmation */}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded font-bold text-[11px] shadow transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <UploadCloud size={14} />
                  Submit Confirmation
                </button>

              </form>

            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-500 mt-2 tracking-wide uppercase">Trainer Mobile App Simulator</span>
        </div>
      ) : (
        /* ==================== SESSIONS DIRECTORY LIST ==================== */
        <div className="space-y-4">
          
          {/* Header Directory Filters */}
          <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <select
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-md text-xs font-semibold outline-none"
              >
                <option value="All">All Schools</option>
                {schools.map(s => (
                  <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-60 relative">
              <select
                value={selectedProgFilter}
                onChange={(e) => setSelectedProgFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-md text-xs font-semibold outline-none"
              >
                <option value="All">All Programmes</option>
                <option value="Vocational">Vocational</option>
                <option value="Pre-Vocational">Pre-Vocational</option>
                <option value="Udyam">Udyam</option>
                <option value="Magic Touch">Magic Touch</option>
              </select>
            </div>
          </div>

          {/* Session Cards list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.length === 0 ? (
              <div className="col-span-full text-center py-12 text-xs text-slate-500">
                No sessions match selected filters.
              </div>
            ) : (
              filteredSessions.map(session => {
                const school = schools.find(s => s.code === session.schoolCode);
                return (
                  <div 
                    key={session.id} 
                    className={`bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-4 rounded-md shadow-sm relative flex flex-col justify-between h-auto min-h-[176px] ${
                      session.status === 'Completed' 
                        ? 'border-l-4 border-l-secondary' 
                        : session.status === 'Missed'
                        ? 'border-l-4 border-l-red-500'
                        : 'border-l-4 border-l-primary'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-slate-400">{session.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                          session.status === 'Completed'
                            ? 'bg-secondary/10 text-secondary'
                            : session.status === 'Missed'
                            ? 'bg-red-500/10 text-red-500'
                            : session.status === 'Scheduled'
                            ? 'bg-primary/10 text-primary animate-pulse'
                            : 'bg-accent/10 text-accent'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2.5 truncate">
                        {school ? school.name : session.schoolCode}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1 font-semibold capitalize bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border px-1.5 py-0.5 rounded inline-block">
                        {session.programme} • {session.subject}
                      </p>

                      {session.photoUrl && (
                        <div className="mt-3">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Classroom Observation</span>
                          <div className="relative rounded overflow-hidden border border-slate-200 dark:border-dark-border max-h-[100px] shadow-sm">
                            <img 
                              src={session.photoUrl} 
                              alt="Classroom Observation" 
                              className="w-full h-20 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                              onClick={() => setActivePhotoUrl(session.photoUrl || null)}
                            />
                          </div>
                        </div>
                      )}

                      {(session.status === 'Completed' || session.status === 'Conducted') && (
                        <div className="mt-3 space-y-1 text-[10px] text-slate-500 font-semibold border-t border-slate-200 dark:border-dark-border/40 pt-2 w-full">
                          {session.conductedBy && (
                            <span className="block">Conducted By: <span className="text-slate-900 dark:text-white font-bold">{session.conductedBy}</span></span>
                          )}
                          {session.remarks && (
                            <span className="block italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border p-1.5 rounded">Remarks: "{session.remarks}"</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-100 dark:border-dark-border/60 pt-3 mt-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {session.date} ({session.time})
                      </span>
                      {session.status === 'Scheduled' && (currentUser?.role === 'trainer' || currentUser?.role === 'super_admin') && (
                        <button
                          onClick={() => handleStartSessionConfirm(session)}
                          className="px-3 py-1.5 bg-primary text-white rounded text-[10px] font-bold hover:bg-primary-dark transition-all inline-flex items-center gap-1 shadow shadow-primary/20"
                        >
                          <Play size={10} fill="currentColor" />
                          Confirm Class
                        </button>
                      )}
                      {session.status === 'Completed' && (
                        <span className="text-[9px] text-slate-400">
                          {session.attendancePresent.length} students logged
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
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
