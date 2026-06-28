import { useState, FormEvent } from 'react';
import { Debt } from '../types';
import { Plus, Trash, ArrowDownAz, TrendingDown, RefreshCw, Zap, Archive, CheckCircle2 } from 'lucide-react';

interface DebtsViewProps {
  debts: Debt[];
  onUpdateDebts: (updated: Debt[]) => void;
  accounts: string[];
}

type SortType = 'priority' | 'smallest' | 'highest-apr' | 'due-date' | 'settlement';

export default function DebtsView({ debts, onUpdateDebts, accounts }: DebtsViewProps) {
  const [sort, setSort] = useState<SortType>('priority');
  const [isAdding, setIsAdding] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [minPayment, setMinPayment] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [apr, setApr] = useState('');
  const [account, setAccount] = useState(accounts[0] || 'Life Wallet 🧍');
  const [status, setStatus] = useState<'Active' | 'Not Started' | 'Paid'>('Active');
  const [phase, setPhase] = useState('Phase 1');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [notes, setNotes] = useState('');

  // Handle Sort
  const getSortedDebts = (list: Debt[]) => {
    const sorted = [...list];
    switch (sort) {
      case 'smallest':
        return sorted.sort((a, b) => a.balance - b.balance);
      case 'highest-apr':
        return sorted.sort((a, b) => b.apr - a.apr);
      case 'due-date':
        return sorted.sort((a, b) => {
          const dayA = parseInt(a.dueDate) || 99;
          const dayB = parseInt(b.dueDate) || 99;
          return dayA - dayB;
        });
      case 'settlement':
        // Sort by settlement opportunity (smallest balance first, but prioritize debts under 3,000)
        return sorted.sort((a, b) => {
          const aSettle = a.balance > 0 && a.balance < 3000 ? 0 : 1;
          const bSettle = b.balance > 0 && b.balance < 3000 ? 0 : 1;
          if (aSettle !== bSettle) return aSettle - bSettle;
          return a.balance - b.balance;
        });
      case 'priority':
      default:
        return sorted.sort((a, b) => a.priority - b.priority);
    }
  };

  // Sections
  const activeDebts = getSortedDebts(debts.filter(d => d.status === 'Active' && d.balance > 0));
  const notStartedDebts = getSortedDebts(debts.filter(d => d.status === 'Not Started'));
  const paidArchivedDebts = debts.filter(d => d.status === 'Paid' || d.balance === 0 || d.status === 'Archived');

  // Add Debt
  const handleAddDebt = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !balance || !minPayment) return;

    const newDebt: Debt = {
      priority: debts.length + 1,
      name,
      status,
      balance: parseFloat(balance) || 0,
      minimumPayment: parseFloat(minPayment) || 0,
      dueDate: dueDate || '15th',
      apr: parseFloat(apr) || 0,
      accountPaidFrom: account,
      payoffPhase: phase,
      whyThisMatters: whyItMatters || 'Frees up cash flow',
      amountFreedWhenPaid: parseFloat(minPayment) || 0,
      notes
    };

    onUpdateDebts([...debts, newDebt]);
    setIsAdding(false);

    // Clear form
    setName('');
    setBalance('');
    setMinPayment('');
    setApr('');
    setWhyItMatters('');
    setNotes('');
  };

  // Toggle debt status (Active -> Paid)
  const toggleStatus = (debtName: string) => {
    const updated = debts.map(d => {
      if (d.name === debtName) {
        const nextStatus = d.status === 'Paid' ? 'Active' : 'Paid';
        const nextBalance = nextStatus === 'Paid' ? 0 : d.balance || 1000; // Reset balance if toggling active
        return {
          ...d,
          status: nextStatus as any,
          balance: nextBalance
        };
      }
      return d;
    });
    onUpdateDebts(updated);
  };

  // Delete debt
  const handleDeleteDebt = (debtName: string) => {
    const confirmed = window.confirm(`Permanently remove ${debtName} from active debts ledger?`);
    if (!confirmed) return;
    const updated = debts.filter(d => d.name !== debtName);
    onUpdateDebts(updated);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 space-y-6 animate-fade-in" id="debts-tab-content">
      {/* Header and Sorting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Boss Battles 👾</h2>
          <p className="text-sm text-slate-500">Defeat your financial liabilities, build attack momentum, and clear your board</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sort Selection */}
          <div className="flex items-center gap-1.5 bg-slate-100 py-1 px-3 rounded-full border border-slate-200/50">
            <ArrowDownAz className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortType)}
              className="bg-transparent text-xs font-semibold text-slate-600 focus:outline-none"
              id="debt-sort-select"
            >
              <option value="priority">Priority Order</option>
              <option value="smallest">Smallest Balance (Snowball)</option>
              <option value="highest-apr">Highest APR % (Avalanche)</option>
              <option value="due-date">Due Date</option>
              <option value="settlement">Settlement Opportunity</option>
            </select>
          </div>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200"
            id="add-debt-toggle-btn"
          >
            <Plus className="w-4 h-4" />
            Add Debt Tracker
          </button>
        </div>
      </div>

      {/* Form Card */}
      {isAdding && (
        <div className="glass-panel rounded-3xl p-6 border-rose-200 bg-rose-50/10 animate-slide-up">
          <h3 className="font-display font-bold text-base text-slate-800 mb-4">Register New Debt Liability</h3>
          <form onSubmit={handleAddDebt} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Debt Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Chase Credit Card"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Current Balance ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={balance}
                onChange={e => setBalance(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-balance"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Minimum Payment ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={minPayment}
                onChange={e => setMinPayment(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-min"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Annual Interest Rate (APR %)</label>
              <input
                type="number"
                step="0.1"
                value={apr}
                onChange={e => setApr(e.target.value)}
                placeholder="e.g. 18.9"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-apr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Due Day</label>
              <input
                type="text"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                placeholder="e.g. 15th"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-due"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Account Paid From</label>
              <select
                value={account}
                onChange={e => setAccount(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-account"
              >
                {accounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Initial Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-status"
              >
                <option value="Active">Active</option>
                <option value="Not Started">Not Started Yet</option>
                <option value="Paid">Already Paid</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Payoff Phase</label>
              <input
                type="text"
                value={phase}
                onChange={e => setPhase(e.target.value)}
                placeholder="e.g. Phase 1 - Avalanche focus"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-phase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Why This Matters</label>
              <input
                type="text"
                value={whyItMatters}
                onChange={e => setWhyItMatters(e.target.value)}
                placeholder="e.g. Highest interest drainage"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-why"
              />
            </div>

            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-semibold text-slate-600">Special Notes</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Call to discuss settlement rate, stop using"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-rose-500"
                id="debt-form-notes"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                id="debt-form-cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-semibold shadow-md"
                id="debt-form-submit-btn"
              >
                Create Debt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* THREE STRATEGY SECTIONS */}
      <div className="space-y-8">
        {/* SECTION 1: CURRENT FIGHTS */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <Zap className="w-5 h-5 text-rose-500" />
            Current Fights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeDebts.map(d => {
              const isSettlementOpp = d.balance > 0 && d.balance < 3000;
              return (
                <div key={d.name} className="glass-panel rounded-3xl p-5 border-l-4 border-l-rose-500 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display font-extrabold text-slate-800">{d.name}</h4>
                        <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100/60 py-0.5 px-2 rounded-full border border-slate-200/40">
                          {d.payoffPhase}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-rose-600 block">{formatCurrency(d.balance)}</span>
                        <span className="text-[10px] font-mono text-slate-400">{d.apr}% APR</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Min Payment:</span>
                        <span className="font-mono font-bold text-slate-700">{formatCurrency(d.minimumPayment)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Paid From:</span>
                        <span className="font-medium text-slate-700">{d.accountPaidFrom}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Due Day:</span>
                        <span className="font-mono font-semibold text-slate-700">{d.dueDate}</span>
                      </div>
                      <div className="p-2.5 bg-rose-50/35 rounded-xl border border-rose-100/50 text-[11px] text-rose-800 leading-tight">
                        <span className="font-bold">Goal:</span> "{d.whyThisMatters}"
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {/* Settlement Opportunity Badge */}
                    {isSettlementOpp && (
                      <div className="flex items-center gap-1.5 py-1 px-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200/50 text-[10px] font-semibold">
                        <TrendingDown className="w-3.5 h-3.5" />
                        Settlement Opportunity (Balance &lt; $3,000)
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <button
                        onClick={() => toggleStatus(d.name)}
                        className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-full font-semibold transition-all duration-150"
                        id={`debt-mark-paid-${d.name}`}
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(d.name)}
                        className="p-1.5 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        id={`debt-delete-${d.name}`}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {activeDebts.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                No active debts found in ledger. Add some or check the filter!
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: LOCKED ENEMIES */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-500" />
            Locked Enemies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notStartedDebts.map(d => (
              <div key={d.name} className="glass-panel rounded-3xl p-5 border-l-4 border-l-slate-400 flex flex-col justify-between space-y-4 opacity-80 hover:opacity-100 transition-opacity">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-display font-extrabold text-slate-800">{d.name}</h4>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-100/60 py-0.5 px-2 rounded-full">
                        {d.payoffPhase}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-slate-600 block">{formatCurrency(d.balance)}</span>
                      <span className="text-[10px] font-mono text-slate-400">{d.apr}% APR</span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Min Payment:</span>
                      <span className="font-mono font-semibold text-slate-700">{formatCurrency(d.minimumPayment)}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 leading-tight">
                      <span className="font-bold">Plan:</span> "{d.whyThisMatters}"
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      const updated = debts.map(item => {
                        if (item.name === d.name) {
                          return { ...item, status: 'Active' as const };
                        }
                        return item;
                      });
                      onUpdateDebts(updated);
                    }}
                    className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-full font-semibold transition-all duration-150"
                    id={`debt-start-${d.name}`}
                  >
                    Activate Payoff Focus
                  </button>
                  <button
                    onClick={() => handleDeleteDebt(d.name)}
                    className="p-1.5 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {notStartedDebts.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                No debts are currently waiting in backlog. All liabilities are either active or paid off!
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: DEFEATED BOSSES */}
        <div className="space-y-3">
          <h3 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Defeated Bosses 🏆
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paidArchivedDebts.map(d => (
              <div key={d.name} className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-150 flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-sm line-through decoration-emerald-500 decoration-2">{d.name}</h4>
                  <p className="text-[10px] text-emerald-600 font-mono">Frees up {formatCurrency(d.amountFreedWhenPaid || d.minimumPayment)}/mo</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold py-0.5 px-2 bg-emerald-100 text-emerald-800 rounded-full">
                    Paid!
                  </span>
                </div>
              </div>
            ))}
            {paidArchivedDebts.length === 0 && (
              <div className="col-span-full py-6 text-center text-slate-400 text-xs">
                Your archive list is currently empty. Cross off some debts to see them appear here!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
