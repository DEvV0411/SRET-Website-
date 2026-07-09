import type { 
  User, Student, School, Session, LessonPlan, 
  CounsellingRecord, InventoryItem, TransportRoute, 
  MonitoringVisit, SystemAlert, SyncItem, TimetableEntry, ActivityLog,
  DriverDetails, VehicleDetails, DriverDailyEntry, TrainerReimbursement,
  WeeklySubmissionStatus, DashboardLayout
} from '../types';
import { firestoreDb, isFirebaseConfigured } from './firebase';
import {
  doc, setDoc, deleteDoc, writeBatch,
  collection, getDocs, onSnapshot, getDoc
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// Seed Data
// ─────────────────────────────────────────────────────────────────────────────

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
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
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
    permissions: ['View Students', 'View Reports', 'Export Reports'],
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
    permissions: ['Manage Inventory', 'View Reports'],
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
    permissions: ['Manage Fleet', 'View Reports'],
    activityLogs: []
  },
  {
    username: 'trainer.krunal',
    name: 'Krunal Desai (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: ['S102', 'S104'],
    assignedDistricts: ['Valsad'],
    isActive: true,
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.jinal',
    name: 'Jinal Mehta (Magic Touch Trainer)',
    role: 'trainer',
    assignedProgramme: 'Magic Touch',
    assignedSchools: ['S103'],
    assignedDistricts: ['Valsad'],
    isActive: true,
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.anjali',
    name: 'Anjali Patel (Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Vocational',
    assignedSchools: ['S101'],
    assignedDistricts: ['Surendranagar'],
    isActive: true,
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'driver.ramesh',
    name: 'Ramesh Solanki (Fleet Driver)',
    role: 'driver',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: ['Ahmedabad'],
    isActive: true,
    permissions: ['View Reports'],
    activityLogs: []
  },
];

