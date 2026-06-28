import { useState, FormEvent, useEffect } from 'react';
import { Goal } from '../types';
import { 
  Plus, 
  Trash, 
  Sparkles, 
  TrendingUp, 
  HelpCircle, 
  ArrowUp, 
  ArrowDown, 
  Flame, 
  CheckSquare, 
  Square, 
  Image as ImageIcon, 
  Award, 
  Milestone,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  Sparkle,
  Gift,
  Heart,
  ChevronLeft,
  Coins,
  ShieldCheck,
  Compass,
  Smile,
  Check
} from 'lucide-react';

interface GoalsViewProps {
  goals: Goal[];
  onUpdateGoals: (updated: Goal[]) => void;
}

interface CelebrationState {
  goalName: string;
  milestone: 25 | 50 | 75 | 100;
  badge: string;
  message: string;
  icon: any;
}

// Pre-built aspirational templates
const ASPIRATIONAL_TEMPLATES = [
  {
    name: 'Boss Fight Fund 🗡️',
    category: 'Debt Payoff',
    targetAmount: 5000,
    currentAmount: 0,
    weeklyTransfer: 150,
    whyItMatters: 'Destroy high-interest debt with a powerful extra payout blow.',
    notes: 'Defeat interest dragons and reclaim cash flow freedom!'
  },
  {
    name: 'Escape Fund 🌴',
    category: 'Travel',
    targetAmount: 3000,
    currentAmount: 0,
    weeklyTransfer: 50,
    whyItMatters: 'Securing well-deserved creative rest in tropical paradise.',
    notes: 'Pristine beaches, clear water, and deep offline relaxation.'
  },
  {
    name: 'Freedom Buffer 🛡️',
    category: 'Safety Net',
    targetAmount: 10000,
    currentAmount: 0,
    weeklyTransfer: 200,
    whyItMatters: 'A cash cushion for real-life safety and immediate peace of mind.',
    notes: 'Insulate yourself from daily stress and unexpected life events.'
  },
  {
    name: 'New Ride Quest 🏎️',
    category: 'Vehicle Upgrade',
    targetAmount: 8000,
    currentAmount: 0,
    weeklyTransfer: 100,
    whyItMatters: 'Secure hassle-free premium transportation with solid cold cash.',
    notes: 'Trade up for efficiency, speed, or pure electric torque.'
  },
  {
    name: 'Holiday Magic 🎄',
    category: 'Celebration',
    targetAmount: 2500,
    currentAmount: 0,
    weeklyTransfer: 30,
    whyItMatters: 'Create memorable festive moments without credit card guilt.',
    notes: 'Insulate the holiday gift season with prepared financial planning.'
  },
  {
    name: 'Treat Yourself ☕',
    category: 'Lifestyle',
    targetAmount: 1500,
    currentAmount: 0,
    weeklyTransfer: 25,
    whyItMatters: 'Unlocking guilt-free funding for your personal hobbies.',
    notes: 'New tech, spa weekends, or premium single-origin espresso setups.'
  }
];

