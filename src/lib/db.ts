import { 
  User, Student, School, Session, LessonPlan, 
  CounsellingRecord, InventoryItem, TransportRoute, 
  MonitoringVisit, SystemAlert, SyncItem 
} from '../types';

// Mock Seed Data Definitions
const SEED_USERS: User[] = [
  {
    username: 'admin',
    name: 'Ramanlal Patel (Super Admin)',
    role: 'super_admin',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: ['All'],
    isActive: true,
    permissions: [
      'View Students', 'Add Students', 'Edit Students', 'Delete Students',
      'View Attendance', 'Mark Attendance', 'View Reports', 'Export Reports',
      'Manage Inventory', 'Manage Users', 'Manage Fleet', 'View Financials', 'AI Insight Access'
    ],
    activityLogs: [
      { id: 'l1', timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'System Login', details: 'Authenticated successfully from Ahmedabad Office' }
    ]
  },
  {
    username: 'prog.head',
    name: 'Anjali Shah (Programme Head)',
    role: 'programme_head',
    assignedProgramme: 'Vocational',
    assignedSchools: ['S101', 'S103'],
    assignedDistricts: ['Ahmedabad', 'Aravalli'],
    isActive: true,
    permissions: [
      'View Students', 'Add Students', 'Edit Students',
      'View Attendance', 'View Reports', 'Export Reports',
      'Manage Inventory', 'AI Insight Access'
    ],
    activityLogs: []
  },
  {
    username: 'coordinator',
    name: 'Mukesh Vyas (Coordinator)',
    role: 'programme_coordinator',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: ['S102'],
    assignedDistricts: ['Surendranagar'],
    isActive: true,
    permissions: [
      'View Students', 'Add Students', 'Edit Students',
      'View Attendance', 'Mark Attendance', 'View Reports', 'Export Reports'
    ],
    activityLogs: []
  },
  {
    username: 'trainer.rahul',
    name: 'Rahul Parmar (Udyam Trainer)',
    role: 'trainer',
    assignedProgramme: 'Udyam',
    assignedSchools: ['S101', 'S102'],
    assignedDistricts: ['Ahmedabad', 'Surendranagar'],
    isActive: true,
    permissions: [
      'View Students', 'View Attendance', 'Mark Attendance'
    ],
    activityLogs: []
  },
  {
    username: 'counsellor.priya',
    name: 'Dr. Priya Sharma (Lead Counsellor)',
    role: 'counsellor',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: ['All'],
    isActive: true,
    permissions: [
      'View Students', 'View Reports', 'Export Reports'
    ],
    activityLogs: []
  },
  {
    username: 'inventory.staff',
    name: 'Harish Mehta (Store Manager)',
    role: 'inventory_team',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: [],
    isActive: true,
    permissions: [
      'Manage Inventory', 'View Reports'
    ],
    activityLogs: []
  },
  {
    username: 'transport.staff',
    name: 'Devendra Rathod (Logistics Chief)',
    role: 'transport_team',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: [],
    isActive: true,
    permissions: [
      'Manage Fleet', 'View Reports'
    ],
    activityLogs: []
  },
  {
    username: 'viewer',
    name: 'Donor Representative (Viewer)',
    role: 'viewer',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: [],
    isActive: true,
    permissions: [
      'View Students', 'View Attendance', 'View Reports'
    ],
    activityLogs: []
  }
];

const SEED_SCHOOLS: School[] = [
  {
    code: 'S101',
    name: 'Dholera Rural High School',
    principalName: 'Dr. K. Patel',
    principalContact: '+91 98765 43210',
    village: 'Dholera',
    taluka: 'Dholera',
    district: 'Ahmedabad',
    studentStrength: 180,
    sessionsTarget: 24,
    sessionsConducted: 18,
    runningProgrammes: ['Vocational', 'Udyam']
  },
  {
    code: 'S102',
    name: 'Limdi Secondary Vidhyalaya',
    principalName: 'Smt. Pushpa Shah',
    principalContact: '+91 98765 43211',
    village: 'Limdi',
    taluka: 'Surendranagar',
    district: 'Surendranagar',
    studentStrength: 120,
    runningProgrammes: ['Pre-Vocational', 'Magic Touch'],
    sessionsTarget: 20,
    sessionsConducted: 15
  },
  {
    code: 'S103',
    name: 'Modasa Girls High School',
    principalName: 'Shri R. Vyas',
    principalContact: '+91 98765 43212',
    village: 'Modasa',
    taluka: 'Modasa',
    district: 'Aravalli',
    studentStrength: 150,
    runningProgrammes: ['Vocational', 'Magic Touch'],
    sessionsTarget: 25,
    sessionsConducted: 20
  }
];