// Pre-Vocational Lesson Plan Seed Data (from Google Drive)
const SEED_PV_LESSON_PLANS = [
  {
    id: 'PV_LP_AG_G6',
    programme: 'Pre-Vocational' as const,
    subject: 'Agriculture',
    chapter: 'Grade 6 — Agriculture (New Format, Gujarati)',
    learningObjectives: [
      'Understand basic concepts of soil and land preparation',
      'Identify common crops grown in Gujarat',
      'Learn about seasonal farming cycles',
    ],
    activities: [
      'Field observation of soil types',
      'Group activity: seed germination experiment',
      'Discussion on local agricultural practices',
    ],
    materialsRequired: ['Soil samples', 'Seeds', 'Pots', 'Gujarati textbook'],
    worksheets: ['Grade 6 (1).docx'],
    driveFileId: '1Aq-J4ZqDMnVOtqMRe9iUIvSSnNnCDXqV',
    driveFileName: 'Grade 6 (1).docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_AG_G7',
    programme: 'Pre-Vocational' as const,
    subject: 'Agriculture',
    chapter: 'Grade 7 — Agriculture (New Format, Gujarati)',
    learningObjectives: [
      'Study irrigation methods and water conservation',
      'Learn about fertilizers and organic farming',
      'Understand pest management techniques',
    ],
    activities: [
      'Demonstration of drip irrigation model',
      'Visit to school garden for hands-on practice',
      'Worksheet on fertilizer types',
    ],
    materialsRequired: ['Drip irrigation kit', 'Organic compost', 'Gujarati textbook'],
    worksheets: ['Grade 7 (1).docx'],
    driveFileId: '1Aq-J4ZqDMnVOtqMRe9iUIvSSnNnCDXqV',
    driveFileName: 'Grade 7 (1).docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_AG_G8',
    programme: 'Pre-Vocational' as const,
    subject: 'Agriculture',
    chapter: 'Grade 8 — Agriculture (New Format, Gujarati)',
    learningObjectives: [
      'Explore agri-entrepreneurship opportunities',
      'Study post-harvest management techniques',
      'Understand government schemes for farmers',
    ],
    activities: [
      'Business plan for a small agri venture',
      'Case study: successful farmer stories',
      'Role play: farmer-to-market chain',
    ],
    materialsRequired: ['Case study sheets', 'Chart paper', 'Gujarati textbook'],
    worksheets: ['Grade 8.docx'],
    driveFileId: '1Aq-J4ZqDMnVOtqMRe9iUIvSSnNnCDXqV',
    driveFileName: 'Grade 8.docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_HH_G6',
    programme: 'Pre-Vocational' as const,
    subject: 'Home and Health',
    chapter: 'Grade 6 — Home and Health (New Format, Gujarati)',
    learningObjectives: [
      'Understand basic personal hygiene practices',
      'Learn about balanced nutrition and food groups',
      'Identify household safety rules',
    ],
    activities: [
      'Handwashing technique demonstration',
      'Create a daily healthy meal chart',
      'Safety audit of the classroom',
    ],
    materialsRequired: ['Soap', 'Chart paper', 'Gujarati textbook'],
    worksheets: ['Gr6 - Guj - New Format.docx'],
    driveFileId: '1l7Afb9WhO4_2U7SgOcp4YKNVsUfsQh2t',
    driveFileName: 'Gr6 - Guj - New Format.docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_HH_G7',
    programme: 'Pre-Vocational' as const,
    subject: 'Home and Health',
    chapter: 'Grade 7 — Home and Health (New Format, Gujarati)',
    learningObjectives: [
      'Study first aid basics and emergency response',
      'Learn household budget management',
      'Understand community health and sanitation',
    ],
    activities: [
      'First aid role play scenarios',
      'Monthly budget planning exercise',
      'Community cleanliness drive planning',
    ],
    materialsRequired: ['First aid kit', 'Budget worksheets', 'Gujarati textbook'],
    worksheets: ['Gr7-Guj- New Format.docx'],
    driveFileId: '1l7Afb9WhO4_2U7SgOcp4YKNVsUfsQh2t',
    driveFileName: 'Gr7-Guj- New Format.docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_HH_G8',
    programme: 'Pre-Vocational' as const,
    subject: 'Home and Health',
    chapter: 'Grade 8 — Home and Health (New Format, Gujarati)',
    learningObjectives: [
      'Understand adolescent health and wellbeing',
      'Learn about small home-based business (e.g. juice stall)',
      'Study nutrition for growing children',
    ],
    activities: [
      'Juice stall business simulation',
      'Nutrition label reading activity',
      'Peer discussion on adolescent health topics',
    ],
    materialsRequired: ['Juice stall materials', 'Food labels', 'Gujarati textbook'],
    worksheets: ['Gr8-Guj- New Format.docx', 'hh gr 8 juice stall.gdoc'],
    driveFileId: '1l7Afb9WhO4_2U7SgOcp4YKNVsUfsQh2t',
    driveFileName: 'Gr8-Guj- New Format.docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_TC_G6',
    programme: 'Pre-Vocational' as const,
    subject: 'Trade, Commerce and Technology',
    chapter: 'Grade 6 — Trade, Commerce & Technology (New Format, Gujarati)',
    learningObjectives: [
      'Introduction to trade and basic commerce concepts',
      'Understand buying, selling, and pricing',
      'Learn about simple technology tools used in daily life',
    ],
    activities: [
      'Classroom market simulation',
      'Explore items bought and sold in local markets',
      'Technology show-and-tell',
    ],
    materialsRequired: ['Play money', 'Sample goods', 'Gujarati textbook'],
    worksheets: ['Grade 6.docx'],
    driveFileId: '1dQm0fTgYPgUElAFxUzO6AoeKiwETgRle',
    driveFileName: 'Grade 6.docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_TC_G7',
    programme: 'Pre-Vocational' as const,
    subject: 'Trade, Commerce and Technology',
    chapter: 'Grade 7 — Trade, Commerce & Technology (New Format, Gujarati)',
    learningObjectives: [
      'Study record-keeping and basic bookkeeping',
      'Understand profit, loss, and break-even',
      'Learn about digital payments and banking',
    ],
    activities: [
      'Bookkeeping exercise with sample transactions',
      'Profit/loss calculation worksheet',
      'Demonstration of UPI and digital payment apps',
    ],
    materialsRequired: ['Ledger sheets', 'Calculator', 'Gujarati textbook'],
    worksheets: ['Grade 7.docx'],
    driveFileId: '1dQm0fTgYPgUElAFxUzO6AoeKiwETgRle',
    driveFileName: 'Grade 7.docx',
    status: 'Planned' as const,
  },
  {
    id: 'PV_LP_TC_G8',
    programme: 'Pre-Vocational' as const,
    subject: 'Trade, Commerce and Technology',
    chapter: 'Grade 8 — Trade, Commerce & Technology (New Format, Gujarati)',
    learningObjectives: [
      'Explore entrepreneurship and self-employment',
      'Understand GST, invoicing, and taxation basics',
      'Learn about e-commerce and online businesses',
    ],
    activities: [
      'Create a mock invoice and bill',
      'Discussion on local startup stories',
      'Group project: design a small e-commerce concept',
    ],
    materialsRequired: ['Invoice templates', 'Chart paper', 'Gujarati textbook'],
    worksheets: ['Grade 8.docx', 'story.gdoc'],
    driveFileId: '1dQm0fTgYPgUElAFxUzO6AoeKiwETgRle',
    driveFileName: 'Grade 8.docx',
    status: 'Planned' as const,
  },
];

