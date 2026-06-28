import { useState, FormEvent, useEffect, useRef } from 'react';
import { Account, Debt, Bill, Goal, BudgetCategory, PaymentHistoryItem, PaycheckCovers } from '../types';
import { User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { createLinkToken, exchangePublicToken, fetchBankTransactions } from '../lib/plaid';
import { syncBankTransactions } from '../lib/googleSheets';
import { usePlaidLink } from 'react-plaid-link';
import { evaluateFinancialPhase } from '../lib/financialEngine';
import CsvImportWizard from './CsvImportWizard';
import CircularProgress from './CircularProgress';
import FinancialHealthGauge from './FinancialHealthGauge';
import EmptyState from './EmptyState';
import confetti from 'canvas-confetti';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Plus, 
  Minus, 
  ArrowRightLeft, 
  CheckCircle2, 
  Zap, 
  Play, 
  Info, 
  DollarSign, 
  X,
  RefreshCw,
  Trophy,
  Activity,
  Award,
  Search,
  BookOpen,
  Sliders,
  Bell,
  Check,
  Compass,
  ArrowRight,
  ChevronDown,
  Upload,
  Sun,
  CloudSun,
  Moon,
  ChevronUp
} from 'lucide-react';

// Safe currency formatting utility defined first to avoid temporal dead zone
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

interface DashboardViewProps {
  accounts: Account[];
  debts: Debt[];
  bills: Bill[];
  goals: Goal[];
  budgetCategories: BudgetCategory[];
  paycheckCovers: PaycheckCovers;
  setCurrentTab: (tab: string) => void;
  onUpdateAccounts: (updated: Account[]) => void;
  onUpdateDebts: (updated: Debt[]) => void;
  onUpdateHistory: (updated: PaymentHistoryItem[]) => void;
  history: PaymentHistoryItem[];
  isSyncing: boolean;
  spreadsheetId: string | null;
  showActualName?: boolean;
  user?: User | null;
}