const SEED_STUDENTS: Student[] = [
  {
    studentId: 'STU001',
    name: 'Hitesh Makwana',
    rollNumber: '12',
    gender: 'Male',
    dob: '2011-04-12',
    mobileNumber: '+91 99887 76655',
    parentName: 'Ramesh Makwana',
    parentContact: '+91 99887 76650',
    address: 'Plot 45, Near Temple',
    village: 'Dholera',
    taluka: 'Dholera',
    district: 'Ahmedabad',
    schoolCode: 'S101',
    standard: '9th',
    stream: 'None',
    enrollmentDate: '2025-06-15',
    attendancePercentage: 88,
    baselineScore: 42,
    endlineScore: 78,
    exams: [
      { examName: 'Unit Test 1', score: 65, date: '2025-09-10' },
      { examName: 'Midterm', score: 72, date: '2025-11-20' }
    ],
    certificates: ['Basic IT Literacy Cert', 'Udyam Entrepreneurship Badge'],
    aspirations: 'Computer Operator / Cyber Cafe Owner',
    suggestedCourses: ['Advanced Excel Training', 'Web Development Basics'],
    postStatus: 'Higher Education',
    alumniStatus: 'Active',
    governmentSchemeParticipation: ['MYSY Scholarship Scheme']
  },
  {
    studentId: 'STU002',
    name: 'Priyanka Rathod',
    rollNumber: '34',
    gender: 'Female',
    dob: '2010-08-25',
    mobileNumber: '+91 98989 12345',
    parentName: 'Balvantsinh Rathod',
    parentContact: '+91 98989 12340',
    address: 'Opposite Milk Dairy Coop',
    village: 'Limdi',
    taluka: 'Surendranagar',
    district: 'Surendranagar',
    schoolCode: 'S102',
    standard: '10th',
    stream: 'None',
    enrollmentDate: '2025-06-15',
    attendancePercentage: 92,
    baselineScore: 50,
    endlineScore: 82,
    exams: [
      { examName: 'Midterm', score: 78, date: '2025-11-20' }
    ],
    certificates: ['Pre-Vocational Crafting Cert'],
    aspirations: 'Government Officer (GPSC) / Teacher',
    suggestedCourses: ['Competitive Exam Prep', 'Spoken English Course'],
    postStatus: 'Higher Education',
    alumniStatus: 'Active',
    governmentSchemeParticipation: []
  },
  {
    studentId: 'STU003',
    name: 'Suresh Vaghela',
    rollNumber: '05',
    gender: 'Male',
    dob: '2009-11-03',
    mobileNumber: '+91 97234 56789',
    parentName: 'Manubhai Vaghela',
    parentContact: '+91 97234 56780',
    address: 'Vaghela Vas, Main Road',
    village: 'Modasa',
    taluka: 'Modasa',
    district: 'Aravalli',
    schoolCode: 'S103',
    standard: '11th',
    stream: 'Science',
    enrollmentDate: '2024-06-12',
    attendancePercentage: 74,
    baselineScore: 35,
    endlineScore: 60,
    exams: [],
    certificates: [],
    aspirations: 'Solar Panel Technician',
    suggestedCourses: ['Electrical Skills Module II'],
    postStatus: 'Employment',
    employmentDetails: 'Assistant at Sunshine Solar Agency, Modasa',
    alumniStatus: 'Active',
    governmentSchemeParticipation: ['Shramik Sahay Yojana']
  },
  {
    studentId: 'STU004',
    name: 'Apeksha Patel',
    rollNumber: '01',
    gender: 'Female',
    dob: '2011-02-18',
    mobileNumber: '+91 90123 45678',
    parentName: 'Jitendrabhai Patel',
    parentContact: '+91 90123 45670',
    address: 'Patel Street, Ramji Mandir Chawk',
    village: 'Dholera',
    taluka: 'Dholera',
    district: 'Ahmedabad',
    schoolCode: 'S101',
    standard: '9th',
    stream: 'None',
    enrollmentDate: '2025-06-15',
    attendancePercentage: 96,
    baselineScore: 68,
    endlineScore: 94,
    exams: [
      { examName: 'Midterm', score: 92, date: '2025-11-20' }
    ],
    certificates: ['Leadership Excellence Badge', 'Udyam Pitch Winner'],
    aspirations: 'Agri-Business Entrepreneur',
    suggestedCourses: ['Organic Farming Business Model', 'Financial Literacy'],
    postStatus: 'Self Employed',
    employmentDetails: 'Running family dairy store online portal',
    alumniStatus: 'Active',
    governmentSchemeParticipation: ['Stand-Up India Startup Support']
  },
  {
    studentId: 'STU005',
    name: 'Meena Parmar',
    rollNumber: '22',
    gender: 'Female',
    dob: '2012-07-30',
    mobileNumber: '+91 76001 23456',
    parentName: 'Kalidas Parmar',
    parentContact: '+91 76001 23450',
    address: 'Near Government Well',
    village: 'Limdi',
    taluka: 'Surendranagar',
    district: 'Surendranagar',
    schoolCode: 'S102',
    standard: '9th',
    stream: 'None',
    enrollmentDate: '2025-06-15',
    attendancePercentage: 45, // Critical Student
    baselineScore: 28,
    exams: [
      { examName: 'Unit Test 1', score: 32, date: '2025-09-10' }
    ],
    certificates: [],
    aspirations: 'Tailoring Shop Owner',
    suggestedCourses: ['Fashion Design Basics'],
    postStatus: 'Unemployed',
    alumniStatus: 'Inactive',
    governmentSchemeParticipation: []
  }
];

