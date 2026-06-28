import { LayoutDashboard, Calendar, Target, CreditCard, Users, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export default function BottomNav({ currentTab, setCurrentTab }: BottomNavProps) {
  const primaryTabs = [
    { 
      id: 'dashboard', 
      label: 'Home', 
      icon: LayoutDashboard,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50/90 border-blue-100/60 text-blue-600 shadow-xs'
    },
    { 
      id: 'upcoming', 
      label: 'Upcoming', 
      icon: Calendar,
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50/90 border-amber-100/60 text-amber-600 shadow-xs'
    },
    { 
      id: 'goals', 
      label: 'Goals', 
      icon: Target,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50/90 border-purple-100/60 text-purple-600 shadow-xs'
    },
    { 
      id: 'debts', 
      label: 'Debts', 
      icon: CreditCard,
      colorClass: 'text-rose-600',
      bgClass: 'bg-rose-50/90 border-rose-100/60 text-rose-600 shadow-xs'
    },
    { 
      id: 'community', 
      label: 'Community', 
      icon: Users,
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-50/90 border-indigo-100/60 text-indigo-600 shadow-xs'
    },
    { 
      id: 'more', 
      label: 'More', 
      icon: MoreHorizontal,
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-50/90 border-indigo-100/60 text-indigo-600 shadow-xs'
    }
  ];

  // If we are in secondary screens, "More" should be highlighted as active
  const isSecondaryActive = ['accounts', 'history', 'subscriptions', 'challenges', 'reports', 'settings', 'budget'].includes(currentTab);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg bg-white/80 border border-slate-200/50 rounded-3xl p-1.5 shadow-xl shadow-slate-900/5 flex items-center justify-between backdrop-blur-xl animate-fade-in" id="mobile-floating-bottom-nav">
      {primaryTabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id || (tab.id === 'more' && isSecondaryActive);

        return (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className="flex-1 flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl relative transition-all duration-200"
            id={`bottom-nav-item-${tab.id}`}
          >
            {isActive ? (
              <motion.div
                layoutId="activeBottomTabPill"
                className={`absolute inset-0 rounded-2xl border ${tab.bgClass}`}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            ) : null}

            <span className="relative z-10 flex flex-col items-center">
              <Icon className={`w-5 h-5 transition-all duration-300 ${
                isActive ? tab.colorClass : 'text-slate-400 hover:text-slate-700'
              }`} />
              
              <span className={`text-[10px] font-sans font-medium mt-1 tracking-tight transition-colors duration-300 ${
                isActive ? tab.colorClass : 'text-slate-400 hover:text-slate-700'
              }`}>
                {tab.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
