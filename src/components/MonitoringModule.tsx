import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { MonitoringVisit, School } from '../types';
import { ShieldCheck, Plus, MapPin, AlertCircle, FileText, CheckSquare, Star } from 'lucide-react';

export const MonitoringModule: React.FC = () => {
  const { t } = useAuth();
  
  // States
  const [visits, setVisits] = useState<MonitoringVisit[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [schoolCode, setSchoolCode] = useState('');
  const [fieldStaff, setFieldStaff] = useState('');
  const [observations, setObservations] = useState('');
  const [challenges, setChallenges] = useState('');
  const [actionItemStr, setActionItemStr] = useState('');
  const [rating, setRating] = useState(5);

  useEffect(() => {
    loadData();
    window.addEventListener('omp_db_pulled', loadData);
    return () => {
      window.removeEventListener('omp_db_pulled', loadData);
    };
  }, []);

  const loadData = () => {
    setVisits(db.getMonitoring());
    setSchools(db.getSchools());
  };

  const handleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode || !fieldStaff) return;

    const newVisit: MonitoringVisit = {
      id: 'MON' + Math.floor(100 + Math.random() * 900),
      schoolCode,
      visitDate: new Date().toISOString().split('T')[0],
      fieldStaffName: fieldStaff,
      observations,
      challenges,
      actionItems: actionItemStr.split(',').map(s => s.trim()).filter(Boolean),
      rating
    };

    db.saveMonitoringVisit(newVisit);
    loadData();
    setShowAddModal(false);

    // Reset forms
    setSchoolCode('');
    setFieldStaff('');
    setObservations('');
    setChallenges('');
    setActionItemStr('');
    setRating(5);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('monitoring')}</h1>
          <p className="text-sm text-slate-500 mt-1">Field visits audit reports, safety observations, and challenges tracking</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          <span>Log Audit Visit</span>
        </button>
      </div>

      {/* Grid of visits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visits.map(visit => {
          const school = schools.find(s => s.code === visit.schoolCode);
          return (
            <div 
              key={visit.id}
              className="bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-md shadow-sm relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-border/40 pb-2 mb-3">
                  <span className="text-[10px] font-mono text-slate-400">{visit.id} • {visit.visitDate}</span>
                  <div className="flex gap-0.5 text-yellow-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill={i < visit.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-green-500/10 text-green-500 flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">Visited: {school ? school.name : visit.schoolCode}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Auditor: {visit.fieldStaffName}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">General Observations:</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5">{visit.observations}</p>
                  </div>
                  
                  {visit.challenges && (
                    <div className="p-2.5 bg-red-500/5 border border-red-500/10 rounded flex items-start gap-2 text-red-500">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] text-slate-400 block font-semibold">Flagged Challenges:</span>
                        <p className="text-[11px] font-semibold mt-0.5">{visit.challenges}</p>
                      </div>
                    </div>
                  )}

                  {visit.actionItems.length > 0 && (
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold mb-1">Assigned Action Items:</span>
                      <div className="space-y-1">
                        {visit.actionItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                            <CheckSquare size={12} className="text-secondary" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- ADD AUDIT VISIT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[450px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h2 className="text-base font-bold font-heading mb-4 text-slate-900 dark:text-white">Log Audit Visit</h2>

            <form onSubmit={handleVisitSubmit} className="space-y-4">
              
              {/* Select School */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Inspected School *</label>
                <select
                  required
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  className="input-field"
                >
                  <option value="">Choose school...</option>
                  {schools.map(s => (
                    <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* Staff Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Auditor / Field Staff Name *</label>
                <input
                  type="text"
                  required
                  value={fieldStaff}
                  onChange={(e) => setFieldStaff(e.target.value)}
                  placeholder="Enter staff name"
                  className="input-field"
                />
              </div>

              {/* Observations */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Observations *</label>
                <textarea
                  rows={2}
                  required
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Summarize visual observations..."
                  className="input-field"
                />
              </div>

              {/* Challenges */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Challenges Detected</label>
                <input
                  type="text"
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  placeholder="e.g. Power grid fluctuations, Smartboard broke"
                  className="input-field"
                />
              </div>

              {/* Action items */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Action Items (comma separated)</label>
                <input
                  type="text"
                  value={actionItemStr}
                  onChange={(e) => setActionItemStr(e.target.value)}
                  placeholder="e.g. Contact electrician, Provide worksheets"
                  className="input-field"
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Cluster Grade/Rating (1-5 Star)</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="input-field"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (Good)</option>
                  <option value={3}>⭐⭐⭐ (Average)</option>
                  <option value={2}>⭐⭐ (Poor)</option>
                  <option value={1}>⭐ (Critical)</option>
                </select>
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
                  Save Audit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
