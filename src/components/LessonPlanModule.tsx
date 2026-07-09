import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import type { LessonPlan, ProgrammeName } from '../types';
import { 
  Plus, BookOpen, Film, FileText, Upload, Compass, 
  CheckCircle, ArrowUpRight, PlayCircle, Eye, Trash, RefreshCw,
  ExternalLink, FolderOpen, Sprout, Heart, ShoppingBag, ChevronDown, ChevronRight
} from 'lucide-react';

export const LessonPlanModule: React.FC = () => {
  const { hasPermission, t } = useAuth();
  
  // States
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const selectedPlanRef = useRef<LessonPlan | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<LessonPlan | null>(null);

  // Keep ref in sync so async callbacks always read the latest plan
  useEffect(() => {
    selectedPlanRef.current = selectedPlan;
  }, [selectedPlan]);
  const [selectedProgFilter, setSelectedProgFilter] = useState<ProgrammeName | 'All'>('All');
  
  // Forms states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<LessonPlan>>({
    programme: 'Vocational',
    subject: '',
    chapter: '',
    learningObjectives: [''],
    activities: [''],
    materialsRequired: [''],
    worksheets: [],
    videoUrl: '',
    status: 'Planned'
  });

  // Upload simulations states
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    const raw = db.getLessonPlans();
    setPlans(raw);
    if (raw.length > 0 && !selectedPlan) {
      setSelectedPlan(raw[0]);
    }
  };

  const handleToggleStatus = (id: string) => {
    const plan = db.getLessonPlans().find(p => p.id === id);
    if (!plan) return;

    const nextStatus: 'Planned' | 'Delivered' | 'Pending' = plan.status === 'Planned' 
      ? 'Delivered' 
      : plan.status === 'Delivered' 
      ? 'Pending' 
      : 'Planned';

    const updated: LessonPlan = { ...plan, status: nextStatus };
    db.saveLessonPlan(updated);
    
    // Update local state
    setSelectedPlan(updated);
    loadPlans();
    
    window.dispatchEvent(new CustomEvent('omp_toast_message', { 
      detail: `Lesson Plan status updated to: ${nextStatus}` 
    }));
  };

  // Mock doc upload
  const handleDocUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedPlanRef.current) return;
    
    const file = files[0];
    // Reset input so the same file can be re-selected later
    e.target.value = '';

    if (!file.name.match(/\.(docx|doc|pdf)$/i)) {
      alert('Please upload Word (.docx/.doc) or PDF documents only.');
      return;
    }

    // Capture the plan at upload-start via ref (always up-to-date)
    const planAtUploadStart = selectedPlanRef.current;

    setIsUploadingDoc(true);
    setUploadProgress(0);
    
    // Simulate upload ticks
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const next = prev + 30;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            // Use the captured plan reference, not stale closure
            const updatedPlan: LessonPlan = {
              ...planAtUploadStart,
              worksheets: [...planAtUploadStart.worksheets, file.name]
            };
            
            db.saveLessonPlan(updatedPlan);
            setSelectedPlan(updatedPlan);
            loadPlans();
            setUploadProgress(0);
            setIsUploadingDoc(false);
            
            window.dispatchEvent(new CustomEvent('omp_toast_message', { 
              detail: `Word worksheet '${file.name}' attached successfully!` 
            }));
          }, 400);
          return 100;
        }
        return next;
      });
    }, 200);
  };

  // Video adding submit
  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim() || !selectedPlan) return;

    const updatedPlan: LessonPlan = {
      ...selectedPlan,
      videoUrl: newVideoUrl.trim()
    };

    db.saveLessonPlan(updatedPlan);
    setSelectedPlan(updatedPlan);
    loadPlans();
    setNewVideoUrl('');
    setShowVideoInput(false);

    window.dispatchEvent(new CustomEvent('omp_toast_message', { 
      detail: 'Training video link attached successfully.' 
    }));
  };

  // Add lesson plan handles
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.subject || !newPlan.chapter) return;

    const planToSave: LessonPlan = {
      id: 'LP' + Math.floor(300 + Math.random() * 99),
      programme: newPlan.programme as ProgrammeName,
      subject: newPlan.subject,
      chapter: newPlan.chapter,
      learningObjectives: newPlan.learningObjectives?.filter(Boolean) || [],
      activities: newPlan.activities?.filter(Boolean) || [],
      materialsRequired: newPlan.materialsRequired?.filter(Boolean) || [],
      worksheets: newPlan.worksheets || [],
      videoUrl: newPlan.videoUrl || undefined,
      status: 'Planned'
    };

    db.saveLessonPlan(planToSave);
    loadPlans();
    setShowAddModal(false);

    // Reset Form
    setNewPlan({
      programme: 'Vocational',
      subject: '',
      chapter: '',
      learningObjectives: [''],
      activities: [''],
      materialsRequired: [''],
      worksheets: [],
      videoUrl: '',
      status: 'Planned'
    });
  };

  const handleArrayChange = (index: number, val: string, field: 'learningObjectives' | 'activities' | 'materialsRequired') => {
    const list = [...(newPlan[field] || [])];
    list[index] = val;
    setNewPlan({ ...newPlan, [field]: list });
  };

  const addArrayItem = (field: 'learningObjectives' | 'activities' | 'materialsRequired') => {
    const list = [...(newPlan[field] || []), ''];
    setNewPlan({ ...newPlan, [field]: list });
  };

  // Filtering
  const filteredPlans = plans.filter(p => {
    return selectedProgFilter === 'All' || p.programme === selectedProgFilter;
  });

  // ── Pre-Vocational subject grouping ──────────────────────────────────────
  const PV_SUBJECTS = [
    { key: 'Agriculture',                   label: 'Agriculture',                    icon: Sprout,      color: 'emerald', driveUrl: 'https://drive.google.com/drive/folders/1Aq-J4ZqDMnVOtqMRe9iUIvSSnNnCDXqV' },
    { key: 'Home and Health',               label: 'Home and Health',                icon: Heart,       color: 'rose',    driveUrl: 'https://drive.google.com/drive/folders/1l7Afb9WhO4_2U7SgOcp4YKNVsUfsQh2t' },
    { key: 'Trade, Commerce and Technology',label: 'Trade, Commerce & Technology',  icon: ShoppingBag, color: 'blue',    driveUrl: 'https://drive.google.com/drive/folders/1dQm0fTgYPgUElAFxUzO6AoeKiwETgRle' },
  ];
  const [expandedSubject, setExpandedSubject] = useState<string | null>('Agriculture');
  const pvPlans = plans.filter(p => p.programme === 'Pre-Vocational');

  const pvBySubject = (subject: string) =>
    pvPlans.filter(p => p.subject === subject).sort((a, b) => a.chapter.localeCompare(b.chapter));

  // Colour helpers
  const subjectColor = (color: string) => ({
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    rose:    'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400',
    blue:    'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  } as Record<string, string>)[color] || 'bg-primary/10 border-primary/20 text-primary';

  const subjectHeaderColor = (color: string) => ({
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
    rose:    'from-rose-500/10 to-rose-500/5 border-rose-500/20',
    blue:    'from-blue-500/10 to-blue-500/5 border-blue-500/20',
  } as Record<string, string>)[color] || 'from-primary/10 to-primary/5 border-primary/20';

  const subjectIconColor = (color: string) => ({
    emerald: 'text-emerald-500',
    rose:    'text-rose-500',
    blue:    'text-blue-500',
  } as Record<string, string>)[color] || 'text-primary';


  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('lesson_plans')}</h1>
          <p className="text-sm text-slate-500 mt-1">Configure study syllabi, worksheets, and training videos</p>
        </div>
        {hasPermission('Add Students') && (
          <button 
            onClick={() => {
              setNewPlan(prev => ({ ...prev, programme: selectedProgFilter !== 'All' ? selectedProgFilter as ProgrammeName : 'Pre-Vocational' }));
              setShowAddModal(true);
            }}
            className="btn-primary"
          >
            <Plus size={18} />
            <span>Create Lesson Plan</span>
          </button>
        )}
      </div>

      {/* Main Roster Split layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Grid List */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Header filters */}
          <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter Programme:</span>
              <select
                value={selectedProgFilter}
                onChange={(e) => setSelectedProgFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-md text-xs font-semibold focus:border-primary outline-none"
              >
                <option value="All">All Programmes</option>
                <option value="Vocational">Vocational</option>
                <option value="Pre-Vocational">Pre-Vocational</option>
                <option value="Udyam">Udyam</option>
                <option value="Magic Touch">Magic Touch</option>
              </select>
            </div>
            
            <Compass size={18} className="text-slate-400" />
          </div>

          {/* ═══════ PRE-VOCATIONAL SUBJECT GROUPS ═══════ */}
          {(selectedProgFilter === 'Pre-Vocational' || selectedProgFilter === 'All') && pvPlans.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <FolderOpen size={12} className="text-primary" />
                Pre-Vocational Curriculum — Google Drive Library
              </p>

              {PV_SUBJECTS.map(subj => {
                const Icon = subj.icon;
                const subjectPlans = pvBySubject(subj.key);
                const isExpanded = expandedSubject === subj.key;

                return (
                  <div key={subj.key} className={`rounded-xl border bg-gradient-to-br ${subjectHeaderColor(subj.color)} overflow-hidden`}>
                    {/* Subject header */}
                    <div
                      className="flex items-center justify-between p-3.5 cursor-pointer select-none"
                      onClick={() => setExpandedSubject(isExpanded ? null : subj.key)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${subjectColor(subj.color)} border`}>
                          <Icon size={14} className={subjectIconColor(subj.color)} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white">{subj.label}</p>
                          <p className="text-[9px] text-slate-400 font-medium mt-0.5">{subjectPlans.length} grades • New Format, Gujarati</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={subj.driveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-md bg-white/70 dark:bg-dark-card/60 hover:bg-white dark:hover:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-300 hover:text-primary transition-all"
                        >
                          <ExternalLink size={10} />
                          Google Drive
                        </a>
                        {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                      </div>
                    </div>

                    {/* Grade cards */}
                    {isExpanded && (
                      <div className="border-t border-slate-200/60 dark:border-dark-border/40 p-3 grid grid-cols-3 gap-2">
                        {subjectPlans.map(plan => (
                          <div
                            key={plan.id}
                            onClick={() => { setSelectedPlan(plan); setShowVideoInput(false); }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                              selectedPlan?.id === plan.id
                                ? `border-2 ${subjectColor(subj.color).replace('bg-', 'border-').split(' ')[0]} ring-2 ring-primary/10 bg-white dark:bg-dark-card`
                                : 'border-slate-200 dark:border-dark-border bg-white/80 dark:bg-dark-card/50 hover:bg-white dark:hover:bg-dark-card'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-1.5">
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${subjectColor(subj.color)} border`}>
                                {plan.chapter.match(/Grade \d+/)?.[0] || 'Grade'}
                              </span>
                              <span className={`w-2 h-2 rounded-full ${plan.status === 'Delivered' ? 'bg-green-500' : plan.status === 'Pending' ? 'bg-amber-500' : 'bg-slate-300'}`} title={plan.status} />
                            </div>
                            <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 leading-tight mt-1">
                              {plan.worksheets.length} doc{plan.worksheets.length !== 1 ? 's' : ''}
                            </p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{plan.status}</p>
                          </div>
                        ))}
                        {subjectPlans.length === 0 && (
                          <p className="col-span-3 text-xs text-slate-400 italic p-2">No plans found for this subject.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {(selectedProgFilter === 'Pre-Vocational') && (
                <div className="border-b border-slate-200 dark:border-dark-border my-1" />
              )}
            </div>
          )}

          {/* Non-PV plans OR all plans when filter isn't PV */}
          {filteredPlans.filter(p => p.programme !== 'Pre-Vocational' || selectedProgFilter !== 'Pre-Vocational').length > 0 && (
            <>
              {selectedProgFilter === 'All' && (
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Other Programmes</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlans
                  .filter(p => selectedProgFilter !== 'Pre-Vocational' ? p.programme !== 'Pre-Vocational' : false)
                  .map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => { setSelectedPlan(plan); setShowVideoInput(false); }}
                    className={`bg-white dark:bg-dark-surface p-5 border rounded-md shadow-sm cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-md ${
                      selectedPlan?.id === plan.id 
                        ? 'border-2 border-primary ring-2 ring-primary/10' 
                        : 'border-slate-200 dark:border-dark-border'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-slate-400">{plan.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold capitalize ${
                        plan.status === 'Delivered'
                          ? 'bg-green-500/10 text-green-500'
                          : plan.status === 'Pending'
                          ? 'bg-amber-500/10 text-accent font-bold'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {plan.status}
                      </span>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-3 truncate">{plan.chapter}</h3>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-1.5 py-0.5 rounded capitalize">
                        {plan.programme}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate w-32 font-medium">{plan.subject}</span>
                    </div>

                    <div className="flex gap-4 pt-3 border-t border-slate-100 dark:border-dark-border/40 mt-4 text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1"><FileText size={12} className="text-primary" /> {plan.worksheets.length} Worksheets</span>
                      <span className="flex items-center gap-1"><Film size={12} className="text-accent" /> {plan.videoUrl ? '1 Video' : 'No Video'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        {/* Right Detail Card Drawer */}
        <div className="xl:col-span-1">
          {selectedPlan ? (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-dark-border">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{selectedPlan.id} • Syllabus Details</span>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white truncate mt-1">{selectedPlan.chapter}</h2>
                  <p className="text-[11px] text-slate-500 mt-1 capitalize font-bold bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border inline-block px-2 py-0.5 rounded">
                    Prog: {selectedPlan.programme} ({selectedPlan.subject})
                  </p>
                </div>
                
                <button
                  onClick={() => handleToggleStatus(selectedPlan.id)}
                  className="px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-[9px] font-bold uppercase transition-all"
                  title="Toggle Delivery status target"
                >
                  {selectedPlan.status}
                </button>
              </div>

              {/* Objectives */}
              <div className="space-y-2.5">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Objectives</span>
                <ul className="list-disc pl-4 text-xs space-y-1 font-medium text-slate-700 dark:text-slate-350">
                  {selectedPlan.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              {/* Activities */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-dark-border">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Lesson Activities</span>
                <ul className="list-decimal pl-4 text-xs space-y-1 font-medium text-slate-700 dark:text-slate-350">
                  {selectedPlan.activities.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* Word Worksheets & Files Upload Container */}
              <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-dark-border">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Word Docs & Worksheets ({selectedPlan.worksheets.length})</span>
                  <FileText size={16} className="text-slate-400" />
                </div>
                
                {/* Seeded files list */}
                <div className="space-y-1.5">
                  {selectedPlan.worksheets.map((doc, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 dark:bg-dark-card border border-slate-150 dark:border-dark-border rounded flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold truncate w-44">{doc}</span>
                      <div className="flex items-center gap-2">
                        {/* If it's a PV seeded plan, show a real Google Drive link */}
                        {(selectedPlan as any).driveFileId ? (
                          <a
                            href={`https://drive.google.com/drive/folders/${(selectedPlan as any).driveFileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 text-[10px]"
                          >
                            Drive <ExternalLink size={11} />
                          </a>
                        ) : (
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); alert(`Simulating file download of: '${doc}'`); }}
                            className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 text-[10px]"
                          >
                            Open <ArrowUpRight size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedPlan.worksheets.length === 0 && (
                    <span className="text-slate-500 block text-xs">No documents uploaded.</span>
                  )}
                </div>

                {/* Simulated Document Upload Dropzone */}
                {isUploadingDoc ? (
                  <div className="p-3 bg-slate-100 dark:bg-dark-card rounded border border-slate-200 dark:border-dark-border text-center space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 animate-pulse block">Uploading Worksheet Docx...</span>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 dark:border-dark-border hover:border-primary p-3 rounded-md flex flex-col items-center justify-center gap-1.5 cursor-pointer text-slate-500 hover:text-primary transition-all">
                    <Upload size={18} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Attach Word Document (.docx)</span>
                    <input
                      type="file"
                      accept=".docx,.doc,.pdf"
                      onChange={handleDocUploadSim}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Training Videos Section */}
              <div className="space-y-3.5 pt-3 border-t border-slate-100 dark:border-dark-border">
                <div className="flex justify-between items-center">
                  <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Training Videos</span>
                  <Film size={16} className="text-slate-400" />
                </div>

                {selectedPlan.videoUrl ? (
                  <div className="space-y-2.5">
                    {/* Visual Mock Video Player overlay */}
                    <div className="relative w-full aspect-video bg-slate-950 rounded-md overflow-hidden flex items-center justify-center group border border-slate-800">
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-400 bg-black/40 group-hover:bg-black/60 transition-all select-none">
                        <PlayCircle size={36} className="text-white shrink-0 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all" onClick={() => alert(`Simulating play of linked training video: ${selectedPlan.videoUrl}`)} />
                        <span className="text-[9px] font-bold uppercase tracking-wider mt-1.5">{selectedPlan.chapter}</span>
                        <span className="text-[8px] opacity-70 font-mono">{selectedPlan.videoUrl}</span>
                      </div>
                    </div>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => {
                        const updated: LessonPlan = { ...selectedPlan, videoUrl: undefined };
                        db.saveLessonPlan(updated);
                        setSelectedPlan(updated);
                        loadPlans();
                        window.dispatchEvent(new CustomEvent('omp_toast_message', { detail: 'Training video removed.' }));
                      }}
                      className="text-red-500 hover:text-red-600 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Trash size={12} />
                      <span>Remove Video Link</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showVideoInput ? (
                      <form onSubmit={handleAddVideo} className="flex gap-2">
                        <input
                          type="url"
                          required
                          placeholder="Paste YouTube or video link..."
                          value={newVideoUrl}
                          onChange={(e) => setNewVideoUrl(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-dark-card border border-slate-205 dark:border-dark-border rounded text-xs outline-none focus:border-primary text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded"
                        >
                          Attach
                        </button>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowVideoInput(true)}
                        className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-bold flex items-center justify-center gap-1 transition-all border border-slate-200 dark:border-slate-700"
                      >
                        <Plus size={14} />
                        Attach Training Video Link
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-slate-100/50 dark:bg-dark-surface/40 border border-dashed border-slate-200 dark:border-dark-border p-12 rounded-md text-center text-xs text-slate-500">
              Select a lesson plan from the sidebar to inspect training objectives, worksheets documents, and class video media.
            </div>
          )}
        </div>

      </div>

      {/* --- ADD LESSON PLAN MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[550px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h2 className="text-base font-bold font-heading mb-4 text-slate-900 dark:text-white">Create New Lesson Syllabus</h2>

            <form onSubmit={handleAddSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target Programme *</label>
                  <select
                    value={newPlan.programme}
                    onChange={(e) => setNewPlan({ ...newPlan, programme: e.target.value as any })}
                    className="input-field animate-fadeIn"
                  >
                    <option value="Vocational">Vocational</option>
                    <option value="Pre-Vocational">Pre-Vocational</option>
                    <option value="Udyam">Udyam</option>
                    <option value="Magic Touch">Magic Touch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name *</label>
                  <input
                    type="text"
                    required
                    value={newPlan.subject}
                    onChange={(e) => setNewPlan({ ...newPlan, subject: e.target.value })}
                    placeholder="e.g. IT Literacy Basics"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Chapter Title *</label>
                <input
                  type="text"
                  required
                  value={newPlan.chapter}
                  onChange={(e) => setNewPlan({ ...newPlan, chapter: e.target.value })}
                  placeholder="e.g. Chapter 4: File Managers & Systems"
                  className="input-field"
                />
              </div>

              {/* Dynamic Objectives input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-500">Learning Objectives *</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('learningObjectives')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    + Add objective
                  </button>
                </div>
                {newPlan.learningObjectives?.map((obj, i) => (
                  <input
                    key={i}
                    type="text"
                    required
                    value={obj}
                    onChange={(e) => handleArrayChange(i, e.target.value, 'learningObjectives')}
                    placeholder={`Objective ${i + 1}`}
                    className="input-field"
                  />
                ))}
              </div>

              {/* Dynamic Activities input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-500">Activities *</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('activities')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    + Add activity
                  </button>
                </div>
                {newPlan.activities?.map((act, i) => (
                  <input
                    key={i}
                    type="text"
                    required
                    value={act}
                    onChange={(e) => handleArrayChange(i, e.target.value, 'activities')}
                    placeholder={`Activity ${i + 1}`}
                    className="input-field"
                  />
                ))}
              </div>

              {/* Dynamic Materials input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-slate-500">Materials Required *</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('materialsRequired')}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    + Add material
                  </button>
                </div>
                {newPlan.materialsRequired?.map((mat, i) => (
                  <input
                    key={i}
                    type="text"
                    required
                    value={mat}
                    onChange={(e) => handleArrayChange(i, e.target.value, 'materialsRequired')}
                    placeholder={`Material ${i + 1}`}
                    className="input-field"
                  />
                ))}
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Training Video URL Reference (Optional)</label>
                <input
                  type="url"
                  value={newPlan.videoUrl}
                  onChange={(e) => setNewPlan({ ...newPlan, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                  className="input-field"
                />
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
                  Save Syllabus
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
