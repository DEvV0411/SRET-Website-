import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { Sparkles, BrainCircuit, PlayCircle, Send, Copy, RefreshCw, AlertCircle } from 'lucide-react';

export const AIAssistant: React.FC = () => {
  const { currentUser } = useAuth();
  
  // States
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (type: 'narrative' | 'prediction' | 'intervention') => {
    setLoading(true);
    
    // Simulate LLM processing latency
    setTimeout(() => {
      setLoading(false);
      
      const rawStudents = db.getStudents();
      const rawSessions = db.getSessions();
      
      if (type === 'narrative') {
        const completedCount = rawSessions.filter(s => s.status === 'Completed').length;
        setOutput(
          `**OMP IMPACT NARRATIVE**\n` +
          `Date Generated: ${new Date().toLocaleDateString()}\n\n` +
          `During the current audit cycle, the OMP platform facilitated the execution of **${completedCount} educational sessions** across rural schools. ` +
          `Notably, at Dholera Rural High School, average student capabilities showed substantial gains: baseline diagnostic scores rose from an average of **42% to a final endline index of 78%**, representing a **+36% improvement** in core technical competencies.\n\n` +
          `Vocational alignment remains strong, with leading student career aspirations focused on localized digital entrepreneurship (Cyber Cafe Operators, Solar Agency Technicians) supported by parent backing logs.`
        );
      } else if (type === 'prediction') {
        // Find critical attendance students
        const criticalList = rawStudents.filter(s => s.attendancePercentage < 75);
        const names = criticalList.map(s => `${s.name} (${s.attendancePercentage}% attendance, standard ${s.standard} at ${s.schoolCode})`).join('\n* ');
        
        setOutput(
          `**AI STUDENT RISK PREDICTIONS**\n\n` +
          `Based on algorithmic attendance models, the following students are flagged at **HIGH RISK** of dropping out:\n\n` +
          `* ${names}\n\n` +
          `**Predictive Indicators Identified:**\n` +
          `1. Agricultural harvesting cycles in Surendranagar have historically triggered temporary absenteeism which often converts to permanent dropouts without quick field checks.\n` +
          `2. Low score progression matches low attendance trends.\n\n` +
          `**Recommended Action:** Trigger parent counselling checklist immediately and coordinate with logistics drivers to ensure route coverage.`
        );
      } else if (type === 'intervention') {
        setOutput(
          `**AI INTERVENTION RECOMMENDATIONS**\n\n` +
          `* **Inventory Action:** Electronics Breadboard Kit is currently low (4 Boxes remaining). Pre-order 10 additional kits immediately to prevent halting Vocational lab chapters planned for mid-July.\n` +
          `* **Class Recovery:** Reschedule Udyam Session SES203 at Limdi Secondary school (Status: Missed). The trainer should coordinate a replacement session on next Thursday.`
        );
      }
    }, 1200);
  };

  const handleCustomPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOutput(
        `**AI CUSTOM DRAFT**\n` +
        `Response to query: "${prompt}"\n\n` +
        `Here is the automated draft based on current OMP database stats:\n` +
        `The regional education metrics show that the schools running 'Vocational' and 'Udyam' projects are executing on-target. Principal contacts show high satisfaction ratings. Minor transportation bottlenecks have been resolved by driver routing logs.`
      );
      setPrompt('');
    }, 1500);
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-dark-border/40">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-primary animate-pulse" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">OMP AI Copilot</h2>
        </div>
        <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
          <Sparkles size={10} /> Active
        </span>
      </div>

      {/* Preset Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleGenerate('narrative')}
          className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded hover:border-primary text-[10px] font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all text-slate-700 dark:text-slate-200"
        >
          <PlayCircle size={16} className="text-secondary" />
          Draft Narrative
        </button>
        <button
          onClick={() => handleGenerate('prediction')}
          className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded hover:border-primary text-[10px] font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all text-slate-700 dark:text-slate-200"
        >
          <AlertCircle size={16} className="text-red-500" />
          Predict Risks
        </button>
        <button
          onClick={() => handleGenerate('intervention')}
          className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded hover:border-primary text-[10px] font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all text-slate-700 dark:text-slate-200"
        >
          <Sparkles size={16} className="text-accent" />
          Suggest Actions
        </button>
      </div>

      {/* Output Console Box */}
      <div className="relative">
        <div className="min-h-48 max-h-72 overflow-y-auto bg-slate-950 text-slate-300 font-mono text-[11px] p-4 rounded border border-slate-800 leading-relaxed whitespace-pre-wrap">
          {loading ? (
            <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-primary" />
              <span>Querying local database models...</span>
            </div>
          ) : output ? (
            output
          ) : (
            <span className="text-slate-600 italic">
              Select one of the preset generation metrics above or type a custom drafting query below...
            </span>
          )}
        </div>

        {output && !loading && (
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <span className="text-[10px] font-bold px-1 text-green-500">Copied!</span> : <Copy size={12} />}
          </button>
        )}
      </div>

      {/* Interactive custom prompt form */}
      <form onSubmit={handleCustomPromptSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask AI (e.g. 'Draft Dholera school report')"
          className="flex-1 px-3 py-2 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-md text-xs outline-none focus:border-primary text-slate-900 dark:text-white"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-md flex items-center justify-center shrink-0"
        >
          <Send size={14} />
        </button>
      </form>

    </div>
  );
};
