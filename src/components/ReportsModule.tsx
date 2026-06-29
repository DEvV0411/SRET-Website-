import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { Download, FileSpreadsheet, FileText, Settings, RefreshCw } from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const { t } = useAuth();
  
  // States
  const [selectedProg, setSelectedProg] = useState('All');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [reportType, setReportType] = useState('impact');
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | null>(null);

  const triggerExport = (format: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    setExportFormat(format);

    // Simulate PDF generation/Excel calculation delay
    setTimeout(() => {
      setIsGenerating(false);
      setExportFormat(null);
      
      const formatLabel = format.toUpperCase();
      const reportLabel = reportType.charAt(0).toUpperCase() + reportType.slice(1);
      
      // Fire visual toast trigger
      window.dispatchEvent(new CustomEvent('omp_toast_message', { 
        detail: `Successfully downloaded ${reportLabel} Report in ${formatLabel} format!` 
      }));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('reports')}</h1>
          <p className="text-sm text-slate-500 mt-1">OMP Centralized Reporting Engine (Donor & Impact logs exports)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left side Filter Panel */}
        <div className="lg:col-span-1 bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-md shadow-sm space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Report Parameters</h2>
          
          {/* Report Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Report Module Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="input-field font-semibold"
            >
              <option value="impact">Donor Impact Report</option>
              <option value="attendance">Monthly Attendance Ledger</option>
              <option value="inventory">Stock Inward/Outward Ledger</option>
              <option value="counselling">Career Counselling Logs</option>
              <option value="sessions">Session Completion Audit</option>
            </select>
          </div>

          {/* Scopes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Programme Filter</label>
            <select
              value={selectedProg}
              onChange={(e) => setSelectedProg(e.target.value)}
              className="input-field"
            >
              <option value="All">All Programmes</option>
              <option value="Vocational">Vocational</option>
              <option value="Pre-Vocational">Pre-Vocational</option>
              <option value="Udyam">Udyam</option>
              <option value="Magic Touch">Magic Touch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target School</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="input-field"
            >
              <option value="All">All Schools</option>
              {db.getSchools().map(s => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-dark-border/60 space-y-3">
            <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Export Document</span>
            
            {isGenerating ? (
              <div className="py-2.5 bg-slate-100 dark:bg-dark-card rounded text-xs font-bold text-slate-500 flex items-center justify-center gap-2 border border-slate-200 dark:border-dark-border">
                <RefreshCw size={14} className="animate-spin" />
                <span>Compiling {exportFormat?.toUpperCase()}...</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => triggerExport('pdf')}
                  className="py-2.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold shadow flex flex-col items-center gap-1.5 transition-all"
                >
                  <FileText size={16} />
                  PDF Format
                </button>
                <button
                  onClick={() => triggerExport('excel')}
                  className="py-2.5 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold shadow flex flex-col items-center gap-1.5 transition-all"
                >
                  <FileSpreadsheet size={16} />
                  Excel Sheet
                </button>
                <button
                  onClick={() => triggerExport('csv')}
                  className="py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded text-[10px] font-bold shadow flex flex-col items-center gap-1.5 transition-all"
                >
                  <Download size={16} />
                  CSV File
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right side Preview Roster */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-surface p-5 border border-slate-200 dark:border-dark-border rounded-md shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-dark-border/40">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Grid Preview</h2>
            <Settings size={14} className="text-slate-400" />
          </div>

          <div className="space-y-4">
            {reportType === 'impact' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-md">
                  <h3 className="font-bold text-slate-900 dark:text-white">Summary Indicator: NGO Educational Metrics</h3>
                  <div className="grid grid-cols-2 gap-4 mt-3 font-semibold text-slate-700 dark:text-slate-300">
                    <div>Enrolled Students: <span className="font-extrabold text-slate-900 dark:text-white">{db.getStudents().length}</span></div>
                    <div>Active Roster: <span className="font-extrabold text-slate-900 dark:text-white">{db.getStudents().filter(s => s.alumniStatus === 'Active').length}</span></div>
                    <div>Avg Attendance Rate: <span className="font-extrabold text-slate-900 dark:text-white">88%</span></div>
                    <div>Sessions Delivered: <span className="font-extrabold text-slate-900 dark:text-white">{db.getSessions().filter(s => s.status === 'Completed').length}</span></div>
                  </div>
                </div>

                <div className="border border-slate-100 dark:border-dark-border rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border font-bold">
                      <tr>
                        <th className="p-2">School</th>
                        <th className="p-2">District</th>
                        <th className="p-2">Completed Sessions</th>
                        <th className="p-2 text-right">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                      {db.getSchools().map(s => (
                        <tr key={s.code}>
                          <td className="p-2 font-bold">{s.name}</td>
                          <td className="p-2 capitalize">{s.district}</td>
                          <td className="p-2">{s.sessionsConducted} / {s.sessionsTarget}</td>
                          <td className="p-2 text-right font-bold text-secondary">78%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType === 'attendance' && (
              <div className="space-y-4">
                <div className="border border-slate-100 dark:border-dark-border rounded overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border font-bold">
                      <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Student Name</th>
                        <th className="p-2">District</th>
                        <th className="p-2 text-right">Attendance Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-dark-border">
                      {db.getStudents().map(s => (
                        <tr key={s.studentId}>
                          <td className="p-2 font-mono">{s.studentId}</td>
                          <td className="p-2 font-bold">{s.name}</td>
                          <td className="p-2 capitalize text-slate-500">{s.district}</td>
                          <td className="p-2 text-right">
                            <span className={`font-bold ${s.attendancePercentage < 75 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                              {s.attendancePercentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportType !== 'impact' && reportType !== 'attendance' && (
              <div className="text-center py-12 text-xs text-slate-500">
                Rendering grid view preview for selected parameter... Click export to generate file.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
