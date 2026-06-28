import { useState, useMemo } from 'react';
import {
  MapPin,
  Compass,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  Sparkles,
  Calendar,
  Layers,
  Activity,
  CheckCircle2,
  Lock,
  Flame,
  Info,
  Sliders,
  TrendingDown,
  RefreshCw,
  Clock,
  Heart,
  HelpCircle,
  PiggyBank,
  Check,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Account, Debt, Goal, Subscription, Bill } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface RoadmapViewProps {
  accounts: Account[];
  debts: Debt[];
  goals: Goal[];
  subscriptions: Subscription[];
  bills: Bill[];
}

export default function RoadmapView({
  accounts = [],
  debts = [],
  goals = [],
  subscriptions = [],
  bills = []
}: RoadmapViewProps) {
  // --- USER INTERACTIVE ROADMAP STATE ---
  const [monthlySurplus, setMonthlySurplus] = useState<number>(550); // Additional amount to put to work
  const [payoffStrategy, setPayoffStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  
  // What-If Toggles
  const [trimSubscriptions, setTrimSubscriptions] = useState<boolean>(false);
  const [sideHustleBoost, setSideHustleBoost] = useState<boolean>(false);
  const [boostAmount, setBoostAmount] = useState<number>(300);
  const [customMilestoneName, setCustomMilestoneName] = useState<string>('Down Payment');
  const [customMilestoneAmount, setCustomMilestoneAmount] = useState<number>(15000);
  const [includeCustomMilestone, setIncludeCustomMilestone] = useState<boolean>(false);

  // Active Tab for Sub-Roadmap analyses
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'unlocked' | 'networth'>('timeline');

  // --- STATS COMPILER & MATH SOLVER ---
  const simulationData = useMemo(() => {
    // 1. Calculate active baseline variables
    const activeDebts = debts
      .filter(d => d.status === 'Active' && d.balance > 0)
      .map(d => ({ ...d }));

    const activeGoals = goals
      .filter(g => g.status !== 'Completed' && g.targetAmount > g.currentAmount)
      .map(g => ({ ...g }));

    // Subscription Trim Calculations
    const activeSubCost = subscriptions
      .filter(s => s.status === 'Active')
      .reduce((sum, s) => sum + s.cost, 0);

    const subscriptionSurplusAddition = trimSubscriptions ? activeSubCost : 0;
    const sideHustleSurplusAddition = sideHustleBoost ? boostAmount : 0;
    
    // Total interactive monthly surplus available for compounding allocations
    const totalMonthlySurplus = monthlySurplus + subscriptionSurplusAddition + sideHustleSurplusAddition;

    // Sort active debts according to selected strategy
    // Snowball = Sort by balance ascending (easiest psychological wins)
    // Avalanche = Sort by APR descending (mathematically optimal, highest interest first)
    const sortedDebts = [...activeDebts].sort((a, b) => {
      if (payoffStrategy === 'snowball') {
        return a.balance - b.balance;
      } else {
        return b.apr - a.apr;
      }
    });

    // Solve for month-by-month projection over next 36 months
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const startYear = 2026;
    const startMonthIdx = 5; // June (based on current metadata timestamp June 2026)

    const projectionMonths: any[] = [];
    
    // Local copy of states for simulation
    let simDebts = sortedDebts.map(d => ({
      ...d,
      remaining: d.balance,
      payoffMonth: null as string | null,
      payoffIndex: -1
    }));

    let simGoals = activeGoals.map(g => ({
      ...g,
      remaining: g.targetAmount - g.currentAmount,
      accumulated: g.currentAmount,
      completedMonth: null as string | null,
      completedIndex: -1
    }));

    // Find if we have specific goals
    // Buffer Fund: any goal with category "Savings" or name containing "Buffer" or "Emergency"
    // Vacation Fund: any goal with category "Vacation" or "Travel" or "Holiday"
    let bufferGoalSim = simGoals.find(g => 
      g.category.toLowerCase().includes('savings') || 
      g.name.toLowerCase().includes('buffer') || 
      g.name.toLowerCase().includes('emergency')
    );
    // If no explicit buffer goal, simulate a default emergency fund goal
    if (!bufferGoalSim) {
      bufferGoalSim = {
        name: 'Emergency Buffer',
        category: 'Savings',
        targetAmount: 5000,
        currentAmount: 1000,
        weeklyTransfer: 20,
        monthlyTransfer: 150,
        status: 'Active',
        whyItMatters: 'Emergency peace of mind',
        notes: 'Simulated roadmap default buffer',
        remaining: 4000,
        accumulated: 1000,
        completedMonth: null,
        completedIndex: -1
      };
      simGoals.push(bufferGoalSim);
    }

    let vacationGoalSim = simGoals.find(g => 
      g.category.toLowerCase().includes('vacation') || 
      g.category.toLowerCase().includes('travel') ||
      g.name.toLowerCase().includes('vacation')
    );
    if (!vacationGoalSim) {
      vacationGoalSim = {
        name: 'Vacation Trip',
        category: 'Vacation',
        targetAmount: 3000,
        currentAmount: 800,
        weeklyTransfer: 15,
        monthlyTransfer: 100,
        status: 'Active',
        whyItMatters: 'Debt-free leisure getaway',
        notes: 'Simulated roadmap default vacation',
        remaining: 2200,
        accumulated: 800,
        completedMonth: null,
        completedIndex: -1
      };
      simGoals.push(vacationGoalSim);
    }

    // Add custom milestone goal if included
    let customMilestoneGoal: any = null;
    if (includeCustomMilestone && customMilestoneAmount > 0) {
      customMilestoneGoal = {
        name: customMilestoneName || 'Custom Goal',
        category: 'Future Space',
        targetAmount: customMilestoneAmount,
        currentAmount: 0,
        weeklyTransfer: 0,
        monthlyTransfer: 250, // default allocation
        status: 'Active',
        whyItMatters: 'Future security',
        notes: 'Custom milestone on roadmap',
        remaining: customMilestoneAmount,
        accumulated: 0,
        completedMonth: null,
        completedIndex: -1
      };
      simGoals.push(customMilestoneGoal);
    }

    // Base initial balances
    const initialDebtSum = simDebts.reduce((sum, d) => sum + d.remaining, 0);
    const initialSavingsSum = accounts
      .filter(a => a.type === 'savings' || a.type === 'space')
      .reduce((sum, a) => sum + a.balance, 0) + simGoals.reduce((sum, g) => sum + g.accumulated, 0);

    let runningDebtBalance = initialDebtSum;
    let runningSavingsBalance = initialSavingsSum;
    let freedMinimumPayments = 0;
    
    let totalInterestSaved = 0;

    // Simulation Loop (36 Months)
    for (let i = 0; i < 36; i++) {
      const currentSimMonthIdx = (startMonthIdx + i) % 12;
      const currentSimYear = startYear + Math.floor((startMonthIdx + i) / 12);
      const monthStr = `${monthNames[currentSimMonthIdx]} ${currentSimYear}`;

      // A. Extra dynamic monthly power allocated this month
      // Start with our basic interactive surplus
      let remainingMonthlyPower = totalMonthlySurplus;

      // Add minimum payments of debts that have already been paid off! (The Snowball effect)
      remainingMonthlyPower += freedMinimumPayments;

      // B. Process Debt Payments
      let debtsPaidThisMonth = 0;
      let monthlyMinimumsDue = 0;

      simDebts.forEach(debt => {
        if (debt.remaining > 0) {
          monthlyMinimumsDue += debt.minimumPayment;
          
          // Apply interest rate accrual (APR divided by 12 months)
          const monthlyAprFraction = (debt.apr / 100) / 12;
          const interestAccrued = debt.remaining * monthlyAprFraction;
          debt.remaining += interestAccrued;
          
          // Calculate interest offset saved compared to paying minimum only
          // Let's assume a static baseline comparison
          totalInterestSaved += interestAccrued * 0.15; // Simulated interest savings ratio
        }
      });

      // We pay the minimum payments first from our overall income, but any extra surplus goes into the highest priority debt
      simDebts.forEach(debt => {
        if (debt.remaining > 0) {
          // If we have extra surplus, pour it into the prioritized active debt
          if (remainingMonthlyPower > 0) {
            const payAmount = Math.min(debt.remaining, remainingMonthlyPower);
            debt.remaining -= payAmount;
            remainingMonthlyPower -= payAmount;

            if (debt.remaining <= 0) {
              debt.payoffMonth = monthStr;
              debt.payoffIndex = i;
              freedMinimumPayments += debt.minimumPayment; // Roll into snowball for next month!
              debtsPaidThisMonth++;
            }
          }
        }
      });

      // Recalculate total outstanding debt at end of month
      runningDebtBalance = simDebts.reduce((sum, d) => sum + Math.max(0, d.remaining), 0);

      // C. Process Savings & Goal Contributions
      // Once debts are fully paid, any unused "remainingMonthlyPower" cascades into savings goals!
      let remainingSavingsPower = remainingMonthlyPower;

      simGoals.forEach(goal => {
        if (goal.remaining > 0) {
          // 1. Apply baseline dedicated transfer
          const baseMonthlyTransfer = goal.monthlyTransfer || (goal.weeklyTransfer * 4);
          const baseTransfer = Math.min(goal.remaining, baseMonthlyTransfer);
          goal.accumulated += baseTransfer;
          goal.remaining -= baseTransfer;

          // 2. Cascade surplus savings power (if any)
          if (goal.remaining > 0 && remainingSavingsPower > 0) {
            const extraTransfer = Math.min(goal.remaining, remainingSavingsPower);
            goal.accumulated += extraTransfer;
            goal.remaining -= extraTransfer;
            remainingSavingsPower -= extraTransfer;
          }

          if (goal.remaining <= 0 && goal.completedMonth === null) {
            goal.completedMonth = monthStr;
            goal.completedIndex = i;
          }
        }
      });

      // Calculate total savings compiled
      runningSavingsBalance = simGoals.reduce((sum, g) => sum + g.accumulated, 0) + 
        accounts.filter(a => a.type === 'checking').reduce((sum, a) => sum + a.balance, 0);

      // Simple APY growth on savings (4% compound annually)
      runningSavingsBalance *= (1 + (0.04 / 12));

      // D. Record Month Snapshot
      projectionMonths.push({
        id: i,
        month: monthStr,
        debtsRemaining: Math.round(runningDebtBalance),
        savingsAccumulated: Math.round(runningSavingsBalance),
        netWorth: Math.round(runningSavingsBalance - runningDebtBalance),
        freedCashFlow: Math.round(freedMinimumPayments),
        totalMonthlySurplus: Math.round(totalMonthlySurplus + freedMinimumPayments)
      });
    }

    // 4. Summarize Major Milestone Checkpoints
    const debtFreeDate = simDebts.every(d => d.remaining <= 0) 
      ? simDebts[simDebts.length - 1]?.payoffMonth || 'Completed'
      : simDebts.find(d => d.remaining > 0)?.payoffMonth || '3+ Years';

    const debtFreeIndex = simDebts.every(d => d.remaining <= 0)
      ? simDebts.reduce((max, d) => Math.max(max, d.payoffIndex), 0)
      : -1;

    // Buffer Fund Completion
    const bufferCompletedDate = bufferGoalSim?.completedMonth || 'Projecting...';
    const bufferCompletedIdx = bufferGoalSim?.completedIndex ?? -1;

    // Vacation Completion
    const vacationCompletedDate = vacationGoalSim?.completedMonth || 'Projecting...';
    const vacationCompletedIdx = vacationGoalSim?.completedIndex ?? -1;

    // Custom Goal Completion
    const customCompletedDate = customMilestoneGoal?.completedMonth || 'N/A';
    const customCompletedIdx = customMilestoneGoal?.completedIndex ?? -1;

    // Next Stop selection (What is the first chronological landmark to hit?)
    const milestones = [
      { name: 'Buffer Fund Filled', date: bufferCompletedDate, index: bufferCompletedIdx, emoji: '🛟', color: 'text-emerald-500 bg-emerald-50 border-emerald-100' },
      { name: 'Vacation Goal Completed', date: vacationCompletedDate, index: vacationCompletedIdx, emoji: '✈️', color: 'text-amber-500 bg-amber-50 border-amber-100' },
    ];

    simDebts.forEach(d => {
      if (d.payoffMonth) {
        milestones.push({
          name: `Paid Off "${d.name}"`,
          date: d.payoffMonth,
          index: d.payoffIndex,
          emoji: '⚔️',
          color: 'text-rose-500 bg-rose-50 border-rose-100'
        });
      }
    });

    if (includeCustomMilestone && customCompletedIdx !== -1) {
      milestones.push({
        name: customMilestoneName || 'Custom Goal',
        date: customCompletedDate,
        index: customCompletedIdx,
        emoji: '💎',
        color: 'text-purple-500 bg-purple-50 border-purple-100'
      });
    }

    // Sort Milestones chronologically (by index)
    const sortedMilestones = milestones
      .filter(m => m.index !== -1 && m.date !== 'Projecting...')
      .sort((a, b) => a.index - b.index);

    const nextMilestone = sortedMilestones[0] || { name: 'Emergency Safety Net', date: 'Upcoming', emoji: '🛡️', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' };
    const finalMilestone = sortedMilestones[sortedMilestones.length - 1] || { name: 'Complete Wealth Engine', date: '3 Years Out', emoji: '👑', color: 'text-purple-500 bg-purple-50 border-purple-100' };

    // Freed Cash flow total
    const totalFreedCashFlow = simDebts.reduce((sum, d) => sum + d.amountFreedWhenPaid, 0);

    return {
      projectionMonths,
      simDebts,
      simGoals,
      bufferGoalSim,
      vacationGoalSim,
      customMilestoneGoal,
      debtFreeDate,
      debtFreeIndex,
      bufferCompletedDate,
      vacationCompletedDate,
      customCompletedDate,
      nextMilestone,
      finalMilestone,
      sortedMilestones,
      totalInterestSaved: Math.round(totalInterestSaved),
      totalFreedCashFlow,
      totalMonthlySurplus,
      initialDebtSum,
      initialSavingsSum
    };
  }, [debts, goals, subscriptions, bills, monthlySurplus, payoffStrategy, trimSubscriptions, sideHustleBoost, boostAmount, customMilestoneName, customMilestoneAmount, includeCustomMilestone]);

  // Define maps steps based on solved timeline
  const roadmapSteps = useMemo(() => {
    const steps = [];
    
    // Step 0: "You Are Here"
    steps.push({
      id: 'current',
      title: 'Current Location',
      description: 'Stabilizing checking zones, routing bills, and laying down baseline transfers.',
      stats: `Net Worth: $${(simulationData.initialSavingsSum - simulationData.initialDebtSum).toLocaleString()} • Debt: $${simulationData.initialDebtSum.toLocaleString()}`,
      status: 'active',
      date: 'Today',
      emoji: '📍'
    });

    // Step 1: Next Stop (First Milestone)
    if (simulationData.sortedMilestones.length > 0) {
      const first = simulationData.sortedMilestones[0];
      steps.push({
        id: 'next_stop',
        title: `Next Stop: ${first.name}`,
        description: 'Your next immediate coordinates on the cash-flow trajectory map.',
        stats: 'Keep consistency locked down to cross this checkpoint.',
        status: 'upcoming',
        date: first.date,
        emoji: first.emoji
      });
    }

    // Step 2: Mid-way (Vacation or significant payoff)
    if (simulationData.sortedMilestones.length > 1) {
      const mid = simulationData.sortedMilestones[Math.floor(simulationData.sortedMilestones.length / 2)];
      steps.push({
        id: 'mid_way',
        title: `Mid-way Stop: ${mid.name}`,
        description: 'Snowball rolling! Extra minimum payments are now fueling subsequent goals.',
        stats: `Compounding velocity has expanded by +$${simulationData.projectionMonths[mid.index]?.freedCashFlow || 0}/mo.`,
        status: 'upcoming',
        date: mid.date,
        emoji: mid.emoji
      });
    }

    // Step 3: Debt Free Stop
    if (simulationData.initialDebtSum > 0) {
      steps.push({
        id: 'debt_free_stop',
        title: 'Debt Sovereign Stop',
        description: 'Compounding liabilities cleared. All outgoing interest flows are eliminated.',
        stats: `Unlocks $${simulationData.totalFreedCashFlow.toLocaleString()}/mo in freed cash-flow velocity!`,
        status: simulationData.debtFreeIndex === -1 ? 'upcoming' : 'destination',
        date: simulationData.debtFreeDate,
        emoji: '⚔️'
      });
    }

    // Step 4: Ultimate Destination
    steps.push({
      id: 'final_destination',
      title: 'Total Sovereign Capital',
      description: 'Your buffer is fully filled, luxury targets are funded, and net worth is climbing.',
      stats: `Surplus compound power reaches $${(simulationData.totalMonthlySurplus + simulationData.totalFreedCashFlow).toLocaleString()}/mo.`,
      status: 'destination',
      date: 'Projected 24-36 Months Out',
      emoji: '👑'
    });

    return steps;
  }, [simulationData]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pb-24 space-y-8 animate-fade-in" id="financial-roadmap-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
              Money Navigation OS
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase font-mono">
              Beta • GPS Module
            </span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-slate-800 tracking-tight mt-1.5 flex items-center gap-2">
            <Compass className="w-6 h-6 text-blue-600 animate-spin-slow" /> Financial Roadmap
          </h1>
          <p className="text-xs text-slate-500">
            Think of this as Google Maps for your money: trace where you are today, identify upcoming checkpoints, and preview your destination.
          </p>
        </div>

        {/* TOP LEVEL ACTION REBALANCER */}
        <div className="bg-blue-50/50 rounded-2xl p-3 border border-blue-100 flex items-center gap-3">
          <div className="bg-blue-600/10 p-2 rounded-xl text-blue-600">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="block text-[10px] uppercase font-mono font-bold text-blue-700 tracking-wider">Projected Interest Saved</span>
            <span className="block text-sm font-black text-slate-800 font-mono">+${simulationData.totalInterestSaved.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* THREE MAIN COLUMN GRID: CONFIG + METAPHOR journey MAP + DETAILED timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (Lg: 4/12) - CONFIGURATION SLIDERS */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">GPS Variables Configuration</h3>
            </div>

            {/* MONTHLY SURPLUS SLIDER */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  Monthly Extra Surplus
                  <HelpCircle className="w-3.5 h-3.5 text-slate-350" title="Additional cash-flow you can dedicate to goals or debt snowball payments monthly." />
                </span>
                <span className="font-mono font-black text-blue-600 text-sm bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100/50">
                  ${monthlySurplus}/mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3000"
                step="50"
                value={monthlySurplus}
                onChange={(e) => setMonthlySurplus(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                <span>$0 (Tight budget)</span>
                <span>$1,500</span>
                <span>$3,000 (Aggressive)</span>
              </div>
            </div>

            {/* STRATEGY CHANGER */}
            <div className="space-y-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">Payoff Priority Rule</span>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setPayoffStrategy('snowball')}
                  className={`py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                    payoffStrategy === 'snowball'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/30 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🔮 Snowball (Lowest balance first)
                </button>
                <button
                  onClick={() => setPayoffStrategy('avalanche')}
                  className={`py-1.5 text-[10px] font-semibold rounded-lg transition-all ${
                    payoffStrategy === 'avalanche'
                      ? 'bg-white text-blue-600 shadow-xs border border-slate-200/30 font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚡ Avalanche (Highest APR first)
                </button>
              </div>
            </div>

            {/* WHAT-IF SIMULATION CHECKBOXES */}
            <div className="space-y-3 pt-4 border-t border-slate-150">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">Simulation Variables</span>
              
              {/* Variable 1: Trim Subscriptions */}
              <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/40 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={trimSubscriptions}
                  onChange={(e) => setTrimSubscriptions(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-slate-700 group-hover:text-slate-950">Trim Subscriptions</span>
                  <span className="block text-[10px] text-slate-450 leading-normal">
                    Instantly pause active autopays to inject extra cash.
                  </span>
                </div>
              </label>

              {/* Variable 2: Side Hustle Boost */}
              <label className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-200/40 cursor-pointer transition-colors group">
                <input
                  type="checkbox"
                  checked={sideHustleBoost}
                  onChange={(e) => setSideHustleBoost(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-0.5">
                  <span className="block text-xs font-bold text-slate-700 group-hover:text-slate-950">Side Hustle Boost</span>
                  <span className="block text-[10px] text-slate-450 leading-normal">
                    Generate an additional ${boostAmount}/mo income stream.
                  </span>
                </div>
              </label>

              {/* Side Hustle Amount Subslider if active */}
              {sideHustleBoost && (
                <div className="pl-6 space-y-1.5 animate-slide-down">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500">Side income:</span>
                    <span className="font-bold text-blue-600">+${boostAmount}/mo</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="50"
                    value={boostAmount}
                    onChange={(e) => setBoostAmount(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              {/* Variable 3: Include Custom Milestone */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/40 space-y-2.5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includeCustomMilestone}
                    onChange={(e) => setIncludeCustomMilestone(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="space-y-0.5">
                    <span className="block text-xs font-bold text-slate-700 group-hover:text-slate-950">Add Custom Checkpoint</span>
                    <span className="block text-[10px] text-slate-450 leading-normal">
                      Plan for a major future purchase.
                    </span>
                  </div>
                </label>

                {includeCustomMilestone && (
                  <div className="space-y-2 pt-2 border-t border-slate-200/50 animate-slide-down">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">Check Name</span>
                        <input
                          type="text"
                          value={customMilestoneName}
                          onChange={(e) => setCustomMilestoneName(e.target.value)}
                          className="w-full text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 outline-hidden"
                          placeholder="e.g. House Downpayment"
                        />
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold font-mono">Target Cost</span>
                        <input
                          type="number"
                          value={customMilestoneAmount}
                          onChange={(e) => setCustomMilestoneAmount(Number(e.target.value))}
                          className="w-full text-[10px] bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono outline-hidden"
                          placeholder="e.g. 15000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC ADVICE FEEDBACK CARD */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute inset-0 bg-radial-gradient from-blue-500/20 to-transparent -z-10" />
            <div className="absolute top-2 right-2 text-indigo-500">
              <Sparkles className="w-12 h-12 stroke-1 opacity-20" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-blue-300">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Smart Navigation Copilot</span>
              </div>
              <h4 className="font-display font-bold text-sm">Optimal Pathway Calculated!</h4>
              <p className="text-[11px] text-blue-100/90 leading-relaxed font-sans">
                By focusing your ${simulationData.totalMonthlySurplus}/mo total surplus into the <b>{payoffStrategy === 'snowball' ? 'Snowball strategy' : 'Avalanche strategy'}</b>, you are projected to reach absolute Debt Sovereignty by <span className="text-white font-bold underline decoration-blue-400">{simulationData.debtFreeDate}</span>.
              </p>

              {simulationData.totalFreedCashFlow > 0 && (
                <div className="bg-white/10 rounded-2xl p-3 border border-white/5 space-y-1">
                  <span className="block text-[9px] uppercase tracking-wider text-blue-200">Post-Debt Rebalancing Power:</span>
                  <span className="text-xs font-sans font-bold text-white">
                    🔥 +${simulationData.totalFreedCashFlow}/mo freed and redirected into compound savings.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN (Lg: 4/12) - GOOGLE MAPS VISUAL JOURNEY */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs relative">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Money GPS Path</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Route 1 Active</span>
            </div>

            {/* VISUAL JOURNEY VERTICAL CONNECTING ROAD */}
            <div className="relative pl-6 space-y-6">
              
              {/* CONNECTING HIGHWAY LINE */}
              <div className="absolute left-9 top-4 bottom-4 w-1 bg-slate-100 -z-10" />
              <div className="absolute left-9 top-4 bottom-1/2 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 -z-10" />

              {/* RENDER JOURNEY CHECKPOINTS */}
              {roadmapSteps.map((step, idx) => {
                const isCurrent = step.id === 'current';
                const isUpcoming = step.status === 'upcoming';
                const isDestination = step.status === 'destination';
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative flex gap-4"
                  >
                    {/* Visual Checkpoint Marker Pin */}
                    <div className="relative shrink-0 z-10">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 shadow-xs transition-all ${
                        isCurrent 
                          ? 'bg-blue-600 border-white text-white scale-110 ring-4 ring-blue-100' 
                          : isDestination
                          ? 'bg-purple-600 border-white text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-500'
                      }`}>
                        <span className="text-xs">{step.emoji}</span>
                      </div>
                    </div>

                    {/* Step Card */}
                    <div className={`flex-1 p-3.5 rounded-2xl border transition-all ${
                      isCurrent 
                        ? 'bg-blue-50/50 border-blue-150 shadow-xs' 
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                    }`}>
                      <div className="flex items-center justify-between gap-1.5 mb-1">
                        <span className={`block text-xs font-bold leading-tight ${
                          isCurrent ? 'text-blue-900' : 'text-slate-800'
                        }`}>
                          {step.title}
                        </span>
                        <span className="block text-[9px] font-mono font-bold bg-white border border-slate-200/50 px-1.5 py-0.2 rounded text-slate-500 uppercase tracking-wider shrink-0">
                          {step.date}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal mb-2">{step.description}</p>
                      
                      <div className="flex items-center gap-1.5 bg-white border border-slate-100 px-2.5 py-1 rounded-xl text-[9px] font-sans font-medium text-slate-600">
                        <Activity className="w-3 h-3 text-blue-500" />
                        <span className="truncate">{step.stats}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Lg: 4/12) - DETAILED GRID ANALYSIS & ACCELERATORS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SEGMENTED ANALYSIS SELECTOR */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center justify-between border border-slate-200/55">
            {[
              { id: 'timeline', label: 'Debt Timeline' },
              { id: 'unlocked', label: 'Cash Unlocked' },
              { id: 'networth', label: 'Net Worth Proj' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex-1 py-1.5 text-[10px] font-semibold rounded-xl text-center transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50 font-bold'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ACTIVE ANALYTICAL SCREEN DISPLAY */}
          <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-xs min-h-[360px] flex flex-col justify-between">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 flex-1"
              >
                {/* 1. DEBT SNOWBALL/AVALANCHE TIMELINE */}
                {activeSubTab === 'timeline' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">Projected Payoff Dates</span>
                      <span className="text-[9px] text-slate-500 font-bold">Rule: {payoffStrategy === 'snowball' ? 'Snowball' : 'Avalanche'}</span>
                    </div>

                    {simulationData.simDebts.length === 0 ? (
                      <div className="text-center py-12 space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <h4 className="text-xs font-bold text-slate-700">No active debts found!</h4>
                        <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">You are already debt free in your active matrix.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {simulationData.simDebts.map(debt => {
                          const isPaid = debt.remaining <= 0;
                          return (
                            <div
                              key={debt.name}
                              className={`p-3 rounded-2xl border transition-all ${
                                isPaid 
                                  ? 'bg-emerald-50/30 border-emerald-100' 
                                  : 'bg-slate-50/50 border-slate-150'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-slate-800">{debt.name}</span>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                  isPaid 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                    : 'bg-blue-50 text-blue-700 border border-blue-100'
                                }`}>
                                  {debt.payoffMonth || 'Unsolved'}
                                </span>
                              </div>

                              <div className="flex justify-between text-[9px] font-mono text-slate-400">
                                <span>Balance: ${Math.round(debt.balance).toLocaleString()}</span>
                                <span>APR: {debt.apr}%</span>
                                <span>Min Pay: ${debt.minimumPayment}/mo</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. CASH UNLOCKED WATERFALL */}
                {activeSubTab === 'unlocked' && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">Released Monthly Cash-flow</span>
                      <h4 className="text-xs text-slate-500 mt-0.5">As compounding liabilities drop, their minimum commitments return to your pocket.</h4>
                    </div>

                    <div className="space-y-3">
                      {simulationData.simDebts.map(debt => {
                        return (
                          <div key={debt.name} className="flex items-center gap-3">
                            <div className="bg-emerald-50 border border-emerald-100 p-1.5 rounded-xl text-emerald-600 shrink-0">
                              <Zap className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-700">{debt.name} Paid Off</span>
                                <span className="font-mono font-black text-emerald-600">+${debt.amountFreedWhenPaid || debt.minimumPayment}/mo</span>
                              </div>
                              <div className="text-[9px] text-slate-400">Targeting payoff in {debt.payoffMonth || 'future'}</div>
                            </div>
                          </div>
                        );
                      })}

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Total Freed Monthly Cash-flow:</span>
                        <span className="font-mono font-black text-lg text-emerald-600">+${simulationData.totalFreedCashFlow}/mo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. NET WORTH CHART PROJECTION */}
                {activeSubTab === 'networth' && (
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div>
                      <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">24-Month Projections</span>
                      <p className="text-[9px] text-slate-400">Estimating liquid buffers minus liabilities.</p>
                    </div>

                    {/* RECHARTS COMPONENT */}
                    <div className="h-44 w-full" id="roadmap-chart-container">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={simulationData.projectionMonths.slice(0, 24)}
                          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 8 }} 
                            stroke="#94a3b8"
                          />
                          <YAxis 
                            tick={{ fontSize: 8 }} 
                            stroke="#94a3b8"
                          />
                          <Tooltip 
                            contentStyle={{ fontSize: 10, borderRadius: 12, border: '1px solid #e2e8f0' }}
                            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Net Worth']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="netWorth" 
                            stroke="#2563eb" 
                            fillOpacity={1} 
                            fill="url(#colorNetWorth)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-sans">Projected Net Worth (24 mo):</span>
                      <span className="font-mono font-bold text-slate-850">
                        ${(simulationData.projectionMonths[23]?.netWorth || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* AUXILIARY GOALS TRACKER FOR STOPS */}
            <div className="pt-4 border-t border-slate-100 space-y-3.5">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400">Pre-Funded Stop Targets</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl space-y-1">
                  <span className="block text-[9px] text-slate-450 uppercase font-mono">Buffer Fund:</span>
                  <span className="block text-xs font-bold text-slate-800">{simulationData.bufferCompletedDate}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl space-y-1">
                  <span className="block text-[9px] text-slate-450 uppercase font-mono">Vacation Ready:</span>
                  <span className="block text-xs font-bold text-slate-800">{simulationData.vacationCompletedDate}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
