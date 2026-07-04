import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, School, Calendar, BookOpen, 
  Package, Truck, HeartHandshake, Eye, ShieldAlert, 
  FileText, Settings, LogOut, Menu, X, Globe, Sun, Moon, Wifi, WifiOff 
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    currentUser, logout, hasPermission, isOnline, 
    toggleNetwork, language, setLanguage, t, theme, 
    toggleTheme, syncQueueSize 
  } = useAuth();
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  // List of all possible navigation items with permission gating rules
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: 'View Students' }, // Everyone has access
    { id: 'students', icon: Users, label: 'Students', permission: 'View Students' },
    { id: 'schools', icon: School, label: 'Schools', permission: 'View Students' },
    { id: 'sessions', icon: Calendar, label: 'Sessions', permission: 'View Students' },
    { id: 'lesson_plans', icon: BookOpen, label: 'Lesson Plans', permission: 'View Students' },
    { id: 'pre_vocational', icon: BookOpen, label: 'Pre Vocational' },
    { id: 'inventory', icon: Package, label: 'Inventory', permission: 'Manage Inventory' },
    { id: 'transport', icon: Truck, label: 'Transport', permission: 'Manage Fleet' },
    { id: 'counselling', icon: HeartHandshake, label: 'Counselling', role: 'counsellor' }, // Custom role block
    { id: 'monitoring', icon: ShieldAlert, label: 'School Visits', role: 'programme_coordinator' },
    { id: 'reports', icon: FileText, label: 'Reports', permission: 'View Reports' },
    { id: 'users', icon: Settings, label: 'User Manager', permission: 'Manage Users' },
  ];

  // Filter items based on permissions/roles
  const visibleItems = menuItems.filter(item => {
    // If super admin, has access to all
    if (currentUser.role === 'super_admin') return true;
    
    // If trainer, restrict strictly to Dashboard, Pre Vocational, and Lesson Plans
    if (currentUser.role === 'trainer') {
      return item.id === 'dashboard' || item.id === 'pre_vocational' || item.id === 'lesson_plans';
    }
    
    // Check permission gating
    if (item.permission && !hasPermission(item.permission)) return false;
    
    // Check role restriction
    if (item.role && currentUser.role !== item.role) return false;
    
    return true;
  });

  // Mobile navigation bottom list (primary actions for fast field workflows)
  const mobilePrimaryItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'students', icon: Users, label: 'Students' },
    { id: 'sessions', icon: Calendar, label: 'Sessions' },
    { id: 'pre_vocational', icon: BookOpen, label: 'Pre Vocational' },
    { id: 'lesson_plans', icon: BookOpen, label: 'Lesson Plans' },
    { id: 'inventory', icon: Package, label: 'Inventory', permission: 'Manage Inventory' },
    { id: 'reports', icon: FileText, label: 'Reports', permission: 'View Reports' },
  ].filter(item => {
    if (currentUser.role === 'super_admin') return true;
    if (currentUser.role === 'trainer') {
      return item.id === 'dashboard' || item.id === 'pre_vocational' || item.id === 'lesson_plans';
    }
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  return (
    <>
      {/* 1. DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col h-screen fixed left-0 top-0 bg-slate-50 border-r border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 transition-all duration-300 z-30 ${
        collapsed ? 'w-[70px]' : 'w-[260px]'
      }`}>
        
        {/* Header Branding */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200/80 dark:border-slate-800/80">
          {!collapsed && (
            <div className="flex items-center gap-2 font-heading font-bold text-slate-900 dark:text-white text-lg tracking-tight select-none">
              <span className="text-xl">⚡</span>
              <span>OMP MIS</span>
            </div>
          )}
          {collapsed && (
            <span className="text-xl mx-auto font-heading font-bold text-slate-900 dark:text-white">⚡</span>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="text-slate-400 hover:text-slate-800 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* User Badge Card */}
        <div className={`p-4 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-100/40 dark:bg-slate-950/20 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{currentUser.role.replace(/_/g, ' ')}</p>
                {currentUser.assignedProgramme !== 'All' && (
                  <span className="inline-block px-1.5 py-0.5 mt-1 bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary rounded capitalize">
                    {currentUser.assignedProgramme}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white mx-auto cursor-pointer" title={currentUser.name}>
              {currentUser.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Menu Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-semibold transition-all border-l-4 ${
                  isActive 
                    ? 'bg-primary/10 border-primary text-primary font-bold dark:bg-primary/20 dark:text-white dark:border-transparent' 
                    : 'border-transparent hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800/50 dark:hover:text-white text-slate-600 dark:text-slate-400'
                } ${collapsed ? 'justify-center' : ''}`}
                title={t(item.label.toLowerCase())}
              >
                <Icon size={18} className={isActive ? 'text-primary dark:text-white' : 'text-slate-400'} />
                {!collapsed && <span>{t(item.label.toLowerCase())}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sync queue floating button */}
        {syncQueueSize > 0 && !collapsed && (
          <div className="mx-4 mb-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md text-xs flex items-center justify-between animate-pulse">
            <span className="font-semibold">{syncQueueSize} offline items</span>
            <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-bold rounded-full text-[9px]">PENDING</span>
          </div>
        )}

        {/* System Controls Panel */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-100/30 dark:bg-slate-950/20">
          
          {/* Simulated Offline Switcher */}
          <button 
            onClick={toggleNetwork}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-semibold border transition-all ${
              isOnline 
                ? 'bg-secondary/5 border-secondary/20 text-secondary hover:bg-secondary/10' 
                : 'bg-accent/5 border-accent/20 text-accent hover:bg-accent/10'
            } ${collapsed ? 'justify-center' : ''}`}
            title={isOnline ? 'OMP is online. Click to go offline.' : 'OMP is offline. Click to go online.'}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {!collapsed && (
              <span className="truncate">
                {isOnline ? 'Network: Online' : 'Network: Offline'}
              </span>
            )}
          </button>

          {/* Theme & Language Toggles in a row */}
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              {/* Language toggler */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded text-xs font-bold transition-all border border-slate-200 dark:border-slate-705"
              >
                <Globe size={14} className="text-primary" />
                <span>{language === 'en' ? 'ગુજરાતી' : 'English'}</span>
              </button>

              {/* Theme toggler */}
              <button
                onClick={toggleTheme}
                className="w-10 py-2 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded flex items-center justify-center transition-all border border-slate-200 dark:border-slate-705"
                title="Toggle UI Theme"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
                className="w-8 h-8 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded flex items-center justify-center text-[10px] font-bold border border-slate-200 dark:border-slate-700"
                title="Switch Language"
              >
                {language === 'en' ? 'ગુ' : 'EN'}
              </button>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded flex items-center justify-center border border-slate-200 dark:border-slate-700"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            </div>
          )}

          {/* Log out */}
          <button 
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={14} />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* 2. MOBILE TOP NAVIGATION HEADER */}
      <header className="md:hidden w-full h-14 bg-slate-50 border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between px-4 fixed top-0 left-0 z-40 text-slate-900 dark:text-white">
        <div className="flex items-center gap-2 font-heading font-bold">
          <span>⚡</span>
          <span>OMP MIS</span>
          {syncQueueSize > 0 && (
            <span className="w-2 h-2 rounded-full bg-accent animate-ping ml-1" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Connection indicator toggle */}
          <button 
            onClick={toggleNetwork}
            className={`p-1.5 rounded-md ${isOnline ? 'text-secondary bg-secondary/10' : 'text-accent bg-accent/10'}`}
          >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
          </button>
          
          {/* Quick Language change */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
            className="p-1.5 bg-white dark:bg-slate-800 rounded font-bold text-[10px] min-w-8 text-center border border-slate-200 dark:border-slate-700"
          >
            {language === 'en' ? 'ગુ' : 'EN'}
          </button>

          {/* Logout */}
          <button 
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* 3. MOBILE BOTTOM NAVIGATION (Optimized for Android 1-hand usage) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-slate-50 border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-around z-40 text-slate-600 dark:text-slate-400 px-2 pb-safe">
        {mobilePrimaryItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-semibold transition-all ${
                isActive ? 'text-primary scale-105 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-primary' : 'text-slate-400'} />
              <span className="mt-1 leading-none">{t(item.label.toLowerCase())}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
