import type { 
  User, Student, School, Session, LessonPlan, 
  CounsellingRecord, InventoryItem, TransportRoute, 
  MonitoringVisit, SystemAlert, SyncItem, TimetableEntry, ActivityLog,
  DriverDetails, VehicleDetails, DriverDailyEntry, TrainerReimbursement, WeeklySubmissionStatus
} from '../types';
import { firestoreDb, isFirebaseConfigured } from './firebase';
import { doc, setDoc, deleteDoc, writeBatch, collection, getDocs, onSnapshot } from 'firebase/firestore';

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
  },
  // ==================== Pre-Vocational Teachers ====================
  {
    username: 'trainer.krunal',
    name: 'Krunal (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'krunalpass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.jinal',
    name: 'Jinal (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'jinalpass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.sunita',
    name: 'Sunita (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'sunitapass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.sumanti',
    name: 'Sumanti (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'sumantipass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.mital',
    name: 'Mital (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'mitalpass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.mahendra',
    name: 'Mahendra (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'mahendrapass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.anjana',
    name: 'Anjana (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'anjanapass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.anjali',
    name: 'Anjali (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'anjalipass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.leelaben',
    name: 'Leelaben (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'leelabenpass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.divyesh',
    name: 'Divyesh (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'divyeshpass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.vaishali',
    name: 'Vaishali (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'vaishalipass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.manisha',
    name: 'Manisha (Pre-Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Pre-Vocational',
    assignedSchools: [],
    assignedDistricts: ['Valsad'],
    isActive: true,
    password: 'manishapass123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'driver.karsan',
    name: 'Karsanbhai Rabari (Driver)',
    role: 'driver',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: [],
    isActive: true,
    password: 'password123',
    permissions: ['View Driver Dashboard', 'Log Trips'],
    activityLogs: []
  },
  {
    username: 'driver.sanjay',
    name: 'Sanjay Tadvi (Driver)',
    role: 'driver',
    assignedProgramme: 'All',
    assignedSchools: [],
    assignedDistricts: [],
    isActive: true,
    password: 'password123',
    permissions: ['View Driver Dashboard', 'Log Trips'],
    activityLogs: []
  },
  {
    username: 'trainer.amit',
    name: 'Amit Patel (Vocational Trainer)',
    role: 'trainer',
    assignedProgramme: 'Vocational',
    assignedSchools: ['S101'],
    assignedDistricts: ['Ahmedabad'],
    isActive: true,
    password: 'password123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
    activityLogs: []
  },
  {
    username: 'trainer.neha',
    name: 'Neha Shah (Magic Touch Trainer)',
    role: 'trainer',
    assignedProgramme: 'Magic Touch',
    assignedSchools: ['S103'],
    assignedDistricts: ['Aravalli'],
    isActive: true,
    password: 'password123',
    permissions: ['View Students', 'View Attendance', 'Mark Attendance'],
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
  },

  // PRE-VOCATIONAL ECO SCHOOLS (71 new Dharampur cluster schools)
  { code: 'S_PV_1', name: 'Khanda Primary school', principalName: 'Shri A. Patel', principalContact: '+91 99000 11101', village: 'Khanda', taluka: 'Dharampur', district: 'Valsad', studentStrength: 95, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_2', name: 'Sawarmal Primary school', principalName: 'Shri B. Desai', principalContact: '+91 99000 11102', village: 'Sawarmal', taluka: 'Dharampur', district: 'Valsad', studentStrength: 110, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_3', name: 'Kangvi Primary school', principalName: 'Shri C. Naik', principalContact: '+91 99000 11103', village: 'Kangvi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 85, sessionsTarget: 20, sessionsConducted: 10, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_4', name: 'Karanjveri Patel faliya', principalName: 'Shri D. Chaudhari', principalContact: '+91 99000 11104', village: 'Karanjveri', taluka: 'Dharampur', district: 'Valsad', studentStrength: 75, sessionsTarget: 20, sessionsConducted: 8, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_5', name: 'Navinagri Primary', principalName: 'Shri E. Gamit', principalContact: '+91 99000 11105', village: 'Navinagri', taluka: 'Dharampur', district: 'Valsad', studentStrength: 90, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_6', name: 'Malanpada Primary school, Dasherapati', principalName: 'Shri F. Rathod', principalContact: '+91 99000 11106', village: 'Malanpada', taluka: 'Dharampur', district: 'Valsad', studentStrength: 120, sessionsTarget: 20, sessionsConducted: 13, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_7', name: 'Baroliya Mukhya shala', principalName: 'Shri G. Vasava', principalContact: '+91 99000 11107', village: 'Baroliya', taluka: 'Dharampur', district: 'Valsad', studentStrength: 100, sessionsTarget: 20, sessionsConducted: 15, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_8', name: 'Ozarpada Primary school', principalName: 'Shri H. Solanki', principalContact: '+91 99000 11108', village: 'Ozarpada', taluka: 'Dharampur', district: 'Valsad', studentStrength: 105, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_9', name: 'Nilparn Ashram shala Khanda', principalName: 'Shri I. Chauhan', principalContact: '+91 99000 11109', village: 'Khanda', taluka: 'Dharampur', district: 'Valsad', studentStrength: 130, sessionsTarget: 20, sessionsConducted: 16, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_10', name: 'Bhavada Primary school', principalName: 'Shri J. Jadeja', principalContact: '+91 99000 11110', village: 'Bhavada', taluka: 'Dharampur', district: 'Valsad', studentStrength: 80, sessionsTarget: 20, sessionsConducted: 9, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_11', name: 'SRVV Tamchhadi', principalName: 'Shri K. Parmar', principalContact: '+91 99000 11111', village: 'Tamchhadi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 140, sessionsTarget: 20, sessionsConducted: 18, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_12', name: 'Tamchhadi Primary school', principalName: 'Shri L. Vaghela', principalContact: '+91 99000 11112', village: 'Tamchhadi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 115, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_13', name: 'Besfaliya bilpudi Primary school', principalName: 'Shri M. Mewada', principalContact: '+91 99000 11113', village: 'Bilpudi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 92, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_14', name: 'Primary school Dungarpada', principalName: 'Shri N. Dodiya', principalContact: '+91 99000 11114', village: 'Dungarpada', taluka: 'Dharampur', district: 'Valsad', studentStrength: 88, sessionsTarget: 20, sessionsConducted: 10, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_15', name: 'Vidyamandir sherimal', principalName: 'Shri O. Joshi', principalContact: '+91 99000 11115', village: 'Sherimal', taluka: 'Dharampur', district: 'Valsad', studentStrength: 150, sessionsTarget: 20, sessionsConducted: 17, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_16', name: 'Kanya Ashram Shala Tanki', principalName: 'Shri P. Rawal', principalContact: '+91 99000 11116', village: 'Tanki', taluka: 'Dharampur', district: 'Valsad', studentStrength: 160, sessionsTarget: 20, sessionsConducted: 19, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_17', name: 'Kharvel Primary school', principalName: 'Shri Q. Dave', principalContact: '+91 99000 11117', village: 'Kharvel', taluka: 'Dharampur', district: 'Valsad', studentStrength: 100, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_18', name: 'Patel faliya Baroliya', principalName: 'Shri R. Trivedi', principalContact: '+91 99000 11118', village: 'Baroliya', taluka: 'Dharampur', district: 'Valsad', studentStrength: 82, sessionsTarget: 20, sessionsConducted: 9, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_19', name: 'Bamti Primary school', principalName: 'Shri S. Vyas', principalContact: '+91 99000 11119', village: 'Bamti', taluka: 'Dharampur', district: 'Valsad', studentStrength: 108, sessionsTarget: 20, sessionsConducted: 13, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_20', name: 'Kelavni Kendra shala', principalName: 'Shri T. Pandya', principalContact: '+91 99000 11120', village: 'Kelavni', taluka: 'Dharampur', district: 'Valsad', studentStrength: 125, sessionsTarget: 20, sessionsConducted: 15, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_21', name: 'Ashram Shala Tamchhadi', principalName: 'Shri U. Bhatt', principalContact: '+91 99000 11121', village: 'Tamchhadi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 135, sessionsTarget: 20, sessionsConducted: 16, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_22', name: 'Patel faliya Prathmik Shala Kelavni', principalName: 'Shri V. Pathak', principalContact: '+91 99000 11122', village: 'Kelavni', taluka: 'Dharampur', district: 'Valsad', studentStrength: 98, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_23', name: 'Barumal primary school', principalName: 'Shri W. Dwivedi', principalContact: '+91 99000 11123', village: 'Barumal', taluka: 'Dharampur', district: 'Valsad', studentStrength: 112, sessionsTarget: 20, sessionsConducted: 13, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_24', name: 'Kanurbarda Primary school', principalName: 'Shri X. Shastri', principalContact: '+91 99000 11124', village: 'Kanurbarda', taluka: 'Dharampur', district: 'Valsad', studentStrength: 86, sessionsTarget: 20, sessionsConducted: 10, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_25', name: 'Avdha Primary school (2)', principalName: 'Shri Y. Upadhyay', principalContact: '+91 99000 11125', village: 'Avdha', taluka: 'Dharampur', district: 'Valsad', studentStrength: 102, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_26', name: 'Ghogharpati Primary school', principalName: 'Shri Z. Shukla', principalContact: '+91 99000 11126', village: 'Ghogharpati', taluka: 'Dharampur', district: 'Valsad', studentStrength: 90, sessionsTarget: 20, sessionsConducted: 10, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_27', name: 'Ranpada Primary school', principalName: 'Shri A. Ray', principalContact: '+91 99000 11127', village: 'Ranpada', taluka: 'Dharampur', district: 'Valsad', studentStrength: 118, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_28', name: 'Rajmahal road Primary school (2)', principalName: 'Shri B. Sen', principalContact: '+91 99000 11128', village: 'Rajmahal', taluka: 'Dharampur', district: 'Valsad', studentStrength: 130, sessionsTarget: 20, sessionsConducted: 15, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_29', name: 'Sidumbar Primary school (2)', principalName: 'Shri C. Das', principalContact: '+91 99000 11129', village: 'Sidumbar', taluka: 'Dharampur', district: 'Valsad', studentStrength: 124, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_30', name: 'Asura primary school', principalName: 'Shri D. Roy', principalContact: '+91 99000 11130', village: 'Asura', taluka: 'Dharampur', district: 'Valsad', studentStrength: 105, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_31', name: 'Kunkan faliya Primary school (Poonam)', principalName: 'Shri E. Pal', principalContact: '+91 99000 11131', village: 'Kunkan', taluka: 'Dharampur', district: 'Valsad', studentStrength: 84, sessionsTarget: 20, sessionsConducted: 9, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_32', name: 'chondha Primary school', principalName: 'Shri F. Dutt', principalContact: '+91 99000 11132', village: 'Chondha', taluka: 'Dharampur', district: 'Valsad', studentStrength: 96, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_33', name: 'Luheri Primary school', principalName: 'Shri G. Bose', principalContact: '+91 99000 11133', village: 'Luheri', taluka: 'Dharampur', district: 'Valsad', studentStrength: 112, sessionsTarget: 20, sessionsConducted: 13, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_34', name: 'Ananad ashram Shala chondha', principalName: 'Shri H. Ghose', principalContact: '+91 99000 11134', village: 'Chondha', taluka: 'Dharampur', district: 'Valsad', studentStrength: 142, sessionsTarget: 20, sessionsConducted: 17, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_35', name: 'Jagiri faliya Primary school Bartad', principalName: 'Shri I. Mitra', principalContact: '+91 99000 11135', village: 'Bartad', taluka: 'Dharampur', district: 'Valsad', studentStrength: 89, sessionsTarget: 20, sessionsConducted: 10, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_36', name: 'Naniba ashram shala', principalName: 'Shri J. Dhar', principalContact: '+91 99000 11136', village: 'Naniba', taluka: 'Dharampur', district: 'Valsad', studentStrength: 128, sessionsTarget: 20, sessionsConducted: 15, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_37', name: 'Ambadalat Primary school', principalName: 'Shri K. Nag', principalContact: '+91 99000 11137', village: 'Ambadalat', taluka: 'Dharampur', district: 'Valsad', studentStrength: 100, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_38', name: 'Kamalzari primary school', principalName: 'Shri L. Som', principalContact: '+91 99000 11138', village: 'Kamalzari', taluka: 'Dharampur', district: 'Valsad', studentStrength: 91, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_39', name: 'Kelipada primary school', principalName: 'Shri M. Guha', principalContact: '+91 99000 11139', village: 'Kelipada', taluka: 'Dharampur', district: 'Valsad', studentStrength: 97, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_40', name: 'Molaamba Primary school', principalName: 'Shri N. Barua', principalContact: '+91 99000 11140', village: 'Molaamba', taluka: 'Dharampur', district: 'Valsad', studentStrength: 118, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_41', name: 'Khanpur primary school', principalName: 'Shri O. Sinha', principalContact: '+91 99000 11141', village: 'Khanpur', taluka: 'Dharampur', district: 'Valsad', studentStrength: 83, sessionsTarget: 20, sessionsConducted: 9, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_42', name: 'Bopi Primary school', principalName: 'Shri P. Sur', principalContact: '+91 99000 11142', village: 'Bopi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 104, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_43', name: 'Bapu Ashram shala Bopi', principalName: 'Shri Q. Kar', principalContact: '+91 99000 11143', village: 'Bopi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 136, sessionsTarget: 20, sessionsConducted: 16, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_44', name: 'Maji Rajbaa Kanya shala dharampur', principalName: 'Shri R. De', principalContact: '+91 99000 11144', village: 'Dharampur', taluka: 'Dharampur', district: 'Valsad', studentStrength: 155, sessionsTarget: 20, sessionsConducted: 19, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_45', name: 'Ashram Shala Asura', principalName: 'Shri S. Roy', principalContact: '+91 99000 11145', village: 'Asura', taluka: 'Dharampur', district: 'Valsad', studentStrength: 122, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_46', name: 'Moti Dholdungri Primary school', principalName: 'Shri T. Paul', principalContact: '+91 99000 11146', village: 'Moti Dholdungri', taluka: 'Dharampur', district: 'Valsad', studentStrength: 110, sessionsTarget: 20, sessionsConducted: 13, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_47', name: 'Khatana Primary school', principalName: 'Shri U. Sen', principalContact: '+91 99000 11147', village: 'Khatana', taluka: 'Dharampur', district: 'Valsad', studentStrength: 94, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_48', name: 'Dhamni Mukhya Shala', principalName: 'Shri V. Das', principalContact: '+91 99000 11148', village: 'Dhamni', taluka: 'Dharampur', district: 'Valsad', studentStrength: 115, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_49', name: 'UMARMAAD VARG SHALA', principalName: 'Shri W. Nag', principalContact: '+91 99000 11149', village: 'Umarmaad', taluka: 'Dharampur', district: 'Valsad', studentStrength: 78, sessionsTarget: 20, sessionsConducted: 9, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_50', name: 'Karanjveri Primary school (2)', principalName: 'Shri X. Som', principalContact: '+91 99000 11150', village: 'Karanjveri', taluka: 'Dharampur', district: 'Valsad', studentStrength: 102, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_51', name: 'ASHRAMSHALA DHAMNI', principalName: 'Shri Y. Bose', principalContact: '+91 99000 11151', village: 'Dhamni', taluka: 'Dharampur', district: 'Valsad', studentStrength: 125, sessionsTarget: 20, sessionsConducted: 15, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_52', name: 'BEJBHAVADA PRIMARY SCHOOL', principalName: 'Shri Z. Dutt', principalContact: '+91 99000 11152', village: 'Bejbhavada', taluka: 'Dharampur', district: 'Valsad', studentStrength: 132, sessionsTarget: 20, sessionsConducted: 16, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_53', name: 'Mendha Primary school', principalName: 'Shri A. Guha', principalContact: '+91 99000 11153', village: 'Mendha', taluka: 'Dharampur', district: 'Valsad', studentStrength: 87, sessionsTarget: 20, sessionsConducted: 10, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_54', name: 'bheshdhara / pendha', principalName: 'Shri B. Kar', principalContact: '+91 99000 11154', village: 'Bheshdhara', taluka: 'Dharampur', district: 'Valsad', studentStrength: 106, sessionsTarget: 20, sessionsConducted: 12, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_55', name: 'ashram shala bhesdhara', principalName: 'Shri C. Sen', principalContact: '+91 99000 11155', village: 'Bhesdhara', taluka: 'Dharampur', district: 'Valsad', studentStrength: 118, sessionsTarget: 20, sessionsConducted: 14, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_56', name: 'Lakadmal Primary school', principalName: 'Shri D. Ray', principalContact: '+91 99000 11156', village: 'Lakadmal', taluka: 'Dharampur', district: 'Valsad', studentStrength: 92, sessionsTarget: 20, sessionsConducted: 11, runningProgrammes: ['Pre-Vocational'] },

  // Second list schools (codes S_PV_57 to S_PV_71)
  { code: 'S_PV_57', name: 'Kherlav pra school', principalName: 'Shri E. Roy', principalContact: '+91 99000 11157', village: 'Kherlav', taluka: 'Dharampur', district: 'Valsad', studentStrength: 85, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_58', name: 'Barai prathmik shala', principalName: 'Shri F. Pal', principalContact: '+91 99000 11158', village: 'Barai', taluka: 'Dharampur', district: 'Valsad', studentStrength: 95, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_59', name: 'Goyma mukhaya shala', principalName: 'Shri G. Pal', principalContact: '+91 99000 11159', village: 'Goyma', taluka: 'Dharampur', district: 'Valsad', studentStrength: 112, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_60', name: 'Khutej prathmik shala', principalName: 'Shri H. Dutt', principalContact: '+91 99000 11160', village: 'Khutej', taluka: 'Dharampur', district: 'Valsad', studentStrength: 90, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_61', name: 'Pariya Haran faliya Primary School', principalName: 'Shri I. Dutt', principalContact: '+91 99000 11161', village: 'Pariya', taluka: 'Dharampur', district: 'Valsad', studentStrength: 80, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_62', name: 'Rohina mukhaya school', principalName: 'Shri J. Dutt', principalContact: '+91 99000 11162', village: 'Rohina', taluka: 'Dharampur', district: 'Valsad', studentStrength: 105, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_63', name: 'Navera mukhya pra shala', principalName: 'Shri K. Dutt', principalContact: '+91 99000 11163', village: 'Navera', taluka: 'Dharampur', district: 'Valsad', studentStrength: 98, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_64', name: 'Ozar tad faliya pra school', principalName: 'Shri L. Dutt', principalContact: '+91 99000 11164', village: 'Ozar', taluka: 'Dharampur', district: 'Valsad', studentStrength: 85, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_65', name: 'Kakadmati Primary School', principalName: 'Shri M. Dutt', principalContact: '+91 99000 11165', village: 'Kakadmati', taluka: 'Dharampur', district: 'Valsad', studentStrength: 96, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_66', name: 'Parvasa mukhya school', principalName: 'Shri N. Dutt', principalContact: '+91 99000 11166', village: 'Parvasa', taluka: 'Dharampur', district: 'Valsad', studentStrength: 110, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_67', name: 'Rata prathmik Shala', principalName: 'Shri O. Dutt', principalContact: '+91 99000 11167', village: 'Rata', taluka: 'Dharampur', district: 'Valsad', studentStrength: 90, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_68', name: 'Rabdi Prmary School', principalName: 'Shri P. Dutt', principalContact: '+91 99000 11168', village: 'Rabdi', taluka: 'Dharampur', district: 'Valsad', studentStrength: 82, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_69', name: 'Pati primary school', principalName: 'Shri Q. Dutt', principalContact: '+91 99000 11169', village: 'Pati', taluka: 'Dharampur', district: 'Valsad', studentStrength: 88, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_70', name: 'Arnala pra shala school', principalName: 'Shri R. Dutt', principalContact: '+91 99000 11170', village: 'Arnala', taluka: 'Dharampur', district: 'Valsad', studentStrength: 120, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] },
  { code: 'S_PV_71', name: 'Nevri pra school', principalName: 'Shri S. Dutt', principalContact: '+91 99000 11171', village: 'Nevri', taluka: 'Dharampur', district: 'Valsad', studentStrength: 95, sessionsTarget: 20, sessionsConducted: 0, runningProgrammes: ['Pre-Vocational'] }
];