// Firestore collection → document key mapping
const TABLE_CONFIG: Record<string, { collection: string; key: string }> = {
  omp_users:              { collection: 'users',              key: 'username'    },
  omp_schools:            { collection: 'schools',            key: 'code'        },
  omp_students:           { collection: 'students',           key: 'studentId'   },
  omp_sessions:           { collection: 'sessions',           key: 'id'          },
  omp_lesson_plans:       { collection: 'lesson_plans',       key: 'id'          },
  omp_inventory:          { collection: 'inventory',          key: 'id'          },
  omp_transport:          { collection: 'transport',          key: 'id'          },
  omp_counselling:        { collection: 'counselling',        key: 'id'          },
  omp_monitoring:         { collection: 'monitoring',         key: 'id'          },
  omp_alerts:             { collection: 'alerts',             key: 'id'          },
  omp_timetable:          { collection: 'timetable',          key: 'id'          },
  omp_audit_logs:         { collection: 'audit_logs',         key: 'id'          },
  omp_drivers:            { collection: 'drivers',            key: 'id'          },
  omp_vehicles:           { collection: 'vehicles',           key: 'id'          },
  omp_driver_entries:     { collection: 'driver_entries',     key: 'id'          },
  omp_reimbursements:     { collection: 'reimbursements',     key: 'id'          },
  omp_weekly_submissions: { collection: 'weekly_submissions', key: 'id'          },
  omp_dashboard_layouts:  { collection: 'dashboard_layouts',  key: 'id'          },
};

// ─────────────────────────────────────────────────────────────────────────────
// OmpDatabase — Firestore-first, in-memory cache
// ─────────────────────────────────────────────────────────────────────────────
class OmpDatabase {
  /** In-memory cache: tableName → array of records */
  private cache: Map<string, any[]> = new Map();
  private listeners: (() => void)[] = [];
  private initialized = false;

  constructor() {
    // Initialize asynchronously — sets up cache + realtime listeners
    this.boot();
  }

  // ── Boot: load Firestore → seed if empty → start listeners ───────────────
  private async boot() {
    if (!isFirebaseConfigured || !firestoreDb) {
      console.warn('[DB] Firebase not configured — using empty in-memory store.');
      this.initialized = true;
      window.dispatchEvent(new Event('omp_db_pulled'));
      return;
    }

    try {
      // Load all tables from Firestore into cache
      await Promise.all(
        Object.keys(TABLE_CONFIG).map(table => this.fetchTable(table))
      );

      // Seed Firestore if core collections are empty (first-ever run)
      await this.seedIfEmpty();

      // Set up real-time listeners
      this.setupListeners();

      this.initialized = true;
      window.dispatchEvent(new Event('omp_db_pulled'));
      console.log('[DB] Firestore-first boot complete.');
    } catch (err) {
      console.error('[DB] Boot failed:', err);
      this.initialized = true;
      window.dispatchEvent(new Event('omp_db_pulled'));
    }
  }

