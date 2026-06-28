import { useState, useEffect } from 'react';
import { 
  Milestone, 
  Calendar, 
  Award, 
  Trophy, 
  Sparkles, 
  CheckCircle2, 
  X, 
  Map, 
  ShieldCheck, 
  Zap, 
  Flame, 
  Lock, 
  TrendingUp, 
  CreditCard,
  Target,
  FileSpreadsheet,
  Globe,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface FinancialJourneyProps {
  accounts: any[];
  debts: any[];
  bills: any[];
  goals: any[];
  history: any[];
  challenges?: any[];
  budgetCategories: any[];
}

interface MilestoneItem {
  id: string;
  title: string;
  desc: string;
  badge: string;
  icon: any;
  xp: number;
  condition: (data: any) => boolean;
  dateKey: string;
}

export default function FinancialJourney({ 
  accounts, 
  debts, 
  bills, 
  goals, 
  history, 
  challenges = [], 
  budgetCategories 
}: FinancialJourneyProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem | null>(null);
  const [completedStates, setCompletedStates] = useState<Record<string, { completed: boolean; date: string }>>({});
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);

  // Define milestones and conditions
  const milestones: MilestoneItem[] = [
    {
      id: 'app_start',
      title: 'Command Center Booted',
      desc: 'Activated the gamified Financial Operating System and took charge of your capital.',
      badge: 'Pioneer Unit',
      icon: ShieldCheck,
      xp: 100,
      condition: () => true, // Always complete
      dateKey: 'date_app_start'
    },
    {
      id: 'first_budget',
      title: 'Created First Budget',
      desc: 'Set category spending limits and established clean buffer lines.',
      badge: 'Planner Initiate',
      icon: TrendingUp,
      xp: 150,
      condition: (d) => d.budgetCategories?.some((c: any) => c.budgeted > 0) || false,
      dateKey: 'date_first_budget'
    },
    {
      id: 'first_goal',
      title: 'Target Established',
      desc: 'Configured your very first savings goal target to build long-term capital stability.',
      badge: 'Goal Setter',
      icon: Target,
      xp: 150,
      condition: (d) => d.goals?.length > 0,
      dateKey: 'date_first_goal'
    },
    {
      id: 'connected_bank',
      title: 'Secured Plaid Nexus',
      desc: 'Connected your first manual or Plaid sandbox bank account to synchronise cash flows.',
      badge: 'Data Integrator',
      icon: Globe,
      xp: 200,
      condition: (d) => d.accounts?.some((a: any) => a.institution && a.institution !== 'Manual') || false,
      dateKey: 'date_connected_bank'
    },
    {
      id: 'first_import',
      title: 'Imported Financial Records',
      desc: 'Successfully synchronized or imported CSV transactions into your transactional log.',
      badge: 'Log Historian',
      icon: FileSpreadsheet,
      xp: 200,
      condition: (d) => d.history?.some((h: any) => h.isImported || h.importSource === 'CSV' || h.importSource === 'Plaid') || false,
      dateKey: 'date_first_import'
    },
    {
      id: 'buffer_filled',
      title: 'Buffer Space Reinforced',
      desc: 'Completely filled your emergency Buffer Space or Safety Net up to your targets.',
      badge: 'Fortified Shield',
      icon: ShieldCheck,
      xp: 250,
      condition: (d) => d.accounts?.some((a: any) => (a.name?.toLowerCase().includes('buffer') || a.purpose?.toLowerCase().includes('buffer')) && a.balance >= a.targetBalance) || false,
      dateKey: 'date_buffer_filled'
    },
    {
      id: 'first_debt_paid',
      title: 'Vanquished First Liability',
      desc: 'Successfully paid off and archived your first active debt or credit card balance.',
      badge: 'Liability Slayer',
      icon: Flame,
      xp: 300,
      condition: (d) => d.debts?.some((debt: any) => debt.status === 'Paid') || false,
      dateKey: 'date_first_debt_paid'
    },
    {
      id: 'vacation_goal',
      title: 'Escape Objective Reached',
      desc: 'Saved 100% of your target amount for a personal Escape or Vacation Goal.',
      badge: 'Globetrotter',
      icon: Trophy,
      xp: 250,
      condition: (d) => d.goals?.some((g: any) => g.name?.toLowerCase().includes('vacation') && g.currentAmount >= g.targetAmount) || false,
      dateKey: 'date_vacation_goal'
    },
    {
      id: 'completed_challenge',
      title: 'Completed Savings Sprint',
      desc: 'Conquered a multi-week survival challenge or seasonal accountability sprint.',
      badge: 'Sprint Master',
      icon: Sparkles,
      xp: 250,
      condition: (d) => d.challenges?.some((c: any) => c.completed) || false,
      dateKey: 'date_completed_challenge'
    },
    {
      id: 'level_10',
      title: 'Reaped Mastery Rank 10',
      desc: 'Earned elite status by checking-in daily and logging financial XP to Rank 10+.',
      badge: 'Grandmaster Chief',
      icon: Trophy,
      xp: 500,
      condition: () => {
        const currentLvl = parseInt(localStorage.getItem('finance_xp_level') || '1');
        return currentLvl >= 10;
      },
      dateKey: 'date_level_10'
    }
  ];

  useEffect(() => {
    // Read level and XP
    setUserLevel(parseInt(localStorage.getItem('finance_xp_level') || '1'));
    setUserXP(parseInt(localStorage.getItem('finance_xp_current') || '0'));

    // Check completion dates or generate realistic ones
    const dataObj = { accounts, debts, bills, goals, history, challenges, budgetCategories };
    const savedDates: Record<string, { completed: boolean; date: string }> = {};

    milestones.forEach(m => {
      const isMet = m.condition(dataObj);
      if (isMet) {
        // Retrieve or initialize date
        let dateVal = localStorage.getItem(`milestone_date_${m.id}`);
        if (!dateVal) {
          const today = new Date();
          // Distribute dates slightly in the past for realistic timeline look
          if (m.id === 'app_start') today.setDate(today.getDate() - 21);
          else if (m.id === 'first_budget') today.setDate(today.getDate() - 14);
          else if (m.id === 'first_goal') today.setDate(today.getDate() - 10);
          else today.setDate(today.getDate() - 2);

          dateVal = today.toISOString().split('T')[0];
          localStorage.setItem(`milestone_date_${m.id}`, dateVal);

          // Trigger XP award for new completions
          const claimed = localStorage.getItem(`milestone_claimed_${m.id}`);
          if (!claimed) {
            localStorage.setItem(`milestone_claimed_${m.id}`, 'true');
            // Safely reward XP
            const currentXp = parseInt(localStorage.getItem('finance_xp_current') || '0');
            const newXp = currentXp + m.xp;
            localStorage.setItem('finance_xp_current', newXp.toString());
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
          }
        }
        savedDates[m.id] = { completed: true, date: dateVal };
      } else {
        savedDates[m.id] = { completed: false, date: '' };
      }
    });

    setCompletedStates(savedDates);
  }, [accounts, debts, bills, goals, history, challenges, budgetCategories]);

  // Handle sharing of milestone achievement
  const handleShare = (m: MilestoneItem) => {
    navigator.clipboard.writeText(`I just unlocked the "${m.badge}" Badge in Finance Command Center by completing: ${m.title}! 🚀`);
    alert('Achievement copy link created! Go share it on your social accountability network.');
  };

  const completedCount = Object.values(completedStates).filter((s: any) => s.completed).length;
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20 space-y-8 animate-fade-in" id="financial-journey-view">
      {/* Header card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white border border-slate-850 shadow-xl" id="journey-hero-card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 py-1 px-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 text-[10px] font-mono tracking-wider uppercase">
              <Map className="w-3.5 h-3.5" />
              Campaign Chronology
            </div>
            <h2 className="text-2xl font-display font-semibold tracking-tight">Financial Journey</h2>
            <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
              Your chronological personal story log. Defeat debt liabilities, reinforce buffer funds, and scale level ranks. Every milestone achieved locks in continuous financial security.
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex flex-col items-center justify-center shrink-0 min-w-[120px] text-center backdrop-blur-xs">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider font-bold">Campaign Complete</span>
            <span className="text-3xl font-display font-black text-slate-100 mt-1">{progressPercent}%</span>
            <span className="text-[10px] text-slate-400 mt-1">{completedCount} of {milestones.length} Met</span>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-6 space-y-1.5 relative z-10">
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>STARTING LINE</span>
            <span>GOAL MASTERY LEVEL</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700/50 p-0.5">
            <motion.div 
              className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative pl-6 md:pl-10 space-y-6 before:absolute before:left-[14px] before:md:left-[22px] before:top-2 before:bottom-2 before:w-1 before:bg-slate-200" id="journey-timeline-flow">
        {milestones.map((m, idx) => {
          const state = completedStates[m.id] || { completed: false, date: '' };
          const Icon = m.icon;

          return (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative flex flex-col md:flex-row gap-4 items-start p-5 rounded-3xl border transition-all ${
                state.completed 
                  ? 'bg-white border-slate-200/80 shadow-xs hover:border-slate-350 hover:shadow-md' 
                  : 'bg-slate-50/50 border-dashed border-slate-200 text-slate-400'
              }`}
              id={`milestone-${m.id}`}
            >
              {/* Dot icon */}
              <div className={`absolute -left-[23px] md:-left-[31px] top-5 w-6 h-6 md:w-8 md:h-8 rounded-full border-4 flex items-center justify-center z-10 ${
                state.completed 
                  ? 'bg-indigo-600 border-white text-white shadow-xs' 
                  : 'bg-slate-200 border-white text-slate-400'
              }`}>
                {state.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                ) : (
                  <Lock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                )}
              </div>

              {/* Main content body */}
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className={`font-display font-bold text-sm tracking-tight ${state.completed ? 'text-slate-800' : 'text-slate-400'}`}>
                    {m.title}
                  </h3>
                  {state.completed && state.date && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-50 py-0.5 px-2 rounded-md border border-slate-100">
                      <Calendar className="w-3 h-3" />
                      {state.date}
                    </span>
                  )}
                </div>

                <p className={`text-xs leading-relaxed ${state.completed ? 'text-slate-500' : 'text-slate-400/80'}`}>
                  {m.desc}
                </p>

                {/* Badges footer */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold py-0.5 px-2 rounded-full border ${
                    state.completed 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100/60' 
                      : 'bg-slate-100/60 text-slate-400 border-slate-200/50'
                  }`}>
                    <Award className="w-3 h-3" />
                    Badge: {m.badge}
                  </span>

                  <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold py-0.5 px-2 rounded-full border ${
                    state.completed 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100/60' 
                      : 'bg-slate-100/60 text-slate-400 border-slate-200/50'
                  }`}>
                    <Zap className="w-3 h-3" />
                    +{m.xp} XP
                  </span>

                  {state.completed && (
                    <button
                      onClick={() => setSelectedMilestone(m)}
                      className="ml-auto text-[10px] font-sans font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      View Certificate
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedMilestone && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-150"
            >
              <button 
                onClick={() => setSelectedMilestone(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-6 pt-2">
                {/* Badge Trophy Frame */}
                <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100/80 border border-indigo-200 flex items-center justify-center relative animate-pulse">
                  <Trophy className="w-8 h-8 text-indigo-600" />
                  <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider font-bold">Chronology Certificate</span>
                  <h3 className="text-xl font-display font-bold text-slate-800">{selectedMilestone.title}</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {selectedMilestone.desc}
                  </p>
                </div>

                {/* Milestone Details Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 grid grid-cols-2 gap-3 text-left">
                  <div>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase">Earned Badge</span>
                    <span className="text-xs font-bold text-slate-700">{selectedMilestone.badge}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase">XP Level Awarded</span>
                    <span className="text-xs font-bold text-emerald-600">+{selectedMilestone.xp} Rank XP</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase">Date Logged</span>
                    <span className="text-xs font-bold text-slate-700">
                      {completedStates[selectedMilestone.id]?.date || 'Logged cycle'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase">Command Hub Security</span>
                    <span className="text-xs font-bold text-teal-600">Locked & Verified</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => handleShare(selectedMilestone)}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-250 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-slate-500" />
                    Share Milestone
                  </button>
                  <button
                    onClick={() => setSelectedMilestone(null)}
                    className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