const SEED_SESSIONS: Session[] = [
  {
    id: 'SES201',
    programme: 'Vocational',
    schoolCode: 'S101',
    date: new Date().toISOString().split('T')[0], // Today
    time: '11:00 AM',
    trainerUsername: 'trainer.rahul',
    subject: 'Basic Electronic Components',
    lessonPlanId: 'LP301',
    status: 'Scheduled',
    attendancePresent: [],
    attendanceAbsent: []
  },
  {
    id: 'SES202',
    programme: 'Udyam',
    schoolCode: 'S101',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    time: '02:00 PM',
    trainerUsername: 'trainer.rahul',
    subject: 'Customer Identification & Feedback',
    lessonPlanId: 'LP302',
    status: 'Completed',
    photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=600',
    attendancePresent: ['STU001', 'STU004'],
    attendanceAbsent: [],
    remarks: 'Students engaged well in field survey simulation. Excellent results.',
    locationCoords: { lat: 22.2534, lng: 72.1983 }
  },
  {
    id: 'SES203',
    programme: 'Pre-Vocational',
    schoolCode: 'S102',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
    time: '10:00 AM',
    trainerUsername: 'trainer.rahul',
    subject: 'Intro to Hand Tools',
    lessonPlanId: 'LP303',
    status: 'Missed',
    attendancePresent: [],
    attendanceAbsent: ['STU002', 'STU005'],
    remarks: 'Trainer delayed due to local transport strike. Session to be rescheduled.'
  }
];

