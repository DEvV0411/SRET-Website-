import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole, ProgrammeName } from '../types';
import db from '../lib/db';
import { auth, firestoreDb, isFirebaseConfigured } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Multi-language translation dictionary
const DICTIONARY: Record<string, Record<'en' | 'gu', string>> = {
  'dashboard': { en: 'Dashboard', gu: 'ડેશબોર્ડ' },
  'students': { en: 'Students', gu: 'વિદ્યાર્થીઓ' },
  'schools': { en: 'Schools', gu: 'શાળાઓ' },
  'sessions': { en: 'Sessions', gu: 'સત્રો' },
  'attendance': { en: 'Attendance', gu: 'હાજરી' },
  'lesson_plans': { en: 'Lesson Plans', gu: 'પાઠ આયોજન' },
  'inventory': { en: 'Inventory', gu: 'ઇન્વેન્ટરી' },
  'transport': { en: 'Transport', gu: 'વાહનવ્યવહાર' },
  'counselling': { en: 'Counselling', gu: 'પરામર્શ (કાઉન્સેલિંગ)' },
  'monitoring': { en: 'School Visits', gu: 'શાળા મુલાકાત' },
  'reports': { en: 'Reports', gu: 'અહેવાલો' },
  'alerts': { en: 'Alerts', gu: 'ચેતવણીઓ' },
  'users': { en: 'User Manager', gu: 'વપરાશકર્તા સંચાલન' },
  'ai_assistant': { en: 'AI Assistant', gu: 'AI મદદગાર' },
  'total_students': { en: 'Total Students', gu: 'કુલ વિદ્યાર્થીઓ' },
  'active_students': { en: 'Active Students', gu: 'સક્રિય વિદ્યાર્થીઓ' },
  'sessions_conducted': { en: 'Sessions Conducted', gu: 'યોજાયેલા સત્રો' },
  'attendance_rate': { en: 'Attendance Rate', gu: 'હાજરી દર' },
  'offline_notice': { en: 'Offline Mode (Local Storage Active)', gu: 'ઑફલાઇન મોડ (સ્થાનિક સ્ટોરેજ સક્રિય)' },
  'synced_notice': { en: 'System Synced', gu: 'સિસ્ટમ સમન્વયિત છે' },
  'logout': { en: 'Sign Out', gu: 'લૉગ આઉટ' },
  'pre_vocational': { en: 'Pre Vocational', gu: 'પૂર્વ-વ્યવસાયિક' },
  'pre vocational': { en: 'Pre Vocational', gu: 'પૂર્વ-વ્યવસાયિક' },
  'personal_dashboard': { en: 'Personal Dashboard', gu: 'વ્યક્તિગત ડેશબોર્ડ' },
  'personal dashboard': { en: 'Personal Dashboard', gu: 'વ્યક્તિગત ડેશબોર્ડ' },
  'super_dashboard': { en: 'Super Dashboard', gu: 'મુખ્ય ડેશબોર્ડ' },
  'super dashboard': { en: 'Super Dashboard', gu: 'મુખ્ય ડેશબોર્ડ' },
  'vocational': { en: 'Vocational', gu: 'વ્યવસાયિક (વોકેશનલ)' },
  'udyam': { en: 'Udyam', gu: 'ઉદ્યમ' },
  'magic_touch': { en: 'MagicTouch', gu: 'મેજિક ટચ' },
  'magictouch': { en: 'MagicTouch', gu: 'મેજિક ટચ' }
};

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isOnline: boolean;
  toggleNetwork: () => void;
  language: 'en' | 'gu';
  setLanguage: (lang: 'en' | 'gu') => void;
  t: (key: string) => string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  syncQueueSize: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(db.isNetworkOnline());
  const [language, setLanguageState] = useState<'en' | 'gu'>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [syncQueueSize, setSyncQueueSize] = useState<number>(db.getSyncQueue().length);

  // Initialize theme, language, and auto-login
  useEffect(() => {
    // Theme
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    document.documentElement.className = initialTheme;

    // Language
    const savedLang = localStorage.getItem('lang') as 'en' | 'gu';
    if (savedLang) setLanguageState(savedLang);

    // Network Sync Event listeners
    const handleNetworkChange = () => {
      setIsOnline(db.isNetworkOnline());
    };
    const handleSyncChange = () => {
      setSyncQueueSize(db.getSyncQueue().length);
    };

    window.addEventListener('omp_network_status_change', handleNetworkChange);
    window.addEventListener('omp_sync_queue_change', handleSyncChange);

    // Firebase Auth Observer or Local fallback
    let unsubscribe: () => void = () => {};

    if (isFirebaseConfigured && auth && firestoreDb) {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          const email = firebaseUser.email || '';
          const username = email.split('@')[0];
          try {
            const userDoc = await getDoc(doc(firestoreDb, 'users', username));
            if (userDoc.exists()) {
              setCurrentUser(userDoc.data() as User);
            } else {
              const seedUser = db.getUsers().find(u => u.username === username);
              if (seedUser) {
                setCurrentUser(seedUser);
              }
            }
          } catch (err) {
            console.error('[Firebase Auth] Error retrieving profile state:', err);
          }
        } else {
          setCurrentUser(null);
        }
      });
    } else {
      // Local Storage session lookup
      const savedUser = localStorage.getItem('omp_session_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as User;
        const freshUser = db.getUsers().find(u => u.username === parsed.username);
        if (freshUser && freshUser.isActive) {
          setCurrentUser(freshUser);
        }
      }
    }

    return () => {
      window.removeEventListener('omp_network_status_change', handleNetworkChange);
      window.removeEventListener('omp_sync_queue_change', handleSyncChange);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    const cleanUsername = username.trim().toLowerCase();
    const email = `${cleanUsername}@omp.org`;

    // Timeout race wrapper helper
    const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      let timeoutId: any;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('timeout')), ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
      });
    };

    if (isFirebaseConfigured && auth && firestoreDb) {
      try {
        // 1. Try direct Firebase Auth sign-in first (fast-path for already registered users) with a 3.5s timeout limit
        await withTimeout(signInWithEmailAndPassword(auth, email, password), 3500);

        // 2. Fetch the Firestore metadata document with a 2s timeout
        let userProfile: User;
        try {
          const userDoc = await withTimeout(getDoc(doc(firestoreDb, 'users', cleanUsername)), 2000);
          if (userDoc.exists()) {
            userProfile = userDoc.data() as User;
            // Synchronize stored password with current login password
            if (userProfile.password !== password) {
              userProfile.password = password;
            }
          } else {
            throw new Error('Not found');
          }
        } catch (docErr) {
          const seedUser = db.getUsers().find(u => u.username === cleanUsername);
          userProfile = seedUser || {
            username: cleanUsername,
            name: cleanUsername.replace(/\./g, ' '),
            role: 'trainer',
            assignedProgramme: 'All',
            assignedSchools: [],
            assignedDistricts: ['All'],
            isActive: true,
            permissions: ['View Students', 'View Attendance'],
            activityLogs: []
          };
          userProfile.password = password;
        }

        const updatedUser = {
          ...userProfile,
          lastLogin: new Date().toISOString()
        };

        try {
          await withTimeout(setDoc(doc(firestoreDb, 'users', cleanUsername), updatedUser), 1500);
        } catch (writeErr) {
          console.warn('[Firebase Auth] Firestore last login write timed out/failed, bypassing');
        }

        setCurrentUser(updatedUser);
        if (rememberMe) {
          localStorage.setItem('omp_session_user', JSON.stringify(updatedUser));
        }
        return true;
      } catch (authError: any) {
        console.warn('[Firebase Auth] Direct sign-in failed or timed out, checking fallback:', authError?.message || authError?.code);

        // 3. Fallback: Verify entered credentials against synchronized database profile
        const localUser = db.getUsers().find(u => u.username === cleanUsername);
        const targetPassword = localUser?.password || 'password123';

        if (password === targetPassword) {
          // If valid, auto-register them in Firebase Auth if not enrolled yet
          const errorCode = authError?.code || '';
          if (errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential' || errorCode === 'auth/cannot-find-user' || authError?.message === 'timeout') {
            try {
              console.log('[Firebase Auth] Auto-registering credentials:', email);
              await withTimeout(createUserWithEmailAndPassword(auth, email, password), 3500);
            } catch (regErr) {
              console.warn('[Firebase Auth] Auto-registration skipped/failed:', regErr);
            }
          }

          let userProfile = localUser;
          try {
            const userDoc = await withTimeout(getDoc(doc(firestoreDb, 'users', cleanUsername)), 2000);
            if (userDoc.exists()) {
              userProfile = userDoc.data() as User;
            }
          } catch (firestoreErr) {
            console.warn('[Firebase Auth] Cloud fetch timed out/failed, using cached state:', firestoreErr);
          }

          const updatedUser = {
            ...(userProfile || {
              username: cleanUsername,
              name: cleanUsername.replace(/\./g, ' '),
              role: 'trainer' as const,
              assignedProgramme: 'All' as const,
              assignedSchools: [],
              assignedDistricts: ['All'],
              isActive: true,
              permissions: ['View Students', 'View Attendance'],
              activityLogs: []
            }),
            password,
            lastLogin: new Date().toISOString()
          };

          try {
            await withTimeout(setDoc(doc(firestoreDb, 'users', cleanUsername), updatedUser), 1500);
          } catch (writeErr) {
            console.warn('[Firebase Auth] Cloud sync write timed out/failed:', writeErr);
          }

          setCurrentUser(updatedUser);
          if (rememberMe) {
            localStorage.setItem('omp_session_user', JSON.stringify(updatedUser));
          }
          return true;
        }
        return false;
      }
    } else {
      // Local database fallback
      const user = db.getUsers().find(u => u.username === cleanUsername);
      const targetPassword = user?.password || 'password123';
      if (user && user.isActive && password === targetPassword) {
        const updatedUser = {
          ...user,
          lastLogin: new Date().toISOString()
        };
        
        db.saveUser(updatedUser);
        setCurrentUser(updatedUser);

        if (rememberMe) {
          localStorage.setItem('omp_session_user', JSON.stringify(updatedUser));
        }
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('omp_session_user');
    if (isFirebaseConfigured && auth) {
      firebaseSignOut(auth).catch(err => console.error('[Firebase Auth] Sign out error:', err));
    }
    setCurrentUser(null);
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'super_admin') return true;
    return currentUser.permissions.includes(permission);
  };

  const toggleNetwork = () => {
    const nextState = !isOnline;
    db.setNetworkOnline(nextState);
  };

  const setLanguage = (lang: 'en' | 'gu') => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
  };

  const t = (key: string): string => {
    const term = DICTIONARY[key.toLowerCase()];
    if (term) return term[language];
    // Return formatted key if not found
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.className = nextTheme;
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      logout,
      hasPermission,
      isOnline,
      toggleNetwork,
      language,
      setLanguage,
      t,
      theme,
      toggleTheme,
      syncQueueSize
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
