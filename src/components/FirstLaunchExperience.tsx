import React, { useState } from 'react';
import { 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  ArrowLeft,
  Download, 
  FileText, 
  CheckCircle, 
  Users, 
  Database, 
  Check, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  CreditCard,
  Target,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Bill, Goal, Account } from '../types';

interface FirstLaunchExperienceProps {
  onComplete: (config: {
    isDemoMode: boolean;
    useGoogleDrive: boolean;
    connectedBanks: string[];
    incomes: { item: string; amount: number; frequency: string; isIncome: boolean }[];
    bills: Partial<Bill>[];
    goals: Partial<Goal>[];
  }) => void;
  onSkip: () => void;
  onExploreDemo: () => void;
  onGoogleSignIn: () => Promise<boolean>;
  userEmail?: string | null;
  userPhoto?: string | null;
  userDisplayName?: string | null;
}

export default function FirstLaunchExperience({
  onComplete,
  onSkip,
  onExploreDemo,
  onGoogleSignIn,
  userEmail,
  userPhoto,
  userDisplayName
}: FirstLaunchExperienceProps) {
  const [step, setStep] = useState<'welcome' | 'setup_mode' | 'connect_sheets' | 'connect_bank' | 'add_income' | 'add_bills' | 'choose_goals' | 'finish'>('welcome');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [useGoogleDrive, setUseGoogleDrive] = useState(true);
  const [connectedBanks, setConnectedBanks] = useState<string[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Incomes setup
  const [incomes, setIncomes] = useState<{ item: string; amount: number; frequency: string; isIncome: boolean }[]>([
    { item: 'Bi-weekly Paycheck', amount: 2500, frequency: 'Bi-weekly', isIncome: true }
  ]);
  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newIncomeFreq, setNewIncomeFreq] = useState<'Weekly' | 'Bi-weekly' | 'Monthly'>('Bi-weekly');

  // Bills list (common defaults with toggle)
  const [selectedBills, setSelectedBills] = useState<{[key: string]: { selected: boolean; amount: number; category: string }}>({
    'Rent / Mortgage': { selected: true, amount: 1500, category: 'Housing' },
    'Electric & Gas': { selected: true, amount: 120, category: 'Utilities' },
    'Internet / Wifi': { selected: true, amount: 70, category: 'Utilities' },
    'Car Insurance': { selected: false, amount: 110, category: 'Transport' },
    'Gym Membership': { selected: false, amount: 50, category: 'Sub' },
    'Netflix & subs': { selected: false, amount: 15, category: 'Sub' }
  });

  // Goals list (toggled options)
  const [selectedGoals, setSelectedGoals] = useState<{[key: string]: { selected: boolean; targetAmount: number; whyItMatters: string; category: string }}>({
    'Emergency Fund': { selected: true, targetAmount: 10000, whyItMatters: 'Cover 3-6 months of unexpected living expenses', category: 'Savings' },
    'Debt-Free Journey': { selected: true, targetAmount: 5000, whyItMatters: 'Pay off high-interest balances and free up cash flow', category: 'Debt' },
    'Dream Vacation': { selected: false, targetAmount: 3000, whyItMatters: 'Recharge and explore without taking on debt', category: 'Leisure' },
    'Buffer Fund': { selected: false, targetAmount: 1500, whyItMatters: 'Avoid paycheck-to-paycheck cash-flow anxiety', category: 'Buffer' }
  });

  const handleGoogleSignInClick = async () => {
    try {
      setIsLoggingIn(true);
      const success = await onGoogleSignIn();
      if (success) {
        setStep('setup_mode');
      }
    } catch (err) {
      console.error(err);
      alert('Sign-In failed. Please try again or proceed with offline mode.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const toggleBank = (bankName: string) => {
    setConnectedBanks(prev => 
      prev.includes(bankName) ? prev.filter(b => b !== bankName) : [...prev, bankName]
    );
  };

  const handleAddIncome = () => {
    if (!newIncomeName || !newIncomeAmount) return;
    setIncomes(prev => [
      ...prev,
      { item: newIncomeName, amount: Number(newIncomeAmount), frequency: newIncomeFreq, isIncome: true }
    ]);
    setNewIncomeName('');
    setNewIncomeAmount('');
  };

  const removeIncome = (index: number) => {
    setIncomes(prev => prev.filter((_, i) => i !== index));
  };

  const toggleBillSelection = (billKey: string) => {
    setSelectedBills(prev => ({
      ...prev,
      [billKey]: { ...prev[billKey], selected: !prev[billKey].selected }
    }));
  };

  const updateBillAmount = (billKey: string, amount: string) => {
    setSelectedBills(prev => ({
      ...prev,
      [billKey]: { ...prev[billKey], amount: Number(amount) || 0 }
    }));
  };

  const toggleGoalSelection = (goalKey: string) => {
    setSelectedGoals(prev => ({
      ...prev,
      [goalKey]: { ...prev[goalKey], selected: !prev[goalKey].selected }
    }));
  };

  const updateGoalTarget = (goalKey: string, amount: string) => {
    setSelectedGoals(prev => ({
      ...prev,
      [goalKey]: { ...prev[goalKey], targetAmount: Number(amount) || 0 }
    }));
  };

  const triggerCompletion = () => {
    // Collect active bills
    const billsPayload: Partial<Bill>[] = (Object.entries(selectedBills) as [string, { selected: boolean; amount: number; category: string }][])
      .filter(([_, data]) => data.selected)
      .map(([name, data]) => ({
        id: Math.random().toString(36).substring(2, 9),
        name,
        amount: data.amount,
        category: data.category,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // in 14 days
        autopay: true,
        paid: false,
        accountPaidFrom: 'Chase Checking',
        notes: 'Configured during initial setup flow'
      }));

    // Collect active goals
    const goalsPayload: Partial<Goal>[] = (Object.entries(selectedGoals) as [string, { selected: boolean; targetAmount: number; whyItMatters: string; category: string }][])
      .filter(([_, data]) => data.selected)
      .map(([name, data]) => ({
        name,
        category: data.category,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        weeklyTransfer: 50,
        monthlyTransfer: 200,
        status: 'Active',
        whyItMatters: data.whyItMatters,
        notes: 'Primary setup objective'
      }));

    onComplete({
      isDemoMode,
      useGoogleDrive,
      connectedBanks,
      incomes,
      bills: billsPayload,
      goals: goalsPayload
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/80 backdrop-blur-lg px-4 py-8" id="first-launch-experience">
      <AnimatePresence mode="wait">
        
        {/* Step Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-3xl rounded-3xl p-6 md:p-10 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl relative overflow-hidden"
          >
            {/* Soft Ambient Lights */}
            <div className="absolute top-0 left-1/4 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Premium Apple-Wallet Centerpiece */}
            <div className="text-center space-y-4 mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white shadow-lg shadow-indigo-500/25 font-display font-black text-3xl mb-2">
                $
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-black text-white tracking-tight">
                Finance Command Center
              </h1>
              <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                Take control of your cash flow, optimize debt repayment, track savings sprints, and map your financial roadmap with single-click syncing.
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="max-w-md mx-auto space-y-4">
              <button
                onClick={handleGoogleSignInClick}
                disabled={isLoggingIn}
                className="w-full group flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/10 active:scale-[0.99] cursor-pointer"
                id="btn-continue-with-google"
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.96 5.96 0 0 1 8 12.557a5.96 5.96 0 0 1 5.991-5.957c1.554 0 2.96.536 4.062 1.417l3.073-3.073C19.24 3.226 16.74 2 13.991 2 8.164 2 3.428 6.736 3.428 12.557S8.164 23.114 13.991 23.114c5.829 0 10.012-4.1 10.012-10.183 0-.613-.055-1.164-.17-1.646H12.24Z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={onExploreDemo}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700/60"
                  id="btn-skip-to-demo"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Explore Demo
                </button>
                <button
                  onClick={onSkip}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700/60"
                  id="btn-skip-to-fresh"
                >
                  Skip for Now
                </button>
              </div>
            </div>

            <div className="text-center mt-10 border-t border-slate-800/80 pt-4">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1">
                <Database className="w-3 h-3 text-indigo-400" /> Fully Private local Sandbox included
              </span>
            </div>
          </motion.div>
        )}

        {/* Step 1: Choose Demo or Start Fresh */}
        {step === 'setup_mode' && (
          <motion.div
            key="setup_mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Step 1 of 6</span>
                  <h2 className="text-lg font-display font-bold text-white">Choose Setup Cockpit</h2>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Hi {userDisplayName || 'Chief'}! Let's choose your starting profile. You can start completely blank, or prefill with demo data and then replace it at your leisure.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    setIsDemoMode(true);
                    setStep('connect_sheets');
                  }}
                  className={`p-5 rounded-2xl border text-left space-y-3 transition-all duration-200 ${isDemoMode ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-850 hover:bg-slate-800'} cursor-pointer`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Explore Demo Data</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Pre-populates the app with simulated credit files, accounts, checking zones, and savings streak benchmarks.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsDemoMode(false);
                    setStep('connect_sheets');
                  }}
                  className={`p-5 rounded-2xl border text-left space-y-3 transition-all duration-200 ${!isDemoMode ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-850 hover:bg-slate-800'} cursor-pointer`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Start Fresh Ledger</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Start with a pristine, blank financial command center. Build up your custom accounts, goals, and recurring entries.
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('connect_sheets')}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Connect Google Sheets */}
        {step === 'connect_sheets' && (
          <motion.div
            key="connect_sheets"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Step 2 of 6</span>
                  <h2 className="text-lg font-display font-bold text-white">Google Sheets Sync</h2>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Connect your workspace to Google Drive. This creates a secure, dynamic workbook spreadsheet inside your personal Google Drive account to sync, backup, and store historical rows.
              </p>

              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-850 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Enable Google Sheets Backup
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      All additions or paid checkpoints will save directly to your Google Drive workbook.
                    </p>
                  </div>
                  <button
                    onClick={() => setUseGoogleDrive(!useGoogleDrive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useGoogleDrive ? 'bg-emerald-600' : 'bg-slate-700'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${useGoogleDrive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {useGoogleDrive && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Dynamic sheet authorized!</strong> A spreadsheet called <strong>“Personal Finance Command Center”</strong> will be located or initialized in your Drive once you finish setup.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('setup_mode')}
                  className="py-2 px-4 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep('connect_bank')}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Next: Bank accounts <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Connect Bank Account */}
        {step === 'connect_bank' && (
          <motion.div
            key="connect_bank"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Step 3 of 6</span>
                  <h2 className="text-lg font-display font-bold text-white">Bank Integrations</h2>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Link bank institutions or choose manual setup. Linked bank credentials import live ledger limits securely. (Select up to two mock institutions below to test).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {/* Chase card */}
                <button
                  onClick={() => toggleBank('Chase')}
                  className={`p-4 rounded-xl border text-left space-y-2 transition-colors ${connectedBanks.includes('Chase') ? 'border-blue-500 bg-blue-500/10' : 'border-slate-850 bg-slate-850 hover:bg-slate-800'} cursor-pointer`}
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    C
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Chase Bank</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Checking & Sapphire Card</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-semibold text-emerald-400">+150 XP</span>
                    {connectedBanks.includes('Chase') && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </button>

                {/* Capital One card */}
                <button
                  onClick={() => toggleBank('Capital One')}
                  className={`p-4 rounded-xl border text-left space-y-2 transition-colors ${connectedBanks.includes('Capital One') ? 'border-red-500 bg-red-500/10' : 'border-slate-850 bg-slate-850 hover:bg-slate-800'} cursor-pointer`}
                >
                  <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-xs">
                    C1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Capital One</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Venture Saving Spot</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-semibold text-emerald-400">+150 XP</span>
                    {connectedBanks.includes('Capital One') && <Check className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </button>

                {/* Manual ledger card */}
                <button
                  onClick={() => toggleBank('Manual')}
                  className={`p-4 rounded-xl border text-left space-y-2 transition-colors ${connectedBanks.includes('Manual') ? 'border-amber-500 bg-amber-500/10' : 'border-slate-850 bg-slate-850 hover:bg-slate-800'} cursor-pointer`}
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-750 text-slate-300 flex items-center justify-center font-mono text-xs">
                    M
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Manual Ledger</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Control every balance safely</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9px] font-semibold text-slate-400">Custom</span>
                    {connectedBanks.includes('Manual') && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('connect_sheets')}
                  className="py-2 px-4 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep('add_income')}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Next: Add Income <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Add Income */}
        {step === 'add_income' && (
          <motion.div
            key="add_income"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Step 4 of 6</span>
                  <h2 className="text-lg font-display font-bold text-white">Configure Incomes</h2>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Add your upcoming checkmarks. Incomes populate on your calendar with specialized green accenting and auto-calculate your dynamic monthly projections.
              </p>

              {/* Incomes list */}
              <div className="space-y-2">
                {incomes.map((inc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-850">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white">{inc.item}</span>
                        <span className="text-[10px] text-slate-400 ml-2">({inc.frequency})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-400 font-mono">${inc.amount}</span>
                      <button
                        onClick={() => removeIncome(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add form */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-850/50 flex flex-col sm:flex-row gap-2 items-end">
                <div className="w-full space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Income Type</label>
                  <input
                    type="text"
                    value={newIncomeName}
                    onChange={(e) => setNewIncomeName(e.target.value)}
                    placeholder="e.g. Side Hustle, Paycheck"
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="w-full sm:w-1/3 space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Amount ($)</label>
                  <input
                    type="number"
                    value={newIncomeAmount}
                    onChange={(e) => setNewIncomeAmount(e.target.value)}
                    placeholder="1200"
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="w-full sm:w-1/3 space-y-1">
                  <label className="text-[10px] font-mono text-slate-400">Frequency</label>
                  <select
                    value={newIncomeFreq}
                    onChange={(e: any) => setNewIncomeFreq(e.target.value)}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <button
                  onClick={handleAddIncome}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('connect_bank')}
                  className="py-2 px-4 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep('add_bills')}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Next: Add Bills <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Add Bills */}
        {step === 'add_bills' && (
          <motion.div
            key="add_bills"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Step 5 of 6</span>
                  <h2 className="text-lg font-display font-bold text-white">Upcoming Obligations</h2>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Check off recurring bills you pay each month. We'll set up automated tracking and add them to your calendar projections.
              </p>

              {/* Interactive Bills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                {(Object.entries(selectedBills) as [string, { selected: boolean; amount: number; category: string }][]).map(([billName, data]) => (
                  <div 
                    key={billName}
                    onClick={() => toggleBillSelection(billName)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${data.selected ? 'border-red-500/60 bg-red-500/5' : 'border-slate-800 bg-slate-850 hover:bg-slate-800'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1 rounded-md ${data.selected ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-white">{billName}</span>
                    </div>
                    {data.selected ? (
                      <input
                        type="number"
                        value={data.amount}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateBillAmount(billName, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 py-1 px-1.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-right text-red-400 focus:outline-none focus:border-red-500"
                      />
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">${data.amount}</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('add_income')}
                  className="py-2 px-4 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep('choose_goals')}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Next: Choose Goals <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 6: Choose Goals */}
        {step === 'choose_goals' && (
          <motion.div
            key="choose_goals"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">Step 6 of 6</span>
                  <h2 className="text-lg font-display font-bold text-white">Target Milestones</h2>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                What are you building towards? Establishing targets links your budget spaces to visual milestone projections.
              </p>

              {/* Goals Cards */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {(Object.entries(selectedGoals) as [string, { selected: boolean; targetAmount: number; whyItMatters: string; category: string }][]).map(([goalName, data]) => (
                  <div 
                    key={goalName}
                    onClick={() => toggleGoalSelection(goalName)}
                    className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${data.selected ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-slate-800 bg-slate-850 hover:bg-slate-800'}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-md ${data.selected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-white">{goalName}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 max-w-sm">{data.whyItMatters}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">Target:</span>
                      {data.selected ? (
                        <input
                          type="number"
                          value={data.targetAmount}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateGoalTarget(goalName, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-20 py-1 px-1.5 rounded bg-slate-800 border border-slate-700 text-xs font-mono text-right text-indigo-400 focus:outline-none focus:border-indigo-500"
                        />
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">${data.targetAmount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setStep('add_bills')}
                  className="py-2 px-4 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep('finish')}
                  className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  Next: Finish Setup <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 7: Finish Setup */}
        {step === 'finish' && (
          <motion.div
            key="finish"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-slate-800 bg-slate-900 text-slate-100 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="text-center space-y-4 mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 font-display font-extrabold text-2xl mb-2">
                ✓
              </div>
              <h2 className="text-2xl font-display font-black text-white tracking-tight">
                Command Cockpit Configured!
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Congratulations {userDisplayName || 'Chief'}! Your personal finance cockpit parameters have been locked in and saved.
              </p>
            </div>

            {/* Config summary card */}
            <div className="p-4 rounded-2xl border border-slate-800 bg-slate-850 space-y-3.5 mb-6 text-xs max-w-md mx-auto">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Onboarding Summary</h4>
              
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">Google Sync</div>
                    <div className="font-semibold text-slate-300">{useGoogleDrive ? 'Active' : 'Offline'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">Connected Banks</div>
                    <div className="font-semibold text-slate-300">{connectedBanks.length || 'Manual'} linked</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">Incomes Added</div>
                    <div className="font-semibold text-slate-300">{incomes.length} scheduled</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-[10px] text-slate-500">Bills Configured</div>
                    <div className="font-semibold text-slate-300">{(Object.values(selectedBills) as { selected: boolean }[]).filter(b => b.selected).length} monthly</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 max-w-xs mx-auto">
              <button
                onClick={() => setStep('choose_goals')}
                className="py-2.5 px-4 rounded-full text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Modify
              </button>
              <button
                onClick={triggerCompletion}
                className="w-full py-2.5 px-6 rounded-full text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 transition-all cursor-pointer shadow-lg shadow-white/5 text-center"
              >
                Launch Cockpit
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