const SEED_LESSON_PLANS: LessonPlan[] = [
  {
    id: 'LP301',
    programme: 'Vocational',
    subject: 'Electronics Hardware',
    chapter: 'Chapter 2: Resistors and Capacitors',
    learningObjectives: ['Identify resistor color code schemes', 'Understand capacitor storage properties', 'Perform multimeter check tests'],
    activities: ['Interactive multimeter reading game', 'Breadboard resistor wiring lab'],
    materialsRequired: ['Multimeter', 'Breadboard', 'Assorted resistors & capacitors', '9V battery'],
    worksheets: ['Resistor Color Code Worksheet PDF', 'Component Matching Sheet'],
    status: 'Planned'
  },
  {
    id: 'LP302',
    programme: 'Udyam',
    subject: 'Entrepreneurial Mindset',
    chapter: 'Chapter 4: Customer Validation',
    learningObjectives: ['Draft 3 client feedback questions', 'Conduct mock interviews', 'Understand customer pain-points'],
    activities: ['Role play: shopkeeper & rural customer', 'Survey design circle'],
    materialsRequired: ['Survey Sheets', 'Pens', 'Activity Cards'],
    worksheets: ['Field Pitch Report Template'],
    status: 'Delivered'
  },
  {
    id: 'LP303',
    programme: 'Pre-Vocational',
    subject: 'Woodworking & Mechanics',
    chapter: 'Chapter 1: Hand Tools Safety',
    learningObjectives: ['Safely lift/handle hammers and saws', 'List 5 safety wear protocols', 'Identify tool storage layout'],
    activities: ['Tool sorting exercise', 'Live safety gear drill'],
    materialsRequired: ['Wood Saw', 'Hammer', 'Goggles', 'Safety Gloves'],
    worksheets: ['Tool Identification Match sheet'],
    status: 'Pending'
  }
];

const SEED_INVENTORY: InventoryItem[] = [
  {
    id: 'INV401',
    name: 'Electronics Breadboard Kit',
    type: 'Training Kit',
    currentStock: 4, // Trigger alert (threshold 5)
    minThreshold: 5,
    unit: 'Boxes',
    logs: [
      { id: 'log1', date: '2026-06-10', type: 'Inward', quantity: 15, remarks: 'Direct purchase from Ahmedabad dealer' },
      { id: 'log2', date: '2026-06-25', type: 'Outward', quantity: 11, program: 'Vocational', assignedTo: 'S101', remarks: 'Distributed for lab project' }
    ]
  },
  {
    id: 'INV402',
    name: 'Udyam Pitch Boards',
    type: 'Stationery',
    currentStock: 30,
    minThreshold: 10,
    unit: 'Sheets',
    logs: [
      { id: 'log3', date: '2026-06-15', type: 'Inward', quantity: 40, remarks: 'Supplied to Dholera cluster' },
      { id: 'log4', date: '2026-06-28', type: 'Outward', quantity: 10, program: 'Udyam', assignedTo: 'S102' }
    ]
  },
  {
    id: 'INV403',
    name: 'Basic Multimeters (Digital)',
    type: 'Equipment',
    currentStock: 12,
    minThreshold: 3,
    unit: 'Units',
    logs: [
      { id: 'log5', date: '2026-05-20', type: 'Inward', quantity: 12 }
    ]
  }
];

const SEED_TRANSPORT: TransportRoute[] = [
  {
    id: 'VEH501',
    vehicleNumber: 'GJ-01-XX-9900',
    driverName: 'Karsanbhai Rabari',
    driverContact: '+91 99778 86633',
    routeDetails: 'Ahmedabad HQ -> Dholera Cluster (S101) -> Limdi Cluster (S102)',
    scheduleDays: ['Monday', 'Wednesday', 'Friday'],
    fuelLogs: [
      { date: '2026-06-24', liters: 40, cost: 3800, odometer: 12450 },
      { date: '2026-06-27', liters: 35, cost: 3325, odometer: 12820 }
    ]
  },
  {
    id: 'VEH502',
    vehicleNumber: 'GJ-13-ZZ-1234',
    driverName: 'Sanjay Tadvi',
    driverContact: '+91 99112 23344',
    routeDetails: 'Surendranagar Hub -> Modasa Rural Cluster (S103)',
    scheduleDays: ['Tuesday', 'Thursday', 'Saturday'],
    fuelLogs: [
      { date: '2026-06-25', liters: 50, cost: 4750, odometer: 42310 }
    ]
  }
];

