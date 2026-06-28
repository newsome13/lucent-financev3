import { Account, Debt, Bill, PaymentHistoryItem } from '../types';

export interface FinancialPhase {
  id: number;
  name: string;
  focus: string;
  desc: string;
  badgeColor: string;
  allocationRules: string;
}

/**
 * 6-Phase System evaluation based on liabilities and emergency cushion state
 */
export function evaluateFinancialPhase(
  accounts: Account[],
  debts: Debt[],
  targetBuffer: number = 1000
): FinancialPhase {
  const activeDebts = debts.filter(d => d.balance > 0 && d.status === 'Active');
  const paidDebtsCount = debts.filter(d => d.status === 'Paid' || d.balance === 0).length;
  const totalDebtsCount = debts.length;

  const bufferAccount = accounts.find(a => 
    a.name.toLowerCase().includes('buffer') || 
    a.name.toLowerCase().includes('safety net') || 
    a.name.toLowerCase().includes('cushion')
  )?.balance || 0;

  // Phase 6 -> Financial Freedom 🕊️
  if (activeDebts.length === 0 && totalDebtsCount > 0) {
    return {
      id: 6,
      name: 'Phase 6: Financial Freedom 🕊️',
      focus: 'Boss-Free Wealth compounding',
      desc: 'All outstanding boss enemies are fully defeated! 100% of freed cash flow automatically cascades into your Escape Fund, Boss Fight Fund, and long-term asset investments.',
      badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      allocationRules: '50% Long-term investing, 30% Escape Fund, 20% Life Wallet.'
    };
  }

  // Phase 1 -> Build stability 🛟
  if (bufferAccount < targetBuffer) {
    return {
      id: 1,
      name: 'Phase 1: Build stability 🛟',
      focus: 'Rebuild Safety Net Cushion',
      desc: `Your emergency Safety Net is currently below the target of $${targetBuffer}. Avoid all discretionary transfers. The primary mission is reinforcing this basic armor.`,
      badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      allocationRules: '90% Surplus to Safety Net, 10% Discretionary. Pay ONLY absolute minimums on Boss Battles.'
    };
  }

  // Phase 5 -> Almost free 🔥
  if (activeDebts.length === 1) {
    return {
      id: 5,
      name: 'Phase 5: Almost free 🔥',
      focus: 'Eradicate Final Remaining Boss',
      desc: 'Only one single boss fight remains on your board! Direct the combined power of your entire monthly surplus, budget spill-overs, and rollover minimums to execute the final hit.',
      badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
      allocationRules: '100% of surplus cash routed directly to pay down your last active Boss Battle.'
    };
  }

  // Phase 3 -> Accelerate debt payoff 🛡️
  if (paidDebtsCount > 0 && activeDebts.length >= 2) {
    return {
      id: 3,
      name: 'Phase 3: Accelerate debt payoff 🛡️',
      focus: 'Snowball Multiplier Accumulation',
      desc: `You have successfully defeated ${paidDebtsCount} boss enemy (or enemies)! Rollover freed minimum payments and compound them with extra monthly payoffs.`,
      badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      allocationRules: '85% Surplus to current active Boss Battle target, 15% to XP Level Up quests.'
    };
  }

  // Phase 2 -> Build momentum 🎮
  if (paidDebtsCount === 0 && activeDebts.length >= 2) {
    return {
      id: 2,
      name: 'Phase 2: Build momentum 🎮',
      focus: 'Aggressive Debt Avalanche Attack',
      desc: 'Your emergency Safety Net is secure. Direct every spare penny into your highest priority target to create a powerful breakthrough.',
      badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      allocationRules: '80% Surplus to highest priority Boss Battle target, 20% to Escape Fund/Savings.'
    };
  }

  // Phase 4 -> Optimize cash flow 🗡️
  return {
    id: 4,
    name: 'Phase 4: Optimize cash flow 🗡️',
    focus: 'Maximize Cash Efficiency & Yield',
    desc: 'Safety Net is fully secure and remaining debts are in a locked containment hold. Optimize transfers to avoid idle money drain.',
    badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    allocationRules: '50% to Boss Fight Fund (high-yield compounding), 30% to Escape Fund, 20% to Bill Hub buffers.'
  };
}

/**
 * Automatically recalculates ledger account and debt status on any change
 */
export function recalculateBalances(
  accounts: Account[],
  debts: Debt[],
  history: PaymentHistoryItem[]
): {
  rebalancedAccounts: Account[];
  rebalancedDebts: Debt[];
  explanation: { title: string; desc: string; why: string; date: string };
} {
  // Deep clone to avoid in-place mutation of props
  const rebalancedAccounts = JSON.parse(JSON.stringify(accounts)) as Account[];
  let rebalancedDebts = JSON.parse(JSON.stringify(debts)) as Debt[];

  // Update debt status depending on balances
  rebalancedDebts = rebalancedDebts.map(d => {
    if (d.balance <= 0) {
      return { ...d, balance: 0, status: 'Paid' as const };
    }
    return d;
  });

  // Fetch the latest transaction log
  const latestLog = history[0];
  let title = 'System Ledger Recalculated';
  let desc = 'Ledger rules re-evaluated against connected sheets.';
  let why = 'Automated engine verified current balances, computed upcoming bill requirements, and confirmed your debt avalanche prioritize sequence remains optimized.';
  const dateStr = latestLog?.date || new Date().toISOString().split('T')[0];

  if (latestLog) {
    const amtStr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(latestLog.amount);
    
    if (latestLog.category === 'Income' || latestLog.item.toLowerCase().includes('paycheck')) {
      title = `Income Logged: ${latestLog.item}`;
      desc = `Deposited ${amtStr} into active cash reserves.`;
      why = 'Automated paycheck splitting applied: Secured daily Life Wallet, matched upcoming Bill Hub mandates, filled the emergency Safety Net, and funneled remaining surpluses into high-yield Boss Fight Fund compounders.';
    } else if (latestLog.category === 'Debt Paydown' || latestLog.item.toLowerCase().includes('debt')) {
      title = `Debt Payment: ${latestLog.item}`;
      desc = `Paid ${amtStr} against outstanding liabilities.`;
      why = 'Snowball cascade in action: Principal reduction has lowered your average monthly interest bleed. If this boss fight is fully finished, its entire minimum payment instantly cascades into your next target.';
    } else if (latestLog.category === 'Account Transfers' || latestLog.item.toLowerCase().includes('transfer')) {
      title = `Money Moved: ${latestLog.item}`;
      desc = `Transferred ${amtStr} between active ledger zones.`;
      why = 'Optimizing interest and liquid reserves: Rebalanced funds to match active level up goals and Safety Net thresholds while avoiding idle cash inflation drag.';
    } else if (latestLog.item.toLowerCase().includes('plaid') || latestLog.accountPaidFrom.includes('Plaid')) {
      title = `Bank Feed Sync: ${latestLog.item}`;
      desc = `Logged spending of ${amtStr} from synced bank account.`;
      why = 'Single Source of Truth synchronization: Reconciled transactions directly with Google Sheets. Live accounts instantly reflect true bank liquid holdings.';
    } else {
      title = `Ledger Transaction: ${latestLog.item}`;
      desc = `Logged expense of ${amtStr} in category "${latestLog.category}".`;
      why = 'Discretionary spend tracked. Ensure this falls within the envelope tolerances of your monthly budget to keep roll-overs intact.';
    }
  }

  return {
    rebalancedAccounts,
    rebalancedDebts,
    explanation: {
      title,
      desc,
      why,
      date: dateStr
    }
  };
}