  // ── Fetch a single table from Firestore into cache ────────────────────────
  private async fetchTable(table: string) {
    if (!isFirebaseConfigured || !firestoreDb) return;
    const cfg = TABLE_CONFIG[table];
    if (!cfg) return;
    try {
      const snap = await getDocs(collection(firestoreDb, cfg.collection));
      const records: any[] = [];
      snap.forEach(d => records.push(d.data()));
      this.cache.set(table, records);
    } catch (err) {
      console.warn(`[DB] fetchTable(${table}) failed:`, err);
      if (!this.cache.has(table)) this.cache.set(table, []);
    }
  }

  // ── Seed Firestore on first run ───────────────────────────────────────────
  private async seedIfEmpty() {
    if (!isFirebaseConfigured || !firestoreDb) return;

    const usersInCache = this.cache.get('omp_users') || [];
    const needsUserSeed = usersInCache.length === 0;

    const lpInCache = this.cache.get('omp_lesson_plans') || [];
    const existingLPIds = new Set(lpInCache.map((p: any) => p.id));
    const missingPVPlans = SEED_PV_LESSON_PLANS.filter(p => !existingLPIds.has(p.id));

    if (!needsUserSeed && missingPVPlans.length === 0) return;

    const batch = writeBatch(firestoreDb);
    let count = 0;

    if (needsUserSeed) {
      // Seed users
      for (const user of SEED_USERS) {
        batch.set(doc(firestoreDb, 'users', user.username), user);
        count++;
      }
    }

    // Always ensure PV lesson plans exist
    for (const plan of missingPVPlans) {
      batch.set(doc(firestoreDb, 'lesson_plans', plan.id), plan);
      count++;
    }

    if (count > 0) {
      await batch.commit();
      // Refresh cache after seeding
      await this.fetchTable('omp_users');
      await this.fetchTable('omp_lesson_plans');
      console.log(`[DB] Seeded ${count} records to Firestore.`);
    }
  }

  // ── Real-time onSnapshot listeners (updates cache on remote changes) ──────
  private setupListeners() {
    if (!isFirebaseConfigured || !firestoreDb) return;

    this.listeners.forEach(u => u());
    this.listeners = [];

    Object.entries(TABLE_CONFIG).forEach(([table, cfg]) => {
      try {
        const colRef = collection(firestoreDb, cfg.collection);
        const unsub = onSnapshot(colRef, (snap) => {
          // Skip pure local writes (we already updated cache synchronously)
          if (snap.metadata.hasPendingWrites) return;

          const records: any[] = [];
          snap.forEach(d => records.push(d.data()));
          this.cache.set(table, records);

          // Dispatch domain events
          if (table === 'omp_sessions') {
            window.dispatchEvent(new Event('omp_session_conducted_update'));
          }
          if (table === 'omp_alerts') {
            window.dispatchEvent(new Event('omp_alerts_change'));
          }
          window.dispatchEvent(new Event('omp_db_pulled'));
        }, err => {
          console.warn(`[DB] Listener error on ${cfg.collection}:`, err);
        });
        this.listeners.push(unsub);
      } catch (err) {
        console.warn(`[DB] Failed to setup listener for ${table}:`, err);
      }
    });
  }

  // ── Generic helpers ───────────────────────────────────────────────────────
  private getTable<T>(table: string): T[] {
    return (this.cache.get(table) || []) as T[];
  }