const SEED_ALERTS: SystemAlert[] = [
  {
    id: 'ALT001',
    type: 'low_stock',
    severity: 'high',
    message: 'Electronics Breadboard Kit stock balance (4 Boxes) fell below critical threshold (5 Boxes).',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isResolved: false
  },
  {
    id: 'ALT002',
    type: 'attendance_missing',
    severity: 'medium',
    message: 'Attendance submission for Dholera Rural High School (Udyam Session SES201) was not entered by 5 PM.',
    schoolCode: 'S101',
    programme: 'Udyam',
    createdAt: new Date(Date.now() - 36000000).toISOString(),
    isResolved: false
  },
  {
    id: 'ALT003',
    type: 'baseline_pending',
    severity: 'low',
    message: 'Baseline assessment scores are pending for 3 newly enrolled students in Standard 9th at Limdi Secondary Vidhyalaya.',
    schoolCode: 'S102',
    programme: 'Pre-Vocational',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isResolved: false
  }
];

const SEED_COUNSELLING: CounsellingRecord[] = [
  {
    id: 'CNS001',
    studentId: 'STU001',
    counsellorName: 'Dr. Priya Sharma',
    sessionDate: '2026-06-20',
    studentAspirations: 'Wants to launch a rural computer shop',
    suggestedCourses: ['Basic Accounting', 'Hardware Repair Skills'],
    parentCounsellingDetails: 'Father agreed to support Hitesh after school with workshop space.',
    followUpStatus: 'Completed'
  },
  {
    id: 'CNS002',
    studentId: 'STU005',
    counsellorName: 'Dr. Priya Sharma',
    sessionDate: '2026-06-22',
    studentAspirations: 'Struggling due to low attendance and family agricultural responsibilities.',
    suggestedCourses: ['Vocational Tailoring Basics'],
    parentCounsellingDetails: 'Spoke with mother to ensure Meena is released from farming duties on training days.',
    followUpStatus: 'Pending',
    nextFollowUpDate: '2026-07-05'
  }
];

const SEED_MONITORING: MonitoringVisit[] = [
  {
    id: 'MON001',
    schoolCode: 'S101',
    visitDate: '2026-06-26',
    fieldStaffName: 'Anil Rathod',
    observations: 'Trainer was on time. Smartboard was not working so white board was used. Students were responsive.',
    challenges: 'Power fluctuations disrupt digital lab sessions occasionally.',
    actionItems: ['Coordinate with school administration to purchase battery backup.', 'Provide paper worksheets as backup.'],
    rating: 4
  }
];

