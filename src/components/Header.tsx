import { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, CreditCard, Target, Wallet, Banknote, Trophy, Repeat, History, Settings, LogIn, LogOut, CheckCircle2, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { User } from 'firebase/auth';
import UserAvatar, { getDeterministicAvatarConfig, AvatarConfig } from './UserAvatar';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onSync: () => void;
  isSyncing: boolean;
}

export default function Header({
  currentTab,
  setCurrentTab,
  user,
  spreadsheetId,
  spreadsheetUrl,
  onLogin,
  onLogout,
  onSync,
  isSyncing
}: HeaderProps) {
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    const cached = localStorage.getItem('finance_avatar_config');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return getDeterministicAvatarConfig(user?.displayName || 'Chief Commander');
  });

  useEffect(() => {
    const handleUpdate = () => {
      const cached = localStorage.getItem('finance_avatar_config');
      if (cached) {
        try {
          setAvatarConfig(JSON.parse(cached));
        } catch {}
      }
    };
    window.addEventListener('finance_avatar_changed', handleUpdate);
    return () => window.removeEventListener('finance_avatar_changed', handleUpdate);
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Mission Control 🚀', icon: LayoutDashboard },
    { id: 'upcoming', label: 'Incoming Hits 📬', icon: Calendar },
    { id: 'debts', label: 'Boss Battles 👾', icon: CreditCard },
    { id: 'goals', label: 'Level Up Board 🎮', icon: Target },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'accounts', label: 'Zones 🧍', icon: Banknote },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/60 py-3 px-4 md:px-8 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top brand row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-display font-bold text-xl">
              $
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg md:text-xl text-slate-800 tracking-tight flex items-center gap-2">
                Mission Control 🚀
                <span className="text-xs font-mono font-medium py-0.5 px-2 rounded-full bg-slate-100 text-slate-500 border border-slate-200/50">
                  Sheet-Linked
                </span>
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">A real-time Financial Operating System with Live Sync & gamified zones</p>
            </div>
          </div>

          {/* Sync & User Controls */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Back button for secondary views */}
                {['accounts', 'history', 'subscriptions', 'challenges', 'reports', 'settings', 'community'].includes(currentTab) && (
                  <button
                    onClick={() => setCurrentTab('more')}
                    className="mr-2 py-1 px-3 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-full transition-colors"
                    id="header-back-to-more-btn"
                  >
                    ← Back to More Hub
                  </button>
                )}
                
                {/* Sync status indicator */}
                {spreadsheetId ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={spreadsheetUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden md:flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/50 transition-colors"
                      id="header-open-sheet-btn"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Google Sheet
                    </a>
                    <button
                      onClick={onSync}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100/70 border border-teal-200/50 transition-colors"
                      id="header-sync-btn"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <div className="hidden lg:flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 py-1 px-2.5 rounded-full border border-emerald-200/50">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 py-1 px-2.5 rounded-full border border-amber-200/50">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Demo Mode (Unlinked)
                  </div>
                )}

                {/* User avatar and logout */}
                <div className="flex items-center gap-2 border-l border-slate-200/80 pl-3">
                  <div className="shrink-0">
                    <UserAvatar configOrUrl={avatarConfig} size="sm" />
                  </div>
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Sign Out"
                    id="header-signout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 py-1.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200"
                id="header-login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                Connect Sheets
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
