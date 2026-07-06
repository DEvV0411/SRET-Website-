import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { StudentModule } from './components/StudentModule';
import { SessionModule } from './components/SessionModule';
import { InventoryModule } from './components/InventoryModule';
import { CounsellingModule } from './components/CounsellingModule';
import { MonitoringModule } from './components/MonitoringModule';
import { ReportsModule } from './components/ReportsModule';
import { UserManager } from './components/UserManager';
import { LessonPlanModule } from './components/LessonPlanModule';
import { AIAssistant } from './components/AIAssistant';
import { VerticalModule } from './components/VerticalModule';
import { PersonalDashboard } from './components/PersonalDashboard';
import { TransportModule } from './components/TransportModule';
import { Sparkles, HelpCircle, Bell, Wifi, WifiOff } from 'lucide-react';

import { db } from './lib/db';

export const App: React.FC = () => {
  const { currentUser, isOnline, syncQueueSize, t } = useAuth();
  const [activeTab, setActiveTab] = useState('personal_dashboard');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Right-hand AI sidebar open state (Notion-AI style)
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  
  // Custom Toast notification states
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      setToastMessage(customEvent.detail);
      setTimeout(() => setToastMessage(null), 3000);
    };
    window.addEventListener('omp_toast_message', handleToast);
    return () => {
      window.removeEventListener('omp_toast_message', handleToast);
    };
  }, []);

  // Landing page redirection effect
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'super_admin') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('personal_dashboard');
      }
    }
  }, [currentUser]);

  // Trainer GPS position tracker
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'trainer') return;
    if (!navigator.geolocation) {
      console.warn('[GPS Tracker] Geolocation not supported.');
      return;
    }

    console.log('[GPS Tracker] Watching trainer position:', currentUser.username);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        db.updateTrainerLocation(currentUser.username, latitude, longitude);
      },
      (err) => {
        console.warn('[GPS Tracker] Error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [currentUser]);

  // Trigger automatic Firestore database sync pull on login/startup
  useEffect(() => {
    const syncAndPull = async () => {
      if (currentUser) {
        await db.syncPendingQueue();
        await db.pullAllFromFirestore();
        db.setupRealtimeListeners();
      }
    };
    syncAndPull();
  }, [currentUser, isOnline]);

  // Return Login if unauthenticated
  if (!currentUser) {
    return <Login />;
  }

  // Component Router swapper
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal_dashboard':
        return <PersonalDashboard />;
      case 'dashboard':
        return (
          <DashboardView 
            setActiveTab={setActiveTab} 
          />
        );
      case 'pre_vocational':
        return <VerticalModule programme="Pre-Vocational" />;
      case 'vocational':
        return <VerticalModule programme="Vocational" />;
      case 'udyam':
        return <VerticalModule programme="Udyam" />;
      case 'magic_touch':
        return <VerticalModule programme="Magic Touch" />;
      case 'sessions':
        return (
          <SessionModule 
            selectedSessionId={selectedSessionId} 
            setSelectedSessionId={setSelectedSessionId} 
          />
        );
      case 'lesson_plans':
        return <LessonPlanModule />;
      case 'inventory':
        return <InventoryModule />;
      case 'transport':
        return <TransportModule />;
      case 'counselling':
        return <CounsellingModule />;
      case 'monitoring':
        return <MonitoringModule />;
      case 'users':
        return <UserManager />;
      default:
        return (
          <div className="py-12 text-center text-xs text-slate-500 bg-white border rounded">
            Module {activeTab} is configured and running. Data models synced.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 dark:bg-dark-bg dark:text-slate-100 font-body">
      
      {/* 1. APP SIDEBAR & NAVIGATION (Responsive: hides on mobile, adds bottom bar) */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. MAIN SCROLLABLE CONTENT BODY AREA */}
      <div className="flex-1 flex flex-col md:pl-[260px] min-w-0 transition-all duration-300">
        
        {/* Main Desktop Header */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border sticky top-0 z-20">
          
          {/* Breadcrumb section */}
          <div className="flex items-center gap-2 text-sm font-semibold capitalize">
            <span className="text-slate-400">Outreach MIS</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 dark:text-white font-bold">{t(activeTab)}</span>
          </div>

          {/* Core tools icons */}
          <div className="flex items-center gap-4">
            
            {/* Sync connection status text */}
            <div className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full ${
              isOnline 
                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                : 'bg-accent/10 text-accent border border-accent/20 animate-pulse'
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span>{isOnline ? t('synced_notice') : t('offline_notice')}</span>
            </div>

            {/* AI drawer toggle button */}
            <button
              onClick={() => setAiSidebarOpen(!aiSidebarOpen)}
              className={`p-2 rounded-md transition-all flex items-center gap-1.5 text-xs font-bold border ${
                aiSidebarOpen 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-white dark:bg-dark-surface hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 border-slate-200 dark:border-dark-border'
              }`}
              title="Toggle AI Copilot"
            >
              <Sparkles size={16} />
              <span>AI Copilot</span>
            </button>

            {/* User notification bell */}
            <button 
              onClick={() => alert(`System Active. Current alerts count: ${syncQueueSize} pending sync.`)}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white relative hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <Bell size={18} />
              {syncQueueSize > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white dark:border-dark-surface animate-ping" />
              )}
            </button>
          </div>
        </header>

        {/* Core Swapped Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8 pt-20 md:pt-8">
          {renderTabContent()}
        </main>
      </div>

      {/* 3. RIGHT HAND AI DRAWER CO-PILOT (Notion-style sidepanel) */}
      <div className={`hidden md:block fixed right-0 top-16 h-[calc(100vh-64px)] w-[360px] bg-slate-900 border-l border-slate-800 text-white transition-transform duration-300 z-30 shadow-2xl ${
        aiSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto p-5 pb-12 relative">
          <button 
            onClick={() => setAiSidebarOpen(false)}
            className="absolute top-5 right-5 text-slate-500 hover:text-white font-bold"
          >
            ✕
          </button>
          <AIAssistant />
        </div>
      </div>

      {/* Floating Sparkles AI button for MOBILE users (fits mobile-bottom workflows) */}
      <button
        onClick={() => {
          // In mobile, we render AI assistant as a dedicated tab or toggle overlay modal
          setActiveTab(activeTab === 'ai' ? 'dashboard' : 'users');
          // Direct alert description for easy access
          alert("To access the OMP AI Copilot in mobile view, please view this dashboard on a desktop screen. The AI panel slides in from the right to review stats logs side-by-side!");
        }}
        className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg z-30 animate-pulse border-2 border-slate-800"
        title="AI Assistant Info"
      >
        <Sparkles size={20} />
      </button>

      {/* 4. FLOATING SYSTEM TOAST NOTIFICATIONS CARD */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-md shadow-2xl z-50 flex items-center gap-3 animate-slideIn max-w-sm">
          <div className="w-2 h-2 rounded-full bg-secondary animate-ping" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

    </div>
  );
};
export default App;
