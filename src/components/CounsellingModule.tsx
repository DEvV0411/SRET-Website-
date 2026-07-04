import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { CounsellingRecord, Student } from '../types';
import { HeartHandshake, Calendar, Plus, UserPlus, Clipboard, CheckCircle2 } from 'lucide-react';

export const CounsellingModule: React.FC = () => {
  const { t } = useAuth();
  
  // States
  const [records, setRecords] = useState<CounsellingRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [counsellorName, setCounsellorName] = useState('');
  const [aspirations, setAspirations] = useState('');
  const [parentCounselling, setParentCounselling] = useState('');
  const [coursesStr, setCoursesStr] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [nextDate, setNextDate] = useState('');

  useEffect(() => {
    loadData();
    window.addEventListener('omp_db_pulled', loadData);
    return () => {
      window.removeEventListener('omp_db_pulled', loadData);
    };
  }, []);

  const loadData = () => {
    setRecords(db.getCounselling());
    setStudents(db.getStudents());
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !counsellorName) return;

    const newRecord: CounsellingRecord = {
      id: 'CNS' + Math.floor(100 + Math.random() * 900),
      studentId: selectedStudentId,
      counsellorName,
      sessionDate: new Date().toISOString().split('T')[0],
      studentAspirations: aspirations,
      suggestedCourses: coursesStr.split(',').map(s => s.trim()).filter(Boolean),
      parentCounsellingDetails: parentCounselling || undefined,
      followUpStatus: status,
      nextFollowUpDate: nextDate || undefined
    };

    db.saveCounsellingRecord(newRecord);
    loadData();
    setShowAddModal(false);

    // Reset forms
    setSelectedStudentId('');
    setCounsellorName('');
    setAspirations('');
    setParentCounselling('');
    setCoursesStr('');
    setStatus('Pending');
    setNextDate('');
  };

  const handleToggleStatus = (id: string) => {
    const record = db.getCounselling().find(r => r.id === id);
    if (!record) return;

    const nextStatus = record.followUpStatus === 'Pending' 
      ? 'In Progress' 
      : record.followUpStatus === 'In Progress' 
      ? 'Completed' 
      : 'Pending';

    db.saveCounsellingRecord({
      ...record,
      followUpStatus: nextStatus
    });
    loadData();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('counselling')}</h1>
          <p className="text-sm text-slate-500 mt-1">Manage career guidance journal files, psychometrics, and parent sessions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Log Counselling Session</span>
        </button>
      </div>

      {/* Grid records */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records.map(record => {
          const student = students.find(s => s.studentId === record.studentId);
          return (
            <div 
              key={record.id}
              className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border/40 pb-2 mb-3">
                  <span className="text-[9px] font-mono text-slate-400">{record.id} • {record.sessionDate}</span>
                  <button
                    onClick={() => handleToggleStatus(record.id)}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all ${
                      record.followUpStatus === 'Completed'
                        ? 'bg-green-500/10 text-green-500'
                        : record.followUpStatus === 'In Progress'
                        ? 'bg-amber-500/10 text-amber-500 animate-pulse'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {record.followUpStatus}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-pink-500/10 text-pink-500 flex items-center justify-center font-bold text-sm shrink-0">
                    {student ? student.name.charAt(0) : '?'}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{student ? student.name : 'Unknown Student'}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Counsellor: {record.counsellorName}</p>
                  </div>
                </div>

                <div className="space-y-2 mt-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Student Aspirations:</span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{record.studentAspirations}</p>
                  </div>
                  {record.parentCounsellingDetails && (
                    <div className="p-2.5 bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded">
                      <span className="text-[9px] text-slate-400 block font-semibold">Parent Conversation Details:</span>
                      <p className="text-slate-600 dark:text-slate-400 italic text-[11px] mt-0.5">{record.parentCounsellingDetails}</p>
                    </div>
                  )}
                  {record.suggestedCourses.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {record.suggestedCourses.map((c, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {record.nextFollowUpDate && (
                <div className="border-t border-slate-100 dark:border-dark-border/60 pt-3 mt-4 text-[10px] text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary shrink-0" />
                  <span>Next Follow-Up target: <span className="font-bold text-slate-900 dark:text-white">{record.nextFollowUpDate}</span></span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- ADD COUNSELLING MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[450px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h2 className="text-base font-bold font-heading mb-4 text-slate-900 dark:text-white">Log Guidance Session</h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              {/* Select Student */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Student *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose student...</option>
                  {students.map(s => (
                    <option key={s.studentId} value={s.studentId}>{s.name} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              {/* Counsellor Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Counsellor Name *</label>
                <input
                  type="text"
                  required
                  value={counsellorName}
                  onChange={(e) => setCounsellorName(e.target.value)}
                  placeholder="Enter counsellor name"
                  className="input-field"
                />
              </div>

              {/* Aspirations */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Student Career Goals / Aspirations</label>
                <input
                  type="text"
                  value={aspirations}
                  onChange={(e) => setAspirations(e.target.value)}
                  placeholder="e.g. Cyber Cafe, Tech Support"
                  className="input-field"
                />
              </div>

              {/* Parent notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Parent Discussion Notes</label>
                <textarea
                  rows={2}
                  value={parentCounselling}
                  onChange={(e) => setParentCounselling(e.target.value)}
                  placeholder="Notes from discussion with mother/father regarding career supporting..."
                  className="input-field"
                />
              </div>

              {/* Suggested courses */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Recommended Training Courses (comma separated)</label>
                <input
                  type="text"
                  value={coursesStr}
                  onChange={(e) => setCoursesStr(e.target.value)}
                  placeholder="e.g. Tally Training, Spoken English"
                  className="input-field"
                />
              </div>

              {/* Status and dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Follow-Up Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Next Follow-Up Date</label>
                  <input
                    type="date"
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-border/60">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Save Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
