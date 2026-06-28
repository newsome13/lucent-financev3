import { useState, FormEvent, useMemo } from 'react';
import { Bill, Subscription, Debt, Goal, PaymentHistoryItem, PaycheckCovers, Account } from '../types';
import { 
  Plus, 
  Check, 
  Square, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Trash, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Briefcase, 
  Percent, 
  HelpCircle,
  PiggyBank,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Eye,
  Grid,
  List,
  Clock,
  Edit2,
  CalendarDays,
  Filter,
  CheckCircle2,
  ArrowRight,
  Sparkle,
  Zap,
  Info
} from 'lucide-react';

interface UpcomingViewProps {
  bills: Bill[];
  onUpdateBills: (updated: Bill[]) => void;
  accounts: Account[];
  subscriptions: Subscription[];
  onUpdateSubscriptions?: (updated: Subscription[]) => void;
  debts: Debt[];
  goals: Goal[];
  history: PaymentHistoryItem[];
  paycheckCovers: PaycheckCovers;
}

interface CalendarEvent {
  id: string;
  type: 'payday' | 'bill' | 'subscription' | 'debt' | 'goal' | 'income' | 'manual';
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: string;
  notes?: string;
  paid?: boolean;
  frequency?: string;
}

export default function UpcomingView({ 
  bills, 
  onUpdateBills, 
  accounts,
  subscriptions,
  debts,
  goals,
  history,
  paycheckCovers
}: UpcomingViewProps) {
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [formType, setFormType] = useState<'bill' | 'income'>('bill');
  
  // Active calendar navigation
  const [currentDate, setCurrentDate] = useState(() => {
    // Standard system date: 2026-06-27
    return new Date(2026, 5, 27); // June 2026 (0-indexed month)
  });

  // View style switcher state: calendar, agenda, timeline, week, month
  const [viewType, setViewType] = useState<'calendar' | 'agenda' | 'timeline' | 'week' | 'month'>('calendar');

  const selectedYear = currentDate.getFullYear();
  const selectedMonth = currentDate.getMonth(); // 0-11

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Selected calendar day detail state
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>('2026-06-27');

  // Form fields
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Bills');
  const [account, setAccount] = useState(accounts[0]?.name || 'Life Wallet 🧍');
  const [autopay, setAutopay] = useState(false);
  const [paycheck, setPaycheck] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly'>('Monthly');

  // Toggle paid status
  const togglePaid = (id: string) => {
    const updated = bills.map(b => {
      if (b.id === id) {
        return { ...b, paid: !b.paid };
      }
      return b;
    });
    onUpdateBills(updated);
  };

  // Add a new bill or scheduled income
  const handleAddBill = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !dueDate) return;

    const newBill: Bill = {
      id: `b-${Date.now()}`,
      name,
      amount: parseFloat(amount) || 0,
      dueDate,
      category: formType === 'income' ? 'Income' : category,
      accountPaidFrom: account,
      autopay: formType === 'income' ? false : autopay,
      paid: false,
      paycheckUsed: paycheck || 'Next Paycheck',
      notes,
      isIncome: formType === 'income',
      frequency: frequency
    };

    onUpdateBills([...bills, newBill]);
    setIsAdding(false);
    
    // Clear form
    setName('');
    setAmount('');
    setDueDate('');
    setNotes('');
  };

  // Delete bill or income
  const handleDeleteBill = (id: string) => {
    const confirmed = window.confirm('Are you sure you want to remove this item?');
    if (!confirmed) return;
    const updated = bills.filter(b => b.id !== id);
    onUpdateBills(updated);
  };

  // Edit recurring item state
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editFrequency, setEditFrequency] = useState<'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [editAutopay, setEditAutopay] = useState(false);
  const [editCategory, setEditCategory] = useState('Bills');

  const startEditing = (b: Bill) => {
    setEditingBillId(b.id);
    setEditName(b.name);
    setEditAmount(b.amount.toString());
    setEditFrequency(b.frequency || 'Monthly');
    setEditAutopay(b.autopay);
    setEditCategory(b.category);
  };

  const saveEdit = (id: string) => {
    const updated = bills.map(b => {
      if (b.id === id) {
        return {
          ...b,
          name: editName,
          amount: parseFloat(editAmount) || 0,
          frequency: editFrequency,
          autopay: editAutopay,
          category: editCategory
        };
      }
      return b;
    });
    onUpdateBills(updated);
    setEditingBillId(null);
  };

  // Heuristic biweekly payday generator starting from paycheckCovers.paycheckDate
  const projectedPaydays = useMemo(() => {
    const dates: string[] = [];
    if (!paycheckCovers.paycheckDate || paycheckCovers.paycheckAmount <= 0) return dates;

    const startPayday = new Date(paycheckCovers.paycheckDate);
    const currentProj = new Date(2026, 0, 1);
    
    const diffMs = startPayday.getTime() - currentProj.getTime();
    const biweekMs = 14 * 24 * 60 * 60 * 1000;
    const cycles = Math.floor(diffMs / biweekMs);
    const anchorDate = new Date(startPayday.getTime() - (cycles * biweekMs));

    let pointer = new Date(anchorDate);
    while (pointer.getFullYear() <= 2026) {
      const year = pointer.getFullYear();
      const month = String(pointer.getMonth() + 1).padStart(2, '0');
      const date = String(pointer.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${date}`);
      pointer.setDate(pointer.getDate() + 14);
    }

    return dates;
  }, [paycheckCovers.paycheckDate, paycheckCovers.paycheckAmount]);

  // Project and compile all cash flow events for the currently viewed month
  const monthEvents = useMemo<CalendarEvent[]>(() => {
    const events: CalendarEvent[] = [];

    // 1. Paydays from automatic projected list
    projectedPaydays.forEach((dStr, idx) => {
      const d = new Date(dStr);
      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        events.push({
          id: `payday-${idx}`,
          type: 'payday',
          name: 'Regular Paycheck Deposit 💼',
          amount: paycheckCovers.paycheckAmount,
          date: dStr,
          category: 'Income',
          frequency: 'Bi-weekly'
        });
      }
    });

    // 2. Bills and Incomes registered manually in "bills" array
    bills.forEach(b => {
      const bDate = new Date(b.dueDate);
      const isIncome = b.isIncome === true;

      if (bDate.getFullYear() === selectedYear && bDate.getMonth() === selectedMonth) {
        events.push({
          id: b.id,
          type: isIncome ? 'income' : 'bill',
          name: b.name + (isIncome ? ' 💰' : ''),
          amount: b.amount,
          date: b.dueDate,
          category: b.category,
          paid: b.paid,
          notes: b.notes,
          frequency: b.frequency || 'Monthly'
        });
      } else {
        // Project recurring bills if due month differs (matching day of month)
        const dayOfBill = bDate.getDate();
        const yearStr = selectedYear;
        const monthStr = String(selectedMonth + 1).padStart(2, '0');
        const dayStr = String(dayOfBill).padStart(2, '0');
        const projectedDateStr = `${yearStr}-${monthStr}-${dayStr}`;

        events.push({
          id: `proj-${b.id}`,
          type: isIncome ? 'income' : 'bill',
          name: isIncome ? `${b.name} (Projected) 💰` : `${b.name} (Projected)`,
          amount: b.amount,
          date: projectedDateStr,
          category: b.category,
          paid: false,
          notes: b.notes,
          frequency: b.frequency || 'Monthly'
        });
      }
    });

    // 3. Subscriptions
    subscriptions.forEach((s, idx) => {
      if (s.status !== 'Active') return;
      const sDate = new Date(s.nextRenewal);
      const dayOfRenewal = sDate.getDate();
      
      const yearStr = selectedYear;
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(dayOfRenewal).padStart(2, '0');
      const projectedDateStr = `${yearStr}-${monthStr}-${dayStr}`;

      events.push({
        id: `sub-${idx}-${s.name}`,
        type: 'subscription',
        name: `${s.name} Sub 🍿`,
        amount: s.cost,
        date: projectedDateStr,
        category: 'Subscriptions',
        frequency: s.frequency || 'Monthly'
      });
    });

    // 4. Debts (Active Minimums)
    debts.forEach((d, idx) => {
      if (d.status !== 'Active' || d.balance <= 0) return;
      const dDate = new Date(d.dueDate || '2026-06-15');
      const dayOfDebt = dDate.getDate() || 15;

      const yearStr = selectedYear;
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(dayOfDebt).padStart(2, '0');
      const projectedDateStr = `${yearStr}-${monthStr}-${dayStr}`;

      events.push({
        id: `debt-pay-${idx}-${d.name}`,
        type: 'debt',
        name: `${d.name} Min Payment 🛡️`,
        amount: d.minimumPayment,
        date: projectedDateStr,
        category: 'Debt Payoff',
        frequency: 'Monthly'
      });
    });

    // 5. Goal Contribution Dates (projected weekly on Fridays and monthly on the 1st)
    const totalDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const fridays: number[] = [];
    for (let day = 1; day <= totalDays; day++) {
      const tempDate = new Date(selectedYear, selectedMonth, day);
      if (tempDate.getDay() === 5) { // Friday
        fridays.push(day);
      }
    }

    goals.forEach((g, idx) => {
      if (g.status === 'Fully Funded') return;
      
      if (g.weeklyTransfer > 0) {
        fridays.forEach(fDay => {
          const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(fDay).padStart(2, '0')}`;
          events.push({
            id: `goal-weekly-${idx}-${g.name}-${fDay}`,
            type: 'goal',
            name: `${g.name} Auto Deposit 🎯`,
            amount: g.weeklyTransfer,
            date: dateStr,
            category: 'Savings',
            frequency: 'Weekly'
          });
        });
      } else if (g.monthlyTransfer > 0 || g.weeklyTransfer === 0) {
        const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
        events.push({
          id: `goal-monthly-${idx}-${g.name}`,
          type: 'goal',
          name: `${g.name} Monthly Transfer 🎯`,
          amount: g.monthlyTransfer || (g.weeklyTransfer * 4.33) || 50,
          date: dateStr,
          category: 'Savings',
          frequency: 'Monthly'
        });
      }
    });

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedYear, selectedMonth, projectedPaydays, bills, subscriptions, debts, goals]);

  // Calculations for Monthly Outlook Card based on active month events
  const monthlyOutlook = useMemo(() => {
    let income = 0;
    let billsSum = 0;
    let debtSum = 0;
    let subsSum = 0;
    let savingsSum = 0;

    monthEvents.forEach(e => {
      if (e.type === 'payday' || e.type === 'income') {
        income += e.amount;
      } else if (e.type === 'bill') {
        billsSum += e.amount;
      } else if (e.type === 'debt') {
        debtSum += e.amount;
      } else if (e.type === 'subscription') {
        subsSum += e.amount;
      } else if (e.type === 'goal') {
        savingsSum += e.amount;
      }
    });

    const leftover = income - billsSum - debtSum - subsSum - savingsSum;

    let confidence: 'Strong estimate' | 'Pretty close' | 'Needs more info' = 'Strong estimate';
    const prompts: string[] = [];

    if (paycheckCovers.paycheckAmount === 0 && bills.filter(b => b.isIncome).length === 0) {
      confidence = 'Needs more info';
      prompts.push('Add your payday or scheduled incomes so your monthly outlook is more accurate.');
    } else if (bills.filter(b => !b.isIncome).length === 0) {
      confidence = 'Pretty close';
      prompts.push('Add your recurring bills to get a tighter cash flow map.');
    } else if (subscriptions.length === 0) {
      confidence = 'Pretty close';
      prompts.push('Add your active subscriptions to prevent hidden money drain.');
    }

    return {
      income,
      bills: billsSum,
      debt: debtSum,
      subscriptions: subsSum,
      savings: savingsSum,
      leftover,
      confidence,
      prompts
    };
  }, [monthEvents, paycheckCovers.paycheckAmount, bills, subscriptions]);

  // Calendar Geometry Calculations
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();

    const dayCells: { dateStr: string | null; dayNumber: number | null }[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push({ dateStr: null, dayNumber: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(selectedMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${selectedYear}-${monthStr}-${dayStr}`;
      dayCells.push({ dateStr, dayNumber: day });
    }

    return dayCells;
  }, [selectedYear, selectedMonth]);

  const prevMonth = () => {
    setCurrentDate(prev => {
      let m = prev.getMonth() - 1;
      let y = prev.getFullYear();
      if (m < 0) {
        m = 11;
        y--;
      }
      return new Date(y, m, 1);
    });
  };

  const nextMonth = () => {
    setCurrentDate(prev => {
      let m = prev.getMonth() + 1;
      let y = prev.getFullYear();
      if (m > 11) {
        m = 0;
        y++;
      }
      return new Date(y, m, 1);
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  // Get active events for the selected calendar day
  const selectedDayEvents = selectedDayKey 
    ? monthEvents.filter(e => e.date === selectedDayKey)
    : [];

  // Filter bills list for the commitments section
  const [recurringFilter, setRecurringFilter] = useState<'All' | 'Bills' | 'Subscriptions' | 'Transfers' | 'Income'>('All');

  // Today Snapshot Calculations (Date is 2026-06-27)
  const todayDateStr = '2026-06-27';
  const todayEvents = useMemo(() => {
    return monthEvents.filter(e => e.date === todayDateStr);
  }, [monthEvents]);

  const todayIncome = todayEvents.filter(e => e.type === 'payday' || e.type === 'income');
  const todayBills = todayEvents.filter(e => e.type === 'bill');
  const todayTransfers = todayEvents.filter(e => e.type === 'goal' || e.type === 'debt');
  
  const todayAvailableMoney = useMemo(() => {
    const checkingAcc = accounts.find(a => 
      a.name.toLowerCase().includes('checking') || 
      a.name.toLowerCase().includes('wallet') || 
      a.name.toLowerCase().includes('life')
    );
    return checkingAcc ? checkingAcc.balance : 0;
  }, [accounts]);

  const todayReminders = useMemo(() => {
    const alerts: string[] = [];
    if (todayBills.length > 0) {
      alerts.push(`You have ${todayBills.length} bill${todayBills.length > 1 ? 's' : ''} due today!`);
    }
    if (todayIncome.length > 0) {
      alerts.push(`Payday alert! Scheduled deposits totaling ${formatCurrency(todayIncome.reduce((sum, i) => sum + i.amount, 0))} expected.`);
    }
    const lowBalAccounts = accounts.filter(a => a.balance < 150);
    if (lowBalAccounts.length > 0) {
      alerts.push(`Low balance warning: ${lowBalAccounts.map(a => a.name).join(', ')} is under $150.`);
    }
    return alerts;
  }, [todayBills, todayIncome, accounts]);

  // Compile all commitments in a single unified list
  const commitments = useMemo(() => {
    const list: {
      id: string;
      name: string;
      amount: number;
      dueDate: string;
      frequency: string;
      autopay: boolean;
      category: string;
      type: 'Bill' | 'Subscription' | 'Transfer' | 'Income';
      rawObj: any;
    }[] = [];

    // Add Bills (Non-income)
    bills.filter(b => !b.isIncome).forEach(b => {
      list.push({
        id: b.id,
        name: b.name,
        amount: b.amount,
        dueDate: `Day ${new Date(b.dueDate).getDate()}`,
        frequency: b.frequency || 'Monthly',
        autopay: b.autopay,
        category: b.category,
        type: 'Bill',
        rawObj: b
      });
    });

    // Add Subscriptions
    subscriptions.forEach((s, idx) => {
      list.push({
        id: `sub-commit-${idx}`,
        name: s.name,
        amount: s.cost,
        dueDate: `Day ${new Date(s.nextRenewal).getDate()}`,
        frequency: s.frequency || 'Monthly',
        autopay: true,
        category: s.category || 'Streaming',
        type: 'Subscription',
        rawObj: s
      });
    });

    // Add Transfers (Goals)
    goals.filter(g => g.weeklyTransfer > 0 || g.monthlyTransfer > 0).forEach((g, idx) => {
      list.push({
        id: `goal-commit-${idx}`,
        name: `${g.name} Auto Savings`,
        amount: g.weeklyTransfer > 0 ? g.weeklyTransfer : g.monthlyTransfer,
        dueDate: g.weeklyTransfer > 0 ? 'Every Friday' : '1st of Month',
        frequency: g.weeklyTransfer > 0 ? 'Weekly' : 'Monthly',
        autopay: true,
        category: 'Savings',
        type: 'Transfer',
        rawObj: g
      });
    });

    // Add Income
    bills.filter(b => b.isIncome).forEach(b => {
      list.push({
        id: b.id,
        name: b.name,
        amount: b.amount,
        dueDate: `Day ${new Date(b.dueDate).getDate()}`,
        frequency: b.frequency || 'Monthly',
        autopay: false,
        category: 'Salary',
        type: 'Income',
        rawObj: b
      });
    });

    // Add paycheck default if active
    if (paycheckCovers.paycheckAmount > 0) {
      list.push({
        id: 'default-payday-commit',
        name: 'Regular Salary Paycheck',
        amount: paycheckCovers.paycheckAmount,
        dueDate: paycheckCovers.paycheckDate ? `Every 2 Weeks from ${paycheckCovers.paycheckDate}` : 'Bi-weekly',
        frequency: 'Bi-weekly',
        autopay: false,
        category: 'Primary Income',
        type: 'Income',
        rawObj: paycheckCovers
      });
    }

    return list;
  }, [bills, subscriptions, goals, paycheckCovers]);

  // Commitments filtered list
  const filteredCommitments = useMemo(() => {
    if (recurringFilter === 'All') return commitments;
    return commitments.filter(c => c.type === recurringFilter);
  }, [commitments, recurringFilter]);

  // Month-at-a-glance agenda grouped by week
  const groupedWeeksEvents = useMemo(() => {
    const weeks: CalendarEvent[][] = [[], [], [], [], [], []];
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
    
    monthEvents.forEach(e => {
      const d = new Date(e.date);
      const dayOfMonth = d.getDate();
      const firstDayIndex = firstDayOfMonth.getDay();
      const weekIndex = Math.floor((dayOfMonth + firstDayIndex - 1) / 7);
      if (weeks[weekIndex]) {
        weeks[weekIndex].push(e);
      }
    });
    return weeks.filter(w => w.length > 0);
  }, [monthEvents, selectedYear, selectedMonth]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16 space-y-8 animate-fade-in" id="upcoming-tab-content">
      
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Monthly Money Map 📅</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            See what’s coming up so there are no surprises. Track upcoming paydays, bills, subscriptions, transfers, and estimated cash flow all in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setFormType('bill'); setIsAdding(true); }}
            className="flex items-center gap-1.5 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            id="add-bill-toggle-btn"
          >
            <Plus className="w-4 h-4" />
            Add Bill
          </button>
          
          <button
            onClick={() => { setFormType('income'); setIsAdding(true); }}
            className="flex items-center gap-1.5 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
            id="add-income-toggle-btn"
          >
            <Plus className="w-4 h-4" />
            Add Income
          </button>
        </div>
      </div>

      {/* 1. MONTHLY OUTLOOK CARD */}
      <div className="glass-panel rounded-3xl p-6 border-slate-200/65 bg-linear-to-b from-white to-slate-50/20 relative overflow-hidden">
        
        {/* Subtle decorative background glow */}
        <div className="absolute right-0 top-0 w-36 h-36 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-display font-black text-slate-800 text-base">Monthly Outlook</h3>
            <p className="text-xs text-slate-400">Heuristic projections computed for {monthNames[selectedMonth]} {selectedYear}.</p>
          </div>

          {/* Confidence Indicator Badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-black text-slate-400">Forecast Quality:</span>
            <span className={`text-[11px] font-mono font-extrabold py-1 px-3 rounded-full border ${
              monthlyOutlook.confidence === 'Strong estimate'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : monthlyOutlook.confidence === 'Pretty close'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              ● {monthlyOutlook.confidence}
            </span>
          </div>
        </div>

        {/* Totals Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4">
          
          <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-2xl relative">
            <div className="absolute top-2 right-2 p-1 bg-emerald-500/10 rounded-full text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">Inflows (Income)</span>
            <span className="font-mono font-black text-lg text-emerald-600 block mt-1">
              {formatCurrency(monthlyOutlook.income)}
            </span>
          </div>

          <div className="p-3.5 bg-rose-50/40 border border-rose-100 rounded-2xl relative">
            <div className="absolute top-2 right-2 p-1 bg-rose-500/10 rounded-full text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-slate-450 block uppercase tracking-wider">Outflows (Bills)</span>
            <span className="font-mono font-black text-lg text-rose-500 block mt-1">
              {formatCurrency(monthlyOutlook.bills)}
            </span>
          </div>

          <div className="p-3.5 bg-white border border-slate-150 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Debt Payments</span>
            <span className="font-mono font-black text-lg text-indigo-500 block mt-1">
              {formatCurrency(monthlyOutlook.debt)}
            </span>
          </div>

          <div className="p-3.5 bg-white border border-slate-150 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Subscriptions</span>
            <span className="font-mono font-black text-lg text-purple-500 block mt-1">
              {formatCurrency(monthlyOutlook.subscriptions)}
            </span>
          </div>

          <div className="p-3.5 bg-white border border-slate-150 rounded-2xl">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Savings Targets</span>
            <span className="font-mono font-black text-lg text-blue-500 block mt-1">
              {formatCurrency(monthlyOutlook.savings)}
            </span>
          </div>

          {/* IMPROVED ESTIMATED LEFTOVER VISIBILITY */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all shadow-md ${
            monthlyOutlook.leftover >= 0 
              ? 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-500/10' 
              : 'bg-rose-600 border-rose-700 text-white shadow-rose-500/10'
          }`}>
            <span className="text-[9px] font-black uppercase tracking-widest block opacity-85">Estimated Leftover</span>
            <span className="font-mono font-black text-xl lg:text-2xl block tracking-tight leading-none mt-1">
              {formatCurrency(monthlyOutlook.leftover)}
            </span>
            <span className="text-[9px] block opacity-75 mt-1 font-semibold leading-none">
              {monthlyOutlook.leftover >= 0 ? '✓ Secure Excess Cash' : '⚠️ Deficit Expected'}
            </span>
          </div>

        </div>

        {/* Helpful forecast advice warnings if data is thin */}
        {monthlyOutlook.prompts.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              Increase Estimate Reliability:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 pl-1.5">
              {monthlyOutlook.prompts.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Adding Bill / Income form */}
      {isAdding && (
        <div className={`glass-panel rounded-3xl p-6 border animate-slide-up ${
          formType === 'income' ? 'border-emerald-200 bg-emerald-50/10' : 'border-orange-200 bg-orange-50/10'
        }`}>
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-1.5">
              <Sparkle className={`w-5 h-5 ${formType === 'income' ? 'text-emerald-500' : 'text-orange-500'}`} />
              {formType === 'income' ? 'Register Scheduled Income Inflow' : 'Register New Recurring Bill'}
            </h3>
            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
              <button 
                type="button"
                onClick={() => setFormType('bill')}
                className={`py-1 px-3 rounded-md font-bold transition-all ${formType === 'bill' ? 'bg-orange-600 text-white' : 'text-slate-500'}`}
              >
                Bill/Expense
              </button>
              <button 
                type="button"
                onClick={() => setFormType('income')}
                className={`py-1 px-3 rounded-md font-bold transition-all ${formType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}
              >
                Scheduled Income
              </button>
            </div>
          </div>

          <form onSubmit={handleAddBill} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                {formType === 'income' ? 'Income Name / Source' : 'Bill Name'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={formType === 'income' ? 'e.g. Side Hustle, Weekly Paycheck' : 'e.g. Electric Bill'}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-slate-400"
                id="bill-form-name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                {formType === 'income' ? 'Inflow Date' : 'Due Date'}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                id="bill-form-date"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                id="bill-form-amount"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                {formType === 'income' ? 'Deposit To Account' : 'Paid From Account'}
              </label>
              <select
                value={account}
                onChange={e => setAccount(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                id="bill-form-account"
              >
                {accounts.map(acc => (
                  <option key={acc.name} value={acc.name}>{acc.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value as any)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                id="bill-form-frequency"
              >
                <option value="Weekly">Weekly</option>
                <option value="Bi-weekly">Bi-weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                disabled={formType === 'income'}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                id="bill-form-category"
              >
                {formType === 'income' ? (
                  <option value="Income">Income</option>
                ) : (
                  <>
                    <option value="Bills">Bills</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Debt">Debt</option>
                    <option value="Fun / Misc">Fun / Misc</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Notes / Details</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add confirmations, URLs or details"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none"
                id="bill-form-notes"
              />
            </div>

            {formType === 'bill' && (
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="autopay"
                  checked={autopay}
                  onChange={e => setAutopay(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-slate-200 rounded cursor-pointer"
                />
                <label htmlFor="autopay" className="text-xs font-semibold text-slate-700 cursor-pointer">Autopay enabled</label>
              </div>
            )}

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                id="bill-form-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`py-2 px-5 text-white rounded-full text-xs font-bold shadow-md cursor-pointer ${
                  formType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
                id="bill-form-submit-btn"
              >
                {formType === 'income' ? 'Register Income' : 'Create Bill'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. TODAY SNAPSHOT SECTION (RELOCATED) */}
      <div className="p-6 bg-gradient-to-r from-indigo-900/5 to-purple-900/5 border border-indigo-100 rounded-3xl relative overflow-hidden" id="today-snapshot-section">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-4 border-b border-indigo-100/40 pb-2">
          <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-xl">
            <Zap className="w-4 h-4 fill-current" />
          </span>
          <h3 className="font-display font-black text-slate-800 text-sm">Today’s Financial Activity Snapshot</h3>
          <span className="text-[10px] font-mono font-bold bg-white border border-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full uppercase ml-auto">
            June 27, 2026
          </span>
        </div>

        {todayEvents.length > 0 || todayReminders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            
            {/* Left 4 cols for metrics */}
            <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
              
              <div className="p-3 bg-white rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">Today's Income</span>
                <span className="text-base font-mono font-black text-emerald-600 mt-1 block">
                  {todayIncome.length > 0 
                    ? formatCurrency(todayIncome.reduce((sum, e) => sum + e.amount, 0)) 
                    : '$0'
                  }
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {todayIncome.length} deposit{todayIncome.length !== 1 ? 's' : ''} expected
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">Today's Bills</span>
                <span className="text-base font-mono font-black text-rose-500 mt-1 block">
                  {todayBills.length > 0 
                    ? formatCurrency(todayBills.reduce((sum, e) => sum + e.amount, 0)) 
                    : '$0'
                  }
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {todayBills.length} payment{todayBills.length !== 1 ? 's' : ''} due
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-150">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">Today's Transfers</span>
                <span className="text-base font-mono font-black text-blue-500 mt-1 block">
                  {todayTransfers.length > 0 
                    ? formatCurrency(todayTransfers.reduce((sum, e) => sum + e.amount, 0)) 
                    : '$0'
                  }
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  {todayTransfers.length} item{todayTransfers.length !== 1 ? 's' : ''} scheduled
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-150 relative">
                <span className="text-[10px] text-slate-450 font-bold uppercase block">Today's Available Cash</span>
                <span className="text-base font-mono font-black text-indigo-600 mt-1 block">
                  {formatCurrency(todayAvailableMoney)}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">
                  Safe-to-use liquid checking
                </span>
              </div>

            </div>

            {/* Right 1 col for active alerts list */}
            <div className="md:col-span-1 p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-wider block mb-1">Today's Reminders</span>
              {todayReminders.length > 0 ? (
                <div className="space-y-1.5 overflow-y-auto max-h-[80px]">
                  {todayReminders.map((r, i) => (
                    <div key={i} className="text-[10px] text-slate-700 font-semibold leading-relaxed flex items-start gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-emerald-700 font-semibold">✓ You’re all caught up today.</span>
              )}
            </div>

          </div>
        ) : (
          <div className="py-6 text-center text-slate-500 text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            “You’re all caught up today.” Everything is perfectly handled.
          </div>
        )}
      </div>

      {/* 3. CORE CALENDAR / AGENDA / TIMELINE / VIEWS SECTION */}
      <div className="space-y-4">
        
        {/* View Switcher Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-150">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-black text-sm">Money Planner Calendar</h3>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {([
              { id: 'calendar', label: 'Calendar View', icon: CalendarIcon },
              { id: 'agenda', label: 'Agenda View', icon: List },
              { id: 'timeline', label: 'Timeline View', icon: Clock },
              { id: 'week', label: 'Week View', icon: Grid },
              { id: 'month', label: 'Month View', icon: CalendarDays }
            ] as const).map(v => {
              const Icon = v.icon;
              return (
                <button
                  key={v.id}
                  onClick={() => setViewType(v.id)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold transition-all ${
                    viewType === v.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-150'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Rendering of Selected View */}
        <div className="glass-panel rounded-3xl p-6 border-slate-200">
          
          {viewType === 'calendar' && (
            <div className="space-y-6">
              {/* Calendar Month Selector */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-display font-black text-slate-800 text-sm">
                  {monthNames[selectedMonth]} {selectedYear}
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Classic 7-day grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 7-day calendar view */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((cell, idx) => {
                      const { dateStr, dayNumber } = cell;
                      if (!dateStr || !dayNumber) {
                        return <div key={`empty-${idx}`} className="h-20 bg-slate-50/20 rounded-2xl border border-transparent" />;
                      }

                      const cellEvents = monthEvents.filter(e => e.date === dateStr);
                      const isSelected = selectedDayKey === dateStr;
                      const isToday = dateStr === todayDateStr;

                      return (
                        <button
                          key={dateStr}
                          onClick={() => setSelectedDayKey(dateStr)}
                          className={`h-20 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group ${
                            isSelected 
                              ? 'bg-indigo-600/5 border-indigo-500 ring-2 ring-indigo-500/10' 
                              : isToday 
                                ? 'bg-amber-500/5 border-amber-400 shadow-xs' 
                                : 'bg-white border-slate-150 hover:bg-slate-50/50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className={`font-mono text-xs font-extrabold ${
                              isSelected ? 'text-indigo-600 font-black' : isToday ? 'text-amber-700 font-black' : 'text-slate-700'
                            }`}>
                              {dayNumber}
                            </span>
                            {isToday && (
                              <span className="text-[7px] font-mono font-extrabold px-1 bg-amber-500 text-white rounded-md uppercase">
                                TODAY
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5 mt-1 overflow-hidden w-full flex-1 flex flex-col justify-end">
                            {cellEvents.slice(0, 3).map((ev) => (
                              <div 
                                key={ev.id} 
                                className={`text-[8px] font-semibold truncate px-1 rounded-sm leading-snug font-sans ${
                                  ev.type === 'payday' || ev.type === 'income'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ev.type === 'bill'
                                      ? 'bg-rose-100 text-rose-800'
                                      : ev.type === 'subscription'
                                        ? 'bg-purple-100 text-purple-800'
                                        : ev.type === 'debt'
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-blue-100 text-blue-800'
                                }`}
                                title={`${ev.name}: ${formatCurrency(ev.amount)}`}
                              >
                                {ev.type === 'payday' || ev.type === 'income' ? '+$' : '-$'}
                                {ev.amount} {ev.name.replace(/\s+.*$/, '')}
                              </div>
                            ))}
                            {cellEvents.length > 3 && (
                              <div className="text-[7px] font-bold text-slate-400 text-center">
                                +{cellEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Day details pane */}
                <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[9px] font-mono font-black text-indigo-600 block">SELECTED DAY DETAILS</span>
                    <h4 className="text-slate-800 font-bold text-xs font-mono">{selectedDayKey || 'No day selected'}</h4>
                  </div>

                  {selectedDayKey && selectedDayEvents.length > 0 ? (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                      {selectedDayEvents.map((ev) => (
                        <div 
                          key={ev.id} 
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 bg-white shadow-3xs ${
                            ev.type === 'payday' || ev.type === 'income'
                              ? 'border-emerald-100'
                              : 'border-slate-150'
                          }`}
                        >
                          <div>
                            <span className={`text-[8px] uppercase font-mono font-bold block ${
                              ev.type === 'payday' || ev.type === 'income' ? 'text-emerald-600' : 'text-slate-400'
                            }`}>
                              {ev.type}
                            </span>
                            <span className="font-bold text-slate-800 text-xs block mt-0.5">{ev.name}</span>
                            {ev.notes && <span className="text-[9px] text-slate-400 italic block mt-0.5">"{ev.notes}"</span>}
                          </div>
                          <span className={`font-mono text-xs font-black shrink-0 ${
                            ev.type === 'payday' || ev.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {ev.type === 'payday' || ev.type === 'income' ? '+' : '-'}
                            {formatCurrency(ev.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No scheduled actions or income on this date. Enjoy the clear space! ✨
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {viewType === 'agenda' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-display font-black text-slate-800 text-sm">Monthly Agenda Planner</h3>
                <p className="text-xs text-slate-400">Sequential events chronologically mapped for {monthNames[selectedMonth]}.</p>
              </div>

              {monthEvents.length > 0 ? (
                <div className="space-y-6">
                  {groupedWeeksEvents.map((weekEvents, wIdx) => {
                    if (weekEvents.length === 0) return null;
                    return (
                      <div key={wIdx} className="space-y-2.5">
                        <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest bg-slate-50 py-1 px-3.5 rounded-lg border border-slate-150/40 inline-block">
                          Week {wIdx + 1}
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {weekEvents.map(ev => {
                            const isInc = ev.type === 'payday' || ev.type === 'income';
                            return (
                              <div key={ev.id} className="p-4 bg-white border border-slate-150 rounded-2xl shadow-3xs flex items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-mono font-bold text-slate-400">{ev.date}</span>
                                    <span className={`text-[8px] font-mono font-black uppercase py-0.5 px-1.5 rounded border ${
                                      isInc 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                                        : 'bg-slate-50 border-slate-200 text-slate-600'
                                    }`}>
                                      {ev.type}
                                    </span>
                                  </div>
                                  <span className="font-bold text-slate-850 text-xs block">{ev.name}</span>
                                  <span className="text-[10px] text-slate-400 font-medium block">Category: {ev.category}</span>
                                </div>
                                <span className={`font-mono text-sm font-black ${isInc ? 'text-emerald-600' : 'text-slate-800'}`}>
                                  {isInc ? '+' : '-'}
                                  {formatCurrency(ev.amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No upcoming events projected for this month.
                </div>
              )}
            </div>
          )}

          {viewType === 'timeline' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-display font-black text-slate-800 text-sm">Flow & Cash Impact Timeline</h3>
                <p className="text-xs text-slate-400">See how each transaction impacts your cumulative balance, starting from today's safe liquid available cash.</p>
              </div>

              {monthEvents.length > 0 ? (
                <div className="relative border-l border-indigo-200/50 pl-6 space-y-6 max-w-2xl mx-auto">
                  
                  {/* Rolling cumulative logic */}
                  {(() => {
                    let cumulativeBalance = todayAvailableMoney;
                    return monthEvents.map((ev, idx) => {
                      const isInc = ev.type === 'payday' || ev.type === 'income';
                      cumulativeBalance = isInc ? cumulativeBalance + ev.amount : cumulativeBalance - ev.amount;

                      return (
                        <div key={ev.id} className="relative group">
                          {/* Circle on timeline */}
                          <div className={`absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full border-2 transition-all group-hover:scale-125 ${
                            isInc 
                              ? 'bg-emerald-500 border-white ring-4 ring-emerald-50' 
                              : 'bg-rose-500 border-white ring-4 ring-rose-50'
                          }`} />

                          <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-3xs hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-extrabold text-slate-400">{ev.date}</span>
                                <span className={`text-[8px] font-mono font-black uppercase py-0.5 px-1.5 rounded ${
                                  isInc ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-600'
                                }`}>
                                  {ev.type}
                                </span>
                              </div>
                              <span className="font-black text-slate-800 text-xs mt-1 block">{ev.name}</span>
                              {ev.notes && <p className="text-[10px] text-slate-400 italic">"{ev.notes}"</p>}
                            </div>

                            <div className="text-right shrink-0">
                              <span className={`font-mono text-sm font-black block ${isInc ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {isInc ? '+' : '-'}
                                {formatCurrency(ev.amount)}
                              </span>
                              <span className="text-[9px] font-mono font-bold text-slate-450 block mt-0.5">
                                Projected Cap: {formatCurrency(cumulativeBalance)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No timeline data available.
                </div>
              )}
            </div>
          )}

          {viewType === 'week' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-display font-black text-slate-800 text-sm">Focused Weekly Calendar View</h3>
                <p className="text-xs text-slate-400">Deep-dive into scheduled events for the current week surrounding June 27, 2026 (June 21 - June 27).</p>
              </div>

              {/* 7 columns for the current week */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {['2026-06-21', '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26', '2026-06-27'].map((dayStr) => {
                  const dayEvents = monthEvents.filter(e => e.date === dayStr);
                  const isToday = dayStr === todayDateStr;
                  const dObj = new Date(dayStr);
                  const weekdayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNum = dObj.getDate();

                  return (
                    <div 
                      key={dayStr} 
                      className={`p-4 rounded-2xl border flex flex-col justify-between min-h-[160px] ${
                        isToday 
                          ? 'bg-indigo-50/40 border-indigo-500 shadow-xs ring-2 ring-indigo-500/10' 
                          : 'bg-white border-slate-150'
                      }`}
                    >
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-700 block uppercase font-display">{weekdayName}</span>
                        <span className={`text-xs font-mono font-black w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400'
                        }`}>
                          {dateNum}
                        </span>
                      </div>

                      <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-[120px]">
                        {dayEvents.length > 0 ? (
                          dayEvents.map(ev => {
                            const isInc = ev.type === 'payday' || ev.type === 'income';
                            return (
                              <div key={ev.id} className={`p-1.5 rounded-lg text-[9px] font-bold leading-normal border ${
                                isInc 
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                                  : 'bg-slate-50 border-slate-150 text-slate-800'
                              }`}>
                                <span className="block truncate font-sans">{ev.name}</span>
                                <span className="font-mono block mt-0.5">{isInc ? '+' : '-'}{formatCurrency(ev.amount)}</span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-[9px] text-slate-400 italic block mt-4 text-center">Empty</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewType === 'month' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="font-display font-black text-slate-800 text-sm">Monthly Cash Flow Flowchart Map</h3>
                <p className="text-xs text-slate-400">All projected incoming and outgoing flows sorted chronologically for the month.</p>
              </div>

              <div className="overflow-x-auto border border-slate-150 rounded-2xl bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150">
                      <th className="py-3 px-4 font-mono font-bold text-slate-500 uppercase">Date</th>
                      <th className="py-3 px-4 font-mono font-bold text-slate-500 uppercase">Description / Name</th>
                      <th className="py-3 px-4 font-mono font-bold text-slate-500 uppercase">Action Type</th>
                      <th className="py-3 px-4 font-mono font-bold text-slate-500 uppercase">Category</th>
                      <th className="py-3 px-4 font-mono font-bold text-slate-500 uppercase text-right">Inflow (+) / Outflow (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {monthEvents.map(ev => {
                      const isInc = ev.type === 'payday' || ev.type === 'income';
                      return (
                        <tr key={ev.id} className="hover:bg-slate-50/40">
                          <td className="py-3 px-4 font-mono text-slate-500">{ev.date}</td>
                          <td className="py-3 px-4 text-slate-900 font-bold">{ev.name}</td>
                          <td className="py-3 px-4">
                            <span className={`text-[8px] font-mono font-black uppercase py-0.5 px-2 rounded-full border ${
                              isInc 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}>
                              {ev.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{ev.category}</td>
                          <td className={`py-3 px-4 font-mono font-black text-right ${
                            isInc ? 'text-emerald-600' : 'text-slate-800'
                          }`}>
                            {isInc ? '+' : '-'}
                            {formatCurrency(ev.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 4. REDESIGNED COMMITMENTS SECTION (MONTHLY COMMITMENTS) */}
      <div className="glass-panel rounded-3xl p-6 space-y-6" id="recurring-payments-commitments">
        
        {/* Header and Filter Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-display font-black text-slate-800 text-base">Monthly Commitments & Recurring Payments</h3>
            <p className="text-xs text-slate-400">Audit your locked subscriptions, repeating bills, savings agreements, and paydays.</p>
          </div>

          <div className="bg-slate-100 p-1 rounded-full flex border border-slate-200/50 self-start">
            {(['All', 'Bills', 'Subscriptions', 'Transfers', 'Income'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setRecurringFilter(tab)}
                className={`py-1 px-3.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  recurringFilter === tab
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TOP SUMMARY BLOCK */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-150">
          
          <div className="p-3.5 bg-white border border-slate-150 rounded-xl">
            <span className="text-[10px] text-slate-450 font-black block uppercase tracking-wider">Commitment Bills</span>
            <span className="text-lg font-mono font-black text-slate-800 block mt-1">
              {formatCurrency(commitments.filter(c => c.type === 'Bill').reduce((sum, c) => sum + c.amount, 0))}
            </span>
          </div>

          <div className="p-3.5 bg-white border border-slate-150 rounded-xl">
            <span className="text-[10px] text-slate-450 font-black block uppercase tracking-wider">Recurring Subs</span>
            <span className="text-lg font-mono font-black text-slate-800 block mt-1">
              {formatCurrency(commitments.filter(c => c.type === 'Subscription').reduce((sum, c) => sum + c.amount, 0))}
            </span>
          </div>

          <div className="p-3.5 bg-white border border-slate-150 rounded-xl">
            <span className="text-[10px] text-slate-450 font-black block uppercase tracking-wider">Savings Transfers</span>
            <span className="text-lg font-mono font-black text-slate-800 block mt-1">
              {formatCurrency(commitments.filter(c => c.type === 'Transfer').reduce((sum, c) => sum + c.amount, 0))}
            </span>
          </div>

          <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl">
            <span className="text-[10px] text-emerald-700 font-black block uppercase tracking-wider">Estimated Income</span>
            <span className="text-lg font-mono font-black text-emerald-700 block mt-1">
              {formatCurrency(commitments.filter(c => c.type === 'Income').reduce((sum, c) => sum + c.amount, 0))}
            </span>
          </div>

        </div>

        {/* CARDS LISTING OF THE RECURRING PAYMENTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommitments.map(c => {
            const isEditing = editingBillId === c.id;
            
            return (
              <div 
                key={c.id} 
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                  c.type === 'Income'
                    ? 'bg-emerald-500/5 border-emerald-200'
                    : 'bg-white border-slate-200/80 hover:shadow-xs'
                }`}
              >
                
                {/* Info Block */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className={`text-[8px] font-mono font-black uppercase py-0.5 px-2 rounded-full border ${
                        c.type === 'Income'
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                          : c.type === 'Subscription'
                            ? 'bg-purple-100 border-purple-200 text-purple-800'
                            : c.type === 'Transfer'
                              ? 'bg-blue-100 border-blue-200 text-blue-800'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {c.type}
                      </span>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1 text-xs mt-1 text-slate-800"
                        />
                      ) : (
                        <h4 className="font-display font-black text-slate-800 text-sm mt-1.5">{c.name}</h4>
                      )}
                    </div>

                    <div className="text-right">
                      {isEditing ? (
                        <input 
                          type="number" 
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-20 bg-white border border-slate-300 rounded-lg p-1 text-xs font-mono text-slate-800 text-right"
                        />
                      ) : (
                        <span className={`font-mono text-sm font-black block ${c.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {c.type === 'Income' ? '+' : '-'}
                          {formatCurrency(c.amount)}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {isEditing ? 'Amount' : 'Budgeted Amt'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-50">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Scheduled Date</span>
                      <span className="font-semibold text-slate-700">{c.dueDate}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Frequency</span>
                      {isEditing && c.type === 'Bill' ? (
                        <select 
                          value={editFrequency}
                          onChange={e => setEditFrequency(e.target.value as any)}
                          className="bg-white border border-slate-300 rounded p-0.5 text-[10px]"
                        >
                          <option value="Weekly">Weekly</option>
                          <option value="Bi-weekly">Bi-weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      ) : (
                        <span className="font-semibold text-slate-700">{c.frequency}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Auto Pay</span>
                      {isEditing && c.type === 'Bill' ? (
                        <input 
                          type="checkbox" 
                          checked={editAutopay}
                          onChange={e => setEditAutopay(e.target.checked)}
                          className="rounded text-orange-500"
                        />
                      ) : (
                        <span className={`font-bold ${c.autopay ? 'text-emerald-600' : 'text-slate-450'}`}>
                          {c.autopay ? '✓ Active Autopay' : 'Manual'}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Category</span>
                      {isEditing && c.type === 'Bill' ? (
                        <input 
                          type="text" 
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="bg-white border border-slate-300 rounded p-0.5 text-[10px] w-full"
                        />
                      ) : (
                        <span className="font-semibold text-slate-500 truncate block">{c.category}</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Card footer action trigger */}
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold">
                    Next cycle is active
                  </span>

                  {/* Actions (Only editable if it's a Bill or Income manually registered) */}
                  {(c.type === 'Bill' || c.type === 'Income') && c.id.startsWith('b-') ? (
                    <div className="flex gap-2">
                      {isEditing ? (
                        <button 
                          onClick={() => saveEdit(c.id)}
                          className="py-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-[10px] font-bold shadow transition-all cursor-pointer"
                        >
                          Save
                        </button>
                      ) : (
                        <button 
                          onClick={() => startEditing(c.rawObj)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDeleteBill(c.id)}
                        className="p-1 text-slate-350 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-400 italic font-medium flex items-center gap-0.5">
                      <Info className="w-3 h-3 text-slate-350" />
                      Auto-generated from active {c.type}
                    </span>
                  )}
                </div>

              </div>
            );
          })}

          {filteredCommitments.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-xs font-semibold">
              No registered commitments matching selection.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