  private async writeDoc(table: string, data: any): Promise<void> {
    const cfg = TABLE_CONFIG[table];
    if (!cfg) return;

    const docId = String(data[cfg.key]);

    // Update cache immediately (optimistic update)
    const current = this.cache.get(table) || [];
    const idx = current.findIndex((r: any) => String(r[cfg.key]) === docId);
    if (idx >= 0) {
      current[idx] = data;
    } else {
      current.push(data);
    }
    this.cache.set(table, [...current]);

    // Write to Firestore (SDK handles offline queuing automatically)
    if (isFirebaseConfigured && firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, cfg.collection, docId), JSON.parse(JSON.stringify(data)));
      } catch (err) {
        console.warn(`[DB] writeDoc(${table}/${docId}) failed:`, err);
      }
    }
  }

  private async deleteDoc(table: string, data: any): Promise<void> {
    const cfg = TABLE_CONFIG[table];
    if (!cfg) return;

    const docId = String(data[cfg.key]);

    // Remove from cache immediately
    const current = this.cache.get(table) || [];
    this.cache.set(table, current.filter((r: any) => String(r[cfg.key]) !== docId));

    // Delete from Firestore
    if (isFirebaseConfigured && firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, cfg.collection, docId));
      } catch (err) {
        console.warn(`[DB] deleteDoc(${table}/${docId}) failed:`, err);
      }
    }
  }

  // ── Network simulator (kept for UI toggle only) ───────────────────────────
  public isNetworkOnline(): boolean {
    return navigator.onLine;
  }

  // ── Audit Logs ────────────────────────────────────────────────────────────
  public getAuditLogs(): ActivityLog[] {
    return this.getTable<ActivityLog>('omp_audit_logs')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public writeAuditLog(username: string, action: string, details: string, previousValue = '', newValue = '') {
    const newLog: ActivityLog = {
      id: 'aud_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action, details, username, previousValue, newValue
    };
    this.writeDoc('omp_audit_logs', newLog);
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  public getUsers(): User[] {
    return this.getTable<User>('omp_users');
  }

  public saveUser(user: User) {
    this.writeDoc('omp_users', user);
  }

  public deleteUser(username: string) {
    const user = this.getUsers().find(u => u.username === username);
    if (user) this.deleteDoc('omp_users', user);
  }

  // ── Students ──────────────────────────────────────────────────────────────
  public getStudents(): Student[] {
    return this.getTable<Student>('omp_students');
  }

  public getStudentById(id: string): Student | undefined {
    return this.getStudents().find(s => s.studentId === id);
  }

  public saveStudent(student: Student) {
    this.writeDoc('omp_students', student);
  }

  public deleteStudent(studentId: string) {
    const student = this.getStudentById(studentId);
    if (student) this.deleteDoc('omp_students', student);
  }

  // ── Schools ───────────────────────────────────────────────────────────────
  public getSchools(): School[] {
    return this.getTable<School>('omp_schools');
  }

  public getSchoolByCode(code: string): School | undefined {
    return this.getSchools().find(s => s.code === code);
  }

  public saveSchool(school: School) {
    this.writeDoc('omp_schools', school);
  }

  // ── Sessions ──────────────────────────────────────────────────────────────
  public getSessions(): Session[] {
    return this.getTable<Session>('omp_sessions');
  }

  public saveSession(session: Session) {
    this.writeDoc('omp_sessions', session);
    window.dispatchEvent(new Event('omp_session_conducted_update'));

    if (session.status === 'Completed') {
      const school = this.getSchoolByCode(session.schoolCode);
      if (school) {
        const updated = { ...school, sessionsConducted: (school.sessionsConducted || 0) + 1 };
        this.saveSchool(updated);
      }
    }
  }

  // ── Lesson Plans ──────────────────────────────────────────────────────────
  public getLessonPlans(): LessonPlan[] {
    return this.getTable<LessonPlan>('omp_lesson_plans');
  }

  public saveLessonPlan(plan: LessonPlan) {
    this.writeDoc('omp_lesson_plans', plan);
  }

  // ── Inventory ─────────────────────────────────────────────────────────────
  public getInventory(): InventoryItem[] {
    return this.getTable<InventoryItem>('omp_inventory');
  }

  public saveInventoryItem(item: InventoryItem) {
    this.writeDoc('omp_inventory', item);

    if (item.currentStock < item.minThreshold) {
      const alertExists = this.getAlerts().some(
        a => a.type === 'low_stock' && a.message.includes(item.name) && !a.isResolved
      );
      if (!alertExists) {
        this.addAlert({
          id: Math.random().toString(36).substr(2, 9),
          type: 'low_stock',
          severity: 'high',
          message: `${item.name} stock level (${item.currentStock} ${item.unit}) fell below threshold (${item.minThreshold} ${item.unit}).`,
          createdAt: new Date().toISOString(),
          isResolved: false
        });
      }
    }
  }

  // ── Transport ─────────────────────────────────────────────────────────────
  public getTransport(): TransportRoute[] {
    return this.getTable<TransportRoute>('omp_transport');
  }

  public saveTransportRoute(route: TransportRoute) {
    this.writeDoc('omp_transport', route);
  }

  // ── Alerts ────────────────────────────────────────────────────────────────
  public getAlerts(): SystemAlert[] {
    return this.getTable<SystemAlert>('omp_alerts');
  }

  public addAlert(alert: SystemAlert) {
    this.writeDoc('omp_alerts', alert);
    window.dispatchEvent(new Event('omp_alerts_change'));
  }

  public resolveAlert(id: string) {
    const alert = this.getAlerts().find(a => a.id === id);
    if (alert) {
      this.writeDoc('omp_alerts', { ...alert, isResolved: true });
      window.dispatchEvent(new Event('omp_alerts_change'));
    }
  }

  // ── Drivers ───────────────────────────────────────────────────────────────
  public getDrivers(): DriverDetails[] {
    return this.getTable<DriverDetails>('omp_drivers');
  }

  public saveDriver(driver: DriverDetails) {
    this.writeDoc('omp_drivers', driver);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // ── Vehicles ──────────────────────────────────────────────────────────────
  public getVehicles(): VehicleDetails[] {
    return this.getTable<VehicleDetails>('omp_vehicles');
  }

  public saveVehicle(vehicle: VehicleDetails) {
    this.writeDoc('omp_vehicles', vehicle);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // ── Driver Entries ────────────────────────────────────────────────────────
  public getDriverEntries(): DriverDailyEntry[] {
    return this.getTable<DriverDailyEntry>('omp_driver_entries');
  }

  public saveDriverEntry(entry: DriverDailyEntry) {
    this.writeDoc('omp_driver_entries', entry);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // ── Reimbursements ────────────────────────────────────────────────────────
  public getReimbursements(): TrainerReimbursement[] {
    return this.getTable<TrainerReimbursement>('omp_reimbursements');
  }

  public saveReimbursement(reimbursement: TrainerReimbursement) {
    this.writeDoc('omp_reimbursements', reimbursement);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // ── Weekly Submissions ────────────────────────────────────────────────────
  public getWeeklySubmissions(): WeeklySubmissionStatus[] {
    return this.getTable<WeeklySubmissionStatus>('omp_weekly_submissions');
  }

  public saveWeeklySubmission(submission: WeeklySubmissionStatus) {
    this.writeDoc('omp_weekly_submissions', submission);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // ── Dashboard Layouts ─────────────────────────────────────────────────────
  public getDashboardLayout(username: string, dashboardKey: string): DashboardLayout | undefined {
    const id = `${username}_${dashboardKey}`;
    return this.getTable<DashboardLayout>('omp_dashboard_layouts').find(l => l.id === id);
  }

  public saveDashboardLayout(username: string, dashboardKey: string, widgets: DashboardLayout['widgets']) {
    const id = `${username}_${dashboardKey}`;
    const layout: DashboardLayout = {
      id, username, dashboardKey, widgets,
      updatedAt: new Date().toISOString(),
    };
    this.writeDoc('omp_dashboard_layouts', layout);
  }

  // ── Trainer Location ──────────────────────────────────────────────────────
  public updateTrainerLocation(username: string, lat: number, lng: number) {
    const user = this.getUsers().find(u => u.username === username);
    if (!user) return;
    const timestamp = new Date().toISOString();
    const newLoc = { lat, lng, timestamp };
    const updatedUser = {
      ...user,
      lastKnownLocation: newLoc,
      locationHistory: [newLoc, ...(user.locationHistory || [])].slice(0, 20),
    };
    this.writeDoc('omp_users', updatedUser);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // ── Counselling ───────────────────────────────────────────────────────────
  public getCounselling(): CounsellingRecord[] {
    return this.getTable<CounsellingRecord>('omp_counselling');
  }

  public saveCounsellingRecord(record: CounsellingRecord) {
    this.writeDoc('omp_counselling', record);
  }

  // ── Monitoring ────────────────────────────────────────────────────────────
  public getMonitoring(): MonitoringVisit[] {
    return this.getTable<MonitoringVisit>('omp_monitoring');
  }

  public saveMonitoringVisit(visit: MonitoringVisit) {
    this.writeDoc('omp_monitoring', visit);
  }

  // ── Timetable ─────────────────────────────────────────────────────────────
  public getTimetable(): TimetableEntry[] {
    return this.getTable<TimetableEntry>('omp_timetable');
  }

  public saveTimetableEntry(entry: TimetableEntry) {
    const previous = JSON.stringify(
      this.getTimetable().find(t => t.id === entry.id) || {}
    );
    this.writeDoc('omp_timetable', entry);
    this.writeAuditLog(
      'admin', 'Timetable Entry Saved',
      `Saved timetable for Group ${entry.group}, Teacher ${entry.teacherName} on ${entry.dayOfWeek}`,
      previous, JSON.stringify(entry)
    );
    this.addAlert({
      id: Math.random().toString(36).substr(2, 9),
      type: 'timetable_changed',
      severity: 'medium',
      message: `Timetable altered: ${entry.teacherName} assigned to ${entry.schoolName} on ${entry.dayOfWeek}.`,
      programme: 'Pre-Vocational',
      createdAt: new Date().toISOString(),
      isResolved: false
    });
  }

  public async importTimetable(entries: TimetableEntry[]) {
    if (isFirebaseConfigured && firestoreDb) {
      // Batch write all entries
      const CHUNK = 400; // Firestore batch limit is 500
      for (let i = 0; i < entries.length; i += CHUNK) {
        const batch = writeBatch(firestoreDb);
        entries.slice(i, i + CHUNK).forEach(e => {
          batch.set(doc(firestoreDb, 'timetable', e.id), JSON.parse(JSON.stringify(e)));
        });
        await batch.commit();
      }
    }
    // Update cache
    this.cache.set('omp_timetable', entries);
    window.dispatchEvent(new Event('omp_db_pulled'));

    this.writeAuditLog('admin', 'Timetable Spreadsheet Import',
      `Imported ${entries.length} timetable entries via Excel/CSV.`, '', `Imported count: ${entries.length}`);
    this.addAlert({
      id: Math.random().toString(36).substr(2, 9),
      type: 'timetable_changed',
      severity: 'high',
      message: `Timetable changed: Bulk imported ${entries.length} schedules.`,
      programme: 'Pre-Vocational',
      createdAt: new Date().toISOString(),
      isResolved: false
    });
  }

  // ── Sync Queue (kept for API compat, no longer used internally) ───────────
  public getSyncQueue(): SyncItem[] {
    return []; // No more local queue — Firestore SDK handles offline automatically
  }

  public async syncPendingQueue() {
    // No-op: Firestore SDK handles offline sync automatically via IndexedDB persistence
    window.dispatchEvent(new CustomEvent('omp_toast_message', {
      detail: 'All data is synced to Firestore in real-time.'
    }));
  }

  public async pullAllFromFirestore() {
    await Promise.all(Object.keys(TABLE_CONFIG).map(t => this.fetchTable(t)));
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  public setupRealtimeListeners() {
    this.setupListeners();
  }

  // ── Admin: one-time seed tool ─────────────────────────────────────────────
  public async seedFirestoreDatabase(): Promise<number> {
    if (!isFirebaseConfigured || !firestoreDb) {
      throw new Error('Firebase not configured.');
    }
    await this.seedIfEmpty();
    return SEED_USERS.length + SEED_PV_LESSON_PLANS.length;
  }
}

export const db = new OmpDatabase();
export default db;