// Database Manager wrapper Class utilizing HTML5 localStorage
class OmpDatabase {
  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    if (!localStorage.getItem('omp_users')) {
      localStorage.setItem('omp_users', JSON.stringify(SEED_USERS));
    }
    if (!localStorage.getItem('omp_schools')) {
      localStorage.setItem('omp_schools', JSON.stringify(SEED_SCHOOLS));
    }
    if (!localStorage.getItem('omp_students')) {
      localStorage.setItem('omp_students', JSON.stringify(SEED_STUDENTS));
    }
    if (!localStorage.getItem('omp_sessions')) {
      localStorage.setItem('omp_sessions', JSON.stringify(SEED_SESSIONS));
    }
    if (!localStorage.getItem('omp_lesson_plans')) {
      localStorage.setItem('omp_lesson_plans', JSON.stringify(SEED_LESSON_PLANS));
    }
    if (!localStorage.getItem('omp_inventory')) {
      localStorage.setItem('omp_inventory', JSON.stringify(SEED_INVENTORY));
    }
    if (!localStorage.getItem('omp_transport')) {
      localStorage.setItem('omp_transport', JSON.stringify(SEED_TRANSPORT));
    }
    if (!localStorage.getItem('omp_alerts')) {
      localStorage.setItem('omp_alerts', JSON.stringify(SEED_ALERTS));
    }
    if (!localStorage.getItem('omp_counselling')) {
      localStorage.setItem('omp_counselling', JSON.stringify(SEED_COUNSELLING));
    }
    if (!localStorage.getItem('omp_monitoring')) {
      localStorage.setItem('omp_monitoring', JSON.stringify(SEED_MONITORING));
    }
    if (!localStorage.getItem('omp_sync_queue')) {
      localStorage.setItem('omp_sync_queue', JSON.stringify([]));
    }
    // Simulation state triggers
    if (!localStorage.getItem('omp_network_online')) {
      localStorage.setItem('omp_network_online', 'true');
    }
  }

  // Generic Storage Read/Write helpers
  private getTable<T>(tableName: string): T[] {
    return JSON.parse(localStorage.getItem(tableName) || '[]');
  }

  private saveTable<T>(tableName: string, data: T[]) {
    localStorage.setItem(tableName, JSON.stringify(data));
  }

  // Network State Simulator
  public isNetworkOnline(): boolean {
    return localStorage.getItem('omp_network_online') === 'true';
  }

  public setNetworkOnline(status: boolean) {
    localStorage.setItem('omp_network_online', String(status));
    window.dispatchEvent(new Event('omp_network_status_change'));
    
    // Auto-trigger sync if we go online
    if (status) {
      this.syncPendingQueue();
    }
  }

  // Sync Queue management
  public getSyncQueue(): SyncItem[] {
    return this.getTable<SyncItem>('omp_sync_queue');
  }

  private queueSyncItem(table: string, action: 'insert' | 'update' | 'delete', data: any) {
    const queue = this.getSyncQueue();
    queue.push({
      id: Math.random().toString(36).substr(2, 9),
      table,
      action,
      data,
      timestamp: Date.now()
    });
    this.saveTable('omp_sync_queue', queue);
    window.dispatchEvent(new Event('omp_sync_queue_change'));
  }

  public syncPendingQueue() {
    const queue = this.getSyncQueue();
    if (queue.length === 0) return;
    
    console.log('[Sync Engine] Uploading operations to server database...', queue);
    
    // Simulate server side replication delay
    setTimeout(() => {
      this.saveTable('omp_sync_queue', []);
      window.dispatchEvent(new Event('omp_sync_queue_change'));
      window.dispatchEvent(new CustomEvent('omp_toast_message', { detail: 'Sync completed successfully. 0 items remaining.' }));
    }, 1500);
  }

  // --- MODULE ACTIONS ---

  // Users Auth / Management
  public getUsers(): User[] {
    return this.getTable<User>('omp_users');
  }

  public saveUser(user: User) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username === user.username);
    if (index >= 0) {
      users[index] = user;
      this.queueSyncItem('omp_users', 'update', user);
    } else {
      users.push(user);
      this.queueSyncItem('omp_users', 'insert', user);
    }
    this.saveTable('omp_users', users);
  }

  // Students
  public getStudents(): Student[] {
    return this.getTable<Student>('omp_students');
  }

  public getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.studentId === id);
  }

  public saveStudent(student: Student) {
    const students = this.getStudents();
    const index = students.findIndex(s => s.studentId === student.studentId);
    if (index >= 0) {
      students[index] = student;
      this.queueSyncItem('omp_students', 'update', student);
    } else {
      students.push(student);
      this.queueSyncItem('omp_students', 'insert', student);
    }
    this.saveTable('omp_students', students);
  }

  // Schools
  public getSchools(): School[] {
    return this.getTable<School>('omp_schools');
  }

  public getSchoolByCode(code: string): School | undefined {
    return this.getSchools().find(s => s.code === code);
  }

  public saveSchool(school: School) {
    const schools = this.getSchools();
    const index = schools.findIndex(s => s.code === school.code);
    if (index >= 0) {
      schools[index] = school;
      this.queueSyncItem('omp_schools', 'update', school);
    } else {
      schools.push(school);
      this.queueSyncItem('omp_schools', 'insert', school);
    }
    this.saveTable('omp_schools', schools);
  }

  // Sessions
  public getSessions(): Session[] {
    return this.getTable<Session>('omp_sessions');
  }

  public saveSession(session: Session) {
    const sessions = this.getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
      this.queueSyncItem('omp_sessions', 'update', session);
    } else {
      sessions.push(session);
      this.queueSyncItem('omp_sessions', 'insert', session);
    }
    this.saveTable('omp_sessions', sessions);
    
    // Auto-update School statistics for Sessions completed
    if (session.status === 'Completed') {
      const school = this.getSchoolByCode(session.schoolCode);
      if (school) {
        // Trigger alert audit checklist
        const prevConducted = school.sessionsConducted;
        school.sessionsConducted = prevConducted + 1;
        this.saveSchool(school);
      }
    }
  }

  // Lesson Plans
  public getLessonPlans(): LessonPlan[] {
    return this.getTable<LessonPlan>('omp_lesson_plans');
  }

  // Inventory
  public getInventory(): InventoryItem[] {
    return this.getTable<InventoryItem>('omp_inventory');
  }

  public saveInventoryItem(item: InventoryItem) {
    const inv = this.getInventory();
    const index = inv.findIndex(i => i.id === item.id);
    if (index >= 0) {
      inv[index] = item;
      this.queueSyncItem('omp_inventory', 'update', item);
    } else {
      inv.push(item);
      this.queueSyncItem('omp_inventory', 'insert', item);
    }
    this.saveTable('omp_inventory', inv);

    // Trigger System Alert if below threshold
    if (item.currentStock < item.minThreshold) {
      const alertExists = this.getAlerts().some(a => a.type === 'low_stock' && a.message.includes(item.name) && !a.isResolved);
      if (!alertExists) {
        const newAlert: SystemAlert = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'low_stock',
          severity: 'high',
          message: `${item.name} stock level (${item.currentStock} ${item.unit}) fell below threshold (${item.minThreshold} ${item.unit}).`,
          createdAt: new Date().toISOString(),
          isResolved: false
        };
        this.addAlert(newAlert);
      }
    }
  }

  // Transport
  public getTransport(): TransportRoute[] {
    return this.getTable<TransportRoute>('omp_transport');
  }

  public saveTransportRoute(route: TransportRoute) {
    const transport = this.getTransport();
    const index = transport.findIndex(r => r.id === route.id);
    if (index >= 0) {
      transport[index] = route;
      this.queueSyncItem('omp_transport', 'update', route);
    } else {
      transport.push(route);
      this.queueSyncItem('omp_transport', 'insert', route);
    }
    this.saveTable('omp_transport', transport);
  }

  // Alerts
  public getAlerts(): SystemAlert[] {
    return this.getTable<SystemAlert>('omp_alerts');
  }

  public addAlert(alert: SystemAlert) {
    const alerts = this.getAlerts();
    alerts.unshift(alert);
    this.saveTable('omp_alerts', alerts);
    window.dispatchEvent(new Event('omp_alerts_change'));
  }

  public resolveAlert(id: string) {
    const alerts = this.getAlerts();
    const index = alerts.findIndex(a => a.id === id);
    if (index >= 0) {
      alerts[index].isResolved = true;
      this.saveTable('omp_alerts', alerts);
      window.dispatchEvent(new Event('omp_alerts_change'));
    }
  }

  // Counselling
  public getCounselling(): CounsellingRecord[] {
    return this.getTable<CounsellingRecord>('omp_counselling');
  }

  public saveCounsellingRecord(record: CounsellingRecord) {
    const records = this.getCounselling();
    const index = records.findIndex(r => r.id === record.id);
    if (index >= 0) {
      records[index] = record;
      this.queueSyncItem('omp_counselling', 'update', record);
    } else {
      records.push(record);
      this.queueSyncItem('omp_counselling', 'insert', record);
    }
    this.saveTable('omp_counselling', records);
  }

  // Monitoring
  public getMonitoring(): MonitoringVisit[] {
    return this.getTable<MonitoringVisit>('omp_monitoring');
  }

  public saveMonitoringVisit(visit: MonitoringVisit) {
    const visits = this.getMonitoring();
    const index = visits.findIndex(v => v.id === visit.id);
    if (index >= 0) {
      visits[index] = visit;
      this.queueSyncItem('omp_monitoring', 'update', visit);
    } else {
      visits.push(visit);
      this.queueSyncItem('omp_monitoring', 'insert', visit);
    }
    this.saveTable('omp_monitoring', visits);
  }
}

export const db = new OmpDatabase();
export default db;