const SEED_STUDENTS: Student[] = [];

const SEED_SESSIONS: Session[] = [];

const SEED_LESSON_PLANS: LessonPlan[] = [];

const SEED_INVENTORY: InventoryItem[] = [];

const SEED_TRANSPORT: TransportRoute[] = [];

const SEED_DRIVERS: DriverDetails[] = [];

const SEED_VEHICLES: VehicleDetails[] = [];

const SEED_DRIVER_ENTRIES: DriverDailyEntry[] = [];

const SEED_REIMBURSEMENTS: TrainerReimbursement[] = [];

const SEED_WEEKLY_SUBMISSIONS: WeeklySubmissionStatus[] = [];

const SEED_ALERTS: SystemAlert[] = [];

const SEED_COUNSELLING: CounsellingRecord[] = [];

const SEED_MONITORING: MonitoringVisit[] = [];

const SEED_TIMETABLE: TimetableEntry[] = [
  // ==================== G.1 | Pre-Voc Schedule 2025-26 ====================
  // Monday
  { id: 'tt_g1_m1', group: 'G.1', trade: 'Ex. HH', teacherName: 'Krunal', dayOfWeek: 'Monday', schoolName: 'Khanda Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_m2', group: 'G.1', trade: 'TT (Tech)', teacherName: 'Jinal', dayOfWeek: 'Monday', schoolName: 'Sawarmal Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_m3', group: 'G.1', trade: 'MM', teacherName: 'Sunita', dayOfWeek: 'Monday', schoolName: 'Kagnvi Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_m4', group: 'G.1', trade: 'Ag', teacherName: 'Sumanti', dayOfWeek: 'Monday', schoolName: 'Karanjveri Patel faliya', district: 'Valsad', taluka: 'Dharampur' },
  // Tuesday
  { id: 'tt_g1_t1', group: 'G.1', trade: 'Ex. HH', teacherName: 'Krunal', dayOfWeek: 'Tuesday', schoolName: 'SRVV Tamchhadi', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_t2', group: 'G.1', trade: 'TT (Tech)', teacherName: 'Jinal', dayOfWeek: 'Tuesday', schoolName: 'Tamchhadi Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_t3', group: 'G.1', trade: 'MM', teacherName: 'Sunita', dayOfWeek: 'Tuesday', schoolName: 'Besfaliya bilpudi Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_t4', group: 'G.1', trade: 'Ag', teacherName: 'Sumanti', dayOfWeek: 'Tuesday', schoolName: 'Primary school Dungarpada', district: 'Valsad', taluka: 'Dharampur' },
  // Wednesday (Krunal has no Wednesday class per schedule)
  { id: 'tt_g1_w2', group: 'G.1', trade: 'TT (Tech)', teacherName: 'Jinal', dayOfWeek: 'Wednesday', schoolName: 'Barumal primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_w3', group: 'G.1', trade: 'MM', teacherName: 'Sunita', dayOfWeek: 'Wednesday', schoolName: 'Kanurbarda Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_w4', group: 'G.1', trade: 'Ag', teacherName: 'Sumanti', dayOfWeek: 'Wednesday', schoolName: 'Avdha Primary school (2)', district: 'Valsad', taluka: 'Dharampur' },
  // Thursday
  { id: 'tt_g1_th1', group: 'G.1', trade: 'Ex. HH', teacherName: 'Krunal', dayOfWeek: 'Thursday', schoolName: 'chondha Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_th2', group: 'G.1', trade: 'TT (Tech)', teacherName: 'Jinal', dayOfWeek: 'Thursday', schoolName: 'Luheri Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_th3', group: 'G.1', trade: 'MM', teacherName: 'Sunita', dayOfWeek: 'Thursday', schoolName: 'Ananad ashram Shala chondha', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_th4', group: 'G.1', trade: 'Ag', teacherName: 'Sumanti', dayOfWeek: 'Thursday', schoolName: 'Jagiri faliya Primary school Bartad', district: 'Valsad', taluka: 'Dharampur' },
  // Friday
  { id: 'tt_g1_f1', group: 'G.1', trade: 'Ex. HH', teacherName: 'Krunal', dayOfWeek: 'Friday', schoolName: 'Maji Rajbaa Kanya shala dharampur', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_f2', group: 'G.1', trade: 'TT (Tech)', teacherName: 'Jinal', dayOfWeek: 'Friday', schoolName: 'Ashram Shala Asura', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_f3', group: 'G.1', trade: 'MM', teacherName: 'Sunita', dayOfWeek: 'Friday', schoolName: 'Moti Dholdungri Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g1_f4', group: 'G.1', trade: 'Ag', teacherName: 'Sumanti', dayOfWeek: 'Friday', schoolName: 'Khatana Primary school', district: 'Valsad', taluka: 'Dharampur' },

  // ==================== G.2 ====================
  // Monday
  { id: 'tt_g2_m1', group: 'G.2', trade: 'Ex. HH', teacherName: 'Mital', dayOfWeek: 'Monday', schoolName: 'Navinagri Primary', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_m2', group: 'G.2', trade: 'TT (Tech)', teacherName: 'Mahendra', dayOfWeek: 'Monday', schoolName: 'Malanpada Primary school, Dasherapati', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_m3', group: 'G.2', trade: 'MM', teacherName: 'Anjana', dayOfWeek: 'Monday', schoolName: 'Baroliya Mukhya shala', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_m4', group: 'G.2', trade: 'Ag', teacherName: 'Anjali', dayOfWeek: 'Monday', schoolName: 'Ozarpada Primary school', district: 'Valsad', taluka: 'Dharampur' },
  // Tuesday
  { id: 'tt_g2_t1', group: 'G.2', trade: 'Ex. HH', teacherName: 'Mital', dayOfWeek: 'Tuesday', schoolName: 'Vidyamandir sherimal', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_t2', group: 'G.2', trade: 'TT (Tech)', teacherName: 'Mahendra', dayOfWeek: 'Tuesday', schoolName: 'Bhensdara Prathmik shala / pendha prathmik shala / makadban', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_t3', group: 'G.2', trade: 'MM', teacherName: 'Anjana', dayOfWeek: 'Tuesday', schoolName: 'Kharvel Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_t4', group: 'G.2', trade: 'Ag', teacherName: 'Anjali', dayOfWeek: 'Tuesday', schoolName: 'Patel faliya Baroliya', district: 'Valsad', taluka: 'Dharampur' },
  // Wednesday
  { id: 'tt_g2_w1', group: 'G.2', trade: 'Ex. HH', teacherName: 'Mital', dayOfWeek: 'Wednesday', schoolName: 'Ghogharpati Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_w2', group: 'G.2', trade: 'TT (Tech)', teacherName: 'Mahendra', dayOfWeek: 'Wednesday', schoolName: 'Ranpada Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_w3', group: 'G.2', trade: 'MM', teacherName: 'Anjana', dayOfWeek: 'Wednesday', schoolName: 'Rajmahal road Primary school', district: 'Valsad', taluka: 'Dharampur' },
  // Thursday
  { id: 'tt_g2_th1', group: 'G.2', trade: 'Ex. HH', teacherName: 'Mital', dayOfWeek: 'Thursday', schoolName: 'Naniba ashram shala', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_th2', group: 'G.2', trade: 'TT (Tech)', teacherName: 'Mahendra', dayOfWeek: 'Thursday', schoolName: 'Ambatalat Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_th3', group: 'G.2', trade: 'MM', teacherName: 'Anjana', dayOfWeek: 'Thursday', schoolName: 'Kamalzari primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_th4', group: 'G.2', trade: 'Ag', teacherName: 'Anjali', dayOfWeek: 'Thursday', schoolName: 'Kelipada primary school', district: 'Valsad', taluka: 'Dharampur' },
  // Friday
  { id: 'tt_g2_f1', group: 'G.2', trade: 'Ex. HH', teacherName: 'Mital', dayOfWeek: 'Friday', schoolName: 'Dhamni Mukhya Shala', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_f2', group: 'G.2', trade: 'TT (Tech)', teacherName: 'Mahendra', dayOfWeek: 'Friday', schoolName: 'UMARMAAD VARG SHALA', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g2_f3', group: 'G.2', trade: 'MM', teacherName: 'Anjana', dayOfWeek: 'Friday', schoolName: 'Karanjveri Primary school', district: 'Valsad', taluka: 'Dharampur' },

  // ==================== G.3 ====================
  // Monday
  { id: 'tt_g3_m1', group: 'G.3', trade: 'Ex. HH', teacherName: 'Leelaben', dayOfWeek: 'Monday', schoolName: 'Nilparn Ashram shala Khanda', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_m2', group: 'G.3', trade: 'EE', teacherName: 'Divyesh', dayOfWeek: 'Monday', schoolName: 'Ashram Shala Bhensdara', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_m3', group: 'G.3', trade: 'MM', teacherName: 'Vaishali', dayOfWeek: 'Monday', schoolName: 'Lakadmal Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_m4', group: 'G.3', trade: 'Ag', teacherName: 'Manisha', dayOfWeek: 'Monday', schoolName: 'Bhavada Primary school', district: 'Valsad', taluka: 'Dharampur' },
  // Tuesday
  { id: 'tt_g3_t1', group: 'G.3', trade: 'Ex. HH', teacherName: 'Leelaben', dayOfWeek: 'Tuesday', schoolName: 'Bamti Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_t2', group: 'G.3', trade: 'EE', teacherName: 'Divyesh', dayOfWeek: 'Tuesday', schoolName: 'Kelavani Kendra shala', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_t3', group: 'G.3', trade: 'MM', teacherName: 'Vaishali', dayOfWeek: 'Tuesday', schoolName: 'Ashram Shala Tamchhadi', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_t4', group: 'G.3', trade: 'Ag', teacherName: 'Manisha', dayOfWeek: 'Tuesday', schoolName: 'Patel faliya Prathmik Shala Kelavni', district: 'Valsad', taluka: 'Dharampur' },
  // Wednesday
  { id: 'tt_g3_w1', group: 'G.3', trade: 'Ex. HH', teacherName: 'Leelaben', dayOfWeek: 'Wednesday', schoolName: 'Sidumbar Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_w3', group: 'G.3', trade: 'MM', teacherName: 'Vaishali', dayOfWeek: 'Wednesday', schoolName: 'Asura primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_w4', group: 'G.3', trade: 'Ag', teacherName: 'Manisha', dayOfWeek: 'Wednesday', schoolName: 'Kunkan faliya Primary school (Poonam)', district: 'Valsad', taluka: 'Dharampur' },
  // Thursday
  { id: 'tt_g3_th1', group: 'G.3', trade: 'Ex. HH', teacherName: 'Leelaben', dayOfWeek: 'Thursday', schoolName: 'Molaamba Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_th2', group: 'G.3', trade: 'EE', teacherName: 'Divyesh', dayOfWeek: 'Thursday', schoolName: 'Khanpur Prathmik shala', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_th3', group: 'G.3', trade: 'MM', teacherName: 'Vaishali', dayOfWeek: 'Thursday', schoolName: 'Bopi Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_th4', group: 'G.3', trade: 'Ag', teacherName: 'Manisha', dayOfWeek: 'Thursday', schoolName: 'Bapu Ashram shala Bopi', district: 'Valsad', taluka: 'Dharampur' },
  // Friday
  { id: 'tt_g3_f1', group: 'G.3', trade: 'Ex. HH', teacherName: 'Leelaben', dayOfWeek: 'Friday', schoolName: 'ASHRAMSHALA DHAMNI', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_f2', group: 'G.3', trade: 'EE', teacherName: 'Divyesh', dayOfWeek: 'Friday', schoolName: 'BEJBHAVADA PRIMARY SCHOOL', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_f3', group: 'G.3', trade: 'MM', teacherName: 'Vaishali', dayOfWeek: 'Friday', schoolName: 'Mendha Primary school', district: 'Valsad', taluka: 'Dharampur' },
  { id: 'tt_g3_f4', group: 'G.3', trade: 'Ag', teacherName: 'Manisha', dayOfWeek: 'Friday', schoolName: 'Kanya Ashram Shala Tanki', district: 'Valsad', taluka: 'Dharampur' }
];

// Database Manager wrapper Class utilizing HTML5 localStorage
class OmpDatabase {
  private activeListeners: (() => void)[] = [];

  constructor() {
    this.initDatabase();
  }

  private initDatabase() {
    const existingUsers = localStorage.getItem('omp_users') 
      ? JSON.parse(localStorage.getItem('omp_users')!) 
      : [];
    const mergedUsers = [...existingUsers];
    SEED_USERS.forEach(seedUsr => {
      const matchIndex = mergedUsers.findIndex((u: any) => u.username === seedUsr.username);
      if (matchIndex === -1) {
        mergedUsers.push(seedUsr);
      } else {
        if (!mergedUsers[matchIndex].password && seedUsr.password) {
          mergedUsers[matchIndex].password = seedUsr.password;
        }
      }
    });
    localStorage.setItem('omp_users', JSON.stringify(mergedUsers));
    
    // Always merge schools to ensure all 71 Pre-Vocational schools are registered
    const existingSchools = localStorage.getItem('omp_schools') 
      ? JSON.parse(localStorage.getItem('omp_schools')!) 
      : [];
    const mergedSchools = [...existingSchools];
    SEED_SCHOOLS.forEach(seedSch => {
      if (!mergedSchools.some((s: any) => s.code === seedSch.code)) {
        mergedSchools.push(seedSch);
      }
    });
    localStorage.setItem('omp_schools', JSON.stringify(mergedSchools));

    if (!localStorage.getItem('omp_students')) {
      localStorage.setItem('omp_students', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_sessions')) {
      localStorage.setItem('omp_sessions', JSON.stringify([]));
    } else {
      let currentSessions = JSON.parse(localStorage.getItem('omp_sessions')!);
      const originalLength = currentSessions.length;
      currentSessions = currentSessions.filter((s: any) => s.id !== 'SES203' && !s.id.startsWith('PV_SES_'));
      if (currentSessions.length !== originalLength) {
        localStorage.setItem('omp_sessions', JSON.stringify(currentSessions));
      }
    }
    if (!localStorage.getItem('omp_lesson_plans')) {
      localStorage.setItem('omp_lesson_plans', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_inventory')) {
      localStorage.setItem('omp_inventory', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_transport')) {
      localStorage.setItem('omp_transport', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_alerts')) {
      localStorage.setItem('omp_alerts', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_counselling')) {
      localStorage.setItem('omp_counselling', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_monitoring')) {
      localStorage.setItem('omp_monitoring', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_drivers')) {
      localStorage.setItem('omp_drivers', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_vehicles')) {
      localStorage.setItem('omp_vehicles', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_driver_entries')) {
      localStorage.setItem('omp_driver_entries', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_reimbursements')) {
      localStorage.setItem('omp_reimbursements', JSON.stringify([]));
    }
    if (!localStorage.getItem('omp_weekly_submissions')) {
      localStorage.setItem('omp_weekly_submissions', JSON.stringify([]));
    }
    
    // Always force-overwrite timetable with the latest seed data (Pre-Voc Schedule 2025-26)
    // This ensures school names, groups and teacher assignments stay in sync with the official schedule
    localStorage.setItem('omp_timetable', JSON.stringify(SEED_TIMETABLE));

    if (!localStorage.getItem('omp_audit_logs')) {
      localStorage.setItem('omp_audit_logs', JSON.stringify([]));
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

  public async setNetworkOnline(status: boolean) {
    localStorage.setItem('omp_network_online', String(status));
    window.dispatchEvent(new Event('omp_network_status_change'));
    
    // Auto-trigger sync and pull if we go online
    if (status) {
      await this.syncPendingQueue();
      await this.pullAllFromFirestore();
    }
  }

  // Sync Queue management
  public getSyncQueue(): SyncItem[] {
    return this.getTable<SyncItem>('omp_sync_queue');
  }

  private getFirestoreCollectionName(tableName: string): string {
    const mapping: Record<string, string> = {
      'omp_users': 'users',
      'omp_schools': 'schools',
      'omp_students': 'students',
      'omp_sessions': 'sessions',
      'omp_lesson_plans': 'lesson_plans',
      'omp_inventory': 'inventory',
      'omp_transport': 'transport',
      'omp_counselling': 'counselling',
      'omp_monitoring': 'monitoring',
      'omp_alerts': 'alerts',
      'omp_timetable': 'timetable',
      'omp_audit_logs': 'audit_logs',
      'omp_drivers': 'drivers',
      'omp_vehicles': 'vehicles',
      'omp_driver_entries': 'driver_entries',
      'omp_reimbursements': 'reimbursements',
      'omp_weekly_submissions': 'weekly_submissions'
    };
    return mapping[tableName] || tableName.replace('omp_', '');
  }

  private getDocumentId(tableName: string, data: any): string {
    if (tableName === 'omp_users') return data.username;
    if (tableName === 'omp_schools') return data.code;
    if (tableName === 'omp_students') return data.studentId;
    if (tableName === 'omp_drivers') return data.id;
    if (tableName === 'omp_vehicles') return data.id;
    if (tableName === 'omp_driver_entries') return data.id;
    if (tableName === 'omp_reimbursements') return data.id;
    if (tableName === 'omp_weekly_submissions') return data.id;
    return data.id || data.username || data.studentId || data.code;
  }

  private async syncRecordToFirestore(table: string, action: 'insert' | 'update' | 'delete', data: any) {
    if (!isFirebaseConfigured || !firestoreDb) return;
    const collectionName = this.getFirestoreCollectionName(table);
    const docId = this.getDocumentId(table, data);
    
    if (action === 'delete') {
      await deleteDoc(doc(firestoreDb, collectionName, docId));
    } else {
      const cleanData = JSON.parse(JSON.stringify(data));
      await setDoc(doc(firestoreDb, collectionName, docId), cleanData);
    }
  }

  private queueSyncItem(table: string, action: 'insert' | 'update' | 'delete', data: any) {
    if (isFirebaseConfigured && this.isNetworkOnline()) {
      this.syncRecordToFirestore(table, action, data)
        .then(() => {
          console.log(`[Firebase Firestore] Instantly synced change to /${this.getFirestoreCollectionName(table)}/${this.getDocumentId(table, data)}`);
        })
        .catch(err => {
          console.warn('[Firebase Sync Engine] Direct sync failed. Buffering locally...', err);
          this.addToLocalQueue(table, action, data);
        });
    } else {
      this.addToLocalQueue(table, action, data);
    }
  }

  private addToLocalQueue(table: string, action: 'insert' | 'update' | 'delete', data: any) {
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

  public async syncPendingQueue() {
    const queue = this.getSyncQueue();
    if (queue.length === 0) return;
    
    console.log('[Sync Engine] Uploading operations to server database...', queue);
    
    if (isFirebaseConfigured && firestoreDb) {
      try {
        const batch = writeBatch(firestoreDb);
        let operationsCount = 0;
        
        for (const item of queue) {
          const col = this.getFirestoreCollectionName(item.table);
          const docId = this.getDocumentId(item.table, item.data);
          const docRef = doc(firestoreDb, col, docId);
          
          if (item.action === 'delete') {
            batch.delete(docRef);
          } else {
            const cleanData = JSON.parse(JSON.stringify(item.data));
            batch.set(docRef, cleanData);
          }
          operationsCount++;
        }
        
        if (operationsCount > 0) {
          await batch.commit();
        }
        
        this.saveTable('omp_sync_queue', []);
        window.dispatchEvent(new Event('omp_sync_queue_change'));
        window.dispatchEvent(new CustomEvent('omp_toast_message', { 
          detail: `Firestore sync complete. ${operationsCount} records successfully uploaded.` 
        }));
      } catch (err) {
        console.error('[Firebase Sync Engine] Batch sync transaction failed:', err);
        window.dispatchEvent(new CustomEvent('omp_toast_message', { 
          detail: 'Auto-sync failed. Offline items remain queued.' 
        }));
      }
    } else {
      // Simulate server side replication delay
      setTimeout(() => {
        this.saveTable('omp_sync_queue', []);
        window.dispatchEvent(new Event('omp_sync_queue_change'));
        window.dispatchEvent(new CustomEvent('omp_toast_message', { detail: 'Local sync mock simulated. 0 items remaining.' }));
      }, 1000);
    }
  }

  // Seeding tool for administrators
  public async seedFirestoreDatabase(): Promise<number> {
    if (!isFirebaseConfigured || !firestoreDb) {
      throw new Error('Firebase is not configured. Setup your .env file keys first.');
    }

    let seedCount = 0;
    const batch = writeBatch(firestoreDb);

    const tables = [
      { name: 'omp_users', key: 'username' },
      { name: 'omp_schools', key: 'code' },
      { name: 'omp_students', key: 'studentId' },
      { name: 'omp_sessions', key: 'id' },
      { name: 'omp_lesson_plans', key: 'id' },
      { name: 'omp_inventory', key: 'id' },
      { name: 'omp_transport', key: 'id' },
      { name: 'omp_counselling', key: 'id' },
      { name: 'omp_monitoring', key: 'id' },
      { name: 'omp_alerts', key: 'id' },
      { name: 'omp_timetable', key: 'id' },
      { name: 'omp_audit_logs', key: 'id' }
    ];

    for (const table of tables) {
      const records = this.getTable<any>(table.name);
      const colName = this.getFirestoreCollectionName(table.name);
      
      for (const record of records) {
        const id = record[table.key];
        const docRef = doc(firestoreDb, colName, id);
        batch.set(docRef, record);
        seedCount++;
      }
    }

    if (seedCount > 0) {
      await batch.commit();
    }

    return seedCount;
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

  public saveLessonPlan(plan: LessonPlan) {
    const plans = this.getLessonPlans();
    const index = plans.findIndex(p => p.id === plan.id);
    if (index >= 0) {
      plans[index] = plan;
      this.queueSyncItem('omp_lesson_plans', 'update', plan);
    } else {
      plans.push(plan);
      this.queueSyncItem('omp_lesson_plans', 'insert', plan);
    }
    this.saveTable('omp_lesson_plans', plans);
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
    this.queueSyncItem('omp_alerts', 'insert', alert);
    this.saveTable('omp_alerts', alerts);
    window.dispatchEvent(new Event('omp_alerts_change'));
  }

  public resolveAlert(id: string) {
    const alerts = this.getAlerts();
    const index = alerts.findIndex(a => a.id === id);
    if (index >= 0) {
      alerts[index].isResolved = true;
      this.queueSyncItem('omp_alerts', 'update', alerts[index]);
      this.saveTable('omp_alerts', alerts);
      window.dispatchEvent(new Event('omp_alerts_change'));
    }
  }

  // Drivers
  public getDrivers(): DriverDetails[] {
    return this.getTable<DriverDetails>('omp_drivers');
  }

  public saveDriver(driver: DriverDetails) {
    const drivers = this.getDrivers();
    const index = drivers.findIndex(d => d.id === driver.id);
    if (index >= 0) {
      drivers[index] = driver;
      this.queueSyncItem('omp_drivers', 'update', driver);
    } else {
      drivers.push(driver);
      this.queueSyncItem('omp_drivers', 'insert', driver);
    }
    this.saveTable('omp_drivers', drivers);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // Vehicles
  public getVehicles(): VehicleDetails[] {
    return this.getTable<VehicleDetails>('omp_vehicles');
  }

  public saveVehicle(vehicle: VehicleDetails) {
    const vehicles = this.getVehicles();
    const index = vehicles.findIndex(v => v.id === vehicle.id);
    if (index >= 0) {
      vehicles[index] = vehicle;
      this.queueSyncItem('omp_vehicles', 'update', vehicle);
    } else {
      vehicles.push(vehicle);
      this.queueSyncItem('omp_vehicles', 'insert', vehicle);
    }
    this.saveTable('omp_vehicles', vehicles);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // Driver Daily Entries
  public getDriverEntries(): DriverDailyEntry[] {
    return this.getTable<DriverDailyEntry>('omp_driver_entries');
  }

  public saveDriverEntry(entry: DriverDailyEntry) {
    const entries = this.getDriverEntries();
    const index = entries.findIndex(e => e.id === entry.id);
    if (index >= 0) {
      entries[index] = entry;
      this.queueSyncItem('omp_driver_entries', 'update', entry);
    } else {
      entries.push(entry);
      this.queueSyncItem('omp_driver_entries', 'insert', entry);
    }
    this.saveTable('omp_driver_entries', entries);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // Trainer Reimbursements
  public getReimbursements(): TrainerReimbursement[] {
    return this.getTable<TrainerReimbursement>('omp_reimbursements');
  }

  public saveReimbursement(reimbursement: TrainerReimbursement) {
    const reimbursements = this.getReimbursements();
    const index = reimbursements.findIndex(r => r.id === reimbursement.id);
    if (index >= 0) {
      reimbursements[index] = reimbursement;
      this.queueSyncItem('omp_reimbursements', 'update', reimbursement);
    } else {
      reimbursements.push(reimbursement);
      this.queueSyncItem('omp_reimbursements', 'insert', reimbursement);
    }
    this.saveTable('omp_reimbursements', reimbursements);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // Weekly Submissions
  public getWeeklySubmissions(): WeeklySubmissionStatus[] {
    return this.getTable<WeeklySubmissionStatus>('omp_weekly_submissions');
  }

  public saveWeeklySubmission(submission: WeeklySubmissionStatus) {
    const submissions = this.getWeeklySubmissions();
    const index = submissions.findIndex(s => s.id === submission.id);
    if (index >= 0) {
      submissions[index] = submission;
      this.queueSyncItem('omp_weekly_submissions', 'update', submission);
    } else {
      submissions.push(submission);
      this.queueSyncItem('omp_weekly_submissions', 'insert', submission);
    }
    this.saveTable('omp_weekly_submissions', submissions);
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // Trainer Location updates
  public updateTrainerLocation(username: string, lat: number, lng: number) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.username === username);
    if (index >= 0) {
      const user = users[index];
      const timestamp = new Date().toISOString();
      const newLoc = { lat, lng, timestamp };
      
      const history = user.locationHistory || [];
      const updatedHistory = [newLoc, ...history].slice(0, 20); // Keep last 20 coordinates

      const updatedUser = {
        ...user,
        lastKnownLocation: newLoc,
        locationHistory: updatedHistory
      };
      
      users[index] = updatedUser;
      this.saveTable('omp_users', users);
      this.queueSyncItem('omp_users', 'update', updatedUser);
      window.dispatchEvent(new Event('omp_db_pulled'));
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

  // Pre Vocational Timetable CRUD
  public getTimetable(): TimetableEntry[] {
    return this.getTable<TimetableEntry>('omp_timetable');
  }

  public saveTimetableEntry(entry: TimetableEntry) {
    const timetable = this.getTimetable();
    const index = timetable.findIndex(t => t.id === entry.id);
    
    let previousValue = '';
    if (index >= 0) {
      previousValue = JSON.stringify(timetable[index]);
      timetable[index] = entry;
      this.queueSyncItem('omp_timetable', 'update', entry);
    } else {
      timetable.push(entry);
      this.queueSyncItem('omp_timetable', 'insert', entry);
    }
    this.saveTable('omp_timetable', timetable);
    
    // Write Audit log
    this.writeAuditLog('admin', 'Timetable Entry Saved', `Saved timetable for Group ${entry.group}, Teacher ${entry.teacherName} on ${entry.dayOfWeek}`, previousValue, JSON.stringify(entry));
    
    // Trigger notification alert
    const newAlert: SystemAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'timetable_changed',
      severity: 'medium',
      message: `Timetable altered: ${entry.teacherName} assigned to ${entry.schoolName} on ${entry.dayOfWeek}.`,
      programme: 'Pre-Vocational',
      createdAt: new Date().toISOString(),
      isResolved: false
    };
    this.addAlert(newAlert);
  }

  public importTimetable(entries: TimetableEntry[]) {
    this.saveTable('omp_timetable', entries);
    if (isFirebaseConfigured && this.isNetworkOnline()) {
      for (const entry of entries) {
        this.queueSyncItem('omp_timetable', 'insert', entry);
      }
    }
    this.writeAuditLog('admin', 'Timetable Spreadsheet Import', `Imported ${entries.length} timetable entries via Excel/CSV.`, '', `Imported count: ${entries.length}`);
    
    // Trigger alert
    const newAlert: SystemAlert = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'timetable_changed',
      severity: 'high',
      message: `Timetable changed: Bulk imported ${entries.length} schedules.`,
      programme: 'Pre-Vocational',
      createdAt: new Date().toISOString(),
      isResolved: false
    };
    this.addAlert(newAlert);
  }

  // Audit Logs
  public getAuditLogs(): ActivityLog[] {
    return this.getTable<ActivityLog>('omp_audit_logs');
  }

  public writeAuditLog(username: string, action: string, details: string, previousValue = '', newValue = '') {
    const logs = this.getAuditLogs();
    const newLog: ActivityLog = {
      id: 'aud_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      action,
      details,
      username,
      previousValue,
      newValue
    };
    logs.unshift(newLog);
    this.saveTable('omp_audit_logs', logs);
    
    if (isFirebaseConfigured) {
      this.queueSyncItem('omp_audit_logs', 'insert', newLog);
    }
  }

  // Pull collection from Firestore and merge with local storage
  public async pullTableFromFirestore(table: string, keyField: string = 'id') {
    if (!isFirebaseConfigured || !firestoreDb || !this.isNetworkOnline()) return;
    const colName = this.getFirestoreCollectionName(table);
    try {
      const colRef = collection(firestoreDb, colName);
      const snapshot = await getDocs(colRef);
      const remoteRecords: any[] = [];
      snapshot.forEach(docSnap => {
        remoteRecords.push(docSnap.data());
      });

      if (remoteRecords.length === 0) return;

      const localRecords = this.getTable<any>(table);
      const recordMap = new Map<string, any>();

      // Populate with local records
      localRecords.forEach(r => {
        const id = r[keyField];
        if (id) recordMap.set(String(id), r);
      });

      // Merge remote records (remote data takes precedence, but fields are merged)
      remoteRecords.forEach(r => {
        const id = r[keyField];
        if (id) {
          const localVal = recordMap.get(String(id));
          if (localVal) {
            recordMap.set(String(id), { ...localVal, ...r });
          } else {
            recordMap.set(String(id), r);
          }
        }
      });

      const merged = Array.from(recordMap.values());
      
      // Sort audit logs by timestamp descending if table is audit logs
      if (table === 'omp_audit_logs') {
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }

      this.saveTable(table, merged);
    } catch (err) {
      console.warn(`[Firebase Pull] Failed to pull table ${table}:`, err);
    }
  }

  // Pull all tables from Firestore to local storage
  public async pullAllFromFirestore() {
    if (!isFirebaseConfigured || !firestoreDb || !this.isNetworkOnline()) return;
    
    const tables = [
      { name: 'omp_users', key: 'username' },
      { name: 'omp_schools', key: 'code' },
      { name: 'omp_students', key: 'studentId' },
      { name: 'omp_sessions', key: 'id' },
      { name: 'omp_lesson_plans', key: 'id' },
      { name: 'omp_inventory', key: 'id' },
      { name: 'omp_transport', key: 'id' },
      { name: 'omp_counselling', key: 'id' },
      { name: 'omp_monitoring', key: 'id' },
      { name: 'omp_alerts', key: 'id' },
      { name: 'omp_timetable', key: 'id' },
      { name: 'omp_audit_logs', key: 'id' },
      { name: 'omp_drivers', key: 'id' },
      { name: 'omp_vehicles', key: 'id' },
      { name: 'omp_driver_entries', key: 'id' },
      { name: 'omp_reimbursements', key: 'id' },
      { name: 'omp_weekly_submissions', key: 'id' }
    ];

    for (const table of tables) {
      await this.pullTableFromFirestore(table.name, table.key);
    }
    
    // Dispatch global pull completed event
    window.dispatchEvent(new Event('omp_db_pulled'));
  }

  // Set up real-time onSnapshot listeners for all collections in Firestore
  public setupRealtimeListeners() {
    if (!isFirebaseConfigured || !firestoreDb || !this.isNetworkOnline()) return;

    // Clear any existing listeners first to prevent duplicates
    this.activeListeners.forEach(unsubscribe => unsubscribe());
    this.activeListeners = [];

    const tables = [
      { name: 'omp_users', key: 'username' },
      { name: 'omp_schools', key: 'code' },
      { name: 'omp_students', key: 'studentId' },
      { name: 'omp_sessions', key: 'id' },
      { name: 'omp_lesson_plans', key: 'id' },
      { name: 'omp_inventory', key: 'id' },
      { name: 'omp_transport', key: 'id' },
      { name: 'omp_counselling', key: 'id' },
      { name: 'omp_monitoring', key: 'id' },
      { name: 'omp_alerts', key: 'id' },
      { name: 'omp_timetable', key: 'id' },
      { name: 'omp_audit_logs', key: 'id' },
      { name: 'omp_drivers', key: 'id' },
      { name: 'omp_vehicles', key: 'id' },
      { name: 'omp_driver_entries', key: 'id' },
      { name: 'omp_reimbursements', key: 'id' },
      { name: 'omp_weekly_submissions', key: 'id' }
    ];

    tables.forEach(table => {
      const colName = this.getFirestoreCollectionName(table.name);
      try {
        const colRef = collection(firestoreDb, colName);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
          // Skip if there are local pending writes to avoid race conditions or redundant local overwrites
          if (snapshot.metadata.hasPendingWrites) return;

          const remoteRecords: any[] = [];
          snapshot.forEach(docSnap => {
            remoteRecords.push(docSnap.data());
          });

          if (remoteRecords.length === 0) return;

          const localRecords = this.getTable<any>(table.name);
          const recordMap = new Map<string, any>();

          // Load local records
          localRecords.forEach(r => {
            const id = r[table.key];
            if (id) recordMap.set(String(id), r);
          });

          // Merge remote records
          remoteRecords.forEach(r => {
            const id = r[table.key];
            if (id) {
              const localVal = recordMap.get(String(id));
              if (localVal) {
                recordMap.set(String(id), { ...localVal, ...r });
              } else {
                recordMap.set(String(id), r);
              }
            }
          });

          const merged = Array.from(recordMap.values());
          
          if (table.name === 'omp_audit_logs') {
            merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          }

          this.saveTable(table.name, merged);

          // Dispatch event triggers
          if (table.name === 'omp_sessions') {
            window.dispatchEvent(new Event('omp_session_conducted_update'));
          } else if (table.name === 'omp_alerts') {
            window.dispatchEvent(new Event('omp_alerts_change'));
          }
          
          // General reload event
          window.dispatchEvent(new Event('omp_db_pulled'));
        }, (err) => {
          console.warn(`[Firebase Realtime] Listener error on /${colName}:`, err);
        });

        this.activeListeners.push(unsubscribe);
      } catch (err) {
        console.warn(`[Firebase Realtime] Failed to register listener for ${table.name}:`, err);
      }
    });
  }
}

export const db = new OmpDatabase();
export default db;
