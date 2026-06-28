import { useState } from 'react';
import { 
  Banknote, 
  History, 
  Repeat, 
  Trophy, 
  BarChart3, 
  Settings, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  LifeBuoy, 
  Gamepad2, 
  X,
  Compass,
  ArrowUpRight,
  Wallet,
  Map,
  Bot,
  Cloud
} from 'lucide-react';

interface MoreViewProps {
  onSelectTab: (tabId: string) => void;
}

export default function MoreView({ onSelectTab }: MoreViewProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const menuItems = [
    {
      id: 'coach',
      title: 'AI Financial Coach',
      desc: 'Ask our Gemini coach on purchase affordabilities, debt paydowns & safe spends',
      icon: Bot,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-150',
    },
    {
      id: 'journey',
      title: 'Financial Journey',
      desc: 'Campaign Chronology: Track level, milestones, earned badges & achievements',
      icon: Map,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-150',
    },
    {
      id: 'backup',
      title: 'Backup & Sync Center',
      desc: 'Synchronise real-time Google Sheets & manage Plaid banking sandboxes',
      icon: Cloud,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-150',
    },
    {
      id: 'roadmap',
      title: 'Financial Roadmap',
      desc: 'GPS for your money: Timeline to debt-free, buffer funds & milestone routes',
      icon: Compass,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-150',
    },
    {
      id: 'accounts',
      title: 'Accounts',
      desc: 'Check checking hubs, bill buffers, and liquid zones',
      icon: Banknote,
      color: 'bg-blue-500/10 text-blue-600 border-blue-150',
    },
    {
      id: 'budget',
      title: 'Budget',
      desc: 'Configure checking zones, buffer boundaries & discretionary limits',
      icon: Wallet,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-150',
    },
    {
      id: 'history',
      title: 'Activity',
      desc: 'Audit real-time transactional timeline & sync history',
      icon: History,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-150',
    },
    {
      id: 'subscriptions',
      title: 'Memberships & Subscriptions',
      desc: 'Monitor autopays, app renewals, and repeat memberships',
      icon: Repeat,
      color: 'bg-rose-500/10 text-rose-600 border-rose-150',
    },
    {
      id: 'challenges',
      title: 'Savings Challenges',
      desc: 'Join 52-week or coffee sprints and track survival streaks',
      icon: Trophy,
      color: 'bg-purple-500/10 text-purple-600 border-purple-150',
    },
    {
      id: 'reports',
      title: 'Insights',
      desc: 'Analyze net worth projections, spending footprint & trends',
      icon: BarChart3,
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-150',
    },
    {
      id: 'settings',
      title: 'Settings',
      desc: 'Configure Plaid API sandbox, Google Sheet ID, & system resets',
      icon: Settings,
      color: 'bg-slate-500/10 text-slate-600 border-slate-150',
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pb-12 space-y-8 animate-fade-in" id="more-hub-frame">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-display font-semibold text-slate-800 tracking-tight">More options</h2>
        <p className="text-sm text-slate-500">Dive deeper into advanced logs, challenges, intelligence sheets, and configurations</p>
      </div>

      {/* Grid of options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className="glass-panel text-left rounded-3xl p-5 flex items-start gap-4 hover:border-slate-350 hover:shadow-md transition-all group"
              id={`more-hub-item-${item.id}`}
            >
              <div className={`p-3 rounded-2xl border ${item.color} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1 group-hover:text-slate-900">
                  {item.title}
                  <ChevronRight className="w-4 h-4 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Auxiliary Help and About block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <button
          onClick={() => setShowHelp(true)}
          className="glass-panel text-left rounded-3xl p-5 flex items-center gap-4 hover:bg-slate-50/50 hover:border-slate-300 transition-all"
          id="btn-more-hub-help"
        >
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-150 shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800">Support & Help Desk</h3>
            <p className="text-xs text-slate-400">Read guides on syncing, rebalancing, and phase progression</p>
          </div>
        </button>

        <button
          onClick={() => setShowAbout(true)}
          className="glass-panel text-left rounded-3xl p-5 flex items-center gap-4 hover:bg-slate-50/50 hover:border-slate-300 transition-all"
          id="btn-more-hub-about"
        >
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 border border-teal-150 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-800">About Operating System</h3>
            <p className="text-xs text-slate-400">View software specifications, credits, and architecture model</p>
          </div>
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-slate-150 animate-slide-up">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <LifeBuoy className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-display font-bold text-slate-800">System Help & Guides</h3>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed overflow-y-auto max-h-[400px] pr-2">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700">1. How do Money Spaces work?</h4>
                <p>Your capital resides in five strategic spaces: <b>Life Wallet</b>, <b>Bill Hub</b>, <b>Safety Net</b>, <b>Escape Fund</b>, and <b>Boss Fight Fund</b>. When income drops, the Smart Financial Engine automatically fills these spaces sequentially based on upcoming expenses and targets.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700">2. What are Financial Phases?</h4>
                <p>The OS tracks 6 progressive levels—from Phase 1 (Building Stability) up to Phase 6 (Total Financial Freedom). The System dynamically updates recommendation cards on the Home Dashboard based on which phase you're actively in.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700 font-sans">3. What is Simulation Mode?</h4>
                <p>Allows you to run What-If formulas (e.g. testing reduced spending, extra income, or pausing vacation auto-moves) and immediately observe how many months are shaved off your Boss Battles and how much total interest is saved.</p>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-700">4. Live Google Sheets Sync</h4>
                <p>Your Google Sheet stays the persistent backend. Clicking "Sync Now" pushes any offline changes and pulls incoming items seamlessly.</p>
              </div>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="w-full mt-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-md"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-150 animate-slide-up">
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <Gamepad2 className="w-5 h-5 text-teal-500" />
              <h3 className="text-lg font-display font-bold text-slate-800">About Financial OS</h3>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <p><b>Version</b>: 3.4.0 (Liquid Glass Edition)</p>
              <p><b>Core Arch</b>: Fully React + Express backend proxying Google Workspace and Plaid OAuth protocols. Rebalancing math powered by dynamic matrix loops.</p>
              <p className="leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100 text-slate-500">
                Created to change personal budgeting from an anxiety-driven chore to an encouraging, gamified, and responsive adventure. Defeat liabilities, level up your funds, and sync your life automatically.
              </p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] font-mono text-slate-400">Connected via Secure SSL Proxy</span>
                <span className="text-[10px] font-mono bg-teal-50 text-teal-700 py-0.5 px-2 rounded-full font-bold">Stable Build</span>
              </div>
            </div>
            <button 
              onClick={() => setShowAbout(false)}
              className="w-full mt-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-md"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