export default function DashboardView({
  accounts,
  debts,
  bills,
  goals,
  budgetCategories,
  paycheckCovers,
  setCurrentTab,
  onUpdateAccounts,
  onUpdateDebts,
  onUpdateHistory,
  history,
  isSyncing,
  spreadsheetId,
  showActualName = false,
  user = null
}: DashboardViewProps) {
  // -------------------------------------------------------------
  // 1. Calculations & Derivations
  // -------------------------------------------------------------
  const totalFunds = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const activeDebtsTotal = debts
    .filter(d => d.status === 'Active' || d.status === 'Not Started')
    .reduce((acc, curr) => acc + curr.balance, 0);

  const lifeChecking = accounts.find(a => a.name === 'Life Wallet 🧍' || a.name === 'Life Checking' || a.name === 'Life')?.balance || 0;
  const vaultBills = accounts.find(a => a.name === 'Bill Hub 📦' || a.name === 'Vault/Bills' || a.name === 'Vault')?.balance || 0;
  const bufferFund = accounts.find(a => a.name === 'Safety Net 🛟' || a.name === 'Buffer Fund' || a.name === 'Buffer')?.balance || 0;
  const vacationFund = accounts.find(a => a.name === 'Escape Fund 🌴' || a.name === 'Vacation' || a.name === 'Vacation Savings')?.balance || 0;
  const freedomSavings = accounts.find(a => a.name === 'Boss Fight Fund 🗡️' || a.name === 'Freedom' || a.name === 'Freedom Fund')?.balance || 0;
  const cashBalance = accounts.find(a => a.name === 'Cash' || a.name === 'Physical Cash')?.balance || 0;

  // Next upcoming unpaid bills
  const upcomingBills = [...bills]
    .filter(b => !b.paid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const billsThisWeek = upcomingBills.filter(b => {
    const today = new Date();
    const dueDate = new Date(b.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const billsThisWeekSum = billsThisWeek.reduce((sum, b) => sum + b.amount, 0);

  // Active debts and paid debts lists
  const activeDebtsList = debts.filter(d => d.balance > 0 && d.status === 'Active');
  const paidDebtsList = debts.filter(d => d.status === 'Paid' || d.balance === 0);

  // Estimated rollover / total minimum scheduled debt payment
  const sumMinPayments = activeDebtsList.reduce((acc, curr) => acc + curr.minimumPayment, 0);
  // Rollover capacity freed from paid debts
  const freedMonthlyRollover = paidDebtsList.reduce((acc, curr) => acc + (curr.amountFreedWhenPaid || curr.minimumPayment || 50), 0);
  // Time to freedom estimate: assume min payments + extra payoff capacity ($300 default) can clear outstanding debts
  const baseMonthlyAttack = sumMinPayments + freedMonthlyRollover + 300;
  const estimatedMonthsToFreedom = activeDebtsTotal > 0 && baseMonthlyAttack > 0 
    ? Math.ceil(activeDebtsTotal / baseMonthlyAttack) 
    : 0;

  // -------------------------------------------------------------
  // 2. React States & Layout Elements
  // -------------------------------------------------------------
  const [showAction, setShowAction] = useState<'expense' | 'income' | 'pay' | 'move' | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showCommandBar, setShowCommandBar] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInsightIndex, setActiveInsightIndex] = useState<number | null>(null);
  const [showGreetingDetails, setShowGreetingDetails] = useState(false);
  
  // Custom user layout and quick action pinning states (User Request)
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [pinnedActions, setPinnedActions] = useState<string[]>(() => {
    const saved = localStorage.getItem('finance_command_center_pinned_actions');
    return saved ? JSON.parse(saved) : ['Add Income', 'Add Expense', 'Move Money', 'Pay Debt'];
  });
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
  const [isCustomizingPins, setIsCustomizingPins] = useState(false);
  const [payoffStrategy, setPayoffStrategy] = useState<'snowball' | 'avalanche'>('snowball');
  
  // Quick Action form inputs
  const [actionAmount, setActionAmount] = useState('');
  const [actionAccount, setActionAccount] = useState('Life Wallet 🧍');
  const [destAccount, setDestAccount] = useState('Bill Hub 📦');
  const [actionDebt, setActionDebt] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [actionCategory, setActionCategory] = useState('General');

  // Paycheck Simulator Inputs
  const [simPaycheckAmount, setSimPaycheckAmount] = useState('3000');
  const [simResults, setSimResults] = useState<{
    lifeAlloc: number;
    vaultAlloc: number;
    bufferAlloc: number;
    vacationAlloc: number;
    freedomAlloc: number;
    breakdownReport: string[];
    canCommit: boolean;
  } | null>(null);

  // Advanced "What-If" Simulation States
  const [simExtraDebt, setSimExtraDebt] = useState('250');
  const [simPauseVacation, setSimPauseVacation] = useState(false);
  const [simBufferTarget, setSimBufferTarget] = useState('1000');
  const [simExtraIncome, setSimExtraIncome] = useState('0');
  const [briefing, setBriefing] = useState<string>('');
  const [isBriefingLoading, setIsBriefingLoading] = useState<boolean>(false);

  // Fetch daily tactical command briefing
  useEffect(() => {
    const fetchBriefing = async () => {
      setIsBriefingLoading(true);
      try {
        const response = await fetch('/api/gemini/briefing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            financeData: { accounts, debts, bills, goals, budgetCategories },
            timeOfDay: new Date().getHours() >= 17 ? 'evening' : 'morning'
          })
        });
        const data = await response.json();
        if (data.briefing) {
          setBriefing(data.briefing);
        }
      } catch (err) {
        console.error('Failed to load briefing:', err);
      } finally {
        setIsBriefingLoading(false);
      }
    };
    fetchBriefing();
  }, [accounts.length, debts.length, bills.length, goals.length]);

  // -------------------------------------------------------------
  // 3. Command Bar Trigger Handler (Ctrl + K)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandBar(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Plaid & Bank Connection States & Handlers
  const [plaidLinkToken, setPlaidLinkToken] = useState<string | null>(null);
  const [isLinkingBank, setIsLinkingBank] = useState(false);
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [isSyncingBank, setIsSyncingBank] = useState(false);
  const [hasLinkedBank, setHasLinkedBank] = useState(!!localStorage.getItem('plaid_bank_access_token'));
  const [simSelectedBank, setSimSelectedBank] = useState('Chase Bank');

  useEffect(() => {
    createLinkToken().then(res => {
      setPlaidLinkToken(res.link_token);
    }).catch(err => {
      console.warn('Failed to retrieve Plaid Link Token:', err);
    });
  }, []);

  const onPlaidSuccess = async (public_token: string, metadata: any) => {
    try {
      setIsLinkingBank(true);
      const res = await exchangePublicToken(public_token);
      localStorage.setItem('plaid_bank_access_token', res.access_token);
      setHasLinkedBank(true);
      alert('Bank connected successfully via Plaid Link!');
      await handleSyncBankFeed(res.access_token);
    } catch (err) {
      console.error('Error exchanging Plaid public token:', err);
    } finally {
      setIsLinkingBank(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: plaidLinkToken || '',
    onSuccess: onPlaidSuccess,
  });

  const handleConnectBank = () => {
    if (!plaidLinkToken || plaidLinkToken.includes('mock_') || plaidLinkToken === 'mock_link_token_client_fallback') {
      setShowPlaidModal(true);
    } else {
      if (ready) {
        open();
      } else {
        setShowPlaidModal(true);
      }
    }
  };

  const handleSyncBankFeed = async (existingToken?: string) => {
    const activePlaidToken = existingToken || localStorage.getItem('plaid_bank_access_token');
    if (!activePlaidToken) return;

    try {
      setIsSyncingBank(true);
      const syncRes = await fetchBankTransactions(activePlaidToken);
      
      const updatedHistory = await syncBankTransactions(
        spreadsheetId || 'sandbox',
        'token-placeholder',
        syncRes.transactions,
        history
      );

      const syncedCount = updatedHistory.length - history.length;
      if (syncedCount > 0) {
        const payrollTransaction = syncRes.transactions.find(
          t => t.name.toLowerCase().includes('payroll') || t.name.toLowerCase().includes('paycheck')
        );

        let updatedAccounts = [...accounts];
        if (payrollTransaction) {
          updatedAccounts = accounts.map(acc => {
            if (acc.name === 'Life Checking' || acc.name === 'Life') {
              return { ...acc, balance: acc.balance + Math.abs(payrollTransaction.amount) };
            }
            return acc;
          });
        }

        onUpdateAccounts(updatedAccounts);
        onUpdateHistory(updatedHistory);
        alert(`Successfully synced bank! Retrieved ${syncRes.transactions.length} transactions, logged ${syncedCount} new entries, and auto-updated ledger balances.`);
      } else {
        alert('Bank feed checked. All synced transactions are already logged (No duplicates inserted).');
      }
    } catch (err) {
      console.error('Failed to sync bank feed:', err);
      alert('Failed to sync bank feed. Check console for details.');
    } finally {
      setIsSyncingBank(false);
    }
  };

  const handleDisconnectBank = () => {
    localStorage.removeItem('plaid_bank_access_token');
    setHasLinkedBank(false);
    alert('Bank account disconnected. Resetted sandbox bank feed.');
  };

  // Recalculate and evaluate current system Phase using centralized engine
  const currentPhase = evaluateFinancialPhase(accounts, debts, parseFloat(simBufferTarget) || 1000);

  // -------------------------------------------------------------
  // 4. Idle Money Detection & Recommendations
  // -------------------------------------------------------------
  const getIdleMoneyAdvisory = () => {
    const suggestions = [];
    
    // Check if Vault/Bills has excess
    const totalExpectedBills15Days = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    const vaultExcess = vaultBills - totalExpectedBills15Days;
    if (vaultExcess > 400) {
      suggestions.push({
        id: 'vault-idle',
        title: 'Excess Bill Vault Liquidity',
        text: `You have ${formatCurrency(vaultExcess)} of unassigned idle reserves sitting inside your Bill Vault.`,
        recommendation: `We suggest moving ${formatCurrency(vaultExcess - 100)} into the Freedom Fund towards paying down your highest APR debt to stop interest bleeding.`,
        actionType: 'move',
        amount: Math.round(vaultExcess - 100),
        source: 'Vault/Bills',
        target: 'Freedom'
      });
    }

    // Check if Buffer has excess
    const bufferTarget = parseFloat(simBufferTarget) || 1000;
    const bufferExcess = bufferFund - bufferTarget;
    if (bufferExcess > 500) {
      suggestions.push({
        id: 'buffer-idle',
        title: 'Superfluous Emergency Cushion',
        text: `Your Buffer Fund balance is ${formatCurrency(bufferFund)}, exceeding your ${formatCurrency(bufferTarget)} secure target.`,
        recommendation: `Transfer the surplus of ${formatCurrency(bufferExcess)} directly into your active saving goal or debt snowball to keep your money moving.`,
        actionType: 'move',
        amount: Math.round(bufferExcess),
        source: 'Buffer Fund',
        target: 'Freedom'
      });
    }

    return suggestions;
  };

  const idleAdvisories = getIdleMoneyAdvisory();

  // -------------------------------------------------------------
  // 5. Today Pulse Alerts
  // -------------------------------------------------------------
  const getTodayPulseAlerts = () => {
    const alerts = [];
    
    // Low buffer alert
    const bufferTarget = parseFloat(simBufferTarget) || 1000;
    if (bufferFund < bufferTarget) {
      alerts.push({
        type: 'danger',
        label: 'Low Buffer Security Alert',
        message: `Your Emergency Buffer is at ${formatCurrency(bufferFund)} (Target: ${formatCurrency(bufferTarget)}). Avoid all discretionary checking transfers until restored.`
      });
    }

    // Heavy spending alert
    if (billsThisWeekSum > 500) {
      alerts.push({
        type: 'warning',
        label: 'High-Demand Billing Week',
        message: `${formatCurrency(billsThisWeekSum)} in scheduled transfers are exiting your account in the next 7 days. Ensure your Bill Vault has cleared.`
      });
    }

    // Upcoming bills today
    const billsToday = upcomingBills.filter(b => {
      const todayStr = new Date().toISOString().split('T')[0];
      return b.dueDate === todayStr;
    });

    if (billsToday.length > 0) {
      alerts.push({
        type: 'info',
        label: `${billsToday.length} Bills Autopaying Today`,
        message: `${billsToday.map(b => b.name).join(', ')} totalling ${formatCurrency(billsToday.reduce((s, b) => s + b.amount, 0))} due to post.`
      });
    }

    // Debt priority alert
    if (activeDebtsList.length > 0) {
      const highestAprDebt = [...activeDebtsList].sort((a, b) => b.apr - a.apr)[0];
      if (highestAprDebt.apr > 18) {
        alerts.push({
          type: 'warning',
          label: 'APR Bleed Trigger',
          message: `${highestAprDebt.name} is draining capital at ${highestAprApr(highestAprDebt.apr)}% APR. Prioritize clearing this outstanding liability.`
        });
      }
    }

    return alerts;
  };

  const highestAprApr = (val: number) => Math.round(val * 10) / 10;
  const pulseAlerts = getTodayPulseAlerts();

  // -------------------------------------------------------------
  // 5B. Dynamic Financial Health Score Calculation (User Request)
  // -------------------------------------------------------------
  const getFinancialHealthScore = () => {
    // 1. Money Available: based on buffer fund target (3-6 mo cushions)
    const bTarget = parseFloat(simBufferTarget) || 1000;
    const moneyAvailableScore = Math.min(100, Math.round((bufferFund / Math.max(1, bTarget)) * 100));

    // 2. Spending Plans: percentage of budgets in bounds
    const compliantEnvelopesCount = budgetCategories.filter(c => c.spent <= c.budgeted).length;
    const spendingPlansScore = budgetCategories.length > 0 ? Math.round((compliantEnvelopesCount / budgetCategories.length) * 100) : 100;

    // 3. Debt Progress: percentage of paid/cleared debts
    const debtProgressScore = debts.length > 0 ? Math.round((paidDebtsList.length / debts.length) * 100) : 100;

    // 4. Savings Progress: percentage of total savings targets funded
    const totalSavingsTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSavingsCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const savingsProgressScore = totalSavingsTarget > 0 ? Math.min(100, Math.round((totalSavingsCurrent / totalSavingsTarget) * 100)) : 100;

    // 5. Upcoming Cash Flow: buffer capability for this week's bills
    const upcomingCashFlowScore = billsThisWeekSum > 0 ? Math.min(100, Math.round((vaultBills / billsThisWeekSum) * 100)) : 100;

    // Combine into a weighted score out of 100
    const totalScore = Math.round((moneyAvailableScore + spendingPlansScore + debtProgressScore + savingsProgressScore + upcomingCashFlowScore) / 5);

    let grade = 'D';
    let gradeColor = 'text-rose-600 bg-rose-50 border-rose-200';
    let gradeLabel = 'Vulnerable';
    if (totalScore >= 90) {
      grade = 'A+';
      gradeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
      gradeLabel = 'Masterful';
    } else if (totalScore >= 80) {
      grade = 'A';
      gradeColor = 'text-teal-700 bg-teal-50 border-teal-200';
      gradeLabel = 'Secured';
    } else if (totalScore >= 70) {
      grade = 'B+';
      gradeColor = 'text-blue-700 bg-blue-50 border-blue-200';
      gradeLabel = 'Growing';
    } else if (totalScore >= 60) {
      grade = 'B';
      gradeColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';
      gradeLabel = 'On Track';
    } else if (totalScore >= 50) {
      grade = 'C';
      gradeColor = 'text-amber-700 bg-amber-50 border-amber-200';
      gradeLabel = 'Action Required';
    }

    return {
      score: totalScore,
      moneyAvailableScore,
      spendingPlansScore,
      debtProgressScore,
      savingsProgressScore,
      upcomingCashFlowScore,
      grade,
      gradeColor,
      gradeLabel
    };
  };

  const healthScoreDetails = getFinancialHealthScore();

  // -------------------------------------------------------------
  // 6. Action History Log "What Changed & Why" Explanation
  // -------------------------------------------------------------
  const getWhatChangedReport = () => {
    if (history.length === 0) {
      return {
        title: 'Initial Operating System Active',
        desc: 'All accounts, vaults, and goals synced with Google Sheets. Ready for automatic cash flow distribution and snowball cascades.',
        timestamp: 'Just now'
      };
    }

    const latest = history[0];
    let description = '';
    let explanation = '';

    if (latest.category === 'Income' || latest.item.includes('Paycheck')) {
      description = `An income influx of ${formatCurrency(latest.amount)} was routed into the account matrix.`;
      explanation = 'Rule-based distribution triggered: Funds immediately protected daily Life checking, backed up upcoming bill balances, topped off the safety buffer, and funneled remaining surpluses directly into high-yield freedom compounders.';
    } else if (latest.category === 'Debt Paydown' || latest.item.toLowerCase().includes('debt')) {
      description = `A payoff transfer of ${formatCurrency(latest.amount)} was deployed against your debt liabilities.`;
      explanation = 'By reducing active principal debt balances, your daily compound interest charge has decreased. Monthly minimum rollover cash flows will auto-cascade into subsequent snowball priorities upon full liquidation.';
    } else if (latest.category === 'Account Transfers' || latest.item.toLowerCase().includes('transfer')) {
      description = `A liquidity relocation of ${formatCurrency(latest.amount)} was executed between ledger accounts.`;
      explanation = 'Asset values were balanced. Idle interest risk was minimized by shifting reserves from checking accounts into targeted goal vaults and emergency buffers.';
    } else {
      description = `An expense of ${formatCurrency(latest.amount)} was recorded in your ledger.`;
      explanation = 'Daily life tracking is logged. Ensure the spending is aligned with your active monthly envelope parameters to keep budget carryovers clean.';
    }

    return {
      title: latest.item,
      desc: description,
      why: explanation,
      timestamp: latest.date
    };
  };

  const whatChanged = getWhatChangedReport();

  // -------------------------------------------------------------
  // 7. Handlers for Transactions & Adjustments
  // -------------------------------------------------------------
  const handleQuickAction = (e: FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newHistoryItem: PaymentHistoryItem = {
      date: new Date().toISOString().split('T')[0],
      item: actionNote || `${showAction?.toUpperCase()}: Manual Entry`,
      category: actionCategory,
      amount: amount,
      accountPaidFrom: actionAccount,
      notes: 'Quick-action logged from Liquid Dashboard OS'
    };

    if (showAction === 'expense') {
      const updated = accounts.map(acc => {
        if (acc.name === actionAccount) {
          return { ...acc, balance: Math.max(0, acc.balance - amount) };
        }
        return acc;
      });
      onUpdateAccounts(updated);
      onUpdateHistory([newHistoryItem, ...history]);
    } else if (showAction === 'income') {
      const updated = accounts.map(acc => {
        if (acc.name === actionAccount) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      });
      onUpdateAccounts(updated);
      onUpdateHistory([newHistoryItem, ...history]);
    } else if (showAction === 'pay') {
      if (!actionDebt) return;
      const updatedDebts = debts.map(d => {
        if (d.name === actionDebt) {
          const newBal = Math.max(0, d.balance - amount);
          return { 
            ...d, 
            balance: newBal,
            status: newBal === 0 ? 'Paid' as const : d.status
          };
        }
        return d;
      });
      const updatedAccounts = accounts.map(acc => {
        if (acc.name === actionAccount) {
          return { ...acc, balance: Math.max(0, acc.balance - amount) };
        }
        return acc;
      });
      onUpdateDebts(updatedDebts);
      onUpdateAccounts(updatedAccounts);
      onUpdateHistory([
        {
          ...newHistoryItem,
          item: `Debt Payment: ${actionDebt}`,
          category: 'Debt Paydown',
          notes: 'Executed via Quick Avalanche Action'
        },
        ...history
      ]);
    } else if (showAction === 'move') {
      const srcAccObj = accounts.find(a => a.name === actionAccount);
      if (!srcAccObj || srcAccObj.balance < amount) {
        alert(`Insufficient funds in ${actionAccount} to transfer ${formatCurrency(amount)}!`);
        return;
      }
      const updated = accounts.map(acc => {
        if (acc.name === actionAccount) {
          return { ...acc, balance: acc.balance - amount };
        }
        if (acc.name === destAccount) {
          return { ...acc, balance: acc.balance + amount };
        }
        return acc;
      });
      onUpdateAccounts(updated);
      onUpdateHistory([
        {
          ...newHistoryItem,
          item: `Transfer: ${actionAccount} → ${destAccount}`,
          category: 'Account Transfers',
          notes: 'Transferred via Quick Money flow'
        },
        ...history
      ]);
    }

    // Reset Form
    setActionAmount('');
    setActionNote('');
    setShowAction(null);
  };

  // Run Rule-Based Paycheck allocation math
  const calculateSimulatedAllocation = () => {
    const total = parseFloat(simPaycheckAmount);
    if (isNaN(total) || total <= 0) return;

    // Assignment priority:
    // 1. Life Spending allocation (e.g. 40% up to $1,200)
    const lifeAlloc = Math.min(1200, total * 0.4);
    
    // 2. Fund bill vault matching outstanding upcoming bill sum
    const totalExpectedBills = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    const vaultAlloc = Math.min(totalExpectedBills, total - lifeAlloc);

    // 3. Topping off emergency buffer fund up to the simulator target
    const targetBuffer = parseFloat(simBufferTarget) || 1000;
    const currentBuffer = bufferFund;
    let bufferAlloc = 0;
    if (currentBuffer < targetBuffer) {
      bufferAlloc = Math.min(targetBuffer - currentBuffer, total - lifeAlloc - vaultAlloc);
    }

    // 4. Vacation allocation
    const vacationAlloc = simPauseVacation ? 0 : Math.min(150, total - lifeAlloc - vaultAlloc - bufferAlloc);

    // 5. Surpluses funnel to Freedom Fund
    const freedomAlloc = Math.max(0, total - lifeAlloc - vaultAlloc - bufferAlloc - vacationAlloc);

    const breakdownReport = [
      `1. Allocated ${formatCurrency(lifeAlloc)} to "Life Wallet 🧍" zone for daily food, transit, and necessities.`,
      `2. Allocated ${formatCurrency(vaultAlloc)} to "Bill Hub 📦" to match current outstanding upcoming bills of ${formatCurrency(totalExpectedBills)}.`,
      currentBuffer < targetBuffer 
        ? `3. Safety Net is thin ($${currentBuffer}/$${targetBuffer}). Routed ${formatCurrency(bufferAlloc)} to Safety Net 🛟.`
        : `3. Safety Net 🛟 is already secure at $${currentBuffer}. Zero Safety Net contribution needed.`,
      simPauseVacation 
        ? `4. Escape Fund savings temporarily paused via What-If config. Saved ${formatCurrency(150)} diverted to Boss Battles.`
        : `4. Sent ${formatCurrency(vacationAlloc)} into your active "Escape Fund 🌴" zone.`,
      `5. Rolled the remaining balance of ${formatCurrency(freedomAlloc)} directly into the "Boss Fight Fund 🗡️" to power active Boss Battles.`
    ];

    setSimResults({
      lifeAlloc,
      vaultAlloc,
      bufferAlloc,
      vacationAlloc,
      freedomAlloc,
      breakdownReport,
      canCommit: true
    });
  };

  const commitSimulatedPaycheck = () => {
    if (!simResults) return;

    const { lifeAlloc, vaultAlloc, bufferAlloc, vacationAlloc, freedomAlloc } = simResults;

    const updated = accounts.map(acc => {
      if (acc.name === 'Life Wallet 🧍' || acc.name === 'Life Checking' || acc.name === 'Life') {
        return { ...acc, balance: acc.balance + lifeAlloc };
      }
      if (acc.name === 'Bill Hub 📦' || acc.name === 'Vault/Bills' || acc.name === 'Vault') {
        return { ...acc, balance: acc.balance + vaultAlloc };
      }
      if (acc.name === 'Safety Net 🛟' || acc.name === 'Buffer Fund' || acc.name === 'Buffer') {
        return { ...acc, balance: acc.balance + bufferAlloc };
      }
      if (acc.name === 'Escape Fund 🌴' || acc.name === 'Vacation' || acc.name === 'Vacation Savings') {
        return { ...acc, balance: acc.balance + vacationAlloc };
      }
      if (acc.name === 'Boss Fight Fund 🗡️' || acc.name === 'Freedom' || acc.name === 'Freedom Fund') {
        return { ...acc, balance: acc.balance + freedomAlloc };
      }
      return acc;
    });

    onUpdateAccounts(updated);

    const totalSim = lifeAlloc + vaultAlloc + bufferAlloc + vacationAlloc + freedomAlloc;
    const historyLog: PaymentHistoryItem = {
      date: new Date().toISOString().split('T')[0],
      item: 'Interactive Engine Allocation',
      category: 'Income',
      amount: totalSim,
      accountPaidFrom: 'External Deposit',
      notes: 'Executed rule-based money flow on live ledger matrices'
    };
    onUpdateHistory([historyLog, ...history]);

    setSimResults(null);
    setShowSimulator(false);
  };

  // -------------------------------------------------------------
  // 8. Advanced What-If Simulation calculations
  // -------------------------------------------------------------
  const extraDebtVal = parseFloat(simExtraDebt) || 0;
  const extraIncomeVal = parseFloat(simExtraIncome) || 0;
  
  // Total simulated monthly power = standard min payments + standard freed + simulated extra debt pay + extra income
  const simulatedMonthlyAttack = baseMonthlyAttack + extraDebtVal + extraIncomeVal;
  
  const simulatedMonthsToFreedom = activeDebtsTotal > 0 && simulatedMonthlyAttack > 0
    ? Math.ceil(activeDebtsTotal / simulatedMonthlyAttack)
    : 0;

  const monthsDifference = Math.max(0, estimatedMonthsToFreedom - simulatedMonthsToFreedom);
  const potentialInterestSaved = activeDebtsTotal * 0.18 * (monthsDifference / 12); // rough estimate using average 18% APR

  // -------------------------------------------------------------
  // 9. Command Search Command List
  // -------------------------------------------------------------
  const systemCommands = [
    { title: 'Add Expense', icon: Minus, category: 'Transaction', action: () => { setShowAction('expense'); setActionCategory('Food'); } },
    { title: 'Add Income', icon: Plus, category: 'Transaction', action: () => { setShowAction('income'); setActionCategory('Salary'); } },
    { title: 'Pay Outstanding Debt', icon: Zap, category: 'Debt', action: () => { setShowAction('pay'); setActionCategory('Debt Paydown'); } },
    { title: 'Move Money / Transfer', icon: ArrowRightLeft, category: 'Account', action: () => { setShowAction('move'); setActionCategory('Account Transfers'); } },
    { title: 'Run Paycheck Engine', icon: Play, category: 'Automation', action: () => setShowSimulator(true) },
    { title: 'Trigger What-If Simulator', icon: Sliders, category: 'Simulation', action: () => {
      const simSection = document.getElementById('what-if-simulation-section');
      if (simSection) simSection.scrollIntoView({ behavior: 'smooth' });
    } },
    { title: 'View Phase Strategy Insights', icon: Compass, category: 'System', action: () => {
      const phaseSec = document.getElementById('phase-strategy-alert');
      if (phaseSec) phaseSec.scrollIntoView({ behavior: 'smooth' });
    } },
    { title: 'View Budget Envelopes', icon: Award, category: 'Budget', action: () => setCurrentTab('budget') },
    { title: 'Open Debt avalanche list', icon: CreditCardIcon, category: 'Debt', action: () => setCurrentTab('debts') }
  ];

  function CreditCardIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    );
  }

  const filteredCommands = systemCommands.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const triggerCommand = (cmd: typeof systemCommands[0]) => {
    cmd.action();
    setShowCommandBar(false);
    setSearchQuery('');
  };

  // -------------------------------------------------------------
  // 10. Insight engine topics
  // -------------------------------------------------------------
  const insightTopics = [
    {
      q: 'Why is Vault/Bills $250 this week?',
      a: 'The bill vault is optimized dynamically to exactly match the sum of upcoming bills due within the next 15 days. This keeps your cash liquid while ensuring no transfers fail.'
    },
    {
      q: 'Why is Buffer increasing?',
      a: `Your current operating rules require building emergency liquid reserves up to your target of ${formatCurrency(parseFloat(simBufferTarget) || 1000)}. This shields you from needing to tap high-interest debts in a crunch.`
    },
    {
      q: 'Why is this debt prioritized first?',
      a: 'The system uses an interest-rate avalanche protocol. By channeling extra funds to your highest APR card first, you minimize total capitalization bleed and pay off targets faster.'
    }
  ];

  // -------------------------------------------------------------
  // Redesigned Premium Apple-style Sub-rendering Components (1-6)
  // -------------------------------------------------------------

  // 1. Greeting
  const renderGreeting = () => {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0: Sun, 5: Fri, 6: Sat
    const chefName = showActualName && user?.displayName ? user.displayName : 'Chief';

    // 1. Determine time-of-day category and gradient
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
    let gradientClass = 'from-amber-500/10 via-sky-500/5 to-blue-500/5 border-amber-200/40';
    let IconComponent = Sun;
    let iconColor = 'text-amber-500';

    if (currentHour >= 5 && currentHour < 12) {
      timeOfDay = 'morning';
      gradientClass = 'from-amber-500/10 via-sky-500/5 to-blue-500/5 border-amber-200/40';
      IconComponent = Sun;
      iconColor = 'text-amber-500';
    } else if (currentHour >= 12 && currentHour < 17) {
      timeOfDay = 'afternoon';
      gradientClass = 'from-sky-500/10 via-blue-500/5 to-indigo-500/5 border-sky-200/40';
      IconComponent = CloudSun;
      iconColor = 'text-sky-500';
    } else if (currentHour >= 17 && currentHour < 22) {
      timeOfDay = 'evening';
      gradientClass = 'from-indigo-500/10 via-purple-500/5 to-slate-900/5 border-indigo-200/40';
      IconComponent = Moon;
      iconColor = 'text-indigo-600';
    } else {
      timeOfDay = 'night';
      gradientClass = 'from-slate-950/5 via-indigo-950/5 to-purple-950/10 border-indigo-950/15';
      IconComponent = Sparkles;
      iconColor = 'text-purple-600';
    }

    // 2. Select Dynamic Greeting Headline
    let headline = `Welcome back, ${chefName}! Let's build your bright financial freedom together today. ✨`;
    if (currentDay === 5) {
      headline = `Happy Friday, ${chefName}! 🎉 Cheers to another week of amazing financial progress and discipline!`;
    } else if (currentDay === 6 || currentDay === 0) {
      headline = `Wishing you an incredible weekend, ${chefName}! 🌟 Enjoy some beautiful, well-deserved peace of mind.`;
    } else if (timeOfDay === 'morning') {
      headline = `Good Morning, ${chefName}! ☀️ A fresh, beautiful day to take positive steps toward your dreams!`;
    } else if (timeOfDay === 'afternoon') {
      headline = `Good Afternoon, ${chefName}! 🌟 Keep up the fantastic momentum—you are doing absolutely wonderful!`;
    } else if (timeOfDay === 'evening') {
      headline = `Good Evening, ${chefName}! 🌙 Take a relaxing breath and celebrate your steady discipline tonight.`;
    } else if (timeOfDay === 'night') {
      headline = `Rest easy tonight, ${chefName}! 💤 Sleep soundly knowing your structured safety net is guarding your future.`;
    }

    // 3. Collect active variables for personalized intelligence summary
    const billsDueToday = bills.filter(b => !b.paid && new Date(b.dueDate).toDateString() === new Date().toDateString());
    const lowestDebt = activeDebtsList.sort((a,b) => a.balance - b.balance)[0];
    const highestGoalProgress = goals
      .filter(g => g.targetAmount > 0 && g.currentAmount < g.targetAmount)
      .map(g => ({ g, pct: g.currentAmount / g.targetAmount }))
      .sort((a,b) => b.pct - a.pct)[0];
    const highBudgetSpent = budgetCategories
      .filter(c => c.budgeted > 0 && c.spent < c.budgeted)
      .map(c => ({ c, pct: c.spent / c.budgeted }))
      .sort((a,b) => b.pct - a.pct)[0];

    // Payday check
    const paydayStr = paycheckCovers?.paycheckDate;
    let isPaydayNear = false;
    if (paydayStr) {
      const pDate = new Date(paydayStr);
      const today = new Date();
      const diffDays = Math.ceil((pDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      isPaydayNear = diffDays >= 0 && diffDays <= 2;
    }

    // Determine the smart prioritized message
    let summaryText = `You have a wonderful ${formatCurrency(lifeChecking)} in your Life Wallet to allocate safely! Your spending is beautifully on track—keep up this incredible momentum! ✨`;
    let priorityBadge = 'Golden Opportunity';

    if (billsDueToday.length > 0) {
      priorityBadge = 'Action Empowered';
      summaryText = `Outstanding: You have ${billsDueToday.length} upcoming bill${billsDueToday.length > 1 ? 's' : ''} due today. You've got this completely covered! Settling them keeps your beautiful cash buffer perfectly clean and stress-free. 🛡️`;
    } else if (isPaydayNear) {
      priorityBadge = 'Upcoming Payday 🎉';
      summaryText = `Wonderful news! Your next payday is almost here (${paydayStr}). Get ready to celebrate your hard work and watch your sequential paycheck covers automate those savings buffers! 🚀`;
    } else if (lowestDebt && lowestDebt.balance < 500) {
      priorityBadge = 'Near Triumph! 🎉';
      summaryText = `You are so close! You are only ${formatCurrency(lowestDebt.balance)} away from paying off your "${lowestDebt.name}" debt in full! Keep that amazing momentum going!`;
    } else if (highestGoalProgress && highestGoalProgress.pct >= 0.8) {
      priorityBadge = 'Victory Near! 🎯';
      summaryText = `Amazing progress! Your savings for "${highestGoalProgress.g.name}" have soared to ${Math.round(highestGoalProgress.pct * 100)}% of your goal! Your dreams are getting closer every single day.`;
    } else if (highBudgetSpent && highBudgetSpent.pct >= 0.85) {
      priorityBadge = 'Mindful Guard';
      summaryText = `You are doing great! You've utilized ${Math.round(highBudgetSpent.pct * 100)}% of your monthly "${highBudgetSpent.c.category}" budget. A friendly, gentle nudge to guide your remaining purchases mindfully today! 🎯`;
    } else if (bufferFund >= 1000) {
      priorityBadge = 'Cushion Champion! 🛡️';
      summaryText = `Spectacular milestone! Your Safety Buffer is fully funded at ${formatCurrency(bufferFund)}. You've completed 84% of your monthly goals—you are absolutely crushing it! 🏆`;
    } else {
      // Default encouraging summary
      summaryText = `You have a wonderful ${formatCurrency(lifeChecking)} available in your Life Wallet, and only ${billsThisWeek.length} bill${billsThisWeek.length !== 1 ? 's' : ''} to manage this week. Your steady discipline is paying off beautifully—keep stacking that secure cushion! 🛟`;
    }

    return (
      <div 
        className={`glass-panel rounded-3xl p-6 border bg-gradient-to-r ${gradientClass} shadow-sm mb-4 relative overflow-hidden transition-all duration-300 animate-fade-in`} 
        id="home-greeting"
      >
        {/* Soft background ambient glow matching current time */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          
          {/* Main Headline and Summary */}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl bg-white/85 shadow-sm border border-slate-150 shrink-0 ${iconColor}`}>
              <IconComponent className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="space-y-1.5 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-mono font-extrabold text-blue-600 bg-blue-50 border border-blue-200/50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {priorityBadge} Priority
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-display font-black text-slate-800 tracking-tight leading-none pt-1">
                {headline}
              </h1>
              
              <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                {summaryText}
              </p>
            </div>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              onClick={() => setShowGreetingDetails(!showGreetingDetails)}
              className="py-1.5 px-4 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 shadow-2xs hover:shadow transition-all flex items-center gap-1 cursor-pointer"
              id="greeting-view-details-btn"
            >
              {showGreetingDetails ? 'Hide Details' : 'View Details'}
              {showGreetingDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>
            
            <button
              onClick={() => setShowCommandBar(true)}
              className="py-1.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              Command Terminal
            </button>
          </div>
        </div>

        {/* Expandable Details Grid */}
        <AnimatePresence>
          {showGreetingDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200/50 mt-5 pt-5 relative z-10"
              id="greeting-expanded-details-drawer"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-3.5 rounded-2xl bg-white/60 border border-slate-150 text-left space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Buffer Safety net</span>
                  <span className="text-sm font-mono font-black text-slate-800 block">{formatCurrency(bufferFund)}</span>
                  <span className={`text-[10px] font-medium block ${bufferFund >= 1000 ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {bufferFund >= 1000 ? '✓ Fully Cushioned' : '⚠️ Refilling Buffer'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/60 border border-slate-150 text-left space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Upcoming Bills (Week)</span>
                  <span className="text-sm font-mono font-black text-slate-800 block">{formatCurrency(billsThisWeekSum)}</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    {billsThisWeek.length} bill{billsThisWeek.length !== 1 ? 's' : ''} unpaid
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/60 border border-slate-150 text-left space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Debt</span>
                  <span className="text-sm font-mono font-black text-rose-600 block">{formatCurrency(activeDebtsTotal)}</span>
                  <span className="text-[10px] text-slate-500 font-semibold block">
                    {activeDebtsList.length} battles remaining
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/60 border border-slate-150 text-left space-y-1">
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Savings Goal Leader</span>
                  {highestGoalProgress ? (
                    <>
                      <span className="text-xs font-bold text-slate-800 block truncate">{highestGoalProgress.g.name}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold block">
                        {Math.round(highestGoalProgress.pct * 100)}% Saved
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-slate-400 block">No active goals</span>
                      <span className="text-[10px] text-slate-400 block">-</span>
                    </>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    );
  };

  const renderDailyBriefing = () => {
    if (isBriefingLoading) {
      return (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl animate-pulse flex items-center gap-2.5 mb-4 shadow-3xs" id="tactical-briefing-loading">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
          <span className="text-xs text-slate-500 font-bold">Decoding daily tactical command briefing...</span>
        </div>
      );
    }
    if (!briefing) return null;

    return (
      <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl border border-slate-850 shadow-xl mb-4 relative overflow-hidden animate-fade-in" id="tactical-briefing-view">
        <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-indigo-300 uppercase tracking-widest font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Tactical Command Briefing
          </div>
          <p className="text-xs font-mono leading-relaxed text-slate-100 max-w-3xl">
            {briefing}
          </p>
        </div>
      </div>
    );
  };

  // 2. Today's Focus
  const renderTodayFocus = () => {
    const allNotifications = [
      ...pulseAlerts.map(a => ({ 
        type: a.type, 
        label: a.label, 
        message: a.message, 
        isAdvisory: false, 
        advisoryData: null 
      })),
      ...idleAdvisories.map(a => ({
        type: 'info',
        label: a.title,
        message: `${a.text}. Target recommendation: ${a.recommendation}`,
        isAdvisory: true,
        advisoryData: a
      }))
    ];

    if (allNotifications.length === 0) return null;

    // Priority assignment:
    // 1. Critical / Danger
    // 2. Upcoming Bills
    // 3. Debt Priorities
    // 4. Advisories
    // 5. Other
    const getNotificationPriority = (n: typeof allNotifications[0]) => {
      if (n.type === 'danger') return 1;
      const lbl = n.label.toLowerCase();
      const msg = n.message.toLowerCase();
      if (lbl.includes('bill') || msg.includes('bill') || lbl.includes('autopay') || msg.includes('autopay') || lbl.includes('billing')) return 2;
      if (lbl.includes('debt') || msg.includes('debt') || lbl.includes('apr') || msg.includes('apr')) return 3;
      if (n.isAdvisory) return 4;
      return 5;
    };

    const sortedNotifications = [...allNotifications].sort((a, b) => getNotificationPriority(a) - getNotificationPriority(b));
    const primaryNotification = sortedNotifications[0];
    const secondaryNotifications = sortedNotifications.slice(1);

    return (
      <div className="space-y-3 animate-fade-in" id="home-today-focus">
        {/* Highest Priority Alert Card */}
        <div className={`p-4 rounded-3xl border flex items-start gap-3.5 shadow-2xs ${
          primaryNotification.type === 'danger' 
            ? 'border-rose-100 bg-rose-50/15 text-rose-800' 
            : primaryNotification.type === 'warning'
            ? 'border-amber-100 bg-amber-50/15 text-amber-800'
            : 'border-blue-100 bg-blue-50/15 text-blue-800'
        }`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${
            primaryNotification.type === 'danger' 
              ? 'bg-rose-100 text-rose-600' 
              : primaryNotification.type === 'warning'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-blue-100 text-blue-600'
          }`}>
            {primaryNotification.type === 'danger' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : primaryNotification.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Info className="w-4 h-4" />
            )}
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <h5 className="text-xs font-bold text-slate-800">{primaryNotification.label}</h5>
            <p className="text-xs text-slate-600 leading-relaxed">{primaryNotification.message}</p>
            {primaryNotification.isAdvisory && primaryNotification.advisoryData && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    const adv = primaryNotification.advisoryData!;
                    setShowAction('move');
                    setActionAccount(adv.source);
                    setDestAccount(adv.target);
                    setActionAmount(String(adv.amount));
                    setActionNote(`Optimize idle surplus from ${adv.source}`);
                  }}
                  className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-bold transition-all cursor-pointer"
                >
                  Optimize Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View All collapsible dropdown button */}
        {secondaryNotifications.length > 0 && (
          <div className="pl-1">
            <button
              onClick={() => setShowAllAlerts(!showAllAlerts)}
              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/85 py-1.5 px-3 rounded-full transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
            >
              <span>{showAllAlerts ? 'Show Less' : `View All (${allNotifications.length})`}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showAllAlerts ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAllAlerts && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 mt-3 overflow-hidden"
                >
                  {secondaryNotifications.map((al, idx) => (
                    <div key={idx} className={`p-4 rounded-3xl border flex items-start gap-3.5 shadow-2xs ${
                      al.type === 'danger' 
                        ? 'border-rose-100 bg-rose-50/15 text-rose-800' 
                        : al.type === 'warning'
                        ? 'border-amber-100 bg-amber-50/15 text-amber-800'
                        : 'border-blue-100 bg-blue-50/15 text-blue-800'
                    }`}>
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        al.type === 'danger' 
                          ? 'bg-rose-100 text-rose-600' 
                          : al.type === 'warning'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {al.type === 'danger' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : al.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4" />
                        ) : (
                          <Info className="w-4 h-4" />
                        )}
                      </div>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-slate-800">{al.label}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{al.message}</p>
                        {al.isAdvisory && al.advisoryData && (
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const adv = al.advisoryData!;
                                setShowAction('move');
                                setActionAccount(adv.source);
                                setDestAccount(adv.target);
                                setActionAmount(String(adv.amount));
                                setActionNote(`Optimize idle surplus from ${adv.source}`);
                              }}
                              className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-bold transition-all cursor-pointer"
                            >
                              Optimize Now
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    );
  };

  // 3. Money Available
  const renderMoneyAvailable = () => {
    const spaceCards = [
      { 
        label: 'Life Checking', 
        val: lifeChecking, 
        color: 'border-blue-200/50 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-400 text-blue-700 shadow-sm shadow-blue-500/5 hover:shadow-md' 
      },
      { 
        label: 'Vault / Bills', 
        val: vaultBills, 
        color: 'border-orange-200/50 bg-orange-500/5 hover:bg-orange-500/10 hover:border-orange-400 text-orange-700 shadow-sm shadow-orange-500/5 hover:shadow-md' 
      },
      { 
        label: 'Buffer Fund', 
        val: bufferFund, 
        color: 'border-emerald-200/50 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-400 text-emerald-700 shadow-sm shadow-emerald-500/5 hover:shadow-md' 
      },
      { 
        label: 'Vacation Fund', 
        val: vacationFund, 
        color: 'border-teal-200/50 bg-teal-500/5 hover:bg-teal-500/10 hover:border-teal-400 text-teal-700 shadow-sm shadow-teal-500/5 hover:shadow-md' 
      },
      { 
        label: 'Freedom Savings', 
        val: freedomSavings, 
        color: 'border-amber-200/50 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-400 text-amber-700 shadow-sm shadow-amber-500/5 hover:shadow-md' 
      },
      { 
        label: 'Cash Balance', 
        val: cashBalance, 
        color: 'border-slate-200/50 bg-slate-500/5 hover:bg-slate-500/10 hover:border-slate-400 text-slate-700 shadow-sm shadow-slate-500/5 hover:shadow-md' 
      }
    ];

    return (
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 bg-white/50 space-y-6 animate-fade-in" id="home-money-available">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h3 className="text-xs font-mono font-black text-blue-600 uppercase tracking-wider">Money Available</h3>
            <h2 className="text-4xl font-display font-black text-slate-800 tracking-tight mt-1.5">
              {formatCurrency(totalFunds)}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasLinkedBank ? (
              <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-200/40 rounded-full py-1 px-3 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-emerald-700">Plaid Live</span>
                <button
                  onClick={() => handleSyncBankFeed()}
                  disabled={isSyncingBank}
                  className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 ml-1.5 underline underline-offset-2 cursor-pointer"
                >
                  {isSyncingBank ? 'Syncing...' : 'Sync'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectBank}
                className="text-[10px] font-bold text-white bg-cyan-600 hover:bg-cyan-700 py-1.5 px-3.5 rounded-full transition-all flex items-center gap-1 shadow-sm hover:scale-105"
              >
                Connect Bank
              </button>
            )}
            <button
              onClick={() => setCurrentTab('accounts')}
              className="text-[10px] font-bold text-slate-600 hover:text-slate-850 bg-slate-100 py-1.5 px-3.5 rounded-full transition-colors border border-slate-200/60 cursor-pointer"
            >
              My Wallets
            </button>
          </div>
        </div>

        {/* Financial Health Chips underneath the balance */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-700 border border-slate-200/40">
            <span>Financial Health:</span>
            <span className={healthScoreDetails.score >= 80 ? 'text-emerald-600' : healthScoreDetails.score >= 50 ? 'text-amber-600' : 'text-rose-600'}>
              {healthScoreDetails.gradeLabel} ({healthScoreDetails.score}%)
            </span>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
            healthScoreDetails.moneyAvailableScore >= 85 ? 'bg-emerald-500/5 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <span>{healthScoreDetails.moneyAvailableScore >= 85 ? '✓ Buffer Fund Healthy' : '⚠ Buffer Fund Low'}</span>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
            healthScoreDetails.upcomingCashFlowScore >= 85 ? 'bg-emerald-500/5 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'
          }`}>
            <span>{healthScoreDetails.upcomingCashFlowScore >= 85 ? '✓ Bills Covered' : '⚠ High Bill Load'}</span>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium border ${
            healthScoreDetails.spendingPlansScore >= 85 ? 'bg-emerald-500/5 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
          }`}>
            <span>{healthScoreDetails.spendingPlansScore >= 85 ? '✓ Spending On Track' : '⚠ Over Spending Limits'}</span>
          </div>
          {billsThisWeekSum > 500 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-amber-50 border border-amber-100 text-amber-700">
              <span>⚠ Upcoming Bills Spike</span>
            </div>
          )}
        </div>

        {/* Compact Today's Recommendation Section */}
        <div className="p-4 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl space-y-2.5">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse shrink-0" />
            <span className="text-[11px] font-mono font-bold text-indigo-700 uppercase tracking-wider">Today's Recommendation</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 list-none pl-1">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 font-bold shrink-0">•</span>
              <span>Active System Phase: <strong>{currentPhase.name}</strong> – {currentPhase.focus}. {currentPhase.desc}</span>
            </li>
            {bufferFund < parseFloat(simBufferTarget) ? (
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold shrink-0">•</span>
                <span>Add <strong>{formatCurrency(parseFloat(simBufferTarget) - bufferFund)}</strong> to Buffer Fund to restore emergency cushion.</span>
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>Buffer Fund cushion is fully on target.</span>
              </li>
            )}
            {activeDebtsList.length > 0 ? (
              <li className="flex items-start gap-2">
                <span className="text-indigo-500 font-bold shrink-0">•</span>
                <span>Allocate spare cash flow towards <strong>{activeDebtsList[0].name}</strong> ({highestAprApr(activeDebtsList[0].apr)}% APR) to save approximately 2 weeks.</span>
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                <span>All debt payoff trajectories are highly optimized.</span>
              </li>
            )}
          </ul>
        </div>

        {/* Wallet balances grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {spaceCards.map((acc, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border ${acc.color} flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 cursor-pointer`}
              onClick={() => setCurrentTab('accounts')}
            >
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider leading-tight opacity-90">
                {acc.label}
              </span>
              <span className="text-base font-mono font-black mt-2 block">
                {formatCurrency(acc.val)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 4. Monthly Outlook
  const renderMonthlyOutlook = () => {
    const totalBudget = budgetCategories.reduce((sum, c) => sum + c.budgeted, 0);
    const totalSpent = budgetCategories.reduce((sum, c) => sum + c.spent, 0);
    const billsSum = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
    const remainingBudget = totalBudget - totalSpent;
    const spentPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

    return (
      <div className="glass-panel rounded-3xl p-6 border border-emerald-200/40 bg-emerald-500/5 shadow-xs animate-fade-in" id="home-monthly-outlook">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono font-black text-emerald-700 uppercase tracking-wider">Monthly Outlook</h3>
          <button
            onClick={() => setCurrentTab('budget')}
            className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 hover:bg-emerald-200 py-1.5 px-3.5 rounded-full transition-colors border border-emerald-200/30 cursor-pointer shadow-2xs"
          >
            Adjust Budget
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2 flex items-center gap-6 p-4 rounded-2xl bg-white/70 border border-emerald-150 shadow-2xs">
            <CircularProgress
              value={spentPercentage}
              size={80}
              strokeWidth={8}
              strokeColor={spentPercentage > 90 ? '#ef4444' : '#10b981'}
              trailColor="#f1f5f9"
              glow={spentPercentage > 75}
            >
              <span className="text-xs font-mono font-black text-slate-700">
                {Math.round(spentPercentage)}%
              </span>
            </CircularProgress>
            
            <div className="space-y-1.5 flex-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Spending Plans Pacing</span>
              <h4 className="text-lg font-display font-black text-slate-800 tracking-tight leading-tight">
                {formatCurrency(totalSpent)}
              </h4>
              <p className="text-[10px] text-slate-500">
                spent of {formatCurrency(totalBudget)}
              </p>
              <div className="text-[10px] font-mono font-bold text-emerald-600">
                {formatCurrency(remainingBudget)} Remaining
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 border border-slate-150 flex flex-col justify-between shadow-2xs">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Upcoming Unpaid Bills</span>
            <span className="text-xl font-mono font-black text-slate-800 mt-2">{formatCurrency(billsSum)}</span>
            <span className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">Due in the next 15 days</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex flex-col justify-between shadow-xs">
            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wide">Discretionary Cashflow</span>
            <span className="text-xl font-mono font-black text-emerald-600 mt-2">+{formatCurrency(remainingBudget)}</span>
            <span className="text-[9px] text-emerald-600 mt-1 leading-tight">Remaining unspent plan cash</span>
          </div>
        </div>
      </div>
    );
  };

  // 5. Upcoming Bills
  const renderUpcomingBills = () => {
    const totalBillsCount = bills.length;
    const paidBillsCount = bills.filter(b => b.paid).length;
    const billsPaidPercentage = totalBillsCount > 0 ? (paidBillsCount / totalBillsCount) * 100 : 100;

    return (
      <div className="glass-panel rounded-3xl p-6 border border-orange-200/40 bg-orange-500/5 shadow-xs animate-fade-in" id="home-upcoming-bills">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-4">
            <CircularProgress
              value={billsPaidPercentage}
              size={56}
              strokeWidth={6}
              strokeColor="#f97316"
              trailColor="#f1f5f9"
              glow={billsPaidPercentage > 0}
            >
              <span className="text-[10px] font-mono font-black text-slate-700">
                {paidBillsCount}/{totalBillsCount}
              </span>
            </CircularProgress>
            <div>
              <h3 className="text-xs font-mono font-black text-orange-700 uppercase tracking-wider">Upcoming Bills</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Unpaid dues next 15 days</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('upcoming')}
            className="text-[10px] font-bold text-orange-700 bg-orange-100/80 hover:bg-orange-200 py-1.5 px-3.5 rounded-full transition-colors border border-orange-200/30 cursor-pointer shadow-2xs"
          >
            Full Calendar
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {upcomingBills.slice(0, 4).map((b) => {
            const today = new Date();
            const due = new Date(b.dueDate);
            const isOverdue = due < today;
            const isDueSoon = !isOverdue && (due.getTime() - today.getTime()) <= (5 * 24 * 60 * 60 * 1000);

            return (
              <div key={b.id} className="py-3 flex items-center justify-between hover:bg-white/35 rounded-xl px-2 transition-colors">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{b.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Due {b.dueDate} • {b.accountPaidFrom}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-black text-slate-800">{formatCurrency(b.amount)}</span>
                  <span className={`text-[9px] font-mono font-extrabold py-0.5 px-2 rounded-full border ${
                    isOverdue 
                      ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse' 
                      : isDueSoon 
                        ? 'bg-orange-50 border-orange-200 text-orange-600 font-bold' 
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                  }`}>
                    {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Upcoming'}
                  </span>
                </div>
              </div>
            );
          })}
          {upcomingBills.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs bg-white/45 rounded-2xl border border-dashed border-slate-200">
              All bills are fully paid. Excellent record!
            </div>
          )}
        </div>
      </div>
    );
  };

  // 6. Recent Activity
  const renderRecentActivity = () => {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-indigo-200/40 bg-indigo-500/5 shadow-xs animate-fade-in" id="home-recent-activity">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-mono font-black text-indigo-700 uppercase tracking-wider">Recent Activity</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Movement of cash across your wallets</p>
          </div>
          <button
            onClick={() => setCurrentTab('history')}
            className="text-[10px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 py-1.5 px-3.5 rounded-full transition-colors border border-indigo-200/30 font-sans cursor-pointer shadow-2xs"
          >
            All Activity
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {history.slice(0, 4).map((item, index) => {
            const isInc = item.isIncome || item.category === 'Salary' || item.category === 'Income';
            return (
              <div key={index} className="py-3 flex items-center justify-between hover:bg-white/35 rounded-xl px-2 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-xl shrink-0 border ${isInc ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                    {isInc ? <Plus className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.item}</h4>
                    <p className="text-[9px] text-slate-400 font-mono">
                      {item.date} • {item.accountPaidFrom} • <span className="bg-white/60 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">{item.category}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-black ${isInc ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {isInc ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                  {item.isPending && (
                    <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 border border-amber-200/40 rounded-full font-black uppercase tracking-wide">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {history.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs bg-white/45 rounded-2xl border border-dashed border-slate-200">
              No transactions logged yet. Use Quick Actions or CSV import to add spending history.
            </div>
          )}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // Redesigned Premium Apple-style Sub-rendering Components (7-12)
  // -------------------------------------------------------------

  // 7. Money Insights (Combined Smart Insights & Payoff Progress)
  const renderMoneyInsights = () => {
    const extraDebtVal = parseFloat(simExtraDebt) || 0;
    const extraIncomeVal = parseFloat(simExtraIncome) || 0;

    const getDebtColorAndStyle = (balance: number) => {
      if (balance <= 500) return { stroke: '#10b981', text: 'text-emerald-700', bg: 'bg-emerald-500/5', border: 'border-emerald-200/40', glow: false };
      if (balance <= 2000) return { stroke: '#eab308', text: 'text-yellow-700', bg: 'bg-yellow-500/5', border: 'border-yellow-200/40', glow: false };
      if (balance <= 5000) return { stroke: '#f97316', text: 'text-orange-700', bg: 'bg-orange-500/5', border: 'border-orange-200/40', glow: false };
      return { stroke: '#ef4444', text: 'text-rose-700', bg: 'bg-rose-500/5', border: 'border-rose-200/40', glow: false };
    };

    const sortedDebtsForStrategy = [...activeDebtsList].sort((a, b) => {
      if (payoffStrategy === 'snowball') {
        return a.balance - b.balance;
      } else {
        return b.apr - a.apr;
      }
    });

    const dynamicInsightTopics = [
      {
        q: 'Why is Vault/Bills $250 this week?',
        a: 'The bill vault is optimized dynamically to exactly match the sum of upcoming bills due within the next 15 days. This keeps your cash liquid while ensuring no transfers fail.'
      },
      {
        q: 'Why is Buffer increasing?',
        a: `Your current operating rules require building emergency liquid reserves up to your target of ${formatCurrency(parseFloat(simBufferTarget) || 1000)}. This shields you from needing to tap high-interest debts in a crunch.`
      },
      {
        q: 'Why is this debt prioritized first?',
        a: payoffStrategy === 'snowball' 
          ? `You have active SNOWBALL protocol. We prioritize clearing your lowest balance debt (${activeDebtsList.length > 0 ? activeDebtsList.sort((a,b)=>a.balance - b.balance)[0].name : 'none'}) first. This eliminates individual accounts rapidly to secure psychological wins and free up monthly cash-flow minimums!`
          : `You have active AVALANCHE protocol. We prioritize paying down your highest APR debt (${activeDebtsList.length > 0 ? activeDebtsList.sort((a,b)=>b.apr - a.apr)[0].name : 'none'}) first. This mathematically minimizes total compound interest accumulation and speeds up your path to debt freedom!`
      }
    ];

    return (
      <div className="glass-panel rounded-3xl p-6 border border-indigo-100/50 bg-white/50 space-y-6 animate-fade-in" id="home-money-insights">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
              <h3 className="text-xs font-mono font-bold text-slate-405 uppercase tracking-wider">Money Insights</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">AI-driven financial strategy integrated side-by-side with payoff modeling</p>
          </div>
          <button
            onClick={() => setCurrentTab('debts')}
            className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 hover:bg-indigo-200 py-1.5 px-3.5 rounded-full border border-indigo-200/30 cursor-pointer self-start sm:self-auto transition-colors"
          >
            Optimize Trajectories
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Smart Strategy Insights */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">AI Strategy Insights</span>
            <div className="space-y-2.5">
              {dynamicInsightTopics.map((top, idx) => {
                const isActive = activeInsightIndex === idx;
                return (
                  <div 
                    key={idx}
                    onClick={() => setActiveInsightIndex(isActive ? null : idx)}
                    className={`p-4 rounded-2xl border bg-white/75 shadow-3xs cursor-pointer transition-all duration-250 ${
                      isActive 
                        ? 'border-indigo-200 bg-indigo-50/5 ring-1 ring-indigo-200/35' 
                        : 'border-slate-200/50 hover:border-indigo-300 hover:bg-white/95'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                        <span className={`text-xs font-bold leading-snug ${isActive ? 'text-indigo-800' : 'text-slate-850'}`}>{top.q}</span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 duration-200 ${isActive ? 'rotate-180 text-indigo-600' : ''}`} />
                    </div>
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-xs text-slate-600 leading-relaxed mt-2.5 pt-2.5 border-t border-slate-100 font-medium overflow-hidden"
                        >
                          {top.a}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Interest Saver Insight Box */}
            <div className="p-4 rounded-2xl border border-indigo-100/40 bg-indigo-50/10 space-y-2">
              <span className="text-[9px] font-mono font-bold text-indigo-700 bg-indigo-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider">Interest Burn Calculator</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Switching your target priority dynamically updates your cascade order. Currently, you are scheduled to burn interest at a rate of <strong className="text-indigo-800 font-bold">11.4% blended APR</strong>.
              </p>
              <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1.5 pt-1">
                <span>Active Priority Sequence:</span>
                <span className="bg-white border border-indigo-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                  {sortedDebtsForStrategy.map(d => d.name).join(' ➔ ') || 'No outstanding debt'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Payoff Progress & What-If Slider Modeling */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Payoff Speed & Strategy</span>
              
              {/* Snowball vs Avalanche Segmented Toggle */}
              <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/50 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPayoffStrategy('snowball')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    payoffStrategy === 'snowball' 
                      ? 'bg-white text-slate-800 shadow-3xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Snowball (Bal)
                </button>
                <button
                  type="button"
                  onClick={() => setPayoffStrategy('avalanche')}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    payoffStrategy === 'avalanche' 
                      ? 'bg-white text-slate-800 shadow-3xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Avalanche (APR)
                </button>
              </div>
            </div>

            {/* Sorted Debt Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedDebtsForStrategy.map((d) => {
                const style = getDebtColorAndStyle(d.balance);
                const payoffProgress = Math.round(100 - (d.balance / (d.balance + 3500)) * 100);

                return (
                  <div key={d.name} className={`flex items-center gap-3 p-3.5 rounded-2xl border bg-white/75 ${style.border} hover:shadow-3xs transition-shadow`}>
                    <CircularProgress
                      value={payoffProgress}
                      size={44}
                      strokeWidth={4.5}
                      strokeColor={style.stroke}
                      trailColor="#f8fafc"
                    >
                      <span className="text-[9px] font-mono font-black text-slate-700">
                        {payoffProgress}%
                      </span>
                    </CircularProgress>
                    
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline text-[11px] font-bold gap-1">
                        <span className="text-slate-800 truncate font-sans">{d.name}</span>
                        <span className="text-slate-900 font-mono">{formatCurrency(d.balance)}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono flex justify-between">
                        <span>{highestAprApr(d.apr)}% APR</span>
                        <span>Min: {formatCurrency(d.minimumPayment)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sortedDebtsForStrategy.length === 0 && (
                <div className="sm:col-span-2 py-6 text-center text-emerald-600 text-[11px] font-bold bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/10">
                  Absolutely Debt Free! All targets are fully archived.
                </div>
              )}
            </div>

            {/* Slider Projections and comparisons */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/50 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>Extra Attack</span>
                    <span className="font-mono text-indigo-600">{formatCurrency(extraDebtVal)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    value={simExtraDebt}
                    onChange={e => setSimExtraDebt(e.target.value)}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>Buffer Cushion</span>
                    <span className="font-mono text-indigo-600">{formatCurrency(parseFloat(simBufferTarget) || 1000)}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="250"
                    value={simBufferTarget}
                    onChange={e => setSimBufferTarget(e.target.value)}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>Extra Income</span>
                    <span className="font-mono text-emerald-600">{formatCurrency(extraIncomeVal)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2000"
                    step="100"
                    value={simExtraIncome}
                    onChange={e => setSimExtraIncome(e.target.value)}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
                  />
                </div>
              </div>

              {/* Freedom timeline indicator */}
              <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  <span>Freedom Pace Timeline</span>
                  <span className="text-emerald-400 font-black">{simulatedMonthsToFreedom} Months</span>
                </div>
                
                <div className="space-y-1.5 text-[9px]">
                  <div className="flex justify-between text-slate-400">
                    <span>Baseline Strategy: {estimatedMonthsToFreedom} Mo</span>
                    <span className="text-emerald-400">
                      {monthsDifference > 0 ? `Saved ${monthsDifference} Months!` : 'No Change'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                    <div 
                      className="absolute left-0 top-0 h-full bg-slate-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(10, Math.min(100, (estimatedMonthsToFreedom / 36) * 100))}%` }}
                    />
                    <div 
                      className="absolute left-0 top-0 h-full bg-linear-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(10, Math.min(100, (simulatedMonthsToFreedom / 36) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 8. Recent Achievements (Renamed from Savings Progress / Challenges)
  const renderRecentAchievements = () => {
    const bufferTarget = parseFloat(simBufferTarget) || 1000;
    const isBufferMet = bufferFund >= bufferTarget;

    // Completed goals
    const completedGoalsList = goals.filter(g => g.currentAmount >= g.targetAmount);
    const activeGoalsCount = goals.filter(g => g.currentAmount < g.targetAmount).length;

    return (
      <div className="glass-panel rounded-3xl p-6 border border-amber-200 bg-amber-500/5 space-y-4 animate-fade-in" id="home-recent-achievements">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600 animate-bounce" />
              <h3 className="text-xs font-mono font-black text-amber-800 uppercase tracking-wider">Recent Achievements & Streaks</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Your celebrated milestones, savings habits, and payoff streaks</p>
          </div>
          <button
            onClick={() => setShowSimulator(true)}
            className="text-[10px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 py-1.5 px-3.5 rounded-full border border-amber-200/30 transition-colors cursor-pointer shadow-3xs"
          >
            Allocate Paycheck
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Achievement 1: Buffer Safety Cushion */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3.5 shadow-3xs animate-fade-in">
            <div className={`p-2.5 rounded-xl shrink-0 ${isBufferMet ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Safety Buffer Cushion</span>
              <span className="text-xs font-bold text-slate-800 block">
                {isBufferMet ? 'Cushion Fully Target Met!' : 'Building Cushion...'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                {isBufferMet ? `Saved target of ${formatCurrency(bufferTarget)}` : `${formatCurrency(bufferFund)} of ${formatCurrency(bufferTarget)} saved`}
              </span>
            </div>
          </div>

          {/* Achievement 2: Active Savings Streak */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3.5 shadow-3xs animate-fade-in">
            <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Savings Habits Streak</span>
              <span className="text-xs font-bold text-slate-800 block">5 Month Active Streak!</span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Consistent monthly ledger contributions
              </span>
            </div>
          </div>

          {/* Achievement 3: Completed Milestones */}
          <div className="p-4 rounded-2xl bg-white border border-slate-100 flex items-start gap-3.5 shadow-3xs animate-fade-in">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Completed Milestones</span>
              <span className="text-xs font-bold text-slate-800 block">
                {completedGoalsList.length > 0 
                  ? `${completedGoalsList.length} Goals Achieved!` 
                  : `${activeGoalsCount} Goals Active`}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block truncate">
                {completedGoalsList.length > 0 
                  ? `Last: ${completedGoalsList[completedGoalsList.length - 1].name}` 
                  : 'Establish a new milestone'}
              </span>
            </div>
          </div>
        </div>

        {/* Inline Paycheck Simulator */}
        <AnimatePresence>
          {showSimulator && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-5 rounded-2xl bg-indigo-50/10 border border-indigo-200/50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Paycheck Allocation Automated Engine</h4>
                <button onClick={() => setShowSimulator(false)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Execute standard allocation rules sequentially: <b>Life Checked Spending</b> ➔ <b>Vault Outstanding Bills</b> ➔ <b>Emergency Buffer Fund</b> ➔ <b>Vacation Fund</b> ➔ <b>Freedom snowball pool</b>.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 p-4 bg-white/70 rounded-xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-slate-500 block">Enter Paycheck Payload</span>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="number"
                      value={simPaycheckAmount}
                      onChange={e => setSimPaycheckAmount(e.target.value)}
                      placeholder="3000"
                      className="w-full pl-7 bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={calculateSimulatedAllocation}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition-all mt-2"
                  >
                    Run Allocation Logic
                  </button>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 block">Calculated Distributions</span>
                  {simResults ? (
                    <div className="space-y-3">
                      <div className="bg-white/80 p-3.5 rounded-xl border border-indigo-100 text-[10px] text-slate-600 leading-relaxed max-h-32 overflow-y-auto">
                        {simResults.breakdownReport.map((rep, idx) => (
                          <div key={idx} className="flex gap-2 items-start py-0.5">
                            <span className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <span>{rep}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end gap-2 text-xs">
                        <button onClick={() => setSimResults(null)} className="text-slate-400 hover:underline">
                          Reset
                        </button>
                        <button
                          onClick={commitSimulatedPaycheck}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-3.5 rounded-full font-bold shadow-sm cursor-pointer"
                        >
                          Commit to My Wallets
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-400 text-[10px] bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1">
                      Provide a paycheck amount to see distributed allocations.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // 9. Goals Progress
  const renderGoalsProgress = () => {
    return (
      <div className="glass-panel rounded-3xl p-6 border border-purple-200/40 bg-purple-500/5 shadow-xs animate-fade-in" id="home-goals-progress">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-mono font-black text-purple-700 uppercase tracking-wider">Savings Milestones</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Live progress towards targeted saving goals</p>
          </div>
          <button
            onClick={() => setCurrentTab('goals')}
            className="text-[10px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 py-1.5 px-3.5 rounded-full transition-colors border border-purple-200/30 cursor-pointer shadow-2xs"
          >
            All Goals
          </button>
        </div>

        <div className="space-y-4">
          {goals.slice(0, 4).map((g) => {
            const percent = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
            const isCompleted = g.currentAmount >= g.targetAmount;

            return (
              <div key={g.name} className="flex items-center gap-4 p-4 rounded-2xl border border-purple-100 bg-white/70 hover:shadow-xs cursor-pointer hover:bg-white/95 transition-all">
                <CircularProgress
                  value={percent}
                  size={52}
                  strokeWidth={5}
                  strokeColor={isCompleted ? '#10b981' : '#a855f7'}
                  trailColor="#f1f5f9"
                  glow={isCompleted || percent > 75}
                >
                  <span className="text-[10px] font-mono font-black text-slate-700">
                    {Math.round(percent)}%
                  </span>
                </CircularProgress>

                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-baseline text-xs font-bold">
                    <span className="text-slate-800 font-sans">{g.name}</span>
                    <span className={isCompleted ? 'text-emerald-600 font-bold' : 'text-purple-600 font-mono font-bold'}>
                      {formatCurrency(g.currentAmount)} <span className="text-[10px] text-slate-400 font-normal">/ {formatCurrency(g.targetAmount)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>Weekly Transfer: {formatCurrency(g.weeklyTransfer)}</span>
                    <span>Monthly: {formatCurrency(g.monthlyTransfer)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 10. Financial Health
  // 10. Financial Health Rating (Redesigned per request)
  const renderFinancialHealth = () => {
    // Determine the lowest metric to derive a single, laser-focused recommendation
    const metrics = [
      { name: 'Emergency Cushion', score: healthScoreDetails.moneyAvailableScore, rec: 'Add extra funds to your Safety Buffer to secure your emergency cushion milestone.' },
      { name: 'Envelopes Budgeting', score: healthScoreDetails.spendingPlansScore, rec: 'Audit active envelope spending and trim auxiliary categories to stay inside target budgets.' },
      { name: 'Active Debt Payoffs', score: healthScoreDetails.debtProgressScore, rec: 'Activate a Snowball cascade injection to lower outstanding high-APR debt principals.' },
      { name: 'Savings Milestones', score: healthScoreDetails.savingsProgressScore, rec: 'Direct your sequential paycheck surplus to accelerate active saving milestones.' },
      { name: 'Cash Flow Buffer', score: healthScoreDetails.upcomingCashFlowScore, rec: 'Deposit funds into the Hub Vault to fully cover upcoming outstanding bills.' }
    ];

    // Sort to get the lowest score metric
    const lowestMetric = [...metrics].sort((a, b) => a.score - b.score)[0];
    const healthTrend = healthScoreDetails.score >= 80 ? '▲ Up +4.2% (Strong Pace)' : healthScoreDetails.score >= 60 ? '▲ Stable (+1.5%)' : '▼ Action needed to stem bleed';

    return (
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 bg-white/50 animate-fade-in" id="home-financial-health">
        <div className="flex items-center gap-1.5 mb-1">
          <Activity className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Financial Health Index</h3>
        </div>
        <p className="text-xs text-slate-500 mb-6 font-medium">Overall rating and core strategic directive</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Interactive Gauge */}
          <FinancialHealthGauge
            score={healthScoreDetails.score}
            grade={healthScoreDetails.grade}
            gradeLabel={healthScoreDetails.gradeLabel}
          />

          {/* Right: Focused Strategic Details */}
          <div className="space-y-4">
            {/* Trend Indicator */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">Historical Trend</span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${healthScoreDetails.score >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                {healthTrend}
              </span>
            </div>

            {/* Explanation paragraph */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Health Synthesis</span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Your financial resilience is rated <strong className="text-slate-800">{healthScoreDetails.gradeLabel}</strong> at <strong className="text-slate-800">{healthScoreDetails.score}%</strong>. This score represents a blended balance across emergency cash cushions, envelope budget discipline, debt milestones, and cash-flow safety margins.
              </p>
            </div>

            {/* Laser-Focused Single Recommendation */}
            <div className="p-4 rounded-2xl border border-indigo-100/50 bg-indigo-50/5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Primary Strategic Directive</span>
              </div>
              <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                {lowestMetric.rec}
              </p>
              <div className="text-[10px] text-slate-400 font-medium">
                Target area: <span className="text-indigo-600 font-semibold">{lowestMetric.name}</span> (currently at {lowestMetric.score}%)
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 11. Quick Actions
  const renderQuickActions = () => {
    const allActions = [
      { name: 'Add Income', icon: Plus, desc: 'Record fresh cash inflow' },
      { name: 'Add Expense', icon: Minus, desc: 'Log immediate spending' },
      { name: 'Move Money', icon: ArrowRightLeft, desc: 'Rebalance across checking/savings' },
      { name: 'Pay Debt', icon: Zap, desc: 'Inject funds into high APR debt' },
      { name: 'Import Activity', icon: Upload, desc: 'Upload CSV statement file' },
      { name: 'Connect Bank', icon: RefreshCw, desc: 'Synchronize live bank feed' },
      { name: 'Create Goal', icon: Trophy, desc: 'Launch a new savings milestone' },
      { name: 'Run Simulation', icon: Play, desc: 'Model future paycheck allocation' },
      { name: 'Transfer Between Funds', icon: ArrowRightLeft, desc: 'Move capital between custom reserves' },
      { name: 'Export Data', icon: ArrowUpRight, desc: 'Download local ledger CSV/JSON' },
      { name: 'Settings', icon: Sliders, desc: 'Configure system defaults and rules' }
    ];

    // Filter to get pinned actions (fallback to first 4 if stored values are invalid)
    let pinnedList = allActions.filter(a => pinnedActions.includes(a.name));
    if (pinnedList.length !== 4) {
      pinnedList = allActions.slice(0, 4);
    }

    // Unpinned list
    const unpinnedList = allActions.filter(a => !pinnedActions.includes(a.name));

    const executeAction = (actionName: string) => {
      if (actionName === 'Add Income') {
        setShowAction('income');
        setActionCategory('Salary');
      } else if (actionName === 'Add Expense') {
        setShowAction('expense');
        setActionCategory('Food');
      } else if (actionName === 'Move Money') {
        setShowAction('move');
        setActionCategory('Account Transfers');
      } else if (actionName === 'Pay Debt') {
        setShowAction('pay');
        setActionCategory('Debt Paydown');
      } else if (actionName === 'Import Activity') {
        setShowCsvImport(true);
      } else if (actionName === 'Connect Bank') {
        if (hasLinkedBank) {
          handleSyncBankFeed();
        } else {
          handleConnectBank();
        }
      } else if (actionName === 'Create Goal') {
        setCurrentTab('goals');
      } else if (actionName === 'Run Simulation') {
        setShowSimulator(true);
      } else if (actionName === 'Transfer Between Funds') {
        setShowAction('move');
        setActionCategory('Fund Transfer');
      } else if (actionName === 'Export Data') {
        setCurrentTab('settings');
      } else if (actionName === 'Settings') {
        setCurrentTab('settings');
      }
    };

    const handleTogglePin = (actionName: string) => {
      if (pinnedActions.includes(actionName)) {
        if (pinnedActions.length <= 1) return; // keep at least 1
        const updated = pinnedActions.filter(n => n !== actionName);
        setPinnedActions(updated);
        localStorage.setItem('finance_command_center_pinned_actions', JSON.stringify(updated));
      } else {
        let updated = [...pinnedActions];
        if (updated.length >= 4) {
          // Remove the first one to make room for exactly 4
          updated.shift();
        }
        updated.push(actionName);
        setPinnedActions(updated);
        localStorage.setItem('finance_command_center_pinned_actions', JSON.stringify(updated));
      }
    };

    return (
      <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 bg-white/50 space-y-4 animate-fade-in" id="home-quick-actions">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h3>
            <p className="text-xs text-slate-500 font-medium">Instantly launch manual ledger tasks or sync operations</p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsCustomizingPins(!isCustomizingPins)}
              className={`text-[10px] font-bold py-1 px-3 rounded-full border transition-all cursor-pointer ${
                isCustomizingPins 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-slate-100 text-slate-600 border-slate-200/60 hover:bg-slate-200'
              }`}
            >
              {isCustomizingPins ? 'Done Pinning' : 'Customize Pins'}
            </button>
            <button
              onClick={() => setIsActionsExpanded(!isActionsExpanded)}
              className="text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 py-1.5 px-3 rounded-full border border-slate-200/60 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isActionsExpanded ? 'Collapse' : 'See More'}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isActionsExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {isCustomizingPins ? (
          <div className="p-4 bg-blue-500/5 border border-blue-100 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono font-bold text-blue-700 uppercase tracking-wider block">Pin Exactly 4 Actions to Core Tray</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {allActions.map((act) => {
                const Icon = act.icon;
                const isPinned = pinnedActions.includes(act.name);
                return (
                  <button
                    key={act.name}
                    onClick={() => handleTogglePin(act.name)}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isPinned 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{act.name}</span>
                    </div>
                    <span className="text-[10px] font-bold">{isPinned ? '★' : '☆'}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pinned actions tray */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {pinnedList.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.name}
                    onClick={() => executeAction(act.name)}
                    className="flex flex-col items-start gap-2.5 p-4 bg-white hover:bg-blue-500/5 border border-slate-200/60 hover:border-blue-300 text-slate-800 hover:text-blue-700 rounded-2xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer text-left relative overflow-hidden group"
                  >
                    <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold">{act.name}</span>
                      <span className="block text-[9px] text-slate-400 font-medium group-hover:text-blue-600/80 mt-0.5 leading-normal">{act.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Collapsible Expanded Actions tray */}
            <AnimatePresence>
              {isActionsExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 border-t border-slate-200/40">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-3">Additional Actions</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {unpinnedList.map((act) => {
                        const Icon = act.icon;
                        return (
                          <button
                            key={act.name}
                            onClick={() => executeAction(act.name)}
                            className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50 border border-slate-200/60 hover:border-slate-300 text-slate-800 rounded-2xl text-xs font-semibold shadow-2xs transition-all cursor-pointer text-left"
                          >
                            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="block font-bold truncate">{act.name}</span>
                              <span className="block text-[8px] text-slate-400 font-medium truncate mt-0.5 leading-none">{act.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Dropdown Action Form for current operation */}
        <AnimatePresence>
          {showAction && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 rounded-2xl border border-blue-200 bg-blue-50/10 overflow-hidden mt-3"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Quick Action: {showAction === 'pay' ? 'Execute Payoff Plan' : `${showAction} Entry`}
                </h4>
                <button onClick={() => setShowAction(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleQuickAction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={actionAmount}
                    onChange={e => setActionAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {showAction !== 'income' && showAction !== 'move' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Source Account</label>
                    <select
                      value={actionAccount}
                      onChange={e => setActionAccount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
                    >
                      {accounts.map(a => (
                        <option key={a.name} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                      ))}
                    </select>
                  </div>
                )}

                {showAction === 'income' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Destination Wallet</label>
                    <select
                      value={actionAccount}
                      onChange={e => setActionAccount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
                    >
                      {accounts.map(a => (
                        <option key={a.name} value={a.name}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {showAction === 'move' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">From Wallet</label>
                      <select
                        value={actionAccount}
                        onChange={e => setActionAccount(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
                      >
                        {accounts.map(a => (
                          <option key={a.name} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">To Wallet</label>
                      <select
                        value={destAccount}
                        onChange={e => setDestAccount(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
                      >
                        {accounts.map(a => (
                          <option key={a.name} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {showAction === 'pay' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Target Debt</label>
                    <select
                      value={actionDebt}
                      onChange={e => setActionDebt(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
                    >
                      <option value="">-- Choose Active Debt --</option>
                      {activeDebtsList.map(d => (
                        <option key={d.name} value={d.name}>{d.name} ({formatCurrency(d.balance)})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category Tag</label>
                  <input
                    type="text"
                    value={actionCategory}
                    onChange={e => setActionCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-1 md:col-span-4">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Memo Notes</label>
                  <input
                    type="text"
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder="Details of transaction..."
                    className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAction(null)}
                    className="py-1.5 px-4 text-xs text-slate-500 hover:bg-slate-100 rounded-full font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-sm"
                  >
                    Apply Change
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-8 pb-12 animate-fade-in" id="dashboard-tab-content">
      {renderGreeting()}
      {renderDailyBriefing()}
      {renderTodayFocus()}
      {renderMoneyAvailable()}
      {renderQuickActions()}
      {renderMonthlyOutlook()}
      {renderUpcomingBills()}
      {renderRecentActivity()}
      {renderMoneyInsights()}
      {renderGoalsProgress()}
      {renderFinancialHealth()}
      {renderRecentAchievements()}

      {false && (<>

      {/* -------------------------------------------------------------
          B) DYNAMIC BANNER: SYSTEM PHASE STATUS
         ------------------------------------------------------------- */}
      <div 
        className={`p-5 rounded-3xl border ${currentPhase.badgeColor} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs backdrop-blur-md transition-all duration-300`}
        id="phase-strategy-alert"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-white/60 rounded-2xl text-slate-800 border border-white/80 shadow-xs shrink-0">
            <Activity className="w-5.5 h-5.5 animate-pulse text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white/80 py-0.5 px-2 rounded-full border border-slate-200">
              {currentPhase.name}
            </span>
            <h3 className="font-display font-bold text-lg text-slate-800 mt-1">{currentPhase.focus}</h3>
            <p className="text-xs text-slate-700 mt-0.5 max-w-2xl leading-relaxed">{currentPhase.desc}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setCurrentTab('roadmap')}
            className="flex items-center justify-center gap-1.5 py-2 px-4.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200"
            id="open-roadmap-from-banner-btn"
          >
            <Compass className="w-3.5 h-3.5" />
            View Financial Roadmap
          </button>
          <button
            onClick={() => setShowSimulator(true)}
            className="flex items-center justify-center gap-1.5 py-2 px-4.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200"
            id="trigger-paycheck-simulation-btn"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Paycheck Engine
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------
          C) THE LIQUID GLASS MASTER METRIC CARDS
         ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Fuel Tank Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[210px] hover:shadow-lg hover:border-blue-300/60 group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono font-bold text-blue-700 tracking-wider uppercase">Fuel Tank ⛽</span>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight mt-1 group-hover:scale-[1.01] transition-transform origin-left">
                {formatCurrency(totalFunds)}
              </h2>
            </div>
            <div className="p-2.5 bg-blue-500/15 rounded-2xl text-blue-700 shadow-sm border border-white/40">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
          </div>
          
          <div className="mt-5 pt-3 border-t border-slate-200/50 grid grid-cols-5 gap-1 text-[10px] text-slate-700 font-bold">
            <div className="text-center">
              <span className="block text-slate-900 font-mono text-[11px] font-bold">{formatCurrency(lifeChecking)}</span>
              <span className="text-slate-400 font-medium">Life 🧍</span>
            </div>
            <div className="text-center border-l border-slate-200/50">
              <span className="block text-slate-900 font-mono text-[11px] font-bold">{formatCurrency(vaultBills)}</span>
              <span className="text-slate-400 font-medium">Hub 📦</span>
            </div>
            <div className="text-center border-l border-slate-200/50">
              <span className="block text-slate-900 font-mono text-[11px] font-bold">{formatCurrency(bufferFund)}</span>
              <span className="text-slate-400 font-medium">Safety 🛟</span>
            </div>
            <div className="text-center border-l border-slate-200/50">
              <span className="block text-slate-900 font-mono text-[11px] font-bold">{formatCurrency(cashBalance)}</span>
              <span className="text-slate-400 font-medium">Cash</span>
            </div>
            <div className="text-center border-l border-slate-200/50">
              <span className="block text-slate-900 font-mono text-[11px] font-bold">{formatCurrency(freedomSavings + vacationFund)}</span>
              <span className="text-slate-400 font-medium">Savings</span>
            </div>
          </div>
        </div>

        {/* 2. Boss Battles Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[210px] hover:shadow-lg hover:border-rose-300/60 group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono font-bold text-rose-700 tracking-wider uppercase">Boss Battles 👾</span>
              <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight mt-1 group-hover:scale-[1.01] transition-transform origin-left">
                {formatCurrency(activeDebtsTotal)}
              </h2>
            </div>
            <div className="p-2.5 bg-rose-500/15 rounded-2xl text-rose-700 shadow-sm border border-white/40">
              <AlertTriangle className="w-5.5 h-5.5" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-[10px] font-mono text-slate-600 font-bold">
              <span>Attack Power Freed: {formatCurrency(freedMonthlyRollover)}/mo</span>
              <span className="text-emerald-600 font-extrabold">{estimatedMonthsToFreedom > 0 ? `${estimatedMonthsToFreedom} Months to Freedom` : 'DEBT FREE!'}</span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-150 rounded-full overflow-hidden border border-white/50">
              <div 
                className="h-full bg-linear-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-700" 
                style={{ width: `${debts.length > 0 ? (paidDebtsList.length / debts.length) * 100 : 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>{paidDebtsList.length} of {debts.length} Bosses Defeated</span>
              <span>{debts.length > 0 ? Math.round((paidDebtsList.length / debts.length) * 100) : 100}% Cleared</span>
            </div>
          </div>
        </div>

        {/* 3. Today Pulse Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[210px] hover:shadow-lg hover:border-indigo-300/60 group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-700 tracking-wider uppercase">Today Pulse Alert</span>
              <h3 className="text-lg font-display font-extrabold text-slate-900 mt-1 leading-tight">
                {pulseAlerts.length > 0 ? `${pulseAlerts.length} Active System Alerts` : 'All Systems Perfect'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Urgent operations requiring direct oversight</p>
            </div>
            <div className="p-2.5 bg-indigo-500/15 rounded-2xl text-indigo-700 shadow-sm border border-white/40">
              <Bell className="w-5.5 h-5.5 animate-bounce" />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {pulseAlerts.slice(0, 2).map((al, i) => (
              <div key={i} className="flex gap-2 items-start bg-white/50 p-2 rounded-xl border border-slate-200/60">
                <div className={`w-2 h-2 mt-1 rounded-full ${al.type === 'danger' ? 'bg-rose-500' : al.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="text-[10px] leading-tight text-slate-700">
                  <span className="font-bold text-slate-900 block">{al.label}</span>
                  {al.message}
                </div>
              </div>
            ))}
            {pulseAlerts.length === 0 && (
              <div className="flex gap-2 items-center bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-800 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                No pending billing bottlenecks detected this cycle!
              </div>
            )}
          </div>
        </div>

        {/* 4. Financial Health Score Card */}
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[210px] hover:shadow-lg hover:border-emerald-300/60 group">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-mono font-bold text-emerald-700 tracking-wider uppercase">Financial Health 🎯</span>
              <div className="flex items-baseline gap-1 mt-1">
                <h2 className="text-3xl md:text-4xl font-display font-black text-slate-900 tracking-tight group-hover:scale-[1.01] transition-transform origin-left animate-pulse">
                  {healthScoreDetails.score}
                </h2>
                <span className="text-sm font-bold text-slate-400">/100</span>
              </div>
            </div>
            <div className={`p-1.5 px-2 rounded-xl font-mono text-[9px] font-bold border shadow-xs flex items-center gap-1 ${healthScoreDetails.gradeColor}`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{healthScoreDetails.grade} {healthScoreDetails.gradeLabel}</span>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            <div className="w-full h-2.5 bg-slate-150 rounded-full overflow-hidden border border-white/50">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${
                  healthScoreDetails.score >= 80 ? 'bg-linear-to-r from-emerald-500 to-teal-500' :
                  healthScoreDetails.score >= 60 ? 'bg-linear-to-r from-blue-500 to-indigo-500' :
                  'bg-linear-to-r from-amber-500 to-rose-500'
                }`}
                style={{ width: `${healthScoreDetails.score}%` }}
              />
            </div>

            {/* Mini matrix layout for the 5 parameters */}
            <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-slate-200/40">
              <div className="text-center" title={`Emergency Cushion: ${healthScoreDetails.moneyAvailableScore}%`}>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${healthScoreDetails.moneyAvailableScore >= 85 ? 'bg-emerald-500' : healthScoreDetails.moneyAvailableScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-[8px] font-mono font-extrabold text-slate-400 block tracking-tight">Cushion</span>
              </div>
              <div className="text-center" title={`Spending Envelopes: ${healthScoreDetails.spendingPlansScore}%`}>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${healthScoreDetails.spendingPlansScore >= 85 ? 'bg-emerald-500' : healthScoreDetails.spendingPlansScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-[8px] font-mono font-extrabold text-slate-400 block tracking-tight">Budgets</span>
              </div>
              <div className="text-center" title={`Debt Payoffs: ${healthScoreDetails.debtProgressScore}%`}>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${healthScoreDetails.debtProgressScore >= 85 ? 'bg-emerald-500' : healthScoreDetails.debtProgressScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-[8px] font-mono font-extrabold text-slate-400 block tracking-tight">Debts</span>
              </div>
              <div className="text-center" title={`Savings Goals: ${healthScoreDetails.savingsProgressScore}%`}>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${healthScoreDetails.savingsProgressScore >= 85 ? 'bg-emerald-500' : healthScoreDetails.savingsProgressScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-[8px] font-mono font-extrabold text-slate-400 block tracking-tight">Goals</span>
              </div>
              <div className="text-center" title={`Cash Flow Buffer: ${healthScoreDetails.upcomingCashFlowScore}%`}>
                <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${healthScoreDetails.upcomingCashFlowScore >= 85 ? 'bg-emerald-500' : healthScoreDetails.upcomingCashFlowScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`} />
                <span className="text-[8px] font-mono font-extrabold text-slate-400 block tracking-tight">Flow</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          D) THE QUICK ACTIONS ROW
         ------------------------------------------------------------- */}
      <div className="glass-panel rounded-3xl p-5" id="quick-actions-card">
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Actions Console</h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
           <button
             onClick={() => { setShowAction('expense'); setActionCategory('Food'); }}
             className="flex items-center justify-center gap-2 py-3 px-4 bg-white/70 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-300 text-slate-800 hover:text-rose-700 rounded-2xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150"
             id="btn-action-expense"
           >
             <Minus className="w-4 h-4 text-rose-500" />
             Add Expense
           </button>
           <button
             onClick={() => { setShowAction('income'); setActionCategory('Salary'); }}
             className="flex items-center justify-center gap-2 py-3 px-4 bg-white/70 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:text-emerald-700 rounded-2xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150"
             id="btn-action-income"
           >
             <Plus className="w-4 h-4 text-emerald-500" />
             Add Income
           </button>
           <button
             onClick={() => { setShowAction('pay'); setActionCategory('Debt Paydown'); }}
             className="flex items-center justify-center gap-2 py-3 px-4 bg-white/70 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-300 text-slate-800 hover:text-purple-700 rounded-2xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150"
             id="btn-action-pay"
           >
             <Zap className="w-4 h-4 text-purple-500" />
             Pay Off Debt
           </button>
           <button
             onClick={() => { setShowAction('move'); setActionCategory('Account Transfers'); }}
             className="flex items-center justify-center gap-2 py-3 px-4 bg-white/70 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-slate-800 hover:text-blue-700 rounded-2xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150"
             id="btn-action-move"
           >
             <ArrowRightLeft className="w-4 h-4 text-blue-500" />
             Move Money
           </button>
           <button
             onClick={() => setShowCsvImport(true)}
             className="flex items-center justify-center gap-2 py-3 px-4 bg-white/70 hover:bg-orange-50 border border-slate-200/80 hover:border-orange-300 text-slate-800 hover:text-orange-700 rounded-2xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all duration-150"
             id="btn-action-csv-import"
           >
             <Upload className="w-4 h-4 text-orange-500" />
             Add Bank Activity
           </button>
           <button
             onClick={() => {
               const el = document.getElementById('what-if-simulation-section');
               if (el) el.scrollIntoView({ behavior: 'smooth' });
             }}
             className="col-span-2 sm:col-span-1 lg:col-span-1 flex items-center justify-center gap-2 py-3 px-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-xs hover:shadow-md transition-all duration-150"
             id="btn-action-simulate"
           >
             <Sliders className="w-4 h-4" />
             Simulate What-If
           </button>
         </div>
      </div>

      {/* -------------------------------------------------------------
          E) INTERACTIVE QUICK ACTION FORM DROP-DOWN PANEL
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showAction && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel rounded-3xl p-6 border-blue-200 bg-blue-50/10 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-base text-slate-800 capitalize flex items-center gap-1.5">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Quick Money Flow Form: {showAction === 'pay' ? 'Execute Payoff Plan Paydown' : `${showAction} entry`}
              </h3>
              <button onClick={() => setShowAction(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <form onSubmit={handleQuickAction} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={actionAmount}
                  onChange={e => setActionAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm font-semibold focus:outline-none focus:border-blue-500 shadow-xs"
                  id="quick-amount-input"
                />
              </div>

              {showAction !== 'income' && showAction !== 'move' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Source Account</label>
                  <select
                    value={actionAccount}
                    onChange={e => setActionAccount(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 shadow-xs"
                    id="quick-account-select"
                  >
                    {accounts.map(a => (
                      <option key={a.name} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              {showAction === 'income' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Destination Wallet</label>
                  <select
                    value={actionAccount}
                    onChange={e => setActionAccount(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 shadow-xs"
                    id="quick-dest-select"
                  >
                    {accounts.map(a => (
                      <option key={a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {showAction === 'move' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">From Money Space</label>
                    <select
                      value={actionAccount}
                      onChange={e => setActionAccount(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 shadow-xs"
                      id="quick-from-select"
                    >
                      {accounts.map(a => (
                        <option key={a.name} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">To Money Space</label>
                    <select
                      value={destAccount}
                      onChange={e => setDestAccount(e.target.value)}
                      className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 shadow-xs"
                      id="quick-dest-move-select"
                    >
                      {accounts.map(a => (
                        <option key={a.name} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {showAction === 'pay' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Target Debt Liability</label>
                  <select
                    value={actionDebt}
                    onChange={e => setActionDebt(e.target.value)}
                    className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-blue-500 shadow-xs"
                    id="quick-debt-select"
                  >
                    <option value="">-- Choose Active Debt --</option>
                    {activeDebtsList.map(d => (
                      <option key={d.name} value={d.name}>{d.name} ({formatCurrency(d.balance)})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Category Tag</label>
                <input
                  type="text"
                  value={actionCategory}
                  onChange={e => setActionCategory(e.target.value)}
                  placeholder="e.g. Dining, Salary, Bill"
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none shadow-xs"
                  id="quick-category-input"
                />
              </div>

              <div className="space-y-1 md:col-span-4">
                <label className="text-xs font-bold text-slate-600">Memo Notes</label>
                <input
                  type="text"
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder="Details of transaction..."
                  className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none shadow-xs"
                  id="quick-note-input"
                />
              </div>

              <div className="md:col-span-4 flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAction(null)}
                  className="py-1.5 px-4 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all duration-150"
                  id="quick-submit-btn"
                >
                  Apply Change
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          F) PAYCHECK ENGINE SIMULATOR (CORE WORKFLOW AUTOMATION)
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showSimulator && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel rounded-3xl p-6 border-indigo-200 bg-indigo-50/10"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-indigo-950">
                <Award className="w-5.5 h-5.5 text-indigo-600" />
                <h3 className="font-display font-black text-base">Paycheck Allocation Automated Engine</h3>
              </div>
              <button onClick={() => setShowSimulator(false)} className="p-1 rounded-full text-slate-400 hover:text-indigo-600">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 mb-4 max-w-xl">
              Execute standard allocation rules sequentially: <b>Life Checked Spending</b> → <b>Vault Outstanding Bills</b> → <b>Emergency Buffer Fund</b> → <b>Vacation Fund</b> → <b>Freedom snowball pool</b>.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3 p-4 bg-white/70 rounded-2xl border border-indigo-100 shadow-xs">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">Enter Payload</h4>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-bold">Paycheck Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      value={simPaycheckAmount}
                      onChange={e => setSimPaycheckAmount(e.target.value)}
                      placeholder="3000"
                      className="w-full pl-8 bg-white border border-slate-200 rounded-xl py-2 px-3 text-sm font-semibold focus:outline-none"
                      id="sim-paycheck-input"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={calculateSimulatedAllocation}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all"
                  id="run-sim-allocation-btn"
                >
                  Run Allocation Logic
                </button>
              </div>

              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Calculated Distributions</h4>
                {simResults ? (
                  <div className="space-y-4">
                    <div className="bg-white/80 p-4 rounded-2xl border border-indigo-100 space-y-3 shadow-xs">
                      {simResults.breakdownReport.map((rep, index) => (
                        <div key={index} className="flex gap-2.5 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                          <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                            {rep}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setSimResults(null)}
                        className="py-1.5 px-4 text-xs font-bold text-slate-500 hover:underline"
                      >
                        Reset Calculation
                      </button>
                      <button
                        onClick={commitSimulatedPaycheck}
                        className="py-1.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold shadow-xs hover:shadow-md transition-all"
                        id="commit-sim-paycheck-btn"
                      >
                        Commit to Live Money Spaces
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                    <Sliders className="w-8 h-8 text-slate-300" />
                    Provide a paycheck amount on the left to display distributed allocations.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------
          G) IDLE MONEY DETECTION & WARNING TRIGGERS
         ------------------------------------------------------------- */}
      {idleAdvisories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {idleAdvisories.map((adv) => (
            <div key={adv.id} className="p-4 rounded-3xl border border-blue-200/50 bg-blue-50/10 flex items-start gap-3 shadow-xs backdrop-blur-md">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600 shrink-0">
                <Info className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">{adv.title}</h4>
                <p className="text-xs text-slate-700 leading-relaxed">{adv.text}</p>
                <p className="text-xs text-blue-800 font-semibold leading-relaxed bg-blue-500/5 p-2 rounded-xl border border-blue-500/10 mt-1.5">
                  <b>Recommendation:</b> {adv.recommendation}
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setShowAction('move');
                      setActionAccount(adv.source);
                      setDestAccount(adv.target);
                      setActionAmount(String(adv.amount));
                      setActionNote(`Optimize idle surplus from ${adv.source}`);
                    }}
                    className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-[10px] font-bold transition-all"
                  >
                    Optimize Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* -------------------------------------------------------------
          H) AUTO RECALCULATE STORYLOG: "WHAT CHANGED & WHY"
         ------------------------------------------------------------- */}
      <div className="glass-panel rounded-3xl p-5 border-l-4 border-l-emerald-500/80 bg-emerald-50/5">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-700 shrink-0 shadow-xs border border-white/50">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 py-0.5 px-2 rounded-full border border-emerald-500/20">
              Auto Recalculate Active • Sheet State Evaluated
            </span>
            <h4 className="font-display font-black text-slate-800 mt-1.5 flex items-center gap-1">
              What Changed & Why: 
              <span className="text-xs text-slate-500 font-mono font-medium">({whatChanged.title})</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed mt-0.5">
              {whatChanged.desc}
            </p>
            {whatChanged.why && (
              <p className="text-xs text-slate-600 leading-relaxed italic border-t border-slate-200/50 pt-1.5 mt-1.5">
                <b>OS Reason:</b> {whatChanged.why}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          I) THE ACTIVE LEDGER ACCOUNT MATRIX BALANCES
         ------------------------------------------------------------- */}
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-black text-lg text-slate-800">My Wallets & Money Spaces 🧍</h3>
            <p className="text-xs text-slate-500">Overview of isolated cash reserves across your active Money Spaces</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasLinkedBank ? (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 py-1 px-2.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Plaid Live Sync
                </span>
                <button
                  onClick={() => handleSyncBankFeed()}
                  disabled={isSyncingBank}
                  className="text-xs font-bold text-slate-700 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-full transition-all flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBank ? 'animate-spin' : ''}`} />
                  {isSyncingBank ? 'Syncing...' : 'Sync Bank'}
                </button>
                <button
                  onClick={handleDisconnectBank}
                  className="text-[10px] text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 p-1.5 rounded-full transition-colors"
                  title="Disconnect Bank Account"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectBank}
                disabled={isLinkingBank}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-1.5 px-4 rounded-full transition-colors flex items-center gap-1"
                id="btn-connect-plaid"
              >
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                Connect Bank (Plaid)
              </button>
            )}
            <button
              onClick={() => setShowCsvImport(true)}
              className="text-xs font-bold text-slate-700 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 py-1.5 px-4 rounded-full transition-colors flex items-center gap-1 border border-slate-200/50"
              id="btn-import-csv"
            >
              <Upload className="w-3.5 h-3.5 text-slate-505" />
              Import Recent Activity
            </button>
            <button
              onClick={() => setCurrentTab('accounts')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 px-4 rounded-full transition-colors"
              id="dash-view-all-accounts-btn"
            >
              Manage Balances
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Life Checking', val: lifeChecking, color: 'text-blue-600 bg-blue-50/40 border-blue-200/50 hover:border-blue-400' },
            { label: 'Vault / Bills', val: vaultBills, color: 'text-orange-600 bg-orange-50/40 border-orange-200/50 hover:border-orange-400' },
            { label: 'Buffer Fund', val: bufferFund, color: 'text-emerald-600 bg-emerald-50/40 border-emerald-200/50 hover:border-emerald-400' },
            { label: 'Vacation Fund', val: vacationFund, color: 'text-purple-600 bg-purple-50/40 border-purple-200/50 hover:border-purple-400' },
            { label: 'Freedom Savings', val: freedomSavings, color: 'text-teal-600 bg-teal-50/40 border-teal-200/50 hover:border-teal-400' },
            { label: 'Cash Balance', val: cashBalance, color: 'text-slate-600 bg-slate-50/40 border-slate-200/50 hover:border-slate-400' }
          ].map((acc, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border ${acc.color} flex flex-col justify-between hover:scale-105 transition-transform duration-200 shadow-xs cursor-pointer`}>
              <span className="text-[10px] font-sans font-bold text-slate-500 leading-tight tracking-wide uppercase">{acc.label}</span>
              <span className="text-base font-mono font-black text-slate-900 mt-2 block">{formatCurrency(acc.val)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------
          J) ADVANCED "WHAT-IF" SIMULATION MODELLING TAB
         ------------------------------------------------------------- */}
      <div 
        className="glass-panel rounded-3xl p-6 relative overflow-hidden" 
        id="what-if-simulation-section"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <span className="text-xs font-mono font-extrabold text-blue-700 tracking-wider uppercase">Scenario Modeling Console</span>
            <h3 className="font-display font-black text-lg text-slate-800 mt-0.5">Interactive "What-If" Projections</h3>
            <p className="text-xs text-slate-500">Model the timeline acceleration of adjusting targets or boosting debt attacks</p>
          </div>
          <div className="p-2 bg-blue-600/15 rounded-xl text-blue-700">
            <Sliders className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controls column */}
          <div className="lg:col-span-5 space-y-4 bg-white/40 p-4 rounded-2xl border border-white/50">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Adjust Simulator Parameters</h4>
            
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-700 font-bold">
                <span>Extra Monthly Debt Attack ($)</span>
                <span className="font-mono text-blue-600 font-black">{formatCurrency(extraDebtVal)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={simExtraDebt}
                onChange={e => setSimExtraDebt(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-700 font-bold">
                <span>Configure Buffer Secure Target ($)</span>
                <span className="font-mono text-indigo-600 font-black">{formatCurrency(parseFloat(simBufferTarget) || 1000)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={simBufferTarget}
                onChange={e => setSimBufferTarget(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-700 font-bold">
                <span>Additional Monthly Income ($)</span>
                <span className="font-mono text-emerald-600 font-black">{formatCurrency(extraIncomeVal)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={simExtraIncome}
                onChange={e => setSimExtraIncome(e.target.value)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/60 bg-white/70">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800">Pause Vacation Transfer</span>
                <p className="text-[10px] text-slate-400 leading-none">Redirect $150 to debt snowball</p>
              </div>
              <input
                type="checkbox"
                checked={simPauseVacation}
                onChange={e => setSimPauseVacation(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Outputs/Charts column */}
          <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-white/50 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Freedom Pace</span>
                <span className="text-xl font-mono font-black text-slate-800 mt-1">
                  {simulatedMonthsToFreedom} Months
                </span>
                <span className="text-[9px] text-emerald-600 font-bold mt-1">
                  {monthsDifference > 0 ? `Saved ${monthsDifference} Months!` : 'No change'}
                </span>
              </div>

              <div className="p-3 bg-white/50 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Interest Safeguard</span>
                <span className="text-xl font-mono font-black text-slate-800 mt-1">
                  {formatCurrency(potentialInterestSaved)}
                </span>
                <span className="text-[9px] text-slate-400 font-medium mt-1">Approx. APR Shield</span>
              </div>

              <div className="p-3 bg-white/50 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Monthly Cash Flow</span>
                <span className="text-xl font-mono font-black text-slate-800 mt-1">
                  +{formatCurrency(extraDebtVal + extraIncomeVal + (simPauseVacation ? 150 : 0))}
                </span>
                <span className="text-[9px] text-indigo-600 font-bold mt-1">Surplus Allocation Boost</span>
              </div>
            </div>

            {/* Visual payoff timeline slider representation */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md space-y-4">
              <h4 className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-400" />
                Payoff Speed Timeline (Months)
              </h4>

              <div className="space-y-3">
                {/* Baseline bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span className="font-semibold">Baseline Strategy:</span>
                    <span className="font-mono font-bold text-slate-400">{estimatedMonthsToFreedom} Months</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                    <div 
                      className="h-full bg-slate-600 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(15, Math.min(100, (estimatedMonthsToFreedom / 36) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Simulated bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-200">
                    <span className="font-bold flex items-center gap-1 text-blue-400">
                      Simulated Strategy:
                      {monthsDifference > 0 && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 py-0.5 px-2 rounded-full border border-blue-500/30">
                          -{monthsDifference} Mo!
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-white">{simulatedMonthsToFreedom} Months</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                    <div 
                      className="h-full bg-linear-to-r from-blue-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(15, Math.min(100, (simulatedMonthsToFreedom / 36) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------
          K) THE INTEGRATED INSIGHT ENGINE
         ------------------------------------------------------------- */}
      <div className="glass-panel rounded-3xl p-6">
        <h3 className="font-display font-black text-base text-slate-800 mb-1">Financial Intelligence Insight Engine</h3>
        <p className="text-xs text-slate-500 mb-4">Click any question to view automatic ledger reasons and rule explanations</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insightTopics.map((top, idx) => {
            const isActive = activeInsightIndex === idx;
            return (
              <div 
                key={idx}
                onClick={() => setActiveInsightIndex(isActive ? null : idx)}
                className={`p-4 rounded-2xl border border-slate-200/50 hover:border-blue-300/60 bg-white/45 shadow-xs cursor-pointer transition-all duration-200 ${isActive ? 'bg-blue-500/5 border-blue-300 shadow-md ring-1 ring-blue-300/30' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 leading-snug">{top.q}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isActive ? 'rotate-180 text-blue-600' : ''}`} />
                </div>
                
                <AnimatePresence>
                  {isActive && (
                    <motion.p 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-slate-700 leading-relaxed mt-2.5 pt-2 border-t border-slate-200/60 font-medium"
                    >
                      {top.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------
          L) THE BENTO ROW: BILL ALERTS, BUDGET ENVELOPES & MILESTONES
         ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Upcoming Bills & Budget categories */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Upcoming Bills Card */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-800">Upcoming Bill Alerts</h3>
                <p className="text-xs text-slate-500">Unpaid bills due in the next 15 days</p>
              </div>
              <button
                onClick={() => setCurrentTab('upcoming')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                id="dash-manage-upcoming-btn"
              >
                Full Calendar
              </button>
            </div>
            
            <div className="divide-y divide-slate-150">
              {upcomingBills.slice(0, 4).map((b) => {
                const today = new Date();
                const due = new Date(b.dueDate);
                const isOverdue = due < today;
                const isDueSoon = !isOverdue && (due.getTime() - today.getTime()) <= (5 * 24 * 60 * 60 * 1000);

                return (
                  <div key={b.id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{b.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Due {b.dueDate} • via {b.accountPaidFrom}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-slate-800">{formatCurrency(b.amount)}</span>
                      <span className={`text-[9px] font-mono font-bold py-0.5 px-2 rounded-full border ${
                        isOverdue 
                          ? 'bg-rose-50 border-rose-200 text-rose-600' 
                          : isDueSoon 
                            ? 'bg-orange-50 border-orange-200 text-orange-600' 
                            : 'bg-slate-150 border-slate-200 text-slate-500'
                      }`}>
                        {isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Upcoming'}
                      </span>
                    </div>
                  </div>
                );
              })}
              {upcomingBills.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  All current bills are marked paid! Keep it up.
                </div>
              )}
            </div>
          </div>

          {/* Budget Categories Card */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-800">Budget Envelope Trackers</h3>
                <p className="text-xs text-slate-500">Current spending pacing and envelope remaining</p>
              </div>
              <button
                onClick={() => setCurrentTab('budget')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                id="dash-manage-budget-btn"
              >
                Plan Paycheck
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {budgetCategories.map((cat, idx) => {
                const percent = Math.min((cat.spent / cat.budgeted) * 100, 100);
                const remaining = cat.budgeted - cat.spent;
                const isOver = cat.spent > cat.budgeted;
                const isTight = !isOver && percent >= 85;

                return (
                  <div key={idx} className="p-3.5 rounded-2xl border border-slate-200/50 bg-white/40 flex flex-col justify-between hover:shadow-xs cursor-pointer">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-700">{cat.category}</span>
                      <span className={isOver ? 'text-rose-600' : isTight ? 'text-orange-600' : 'text-slate-500 font-mono'}>
                        {formatCurrency(remaining)} left
                      </span>
                    </div>
                    
                    <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-rose-500' : isTight ? 'bg-orange-400' : 'bg-blue-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 mt-1.5">
                      <span>Spent: {formatCurrency(cat.spent)}</span>
                      <span>{Math.round(percent)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Debts Payoff & Savings Goals Progress */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Debt Payoff Progress */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-800">Active Debt Snowball</h3>
                <p className="text-xs text-slate-500">Remaining balances and active paydown focus</p>
              </div>
              <button
                onClick={() => setCurrentTab('debts')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                id="dash-manage-debts-btn"
              >
                Payoff Plan
              </button>
            </div>

            <div className="space-y-4">
              {activeDebtsList.map((d) => (
                <div key={d.name} className="space-y-1.5 p-3.5 rounded-2xl border border-rose-100 bg-rose-50/15 hover:shadow-xs transition-shadow">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-800">{d.name} ({highestAprApr(d.apr)}% APR)</span>
                    <span className="text-rose-700 font-mono font-extrabold">{formatCurrency(d.balance)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight font-mono">
                    Min payment: {formatCurrency(d.minimumPayment)} • Pay from {d.accountPaidFrom}
                  </div>
                  <div className="text-[10px] text-amber-800 font-semibold leading-relaxed">
                    Why: "{d.whyThisMatters}"
                  </div>
                </div>
              ))}
              {activeDebtsList.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs bg-emerald-50/20 rounded-2xl border border-dashed border-emerald-200">
                  🎉 Absolutely Debt Free! All items are fully archived.
                </div>
              )}
            </div>
          </div>

          {/* Savings Goals Milestones */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-extrabold text-base text-slate-800">Savings Milestones</h3>
                <p className="text-xs text-slate-500">Live progress towards targeted saving vaults</p>
              </div>
              <button
                onClick={() => setCurrentTab('goals')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                id="dash-manage-goals-btn"
              >
                All Goals
              </button>
            </div>

            <div className="space-y-4">
              {goals.slice(0, 4).map((g) => {
                const percent = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                const isCompleted = g.currentAmount >= g.targetAmount;

                return (
                  <div key={g.name} className="space-y-1 p-3.5 rounded-2xl border border-slate-100 bg-white/40 hover:shadow-xs cursor-pointer">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700">{g.name}</span>
                      <span className={isCompleted ? 'text-emerald-600 font-black' : 'text-purple-600 font-mono font-black'}>
                        {formatCurrency(g.currentAmount)} / {formatCurrency(g.targetAmount)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-purple-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                      <span>Weekly transfer: {formatCurrency(g.weeklyTransfer)}</span>
                      <span>{Math.round(percent)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </>)}

      {/* -------------------------------------------------------------
          M) THE COMMAND BAR OVERLAY SPOTLIGHT DIALOG
         ------------------------------------------------------------- */}
      <AnimatePresence>
        {showCommandBar && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/60 backdrop-blur-xs">
            {/* Modal backdrop closer */}
            <div className="absolute inset-0" onClick={() => setShowCommandBar(false)} />
            
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="relative w-full max-w-lg glass-panel bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Type a command or category... (e.g., Pay, Simulate)"
                  className="w-full bg-transparent border-none text-slate-800 text-sm focus:outline-none placeholder-slate-400 font-semibold"
                />
                <button 
                  onClick={() => setShowCommandBar(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Command results list */}
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {filteredCommands.map((cmd, idx) => {
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => triggerCommand(cmd)}
                      className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-blue-500/10 text-left transition-all duration-150 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-600 group-hover:bg-blue-500/15 group-hover:text-blue-600">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{cmd.title}</span>
                      </div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-100 py-0.5 px-2 rounded-full text-slate-500 group-hover:bg-blue-500/20 group-hover:text-blue-700">
                        {cmd.category}
                      </span>
                    </button>
                  );
                })}
                {filteredCommands.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-xs font-medium">
                    No system commands matching "{searchQuery}"
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 border-t border-slate-100 pt-2">
                <span>Use arrows & Enter to navigate (mouse supported)</span>
                <span>ESC to exit command bar</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPlaidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="absolute inset-0" onClick={() => setShowPlaidModal(false)} />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass-panel bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xl flex flex-col gap-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <Zap className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-slate-800 text-sm">Plaid Sandbox Handshake</h3>
                    <p className="text-[10px] text-slate-400 font-mono">FINANCE_OS SECUR_PROTOCOL_1.2</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPlaidModal(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Connect your primary financial accounts securely. Choose your banking partner and authorize direct live read-only transaction feeds to your Google Sheets financial database.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Financial Institution</label>
                  <select
                    value={simSelectedBank}
                    onChange={e => setSimSelectedBank(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Chase Bank">Chase Bank</option>
                    <option value="Wells Fargo">Wells Fargo & Co.</option>
                    <option value="Bank of America">Bank of America</option>
                    <option value="Fidelity Investments">Fidelity Investments</option>
                  </select>
                </div>

                <div className="space-y-3 p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/50">
                  <h4 className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">Sandbox Credentials Required</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">USERNAME</span>
                      <span className="font-mono font-bold text-slate-800">user_good</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">PASSWORD</span>
                      <span className="font-mono font-bold text-slate-800">pass_good</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="user_good"
                      defaultValue="user_good"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="password"
                      placeholder="pass_good"
                      defaultValue="pass_good"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3 mt-1">
                <button
                  onClick={() => setShowPlaidModal(false)}
                  className="py-1.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowPlaidModal(false);
                    onPlaidSuccess('mock_public_token_good', { institution: { name: simSelectedBank } });
                  }}
                  className="py-1.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Authorize Connection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CSV Import Wizard Overlay */}
      <CsvImportWizard
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        accounts={accounts.map(a => a.name)}
        history={history}
        onImport={(importedItems) => {
          onUpdateHistory([...importedItems, ...history]);
        }}
      />
    </div>
  );
}