export default function GoalsView({ goals, onUpdateGoals }: GoalsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [adjustingGoalName, setAdjustingGoalName] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [isContribution, setIsContribution] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Savings');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [weekly, setWeekly] = useState('');
  const [why, setWhy] = useState('');
  const [notes, setNotes] = useState('');

  // Checklist Local State (keyed by goal name)
  const [checklists, setChecklists] = useState<{[key: string]: { id: string; text: string; done: boolean }[]}>({});
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [activeChecklistGoal, setActiveChecklistGoal] = useState<string | null>(null);

  // Milestone Celebration overlay state
  const [activeCelebration, setActiveCelebration] = useState<CelebrationState | null>(null);

  // Initialize checklists from local storage or defaults
  useEffect(() => {
    const stored = localStorage.getItem('goals_custom_checklists');
    if (stored) {
      try {
        setChecklists(JSON.parse(stored));
      } catch (e) {
        console.warn('Could not parse goals checklists', e);
      }
    } else {
      // Default checklists
      const defaults: {[key: string]: { id: string; text: string; done: boolean }[]} = {
        'Escape Fund 🌴': [
          { id: '1', text: 'Select getaway location', done: true },
          { id: '2', text: 'Compare lodging cost options', done: false },
          { id: '3', text: 'Set up automated weekly $50 transfer', done: true }
        ],
        'Boss Fight Fund 🗡️': [
          { id: '1', text: 'Confirm first priority payoff target', done: true },
          { id: '2', text: 'Initiate monthly recurring $250 extra hit', done: false }
        ]
      };
      setChecklists(defaults);
      localStorage.setItem('goals_custom_checklists', JSON.stringify(defaults));
    }
  }, []);

  // Auto-populate 3 exciting pre-built goals if database is entirely empty
  useEffect(() => {
    if (goals.length === 0) {
      const defaultGoals: Goal[] = [
        {
          name: 'Freedom Buffer 🛡️',
          category: 'Safety Net',
          targetAmount: 5000,
          currentAmount: 1250, // 25% complete!
          weeklyTransfer: 100,
          monthlyTransfer: 433,
          status: 'In Progress',
          whyItMatters: 'A cash cushion for real-life safety and immediate peace of mind.',
          notes: 'Insulate yourself from daily stress and unexpected life events.'
        },
        {
          name: 'Escape Fund 🌴',
          category: 'Travel',
          targetAmount: 3000,
          currentAmount: 750, // 25% complete!
          weeklyTransfer: 50,
          monthlyTransfer: 216.5,
          status: 'In Progress',
          whyItMatters: 'Securing well-deserved creative rest in tropical paradise.',
          notes: 'Pristine beaches, clear water, and deep offline relaxation.'
        },
        {
          name: 'Boss Fight Fund 🗡️',
          category: 'Debt Payoff',
          targetAmount: 5000,
          currentAmount: 0,
          weeklyTransfer: 150,
          monthlyTransfer: 649.5,
          status: 'In Progress',
          whyItMatters: 'Destroy high-interest debt with a powerful extra payout blow.',
          notes: 'Defeat interest dragons and reclaim cash flow freedom!'
        }
      ];
      onUpdateGoals(defaultGoals);
    }
  }, [goals, onUpdateGoals]);

  const saveChecklists = (newChecklists: {[key: string]: { id: string; text: string; done: boolean }[]}) => {
    setChecklists(newChecklists);
    localStorage.setItem('goals_custom_checklists', JSON.stringify(newChecklists));
  };

  const handleToggleChecklist = (goalName: string, itemId: string) => {
    const list = checklists[goalName] || [];
    const updatedList = list.map(item => {
      if (item.id === itemId) return { ...item, done: !item.done };
      return item;
    });
    const next = { ...checklists, [goalName]: updatedList };
    saveChecklists(next);
  };

  const handleAddChecklistItem = (goalName: string, e: FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim()) return;
    const list = checklists[goalName] || [];
    const newItem = {
      id: Date.now().toString(),
      text: newChecklistItem.trim(),
      done: false
    };
    const next = { ...checklists, [goalName]: [...list, newItem] };
    saveChecklists(next);
    setNewChecklistItem('');
  };

  // Enable/Quick Add a Pre-built Aspirational Goal Template
  const handleEnableTemplate = (template: typeof ASPIRATIONAL_TEMPLATES[0]) => {
    const exists = goals.some(g => g.name.toLowerCase() === template.name.toLowerCase());
    if (exists) {
      alert(`The quest "${template.name}" is already active on your board!`);
      return;
    }

    const newGoal: Goal = {
      name: template.name,
      category: template.category,
      targetAmount: template.targetAmount,
      currentAmount: template.currentAmount,
      weeklyTransfer: template.weeklyTransfer,
      monthlyTransfer: template.weeklyTransfer * 4.33,
      status: 'In Progress',
      whyItMatters: template.whyItMatters,
      notes: template.notes
    };

    onUpdateGoals([...goals, newGoal]);
    
    // Add default checklist templates for the quick added quest
    let initialChecklist = [
      { id: '1', text: 'Define exact target deadline', done: false },
      { id: '2', text: 'Configure automated payday transfer rules', done: false }
    ];
    if (template.name.includes('Escape')) {
      initialChecklist = [
        { id: '1', text: 'Select travel destination & compare tickets', done: false },
        { id: '2', text: 'Estimate daily accommodation costs', done: false },
        { id: '3', text: 'Set up weekly $50 deposit rule', done: true }
      ];
    } else if (template.name.includes('Boss')) {
      initialChecklist = [
        { id: '1', text: 'Audit highest APR credit target card', done: true },
        { id: '2', text: 'Allocate payday residual cash flows', done: false }
      ];
    }
    
    const nextChecklists = { ...checklists, [template.name]: initialChecklist };
    saveChecklists(nextChecklists);
  };

  // Add Goal manually
  const handleAddGoal = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    const targetNum = parseFloat(target) || 0;
    const currentNum = parseFloat(current) || 0;
    const weeklyNum = parseFloat(weekly) || 0;

    const newGoal: Goal = {
      name,
      category,
      targetAmount: targetNum,
      currentAmount: currentNum,
      weeklyTransfer: weeklyNum,
      monthlyTransfer: weeklyNum * 4.33,
      status: currentNum >= targetNum ? 'Fully Funded' : 'In Progress',
      whyItMatters: why || 'Unlocks a crucial life milestone',
      notes
    };

    onUpdateGoals([...goals, newGoal]);
    setIsAdding(false);

    // Clear form
    setName('');
    setTarget('');
    setCurrent('');
    setWeekly('');
    setWhy('');
    setNotes('');
  };

  // Delete Goal
  const handleDeleteGoal = (goalName: string) => {
    const confirmed = window.confirm(`Permanently delete goal "${goalName}"?`);
    if (!confirmed) return;
    const updated = goals.filter(g => g.name !== goalName);
    onUpdateGoals(updated);
  };

  // Adjust Current Amount with automatic milestone tracking and congratulations overlays
  const handleAdjustBalance = (e: FormEvent) => {
    e.preventDefault();
    if (!adjustingGoalName || !adjustmentAmount) return;

    const amt = parseFloat(adjustmentAmount) || 0;
    const updated = goals.map(g => {
      if (g.name === adjustingGoalName) {
        const factor = isContribution ? 1 : -1;
        const newAmt = Math.max(0, g.currentAmount + (amt * factor));
        
        const reachedTarget = newAmt >= g.targetAmount;
        let finalStatus = reachedTarget ? 'Fully Funded' : 'In Progress';
        if (g.name === 'Vacation Fund' && reachedTarget) {
          finalStatus = 'Rolling Over';
        }

        // Compare old percentage vs new percentage for milestones
        const oldPct = (g.currentAmount / g.targetAmount) * 100;
        const newPct = (newAmt / g.targetAmount) * 100;

        // Determine if a major milestone was crossed
        let crossedMilestone: 25 | 50 | 75 | 100 | null = null;
        if (oldPct < 25 && newPct >= 25 && newPct < 50) crossedMilestone = 25;
        else if (oldPct < 50 && newPct >= 50 && newPct < 75) crossedMilestone = 50;
        else if (oldPct < 75 && newPct >= 75 && newPct < 100) crossedMilestone = 75;
        else if (oldPct < 100 && newPct >= 100) crossedMilestone = 100;

        if (crossedMilestone) {
          let badge = '';
          let message = '';
          let IconComp: any = Sparkles;

          if (crossedMilestone === 25) {
            badge = 'Quarter Way There! 🌱';
            message = `Awesome start! You have conquered 25% of the target for "${g.name}". The foundation is set, keep pouring!`;
            IconComp = Smile;
          } else if (crossedMilestone === 50) {
            badge = 'Halfway Champion! ⚡';
            message = `BOOM! You are 50% funded on "${g.name}". This goal is completely inevitable now. Celebrate your hard work!`;
            IconComp = Flame;
          } else if (crossedMilestone === 75) {
            badge = 'Almost Complete! 🚀';
            message = `Incredible progress! "${g.name}" is 75% funded. The finish line is fully in view. Push through to the summit!`;
            IconComp = TrendingUp;
          } else if (crossedMilestone === 100) {
            badge = 'Fully Funded! 🏆';
            message = `MAX QUEST LEVEL ACHIEVED! Congratulations, you have fully funded "${g.name}". This milestone is yours! 🎉`;
            IconComp = Award;
          }

          setActiveCelebration({
            goalName: g.name,
            milestone: crossedMilestone,
            badge,
            message,
            icon: IconComp
          });
        }

        return {
          ...g,
          currentAmount: newAmt,
          status: finalStatus
        };
      }
      return g;
    });

    onUpdateGoals(updated);
    setAdjustingGoalName(null);
    setAdjustmentAmount('');
  };

  const getUnsplashPhoto = (goalName: string) => {
    const lower = goalName.toLowerCase();
    if (lower.includes('vacation') || lower.includes('escape') || lower.includes('travel')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop'; // Tropical beach
    }
    if (lower.includes('boss') || lower.includes('fight') || lower.includes('freedom')) {
      return 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop'; // Golden seedlings
    }
    if (lower.includes('buffer') || lower.includes('safety') || lower.includes('net') || lower.includes('emergency')) {
      return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop'; // Dynamic desk shield
    }
    if (lower.includes('ride') || lower.includes('car') || lower.includes('vehicle')) {
      return 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&auto=format&fit=crop'; // Modern car headlight
    }
    if (lower.includes('holiday') || lower.includes('magic') || lower.includes('christmas')) {
      return 'https://images.unsplash.com/photo-1544984243-ec57ea16fe25?w=500&auto=format&fit=crop'; // Holiday lights
    }
    if (lower.includes('treat') || lower.includes('hobbies') || lower.includes('coffee')) {
      return 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=500&auto=format&fit=crop'; // Steaming espresso
    }
    return 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=500&auto=format&fit=crop'; // Roadtrip map
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Overall Ring Math
  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0) || 1;
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallCompletionPercentage = Math.round(Math.min((totalCurrentAmount / totalTargetAmount) * 100, 100));

  // Progress circle geometry
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallCompletionPercentage / 100) * circumference;

  // Featured Goal Selection (In progress & closest to completion)
  const inProgressGoals = goals.filter(g => g.currentAmount < g.targetAmount);
  const featuredGoal = inProgressGoals.length > 0 
    ? [...inProgressGoals].sort((a, b) => {
        const ratioA = a.currentAmount / a.targetAmount;
        const ratioB = b.currentAmount / b.targetAmount;
        return ratioB - ratioA; // Higher ratio comes first
      })[0]
    : goals[0];

  // Recently Completed Goals
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 space-y-8 animate-fade-in" id="goals-tab-content">
      
      {/* TASTEFUL MILESTONE CELEBRATION OVERLAY */}
      {activeCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white/95 p-8 rounded-3xl border border-purple-200 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center animate-bounce-short relative overflow-hidden">
            
            {/* Soft decorative background circles */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl" />

            <div className="p-3 bg-gradient-to-tr from-yellow-500/20 to-purple-500/20 rounded-full text-yellow-600 shadow-sm animate-spin-slow">
              {(() => {
                const CelebrationIcon = activeCelebration.icon;
                return <CelebrationIcon className="w-10 h-10" />;
              })()}
            </div>

            <div>
              <span className="text-[10px] uppercase font-mono font-black text-purple-600 bg-purple-100/50 py-1 px-3.5 rounded-full tracking-wider">
                {activeCelebration.badge}
              </span>
              <h3 className="font-display font-black text-xl text-slate-800 mt-2">
                Quest Milestone Unlocked! 🎉
              </h3>
            </div>

            <p className="text-xs text-slate-600 font-semibold leading-relaxed px-2">
              {activeCelebration.message}
            </p>

            <button 
              onClick={() => setActiveCelebration(null)}
              className="mt-2 py-2 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            >
              Secure Achievement
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Achievements & Savings Quests 🎯</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Turn your plans into achievements. Set meaningful goals, celebrate milestones, and watch your progress grow over time.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-md transition-all duration-200 self-start"
          id="add-goal-toggle-btn"
        >
          <Plus className="w-4 h-4" />
          Add Custom Quest
        </button>
      </div>

      {/* REDESIGNED SUMMARY BOARD (Bento Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Progress Ring Card */}
        <div className="glass-panel rounded-3xl p-6 flex items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-sm font-display font-extrabold text-slate-800">Combined Progress</h3>
            <p className="text-xs text-slate-400">Average complete status of all active saving quests.</p>
            <div className="pt-2 text-xs font-mono font-bold text-slate-700">
              {formatCurrency(totalCurrentAmount)} / {formatCurrency(totalTargetAmount)}
            </div>
          </div>

          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="7.5"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-purple-600 transition-all duration-500"
                strokeWidth="7.5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-mono font-black text-sm text-slate-800">
              {overallCompletionPercentage}%
            </span>
          </div>
        </div>

        {/* Featured Goal Banner */}
        {featuredGoal && (
          <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
            {/* Background cover image */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-[0.06] group-hover:scale-105 transition-transform duration-500" 
              style={{ backgroundImage: `url(${getUnsplashPhoto(featuredGoal.name)})` }} 
            />
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono font-black text-purple-700 bg-purple-50 py-0.5 px-2 rounded-full border border-purple-200">
                  Featured Active Quest
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {Math.round((featuredGoal.currentAmount / featuredGoal.targetAmount) * 100)}% Complete
                </span>
              </div>
              <h4 className="font-display font-black text-slate-800 text-sm pt-2">{featuredGoal.name}</h4>
              <p className="text-xs text-slate-400 leading-normal">Required: {formatCurrency(featuredGoal.targetAmount - featuredGoal.currentAmount)} to complete</p>
            </div>
            
            <div className="pt-2 flex items-center justify-between relative z-10 border-t border-slate-100 mt-2">
              <span className="text-[10px] text-purple-600 font-bold">Unlocks: "{featuredGoal.whyItMatters}"</span>
              <button 
                onClick={() => setAdjustingGoalName(featuredGoal.name)}
                className="text-[10px] bg-purple-600 hover:bg-purple-700 text-white py-1 px-3 rounded-full font-bold transition-all cursor-pointer"
              >
                Deposit Cash
              </button>
            </div>
          </div>
        )}

        {/* Streaks & Milestones Card */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Weekly Streak</h4>
              <h3 className="text-sm font-display font-black text-slate-800">Automated Savings Loop</h3>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-3 bg-purple-50 rounded-2xl border border-purple-100 text-purple-600 shadow-xs">
              <Flame className="w-5 h-5 fill-current animate-pulse text-purple-600" />
              <span className="font-mono font-bold text-xs">5 Weeks</span>
            </div>
          </div>
          
          <div className="text-[11px] text-slate-500 leading-normal border-t border-slate-100 pt-2 flex gap-1.5 items-center">
            <Award className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Completed <b>{completedGoals.length}</b> major milestone target funds so far!</span>
          </div>
        </div>

      </div>

      {/* OPTIONAL ASPIRATIONAL TEMPLATES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkle className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-display font-black text-slate-850">Aspirational Blueprints (Optional Quick-Add)</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {ASPIRATIONAL_TEMPLATES.map((tpl) => {
            const hasGoal = goals.some(g => g.name.toLowerCase() === tpl.name.toLowerCase());
            return (
              <div 
                key={tpl.name}
                className={`p-4 bg-white border rounded-2xl flex flex-col justify-between text-left space-y-3 relative overflow-hidden group ${
                  hasGoal ? 'border-purple-200/50 bg-purple-50/10 opacity-70' : 'border-slate-150 hover:border-purple-300'
                }`}
              >
                <div>
                  <span className="text-[8px] font-mono font-black text-purple-600 block uppercase">{tpl.category}</span>
                  <h4 className="font-bold text-slate-800 text-xs mt-1 truncate">{tpl.name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed block mt-1 line-clamp-2" title={tpl.whyItMatters}>
                    "{tpl.whyItMatters}"
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500">
                    <span>Target:</span>
                    <span className="font-bold text-slate-800">{formatCurrency(tpl.targetAmount)}</span>
                  </div>
                  <button
                    onClick={() => handleEnableTemplate(tpl)}
                    disabled={hasGoal}
                    className={`w-full py-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                      hasGoal
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                    }`}
                  >
                    {hasGoal ? '✓ On Board' : 'Activate Quest'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Quest Modal overlay */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-slate-150 animate-slide-up">
            <h3 className="font-display font-black text-base text-slate-800 mb-4">Launch New Zone Quest</h3>
            
            <form onSubmit={handleAddGoal} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Quest Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Escape Fund 🌴, Safety Net 🛟"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Target Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Starting Balance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={current}
                  onChange={e => setCurrent(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Weekly Contribution ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={weekly}
                  onChange={e => setWeekly(e.target.value)}
                  placeholder="25"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Unlocks Milestone ("Why it matters")</label>
                <input
                  type="text"
                  value={why}
                  onChange={e => setWhy(e.target.value)}
                  placeholder="e.g. Escape to Bahamas for summer vacation"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="py-2 px-4 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-md"
                >
                  Confirm Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust cash modal */}
      {adjustingGoalName && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative border border-slate-150 animate-slide-up">
            <h3 className="font-display font-black text-sm text-slate-800 mb-2">Adjust Quest Balance</h3>
            <p className="text-[11px] text-slate-400 mb-4">Goal: <b>{adjustingGoalName}</b></p>
            
            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200/40">
                <button
                  type="button"
                  onClick={() => setIsContribution(true)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    isContribution ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setIsContribution(false)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    !isContribution ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  Withdraw
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Adjustment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjustmentAmount}
                  onChange={e => setAdjustmentAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustingGoalName(null)}
                  className="py-2 px-4 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-bold shadow-md cursor-pointer"
                >
                  Apply Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid of Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map(g => {
          const percent = Math.round(Math.min((g.currentAmount / g.targetAmount) * 100, 100));
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);
          const isCompleted = g.currentAmount >= g.targetAmount;
          
          const isVacation = g.name.toLowerCase().includes('vacation') || g.name.toLowerCase().includes('escape');
          const isChecklistOpen = activeChecklistGoal === g.name;

          return (
            <div 
              key={g.name} 
              className={`glass-panel rounded-3xl flex flex-col justify-between overflow-hidden relative ${
                isCompleted ? 'bg-emerald-500/5 border-emerald-200/60' : ''
              }`}
            >
              {/* Photo Banner */}
              <div 
                className="h-28 bg-cover bg-center relative flex items-end p-4" 
                style={{ backgroundImage: `url(${getUnsplashPhoto(g.name)})` }}
              >
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 to-transparent" />
                <div className="relative z-10 w-full flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono font-black text-purple-200 bg-purple-900/40 py-0.5 px-2 rounded-full backdrop-blur-md border border-purple-300/20">
                      {g.category}
                    </span>
                    <h3 className="font-display font-black text-white text-base mt-1 flex items-center gap-1.5 leading-snug">
                      {g.name}
                    </h3>
                  </div>
                  <div className="text-right font-mono text-white leading-tight">
                    <span className="text-sm font-extrabold block">{formatCurrency(g.currentAmount)}</span>
                    <span className="text-[10px] text-slate-300">target: {formatCurrency(g.targetAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                
                {/* XP fill bar with milestone ticks */}
                <div className="space-y-1">
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative border border-slate-150/40">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-purple-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                    
                    {/* Visual Milestone ticks */}
                    <div className="absolute left-[25%] top-0 bottom-0 w-0.5 bg-white/40" title="25% Milestone" />
                    <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-white/45" title="50% Milestone" />
                    <div className="absolute left-[75%] top-0 bottom-0 w-0.5 bg-white/40" title="75% Milestone" />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 font-semibold">
                    <span>XP progress: {percent}%</span>
                    <span>{isCompleted ? 'QUEST MAXED 🎉' : `${formatCurrency(remaining)} remaining`}</span>
                  </div>
                </div>

                {/* Sub info */}
                <div className="space-y-2 text-xs">
                  
                  {/* Dynamic Milestone Badge displayed inline on the card */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-150/50">
                    <span className="text-[9px] uppercase font-mono font-bold text-slate-400">Quest Status:</span>
                    <span className={`text-[10px] font-bold py-0.5 px-2 rounded-full font-sans border ${
                      percent >= 100 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : percent >= 75
                          ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse'
                          : percent >= 50
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : percent >= 25
                              ? 'bg-purple-50 border-purple-200 text-purple-700'
                              : 'bg-slate-50 border-slate-150 text-slate-500'
                    }`}>
                      {percent >= 100 
                        ? '🏆 fully funded' 
                        : percent >= 75 
                          ? '🚀 almost complete (75%+)' 
                          : percent >= 50 
                            ? '⚡ halfway champion (50%+)' 
                            : percent >= 25 
                              ? '🌱 quarter way there (25%+)' 
                              : '🛡️ starting block'
                      }
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Weekly Transfer:</span>
                    <span className="font-bold text-slate-700">{formatCurrency(g.weeklyTransfer)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Monthly Contribution:</span>
                    <span className="font-bold text-slate-700">{formatCurrency(g.weeklyTransfer * 4.33)}</span>
                  </div>
                  
                  <div className="p-2.5 bg-slate-50/50 rounded-2xl text-[10px] text-slate-500 leading-normal border border-slate-100 flex items-start gap-1.5">
                    <Milestone className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <p><b>Unlock Goal:</b> "{g.whyItMatters}"</p>
                  </div>

                  {isVacation && (
                    <div className="p-2.5 bg-indigo-50/70 text-indigo-800 rounded-2xl text-[10px] leading-normal font-medium border border-indigo-100/40">
                      🌴 Auto-accumulation active. Surplus automatically flows back into escape funds on payday sync!
                    </div>
                  )}
                </div>

                {/* Checklist Dropdown Toggle */}
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => setActiveChecklistGoal(isChecklistOpen ? null : g.name)}
                    className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Quest Checklist ({ (checklists[g.name] || []).filter(i => i.done).length }/{ (checklists[g.name] || []).length })
                    </span>
                    <ChevronRight className={`w-4 h-4 transform transition-transform ${isChecklistOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {isChecklistOpen && (
                    <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/50 animate-slide-up">
                      {(checklists[g.name] || []).map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleToggleChecklist(g.name, item.id)}
                          className="w-full flex items-start gap-2 text-left text-xs text-slate-600 font-medium hover:text-slate-950 transition-colors"
                        >
                          {item.done ? (
                            <CheckSquare className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-350 shrink-0 mt-0.5" />
                          )}
                          <span className={item.done ? 'line-through text-slate-400' : ''}>{item.text}</span>
                        </button>
                      ))}

                      {/* Add checklist item */}
                      <form 
                        onSubmit={(e) => handleAddChecklistItem(g.name, e)}
                        className="flex gap-1 pt-1.5 border-t border-slate-200/50"
                      >
                        <input
                          type="text"
                          required
                          value={newChecklistItem}
                          onChange={e => setNewChecklistItem(e.target.value)}
                          placeholder="Add task item..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-1 text-[11px] focus:outline-none focus:border-purple-500"
                        />
                        <button 
                          type="submit"
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2.5 rounded-xl cursor-pointer"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  )}
                </div>

              </div>

              {/* Action row footer */}
              <div className="bg-slate-50/55 p-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setAdjustingGoalName(g.name)}
                  className="text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 py-1.5 px-3.5 rounded-full font-bold transition-all cursor-pointer"
                >
                  Adjust Cash
                </button>
                <button
                  onClick={() => handleDeleteGoal(g.name)}
                  className="p-1.5 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
