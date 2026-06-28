import { useState, useEffect, useRef, MouseEvent as ReactMouseEvent, FormEvent } from 'react';
import { 
  Plus, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Coins, 
  CreditCard, 
  Target, 
  Calendar, 
  FileSpreadsheet, 
  RefreshCw, 
  Sparkles, 
  Star,
  Compass,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface SmartFABProps {
  accounts: any[];
  debts: any[];
  bills: any[];
  goals: any[];
  history: any[];
  budgetCategories: any[];
  onUpdateAccounts: (updated: any[]) => void;
  onUpdateDebts: (updated: any[]) => void;
  onUpdateBills: (updated: any[]) => void;
  onUpdateGoals: (updated: any[]) => void;
  onUpdateHistory: (updated: any[]) => void;
  onSelectTab: (tabId: string) => void;
}

interface FABAction {
  id: string;
  label: string;
  desc: string;
  icon: any;
  color: string;
  bg: string;
}

export default function SmartFAB({
  accounts,
  debts,
  bills,
  goals,
  history,
  budgetCategories,
  onUpdateAccounts,
  onUpdateDebts,
  onUpdateBills,
  onUpdateGoals,
  onUpdateHistory,
  onSelectTab
}: SmartFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShrunk, setIsShrunk] = useState(false);
  const [starredActions, setStarredActions] = useState<string[]>([]);
  const [activeForm, setActiveForm] = useState<string | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [accountFrom, setAccountFrom] = useState('');
  const [accountTo, setAccountTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Target item selected for specific forms (e.g. paying debt)
  const [targetId, setTargetId] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  // Actions list
  const actions: FABAction[] = [
    { id: 'income', label: 'Add Income', desc: 'Log an incoming paycheck/cash infusion', icon: ArrowUpRight, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'expense', label: 'Add Expense', desc: 'Record standard daily debit/cash hit', icon: ArrowDownLeft, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'move', label: 'Move Money', desc: 'Transfer balances between accounts', icon: Coins, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'debt', label: 'Pay Debt', desc: 'Log payment toward liability balances', icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'goal', label: 'Add Goal', desc: 'Establish new target savings objective', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'bill', label: 'Add Bill', desc: 'Register upcoming cycle bills/renewals', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'csv', label: 'Import Activity (CSV)', desc: 'Launch transactional CSV log wizard', icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'transfer_space', label: 'Space Rebalance', desc: 'Reallocate capital among Money Spaces', icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50' },
    { id: 'bank', label: 'Connect Bank', desc: 'Add new Plaid banking link', icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'simulate', label: 'Simulation Mode', desc: 'Load roadmap what-if simulator', icon: Compass, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  // Track scroll direction
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load favorites
  useEffect(() => {
    const saved = localStorage.getItem('finance_fab_starred_actions');
    if (saved) {
      setStarredActions(JSON.parse(saved));
    } else {
      // Default favourites
      const initialFavs = ['income', 'expense', 'move', 'debt'];
      setStarredActions(initialFavs);
      localStorage.setItem('finance_fab_starred_actions', JSON.stringify(initialFavs));
    }
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleStar = (id: string, e: ReactMouseEvent) => {
    e.stopPropagation();
    let nextStarred = [...starredActions];
    if (starredActions.includes(id)) {
      nextStarred = nextStarred.filter(x => x !== id);
    } else {
      nextStarred.push(id);
    }
    setStarredActions(nextStarred);
    localStorage.setItem('finance_fab_starred_actions', JSON.stringify(nextStarred));
  };

  // Sort actions: Starred first, then alphabetical/original
  const sortedActions = [...actions].sort((a, b) => {
    const aStarred = starredActions.includes(a.id);
    const bStarred = starredActions.includes(b.id);
    if (aStarred && !bStarred) return -1;
    if (!aStarred && bStarred) return 1;
    return 0;
  });

  // Handle trigger action
  const handleActionTrigger = (actionId: string) => {
    if (actionId === 'csv') {
      onSelectTab('history'); // Swaps to history tab (or we can launch wizard)
      setIsOpen(false);
      return;
    }
    if (actionId === 'bank') {
      onSelectTab('settings'); // Plaid Link setup
      setIsOpen(false);
      return;
    }
    if (actionId === 'simulate') {
      onSelectTab('roadmap'); // Runs what-if simulators
      setIsOpen(false);
      return;
    }

    // Initialize defaults for forms
    setAmount('');
    setName('');
    setCategory('');
    setNotes('');
    setTargetId('');
    if (accounts.length > 0) {
      setAccountFrom(accounts[0].name);
      setAccountTo(accounts[1]?.name || accounts[0].name);
    }
    
    // Open the form
    setActiveForm(actionId);
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    // Simulating physical feedback vibrate
    try {
      window.navigator.vibrate?.([15, 10]);
    } catch {}

    // Form logic routing
    if (activeForm === 'income' || activeForm === 'expense') {
      const isInc = activeForm === 'income';
      const historyItem = {
        date,
        item: name || (isInc ? 'Additional Income' : 'Direct Cash Outflow'),
        category: category || (isInc ? 'Income' : 'Discretionary'),
        amount: isInc ? -parsedAmount : parsedAmount, // History logs spent positive, income negative in spreadsheet structure
        accountPaidFrom: accountFrom,
        notes: notes || 'Logged via Smart FAB',
        isIncome: isInc,
        importSource: 'Manual' as const
      };

      // Add to transactional history log
      onUpdateHistory([historyItem, ...history]);

      // Deduct or deposit into matching account
      const nextAccs = accounts.map(a => {
        if (a.name === accountFrom) {
          return { ...a, balance: a.balance + (isInc ? parsedAmount : -parsedAmount) };
        }
        return a;
      });
      onUpdateAccounts(nextAccs);
      
      confetti({ particleCount: 50, spread: 40 });
    }

    else if (activeForm === 'move' || activeForm === 'transfer_space') {
      if (accountFrom === accountTo) {
        alert('Source and destination accounts must be distinct.');
        return;
      }
      // Deduct from A and Add to B
      const nextAccs = accounts.map(a => {
        if (a.name === accountFrom) {
          return { ...a, balance: a.balance - parsedAmount };
        }
        if (a.name === accountTo) {
          return { ...a, balance: a.balance + parsedAmount };
        }
        return a;
      });

      // Log movement in history
      const historyItem = {
        date,
        item: `Transfer: ${accountFrom} ➔ ${accountTo}`,
        category: 'Transfer',
        amount: parsedAmount,
        accountPaidFrom: accountFrom,
        notes: notes || 'Space rebalance transfer',
        importSource: 'Manual' as const
      };

      onUpdateAccounts(nextAccs);
      onUpdateHistory([historyItem, ...history]);
      confetti({ particleCount: 30, spread: 30 });
    }

    else if (activeForm === 'debt') {
      // Log payment toward target debt
      const debtItem = debts.find(d => d.name === targetId);
      if (!debtItem) return;

      const nextDebts = debts.map(d => {
        if (d.name === targetId) {
          const nextBal = Math.max(0, d.balance - parsedAmount);
          return { 
            ...d, 
            balance: nextBal,
            status: nextBal === 0 ? 'Paid' as const : d.status
          };
        }
        return d;
      });

      // Deduct from paying account
      const nextAccs = accounts.map(a => {
        if (a.name === accountFrom) {
          return { ...a, balance: a.balance - parsedAmount };
        }
        return a;
      });

      // Log history transaction
      const historyItem = {
        date,
        item: `Debt Payment: ${debtItem.name}`,
        category: 'Debt',
        amount: parsedAmount,
        accountPaidFrom: accountFrom,
        notes: notes || 'Paid off via Smart FAB',
        importSource: 'Manual' as const
      };

      onUpdateDebts(nextDebts);
      onUpdateAccounts(nextAccs);
      onUpdateHistory([historyItem, ...history]);
      confetti({ particleCount: 60, spread: 50 });
    }

    else if (activeForm === 'goal') {
      // Add a goal
      const newG = {
        name: name || 'New Savings Goal',
        category: category || 'Vacation',
        targetAmount: parsedAmount,
        currentAmount: 0,
        weeklyTransfer: 10,
        monthlyTransfer: 40,
        status: 'Active',
        whyItMatters: notes || 'Building stability',
        notes: 'Created via Smart FAB'
      };
      onUpdateGoals([newG, ...goals]);
      confetti({ particleCount: 40, spread: 40 });
    }

    else if (activeForm === 'bill') {
      // Add a bill
      const newB = {
        id: Math.random().toString(),
        dueDate: date,
        name: name || 'Subscription Renew',
        category: category || 'Utilities',
        amount: parsedAmount,
        accountPaidFrom: accountFrom,
        autopay: true,
        paid: false,
        paycheckUsed: 'First Paycheck',
        notes: notes || 'FAB Auto'
      };
      onUpdateBills([newB, ...bills]);
      confetti({ particleCount: 40, spread: 40 });
    }

    // Complete form close
    setActiveForm(null);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-40" id="smart-fab-wrapper">
      {/* FAB Main Button */}
      <motion.button
        id="smart-fab-main-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-750 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-900/10 cursor-pointer relative z-50 border border-indigo-500"
        whileTap={{ scale: 0.9 }}
        animate={{
          width: isShrunk && !isOpen ? '50px' : '56px',
          height: isShrunk && !isOpen ? '50px' : '56px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="plus-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating expanded shelf / Bottom sheet menu */}
      <AnimatePresence>
        {isOpen && (
          <div 
            ref={menuRef}
            className="absolute bottom-16 right-0 w-[320px] max-w-[90vw] bg-white rounded-3xl border border-slate-200 p-4 shadow-2xl space-y-3 z-40 animate-slide-up"
            id="smart-fab-menu"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">Action Nexus</span>
              <span className="text-[9px] text-indigo-500 font-sans font-bold">Customize by starring ★</span>
            </div>

            {/* Scrollable list of Actions */}
            <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1">
              {sortedActions.map((act) => {
                const ActIcon = act.icon;
                const isStarred = starredActions.includes(act.id);
                return (
                  <button
                    key={act.id}
                    onClick={() => handleActionTrigger(act.id)}
                    className="w-full text-left p-2.5 rounded-2xl bg-slate-50/50 hover:bg-slate-100 border border-slate-150/40 flex items-center justify-between group transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${act.bg} ${act.color} border border-slate-200/20`}>
                        <ActIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-xs text-slate-800 group-hover:text-slate-950">
                          {act.label}
                        </h4>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          {act.desc}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleStar(act.id, e)}
                      className="p-1 text-slate-300 hover:text-amber-500 transition-colors"
                    >
                      <Star className={`w-3.5 h-3.5 ${isStarred && 'fill-amber-400 text-amber-500'}`} />
                    </button>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Forms Overlay Card */}
      <AnimatePresence>
        {activeForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative"
            >
              <button 
                onClick={() => setActiveForm(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider font-bold">Smart Forms</span>
                  <h3 className="text-sm font-display font-bold text-slate-800">
                    {actions.find(a => a.id === activeForm)?.label}
                  </h3>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-3.5">
                  {/* AMOUNT FIELD (Almost universal) */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Amount ($)</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  {/* NAME FIELD (For goals, income/expense names, bills) */}
                  {(activeForm === 'income' || activeForm === 'expense' || activeForm === 'goal' || activeForm === 'bill') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Label / Title</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Chevron Gas, Weekly Paycheck"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-hidden"
                      />
                    </div>
                  )}

                  {/* CATEGORY FIELD */}
                  {(activeForm === 'income' || activeForm === 'expense' || activeForm === 'goal' || activeForm === 'bill') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Category</label>
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Utilities, Food, Vacation"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-hidden"
                      />
                    </div>
                  )}

                  {/* ACCOUNT FROM SELECT */}
                  {(activeForm === 'income' || activeForm === 'expense' || activeForm === 'move' || activeForm === 'transfer_space' || activeForm === 'debt' || activeForm === 'bill') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">
                        {activeForm === 'move' || activeForm === 'transfer_space' ? 'Transfer From' : 'Funding Account'}
                      </label>
                      <select
                        value={accountFrom}
                        onChange={(e) => setAccountFrom(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs focus:outline-hidden"
                      >
                        {accounts.map(a => (
                          <option key={a.name} value={a.name}>{a.name} (${a.balance.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ACCOUNT TO SELECT (For transfers) */}
                  {(activeForm === 'move' || activeForm === 'transfer_space') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Transfer To</label>
                      <select
                        value={accountTo}
                        onChange={(e) => setAccountTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs focus:outline-hidden"
                      >
                        {accounts.map(a => (
                          <option key={a.name} value={a.name}>{a.name} (${a.balance.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* TARGET DEBT SELECT */}
                  {activeForm === 'debt' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Target Debt</label>
                      <select
                        value={targetId}
                        required
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-2.5 text-xs focus:outline-hidden"
                      >
                        <option value="">-- Choose Liability --</option>
                        {debts.filter(d => d.status !== 'Paid').map(d => (
                          <option key={d.name} value={d.name}>{d.name} (Bal: ${d.balance.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* DATE FIELD */}
                  {(activeForm === 'income' || activeForm === 'expense' || activeForm === 'bill') && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-hidden"
                      />
                    </div>
                  )}

                  {/* NOTES / EXPLANATION */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Budget adjustment notes..."
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-hidden resize-none"
                    />
                  </div>

                  {/* Action button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer"
                  >
                    Confirm Logging Checkpoint
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
