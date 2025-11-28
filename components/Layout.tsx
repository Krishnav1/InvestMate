




import React, { ReactNode, useState, useEffect } from 'react';
import { Home, MessageSquare, Users, User, Bell, Sun, Moon, PlayCircle } from 'lucide-react';
import { Tab } from '../types';
import { useApp } from '../context/AppContext';
import { requestNotificationPermission } from '../services/notificationService';
import AudioRoom from './AudioRoom';
import AudioRoomBar from './AudioRoomBar';
import PaymentModal from './PaymentModal';

interface LayoutProps {
  children: ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { theme, toggleTheme, activeRoom, isRoomMinimized, isPaymentModalOpen, openDemo } = useApp();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
        setNotificationsEnabled(true);
    }
  }, []);

  const handleNotificationClick = async () => {
    if (navigator.vibrate) navigator.vibrate(10);
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
        new Notification("Notifications Enabled", { 
            body: "You will now receive alerts for market moves and chats.",
            icon: '/icon.png' 
        });
    }
  };

  const handleToggleTheme = () => {
      if (navigator.vibrate) navigator.vibrate(15);
      toggleTheme();
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col bg-slate-50 dark:bg-black border-x border-slate-200 dark:border-dark-700 shadow-2xl relative overflow-hidden transition-colors duration-300">
      {/* Top Header - Flex Child (Not Fixed) */}
      <header className="h-14 shrink-0 flex items-center justify-between px-4 z-30 transition-all duration-300 glass-light dark:glass-dark border-b border-slate-200/50 dark:border-white/5 relative">
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30 text-white font-bold text-lg">
                I
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">InvestMate</h1>
        </div>
        <div className="flex items-center space-x-1">
          {/* DEMO BUTTON */}
          <button 
            onClick={openDemo}
            className="flex items-center space-x-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-1 rounded-lg text-[10px] font-bold border border-brand-500/20 mr-1 active:scale-95 transition-transform"
          >
             <PlayCircle className="w-3 h-3" />
             <span>Demo</span>
          </button>

          <button 
              onClick={handleToggleTheme}
              className="p-2 text-slate-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/10 active:scale-95"
          >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button 
              onClick={handleNotificationClick}
              className={`relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors active:scale-95 ${notificationsEnabled ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-gray-400'}`}
          >
              <Bell className={`w-5 h-5 ${notificationsEnabled ? 'fill-current opacity-20' : ''}`} />
              {notificationsEnabled && (
                  <Bell className="w-5 h-5 absolute top-2 left-2 animate-pulse text-brand-600 dark:text-brand-400" />
              )}
              {!notificationsEnabled && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white dark:border-black"></span>}
          </button>
        </div>
      </header>

      {/* Main Content Area - Flex Grow */}
      <main className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-black w-full">
        <div key={activeTab} className="h-full w-full animate-fade-in-up">
            {children}
        </div>
      </main>

      {/* Audio Room Components */}
      {activeRoom && !isRoomMinimized && <AudioRoom />}
      {activeRoom && isRoomMinimized && <AudioRoomBar />}

      {/* Monetization Components */}
      {isPaymentModalOpen && <PaymentModal />}

      {/* Bottom Navigation - Flex Child */}
      <nav className="h-[76px] shrink-0 glass-light dark:glass-dark border-t border-slate-200/50 dark:border-white/5 flex items-center justify-around px-2 safe-area-bottom pb-2 backdrop-blur-xl z-30 relative">
          <NavButton 
              icon={<Home className="w-6 h-6" />} 
              label="Feed" 
              active={activeTab === Tab.FEED} 
              onClick={() => onTabChange(Tab.FEED)} 
          />
          <NavButton 
              icon={<MessageSquare className="w-6 h-6" />} 
              label="Charcha" 
              active={activeTab === Tab.CHAT} 
              onClick={() => onTabChange(Tab.CHAT)} 
          />
          <NavButton 
              icon={<Users className="w-6 h-6" />} 
              label="Clubs" 
              active={activeTab === Tab.CLUBS} 
              onClick={() => onTabChange(Tab.CLUBS)} 
          />
          <NavButton 
              icon={<User className="w-6 h-6" />} 
              label="Profile" 
              active={activeTab === Tab.PROFILE} 
              onClick={() => onTabChange(Tab.PROFILE)} 
          />
      </nav>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => {
    const handleClick = () => {
        if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback
        onClick();
    };

    return (
        <button onClick={handleClick} className="flex flex-col items-center justify-center w-20 h-full space-y-1 active:scale-90 transition-transform duration-200 group">
            <div className={`p-1.5 rounded-2xl transition-all duration-300 ${active ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/20 -translate-y-1' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-600 dark:group-hover:text-zinc-300'}`}>
                {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
                    className: `w-6 h-6 ${active ? 'fill-current' : ''}` 
                })}
            </div>
            <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? 'text-brand-600 dark:text-brand-400 font-bold' : 'text-slate-400 dark:text-zinc-500'}`}>
                {label}
            </span>
        </button>
    );
};

export default Layout;
