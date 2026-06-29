import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { Student, School, ProgrammeName } from '../types';
import { Search, Filter, Plus, ArrowUpRight, GraduationCap, Phone, MapPin, ClipboardList, BookOpen, AlertCircle } from 'lucide-react';

export const StudentModule: React.FC = () => {
  const { currentUser, hasPermission, t } = useAuth();
  
  // States
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [selectedProg, setSelectedProg] = useState<ProgrammeName | 'All'>('All');
  const [selectedStandard, setSelectedStandard] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Add student form modal
  const [showAddModal, setShowAddModal] = useState(false);
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
    stream: 'None',
    attendancePercentage: 100,
    baselineScore: undefined,
    endlineScore: undefined,
    aspirations: '',
    suggestedCourses: [],
    postStatus: 'Higher Education',
    alumniStatus: 'Active',
    governmentSchemeParticipation: [],
    exams: [],
    certificates: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    let rawStudents = db.getStudents();
    let rawSchools = db.getSchools();

    // Role scoping (trainer sees only assigned schools)
    if (currentUser?.role === 'trainer' || currentUser?.role === 'programme_coordinator') {
      const assigned = currentUser.assignedSchools;
      rawStudents = rawStudents.filter(s => assigned.includes(s.schoolCode));
      rawSchools = rawSchools.filter(s => assigned.includes(s.code));
    }
    
    setStudents(rawStudents);
    setSchools(rawSchools);
  };

  // Filter students based on UI selections
  const filteredStudents = students.filter(student => {
    // Search filter
    const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) || 
                          student.studentId.toLowerCase().includes(search.toLowerCase());
    
    // School filter
    const matchesSchool = selectedSchool === 'All' || student.schoolCode === selectedSchool;
    
    // Standard filter
    const matchesStandard = selectedStandard === 'All' || student.standard === selectedStandard;

    // Programme filter
    const sch = schools.find(sc => sc.code === student.schoolCode);
    const matchesProg = selectedProg === 'All' || (sch && sch.runningProgrammes.includes(selectedProg));

    return matchesSearch && matchesSchool && matchesStandard && matchesProg;
  });

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.schoolCode) return;

    const studentToSave: Student = {
      ...(newStudent as Student),
      studentId: 'STU' + Math.floor(100 + Math.random() * 900),
      enrollmentDate: new Date().toISOString().split('T')[0],
      attendancePercentage: Number(newStudent.attendancePercentage) || 100
    };

    db.saveStudent(studentToSave);
    loadData();
    setShowAddModal(false);
    
    // Reset form
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
      stream: 'None',
      attendancePercentage: 100,
      baselineScore: undefined,
      endlineScore: undefined,
      aspirations: '',
      suggestedCourses: [],
      postStatus: 'Higher Education',
      alumniStatus: 'Active',
      governmentSchemeParticipation: [],
      exams: [],
      certificates: []
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Module Title Row */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('students')}</h1>
          <p className="text-sm text-slate-500 mt-1">Student roster registry and post-programme tracking</p>
        </div>
        {hasPermission('Add Students') && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        )}
      </div>

      {/* Roster Layout Split grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left side list & filter console */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Filters Dashboard Panel */}
          <div className="bg-white dark:bg-dark-surface p-4 border border-slate-200 dark:border-dark-border rounded-md shadow-sm space-y-3">
            
            {/* Search and Core filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search students by name or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-md text-sm outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>

              {/* School filter dropdown */}
              <div className="w-full sm:w-48 relative">
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-md text-sm font-semibold outline-none appearance-none"
                >
                  <option value="All">All Schools</option>
                  {schools.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 pointer-events-none">
                  <Filter size={14} />
                </span>
              </div>
            </div>

            {/* Sub filters standard & program */}
            <div className="flex gap-4 text-xs font-semibold text-slate-500">
              {/* Program */}
              <div className="flex items-center gap-2">
                <span>Programme:</span>
                <select 
                  value={selectedProg}
                  onChange={(e) => setSelectedProg(e.target.value as any)}
                  className="bg-transparent border-none text-slate-700 dark:text-slate-200 font-bold focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Vocational">Vocational</option>
                  <option value="Pre-Vocational">Pre-Vocational</option>
                  <option value="Udyam">Udyam</option>
                  <option value="Magic Touch">Magic Touch</option>
                </select>
              </div>

              {/* Standard */}
              <div className="flex items-center gap-2">
                <span>Standard:</span>
                <select 
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                  className="bg-transparent border-none text-slate-700 dark:text-slate-200 font-bold focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="9th">9th</option>
                  <option value="10th">10th</option>
                  <option value="11th">11th</option>
                  <option value="12th">12th</option>
                </select>
              </div>
            </div>
          </div>

          {/* Student Grid list */}
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3">ID & Name</th>
                    <th className="p-3">School / Std</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Scores (B / E)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No students found matching current search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const school = schools.find(s => s.code === student.schoolCode);
                      return (
                        <tr 
                          key={student.studentId}
                          onClick={() => setSelectedStudent(student)}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors ${
                            selectedStudent?.studentId === student.studentId ? 'bg-primary/5 dark:bg-primary/10' : ''
                          }`}
                        >
                          <td className="p-3">
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">{student.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{student.studentId} • Roll: {student.rollNumber}</div>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-700 dark:text-slate-300 truncate w-36">{school ? school.name : student.schoolCode}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{student.standard} {student.stream !== 'None' ? `(${student.stream})` : ''}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-1.5 py-0.5 rounded font-bold ${
                              student.attendancePercentage < 75 
                                ? 'bg-red-500/10 text-red-500' 
                                : student.attendancePercentage < 85 
                                ? 'bg-accent/10 text-accent' 
                                : 'bg-green-500/10 text-green-500'
                            }`}>
                              {student.attendancePercentage}%
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">
                              B: <span className="text-slate-900 dark:text-white font-bold">{student.baselineScore || '--'}%</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              E: <span className="text-slate-900 dark:text-white font-bold">{student.endlineScore || '--'}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                              student.alumniStatus === 'Active' ? 'bg-secondary' : 'bg-slate-400'
                            }`} title={student.alumniStatus} />
                          </td>
                          <td className="p-3 text-right">
                            <button className="text-primary hover:text-primary-dark font-bold inline-flex items-center gap-0.5">
                              View <ArrowUpRight size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right side detailed Profile Drawer panel */}
        <div className="xl:col-span-1">
          {selectedStudent ? (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-dark-border">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary font-bold text-2xl">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{selectedStudent.name}</h2>
                  <p className="text-xs text-slate-400 font-mono">{selectedStudent.studentId}</p>
                  <p className="text-xs text-slate-500 mt-1 capitalize font-semibold bg-slate-100 dark:bg-dark-card border border-slate-200 dark:border-dark-border inline-block px-1.5 py-0.5 rounded">
                    Alumni: {selectedStudent.alumniStatus}
                  </p>
                </div>
              </div>

              {/* Personal Information section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contact & Address</h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>Self: {selectedStudent.mobileNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>Parent ({selectedStudent.parentName}): {selectedStudent.parentContact}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedStudent.address}, {selectedStudent.village}, {selectedStudent.taluka}, {selectedStudent.district}</span>
                  </div>
                </div>
              </div>

              {/* Academic indicators section */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Progress</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded">
                    <span className="text-[10px] text-slate-400 block font-semibold">Baseline Test</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {selectedStudent.baselineScore ? `${selectedStudent.baselineScore}%` : 'Pending'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded">
                    <span className="text-[10px] text-slate-400 block font-semibold">Endline Test</span>
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {selectedStudent.endlineScore ? `${selectedStudent.endlineScore}%` : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Career & Alumni goals section */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border text-xs">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Career Aspirations</h3>
                
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400 block">Career Goal:</span>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                      <GraduationCap size={14} className="text-primary shrink-0" />
                      {selectedStudent.aspirations || 'Not documented'}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-slate-400 block">Suggested Training Courses:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedStudent.suggestedCourses.length === 0 ? (
                        <span className="text-slate-500">None assigned yet</span>
                      ) : (
                        selectedStudent.suggestedCourses.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-dark-border rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                            {c}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Post-Programme Status:</span>
                    <p className="font-bold text-secondary flex items-center gap-1 mt-0.5">
                      <BookOpen size={14} className="shrink-0" />
                      {selectedStudent.postStatus}
                    </p>
                    {selectedStudent.employmentDetails && (
                      <p className="text-[10px] text-slate-500 mt-0.5 bg-slate-50 dark:bg-dark-card p-1.5 rounded border border-slate-100 dark:border-dark-border font-mono">
                        {selectedStudent.employmentDetails}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Earned badges / certificates */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-dark-border text-xs">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Certificates Earning ({selectedStudent.certificates.length})</h3>
                <div className="space-y-1">
                  {selectedStudent.certificates.map((cert, idx) => (
                    <div key={idx} className="p-2 bg-green-500/5 border border-green-500/10 text-green-600 dark:text-green-400 rounded flex items-center gap-2">
                      <ClipboardList size={14} />
                      <span className="font-semibold text-[10px]">{cert}</span>
                    </div>
                  ))}
                  {selectedStudent.certificates.length === 0 && (
                    <span className="text-slate-500 block">No course completion certificates generated yet.</span>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-100/50 dark:bg-dark-surface/40 border border-dashed border-slate-200 dark:border-dark-border p-12 rounded-md text-center text-xs text-slate-500">
              <AlertCircle size={24} className="mx-auto text-slate-400 mb-2" />
              Select a student from the list to view their detailed academic, counselling, and career profile.
            </div>
          )}
        </div>
      </div>

      {/* --- ADD STUDENT DIALOG MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[600px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold font-heading mb-4 text-slate-900 dark:text-white">Enroll New Student</h2>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="input-field"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({...newStudent, rollNumber: e.target.value})}
                    className="input-field"
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as any})}
                    className="input-field"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newStudent.dob}
                    onChange={(e) => setNewStudent({...newStudent, dob: e.target.value})}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={newStudent.mobileNumber}
                    onChange={(e) => setNewStudent({...newStudent, mobileNumber: e.target.value})}
                    className="input-field"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})}
                    className="input-field"
                    placeholder="Enter father / guardian name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Parent Contact *</label>
                  <input
                    type="tel"
                    required
                    value={newStudent.parentContact}
                    onChange={(e) => setNewStudent({...newStudent, parentContact: e.target.value})}
                    className="input-field"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned School Code *</label>
                  <select
                    required
                    value={newStudent.schoolCode}
                    onChange={(e) => setNewStudent({...newStudent, schoolCode: e.target.value})}
                    className="input-field"
                  >
                    <option value="">Select School</option>
                    {schools.map(s => (
                      <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Standard</label>
                  <select
                    value={newStudent.standard}
                    onChange={(e) => setNewStudent({...newStudent, standard: e.target.value})}
                    className="input-field"
                  >
                    <option value="9th">9th</option>
                    <option value="10th">10th</option>
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Stream</label>
                  <select
                    value={newStudent.stream}
                    onChange={(e) => setNewStudent({...newStudent, stream: e.target.value as any})}
                    className="input-field"
                  >
                    <option value="None">None</option>
                    <option value="Arts">Arts</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Science">Science</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Village</label>
                  <input
                    type="text"
                    value={newStudent.village}
                    onChange={(e) => setNewStudent({...newStudent, village: e.target.value})}
                    className="input-field"
                    placeholder="Village"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">District</label>
                  <input
                    type="text"
                    value={newStudent.district}
                    onChange={(e) => setNewStudent({...newStudent, district: e.target.value})}
                    className="input-field"
                    placeholder="District"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-500">Career Aspirations</label>
                <input
                  type="text"
                  value={newStudent.aspirations}
                  onChange={(e) => setNewStudent({...newStudent, aspirations: e.target.value})}
                  className="input-field"
                  placeholder="e.g. Electrician, Business owner"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-dark-border">
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
                  Save & Enroll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Inline X SVG for close button simplicity
const X: React.FC<{ size: number, className?: string }> = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
