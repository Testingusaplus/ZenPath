import React, { useState, useEffect, useRef } from 'react';
import { ViewState, WellnessEntry, User } from './types';
import Dashboard from './components/Dashboard';
import DailyCheckIn from './components/DailyCheckIn';
import CalendarView from './components/CalendarView';
import LoginPage from './components/LoginPage';
import SocialHub from './components/SocialHub';
import PremiumUpgrade from './components/PremiumUpgrade';
import WellnessChat from './components/WellnessChat';
import ProfileModal from './components/ProfileModal';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import { api } from './services/api';
import { LayoutDashboard, Calendar as CalendarIcon, ShoppingBag, Settings, PlusCircle, Users, Sparkles, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LOGIN');
  const [entries, setEntries] = useState<WellnessEntry[]>([]);
  const [checkInDate, setCheckInDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [user, setUser] = useState<User | null>(null);
  
  // Modal states
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileInitialEditMode, setProfileInitialEditMode] = useState(false);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accent, setAccent] = useState<'theme-sage' | 'theme-rose' | 'theme-lavender' | 'theme-ocean'>('theme-sage');

  // Header Dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize and verify authentication on mount
  useEffect(() => {
    // 1. Check for Admin Portal parameter
    const params = new URLSearchParams(window.location.search);
    const hasAdminToken = localStorage.getItem('zp_token');

    if (params.get('portal') === 'admin') {
      if (hasAdminToken) {
        // Double check admin role
        api.users.getProfile()
          .then(adminUser => {
            if (adminUser.role === 'admin') {
              setUser(adminUser);
              setView('ADMIN_DASHBOARD');
            } else {
              setView('ADMIN_LOGIN');
            }
          })
          .catch(() => setView('ADMIN_LOGIN'));
      } else {
        setView('ADMIN_LOGIN');
      }
      return;
    }

    // 2. Standard User Auth Check
    const token = localStorage.getItem('zp_token');
    if (token) {
      api.users.getProfile()
        .then(profile => {
          setUser(profile);
          setView('DASHBOARD');
          // Load wellness log entries
          api.users.getEntries()
            .then(data => setEntries(data))
            .catch(err => console.error(err));
        })
        .catch(() => {
          localStorage.removeItem('zp_token');
          setView('LOGIN');
        });
    } else {
      setView('LOGIN');
    }
  }, []);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    
    // Determine view route
    if (loggedInUser.role === 'admin') {
      setView('ADMIN_DASHBOARD');
    } else {
      setView('DASHBOARD');
      // Load standard user entries
      api.users.getEntries()
        .then(data => setEntries(data))
        .catch(err => console.error(err));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zp_token');
    setUser(null);
    setView('LOGIN');
    setShowProfileDropdown(false);
    // Purge search parameters if admin logged out
    const params = new URLSearchParams(window.location.search);
    if (params.get('portal')) {
      window.history.replaceState(null, '', '/');
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleSaveEntry = (entry: WellnessEntry) => {
    // Add or update entry in state list
    setEntries(prev => {
      const filtered = prev.filter(e => e.date !== entry.date);
      return [...filtered, entry];
    });
    setView('DASHBOARD');
  };

  const startCheckIn = (dateStr?: string) => {
    setCheckInDate(dateStr || new Date().toISOString().split('T')[0]);
    setView('CHECK_IN');
  };

  const handleUpgradeUser = (upgradedUser: User) => {
    setUser(upgradedUser);
    setShowPremiumModal(false);
  };

  const renderContent = () => {
    // Admin routes
    if (view === 'ADMIN_LOGIN') {
      return (
        <AdminLogin 
          onLoginSuccess={handleLogin}
          onBack={() => {
            window.history.replaceState(null, '', '/');
            setView('LOGIN');
          }}
        />
      );
    }

    if (view === 'ADMIN_DASHBOARD') {
      return <AdminDashboard onLogout={handleLogout} />;
    }

    // Standard authentication route guard
    if (view === 'LOGIN' || !user) {
      return <LoginPage onLogin={handleLogin} />;
    }

    // Standard user pages
    switch (view) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            entries={entries}
            user={user}
            onCheckIn={() => startCheckIn()}
            onViewCalendar={() => setView('CALENDAR')}
            onUpgradeClick={() => setShowPremiumModal(true)}
          />
        );
      
      case 'CHECK_IN':
        const existing = entries.find(e => e.date === checkInDate);
        return (
          <DailyCheckIn 
            date={checkInDate}
            userId={user.id}
            existingEntry={existing}
            onSave={handleSaveEntry}
            onCancel={() => setView('DASHBOARD')}
          />
        );

      case 'CALENDAR':
        return (
          <div className="h-full overflow-y-auto p-4 pb-24 safe-pb scroll-smooth max-w-4xl mx-auto">
            <CalendarView 
              entries={entries}
              onSelectDate={(date) => startCheckIn(date)}
            />
            {/* Banner Ad Placeholder (Free Users Only) */}
            {!user.isPremium && (
              <div className="h-24 mt-6 bg-gray-100 dark:bg-gray-900 rounded-3xl flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 text-xs border-2 border-dashed border-gray-200 dark:border-gray-800">
                <span className="font-bold text-gray-500 mb-1">Sponsored Ad Banner</span>
                <span>Upgrade to Premium to remove ad banners</span>
              </div>
            )}
          </div>
        );

      case 'SOCIAL':
        return <SocialHub user={user} />;

      case 'RESOURCES':
        return (
          <div className="h-full overflow-y-auto p-4 pb-24 safe-pb scroll-smooth max-w-4xl mx-auto space-y-6">
            <h2 className="font-outfit text-2xl font-bold text-gray-800 dark:text-white">Wellness Digital Shop</h2>
            <p className="text-xs text-gray-400">Downloadable planners and soundtracks supporting voluntary content creators.</p>
            
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              
              {/* Product 1 */}
              <div className="bg-white dark:bg-gray-950 p-5 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-12 h-12 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mb-3">
                    <ShoppingBag size={24} />
                  </div>
                  <h3 className="font-outfit font-bold text-sm text-gray-800 dark:text-white">Digital Wellness Planner PDF</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">Annual printable mindfulness organizer with bullet logs and weekly review sheets.</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-teal-700 dark:text-teal-400 text-sm">$4.99</span>
                  <button 
                    onClick={() => alert("Redirecting to Gumroad simulated checkout secure gateway for Digital Planner...")}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold font-outfit shadow-sm"
                  >
                    Get Planner
                  </button>
                </div>
              </div>

              {/* Product 2 */}
              <div className="bg-white dark:bg-gray-950 p-5 rounded-3xl border border-gray-100 dark:border-gray-900 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-3">
                    <ShoppingBag size={24} />
                  </div>
                  <h3 className="font-outfit font-bold text-sm text-gray-800 dark:text-white">Sleep Meditation Audio Pack</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">5 immersive high-definition natural soundscapes and guided audio tracks for rest.</p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-indigo-750 dark:text-indigo-400 text-sm">$2.99</span>
                  <button 
                    onClick={() => alert("Redirecting to Gumroad simulated checkout secure gateway for Sleep Meditation Pack...")}
                    className="bg-indigo-650 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-outfit shadow-sm"
                  >
                    Buy Audio Pack
                  </button>
                </div>
              </div>

            </div>
          </div>
        );

      default:
        return <div>View not found</div>;
    }
  };

  const getAccentClass = () => {
    if (accent === 'theme-rose') return 'theme-rose';
    if (accent === 'theme-lavender') return 'theme-lavender';
    if (accent === 'theme-ocean') return 'theme-ocean';
    return 'theme-sage';
  };

  // Render Admin Layout directly without core App Shell wrapper
  if (view === 'ADMIN_LOGIN' || view === 'ADMIN_DASHBOARD') {
    return renderContent();
  }

  return (
    <div className={`${getAccentClass()} ${theme} min-h-screen transition-colors duration-200`}>
      <div className="h-[100dvh] w-full bg-gray-50 dark:bg-gray-950 overflow-hidden relative flex flex-col">
        
        {/* Sticky/Fixed Top Bar */}
        {user && view !== 'LOGIN' && (
          <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 shrink-0 shadow-sm border-b border-gray-150/40 dark:border-gray-800/40 flex items-center justify-between z-20 h-16 w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold font-outfit shadow-md">
                Z
              </div>
              <span className="font-outfit font-extrabold text-gray-800 dark:text-white tracking-tight text-sm">ZenPath</span>
            </div>

            <div className="flex items-center gap-2.5 relative" ref={dropdownRef}>
              
              {/* Dynamic Theme Selection (only for premium users) */}
              {user.isPremium && (
                <select
                  value={accent}
                  onChange={(e) => setAccent(e.target.value as any)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-800 text-[10px] font-bold rounded-xl px-2 py-1.5 outline-none cursor-pointer text-gray-655 dark:text-gray-300"
                >
                  <option value="theme-sage">🌿 Sage</option>
                  <option value="theme-rose">🌸 Rose</option>
                  <option value="theme-lavender">🔮 Lavender</option>
                  <option value="theme-ocean">🌊 Ocean</option>
                </select>
              )}

              {/* Theme Toggle (Light/Dark) */}
              <button 
                onClick={toggleTheme}
                className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-500 rounded-xl transition-colors"
                title="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              {/* Pro User status badge */}
              {user.isPremium && (
                <span className="text-[8px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-bold px-2 py-1 rounded-full uppercase border border-indigo-100 dark:border-indigo-900 tracking-wide">
                  Pro
                </span>
              )}

              {/* User Avatar - triggers dropdown */}
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-8 h-8 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 shadow-inner flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              >
                <img src={user.avatar} alt="User Settings" className="w-full h-full object-cover" />
              </button>

              {/* ProfileDropdown Menu */}
              {showProfileDropdown && (
                <div className="absolute top-12 right-0 w-52 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-fade-in text-xs text-gray-700 dark:text-gray-300">
                  <div className="px-4 py-3 border-b border-gray-50 dark:border-gray-850 mb-1">
                    <p className="font-bold text-gray-855 dark:text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-gray-450 truncate">{user.email}</p>
                  </div>
                  <button 
                    onClick={() => { setShowProfileDropdown(false); setProfileInitialEditMode(false); setShowProfileModal(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <UserIcon size={14} className="text-gray-400" /> View Profile
                  </button>
                  <button 
                    onClick={() => { setShowProfileDropdown(false); setProfileInitialEditMode(true); setShowProfileModal(true); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <Settings size={14} className="text-gray-400" /> Edit Settings
                  </button>
                  <div className="h-px bg-gray-50 dark:bg-gray-850 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 flex items-center gap-2.5 font-semibold transition-colors"
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              )}

            </div>
          </header>
        )}

        {/* Content Viewport */}
        <main className={`flex-1 relative overflow-hidden flex flex-col w-full ${user && view !== 'LOGIN' ? 'pt-2' : ''}`}>
          {renderContent()}
        </main>

        {/* Floating Chat Component & Sparks FAB (only for logged-in standard users) */}
        {user && view !== 'LOGIN' && (
          <>
            {showChat && <WellnessChat user={user} onClose={() => setShowChat(false)} />}
            <button
              onClick={() => setShowChat(!showChat)}
              className="fixed bottom-24 right-4 z-40 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white p-4 rounded-full shadow-lg shadow-violet-500/25 hover:shadow-xl hover:-translate-y-0.5 transition-all w-12 h-12 flex items-center justify-center border border-white/10 active:scale-95"
              style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
            >
              {showChat ? <Settings size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </button>
          </>
        )}

        {/* Pro Upgrade modal popup */}
        {showPremiumModal && (
          <PremiumUpgrade 
            onUpgrade={handleUpgradeUser}
            onClose={() => setShowPremiumModal(false)}
          />
        )}

        {/* Profile Details Modal popup */}
        {showProfileModal && user && (
          <ProfileModal 
            user={user}
            onClose={() => setShowProfileModal(false)}
            onSave={handleUpdateUser}
            initialEditMode={profileInitialEditMode}
          />
        )}

        {/* App Bottom Navigation Bar */}
        {user && view !== 'LOGIN' && (
          <nav className="shrink-0 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-150/40 dark:border-gray-800/40 flex justify-around p-2 z-30 safe-pb h-[calc(64px+env(safe-area-inset-bottom))] sticky bottom-0">
            <button 
              onClick={() => setView('DASHBOARD')}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
                view === 'DASHBOARD' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="text-[9px] font-bold font-outfit">Home</span>
            </button>
            
            <button 
              onClick={() => setView('CALENDAR')}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
                view === 'CALENDAR' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              <CalendarIcon size={20} />
              <span className="text-[9px] font-bold font-outfit">Calendar</span>
            </button>

            <button 
              onClick={() => startCheckIn()}
              className="relative -top-5 bg-gradient-to-tr from-teal-500 to-emerald-600 text-white w-12 h-12 rounded-full shadow-lg shadow-teal-500/25 active:scale-95 hover:scale-105 border-4 border-gray-50 dark:border-gray-950 flex items-center justify-center transition-all"
            >
              <PlusCircle size={24} />
            </button>

            <button 
              onClick={() => setView('SOCIAL')}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
                view === 'SOCIAL' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              <Users size={20} />
              <span className="text-[9px] font-bold font-outfit">Social</span>
            </button>

            <button 
              onClick={() => setView('RESOURCES')}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
                view === 'RESOURCES' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              <ShoppingBag size={20} />
              <span className="text-[9px] font-bold font-outfit">Shop</span>
            </button>
          </nav>
        )}

      </div>
    </div>
  );
};

export default App;
