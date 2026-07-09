// OMP System TypeScript Declarations

export type UserRole = 
  | 'super_admin'
  | 'programme_head'
  | 'programme_coordinator'
  | 'trainer'
  | 'counsellor'
  | 'inventory_team'
  | 'transport_team'
  | 'viewer'
  | 'driver';

export type ProgrammeName = 
  | 'Vocational'
  | 'Pre-Vocational'
  | 'Udyam'
  | 'Magic Touch';

export type SessionStatus = 
  | 'Scheduled'
  | 'Conducted'
  | 'Verified'
  | 'Completed'
  | 'Cancelled'
  | 'Missed'
  | 'Postponed'
  | 'Teacher Absent';

export interface User {
  username: string;
  name: string;
  role: UserRole;
  assignedProgramme: ProgrammeName | 'All';
  assignedSchools: string[]; // School codes
  assignedDistricts: string[];
  permissions: string[]; // Granular permission strings
  isActive: boolean;
  password?: string;
  lastLogin?: string;
  activityLogs: ActivityLog[];
  lastKnownLocation?: { lat: number; lng: number; timestamp: string };
  locationHistory?: { lat: number; lng: number; timestamp: string }[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  username?: string;
  previousValue?: string;
  newValue?: string;
}

export interface Student {
  studentId: string;
  name: string;
  rollNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  photoUrl?: string;
  mobileNumber: string;
  parentName: string;
  parentContact: string;
  address: string;
  village: string;
  taluka: string;
  district: string;
  schoolCode: string;
  standard: string; // e.g. "9th", "10th"
  stream?: 'Arts' | 'Commerce' | 'Science' | 'None';
  enrollmentDate: string;
  
  // Academic Performance & Scores
  attendancePercentage: number;
  baselineScore?: number; // % score
  endlineScore?: number; // % score
  exams: { examName: string; score: number; date: string }[];
  certificates: string[]; // Certificate names

  // Career Development
  aspirations: string;
  suggestedCourses: string[];
  entranceExamDetails?: string;

  // Post-Programme Status (Alumni Tracking)
  postStatus: 'Employment' | 'Higher Education' | 'Self Employed' | 'Unemployed';
  employmentDetails?: string;
  alumniStatus: 'Active' | 'Inactive';
  governmentSchemeParticipation: string[];
}

export interface School {
  code: string;
  name: string;
  principalName: string;
  principalContact: string;
  village: string;
  taluka: string;
  district: string;
  studentStrength: number;
  sessionsTarget: number;
  sessionsConducted: number;
  runningProgrammes: ProgrammeName[];
}

export interface Session {
  id: string;
  programme: ProgrammeName;
  schoolCode: string;
  date: string;
  time: string;
  trainerUsername: string;
  subject: string;
  lessonPlanId: string;
  status: SessionStatus;
  photoUrl?: string;
  attendancePresent: string[]; // Array of studentIds
  attendanceAbsent: string[];  // Array of studentIds
  remarks?: string;
  documents?: string[];
  locationCoords?: { lat: number; lng: number };
  
  // Pre Vocational Workflow Extensions
  conductedAt?: string;
  conductedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  completedAt?: string;
  completedBy?: string;
  studentsPresentCount?: number;
  issuesFaced?: string;
  groupName?: string;

  // Substitute & Absence Tracking
  substitutedBy?: string;       // username of substitute trainer
  substitutedByName?: string;   // display name of substitute trainer
  teacherAbsentReason?: string; // reason the assigned teacher couldn't attend
}

export interface TimetableEntry {
  id: string;
  group: string;
  teacherName: string;
  trade?: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  schoolName: string;
  schoolCode?: string;
  district?: string;
  taluka?: string;
}

export interface LessonPlan {
  id: string;
  programme: ProgrammeName;
  subject: string;
  chapter: string;
  learningObjectives: string[];
  activities: string[];
  materialsRequired: string[];
  worksheets: string[];
  videoUrl?: string;
  status: 'Planned' | 'Delivered' | 'Pending';
}

export interface CounsellingRecord {
  id: string;
  studentId: string;
  counsellorName: string;
  sessionDate: string;
  studentAspirations: string;
  suggestedCourses: string[];
  parentCounsellingDetails?: string;
  followUpStatus: 'Pending' | 'In Progress' | 'Completed';
  nextFollowUpDate?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Equipment' | 'Training Kit' | 'Book' | 'Stationery' | 'Consumable';
  currentStock: number;
  minThreshold: number;
  unit: string;
  logs: InventoryLog[];
}

export interface InventoryLog {
  id: string;
  date: string;
  type: 'Inward' | 'Outward';
  quantity: number;
  program?: ProgrammeName;
  assignedTo?: string; // Username / schoolCode
  remarks?: string;
}

export interface TransportRoute {
  id: string;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  routeDetails: string;
  scheduleDays: string[];
  fuelLogs: { date: string; liters: number; cost: number; odometer: number }[];
}

export interface MonitoringVisit {
  id: string;
  schoolCode: string;
  visitDate: string;
  fieldStaffName: string;
  observations: string;
  challenges: string;
  actionItems: string[];
  photoUrl?: string;
  rating: number; // 1-5 scale
}

export interface SystemAlert {
  id: string;
  type: 'attendance_missing' | 'session_unconfirmed' | 'consecutive_misses' | 'low_stock' | 'reports_overdue' | 'baseline_pending' | 'class_conducted' | 'class_missed' | 'remarks_uploaded' | 'timetable_changed';
  severity: 'low' | 'medium' | 'high';
  message: string;
  programme?: ProgrammeName;
  schoolCode?: string;
  createdAt: string;
  isResolved: boolean;
}

export interface SyncItem {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export interface DriverDetails {
  id: string; // driver username
  name: string;
  mobileNumber: string;
  address: string;
  aadhaarUrl?: string; // base64/url
  licenceUrl?: string; // base64/url
  emergencyContact: string;
}

export interface VehicleDetails {
  id: string; // vehicle number
  vehicleNumber: string;
  vehicleType: 'Permanent' | 'Rental';
  insuranceDetails: string;
  rcDetails: string;
  pucDetails: string;
  serviceDueDate: string;
  // Rental specific fields:
  vendorName?: string;
  vendorContact?: string;
  rentalAgreementDetails?: string;
  rentalCharges?: number;
  validityPeriod?: string;
}

export interface DriverDailyEntry {
  id: string;
  driverUsername: string;
  driverName: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  petrolQuantity: number;
  fuelCost: number;
  date: string;
  vehicleId: string;
  linkedTrainerUsername: string;
  linkedTrainerName: string;
  vertical: ProgrammeName;
}

export interface TrainerReimbursement {
  id: string;
  trainerUsername: string;
  trainerName: string;
  date: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  petrolQuantity: number;
  fuelCost: number;
  purpose: string;
  vertical: ProgrammeName;
  status: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
  approvedBy?: string;
}

export interface WeeklySubmissionStatus {
  id: string;
  username: string;
  weekEndDate: string; // e.g. "2026-07-05" (Sunday)
  status: 'Pending' | 'Completed';
  submittedAt?: string;
  type: 'trainer' | 'driver';
}

// Dashboard Customisation
export interface DashboardWidgetConfig {
  id: string;
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  /** Composite key: `{username}_{dashboardKey}` e.g. "admin_super_dashboard" */
  id: string;
  username: string;
  dashboardKey: string; // "super_dashboard" | "personal_dashboard"
  widgets: DashboardWidgetConfig[];
  updatedAt: string;
}

