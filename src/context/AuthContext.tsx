import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ProgrammeName } from '../types';
import db from '../lib/db';

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
  'logout': { en: 'Sign Out', gu: 'લૉગ આઉટ' }
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

    // Auto-login from local session
    const savedUser = localStorage.getItem('omp_session_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as User;
      const freshUser = db.getUsers().find(u => u.username === parsed.username);
      if (freshUser && freshUser.isActive) {
        setCurrentUser(freshUser);
      }
    }

    // Network Sync Event listeners
    const handleNetworkChange = () => {
      setIsOnline(db.isNetworkOnline());
    };
    const handleSyncChange = () => {
      setSyncQueueSize(db.getSyncQueue().length);
    };

    window.addEventListener('omp_network_status_change', handleNetworkChange);
    window.addEventListener('omp_sync_queue_change', handleSyncChange);

    return () => {
      window.removeEventListener('omp_network_status_change', handleNetworkChange);
      window.removeEventListener('omp_sync_queue_change', handleSyncChange);
    };
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    // Standard mock verification (accept 'password123' for any seeded account for validation ease)
    const user = db.getUsers().find(u => u.username === username.trim().toLowerCase());
    if (user && user.isActive && password === 'password123') {
      const updatedUser = {
        ...user,
        lastLogin: new Date().toISOString()
      };
      
      // Update DB record
      db.saveUser(updatedUser);
      setCurrentUser(updatedUser);

      if (rememberMe) {
        localStorage.setItem('omp_session_user', JSON.stringify(updatedUser));
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('omp_session_user');
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
