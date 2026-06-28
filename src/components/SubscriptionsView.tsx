import { useState, FormEvent } from 'react';
import { Subscription } from '../types';
import { Plus, Trash, ToggleLeft, ToggleRight, Sparkles, Repeat } from 'lucide-react';

interface SubscriptionsViewProps {
  subscriptions: Subscription[];
  onUpdateSubscriptions: (updated: Subscription[]) => void;
  accounts: string[];
}

export default function SubscriptionsView({ subscriptions, onUpdateSubscriptions, accounts }: SubscriptionsViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [nextRenewal, setNextRenewal] = useState('');
  const [category, setCategory] = useState('Subscriptions');
  const [account, setAccount] = useState(accounts[0] || 'Life Wallet 🧍');
  const [status, setStatus] = useState<'Active' | 'Paused'>('Active');

  // Toggle active status
  const toggleStatus = (subName: string) => {
    const updated = subscriptions.map(s => {
      if (s.name === subName) {
        return {
          ...s,
          status: s.status === 'Active' ? 'Paused' as const : 'Active' as const
        };
      }
      return s;
    });
    onUpdateSubscriptions(updated);
  };

  // Add Subscription
  const handleAddSubscription = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !cost) return;

    const newSub: Subscription = {
      name,
      cost: parseFloat(cost) || 0,
      frequency,
      nextRenewal: nextRenewal || new Date().toISOString().split('T')[0],
      category,
      accountPaidFrom: account,
      status
    };

    onUpdateSubscriptions([...subscriptions, newSub]);
    setIsAdding(false);

    // Clear Form
    setName('');
    setCost('');
    setNextRenewal('');
  };

  // Delete Subscription
  const handleDeleteSubscription = (subName: string) => {
    const confirmed = window.confirm(`Permanently unsubscribe and delete ${subName} from recurring trackers?`);
    if (!confirmed) return;
    const updated = subscriptions.filter(s => s.name !== subName);
    onUpdateSubscriptions(updated);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Calculate totals
  const totalMonthlyCost = subscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => {
      if (s.frequency === 'Monthly') return sum + s.cost;
      if (s.frequency === 'Weekly') return sum + (s.cost * 4.33);
      if (s.frequency === 'Annual') return sum + (s.cost / 12);
      return sum;
    }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 space-y-6 animate-fade-in" id="subscriptions-tab-content">
      {/* Header and Summary stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-slate-800 tracking-tight">Recurring Subscriptions</h2>
          <p className="text-sm text-slate-500">Monitor digital streaming, SaaS fees, and periodic memberships</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200 self-start"
          id="add-sub-toggle-btn"
        >
          <Plus className="w-4 h-4" />
          Add Subscription
        </button>
      </div>

      {/* Subscription list summary banner */}
      <div className="glass-panel glass-card-purple rounded-3xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-700">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-sm">Monthly Subscription Overhead</h3>
            <p className="text-xs text-slate-500">Includes active recurring monthly, weekly and annualized SaaS</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-mono font-extrabold text-purple-900">{formatCurrency(totalMonthlyCost)}/mo</span>
        </div>
      </div>

      {/* Adding form */}
      {isAdding && (
        <div className="glass-panel rounded-3xl p-6 border-purple-200 bg-purple-50/10 animate-slide-up">
          <h3 className="font-display font-bold text-base text-slate-800 mb-4">Register New Recurring Subscription</h3>
          <form onSubmit={handleAddSubscription} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Service Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Netflix Premium"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="sub-form-name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="14.99"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="sub-form-cost"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Billing Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="sub-form-freq"
              >
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Next Renewal Date</label>
              <input
                type="date"
                value={nextRenewal}
                onChange={e => setNextRenewal(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="sub-form-date"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Charge Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Subscriptions"
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="sub-form-category"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Account Paid From</label>
              <select
                value={account}
                onChange={e => setAccount(e.target.value)}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-purple-500"
                id="sub-form-account"
              >
                {accounts.map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="py-2 px-4 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100"
                id="sub-form-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-semibold shadow-md"
                id="sub-form-submit"
              >
                Add Subscription
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Subscription list card */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/60">
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Service Name</th>
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Cost</th>
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Frequency</th>
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Next Renewal</th>
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Paid From</th>
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.map(s => {
                const isActive = s.status === 'Active';
                return (
                  <tr key={s.name} className={`hover:bg-slate-50/50 transition-colors ${!isActive ? 'opacity-65' : ''}`}>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">{s.name}</td>
                    <td className="py-3.5 px-4 text-xs font-mono font-bold text-slate-800">{formatCurrency(s.cost)}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{s.frequency}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{s.nextRenewal}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">{s.category}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">{s.accountPaidFrom}</td>
                    
                    {/* Status badge and Toggle */}
                    <td className="py-3.5 px-4 text-xs">
                      <button
                        onClick={() => toggleStatus(s.name)}
                        className={`flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-[10px] font-bold border ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/40' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                        id={`sub-toggle-status-${s.name.replace(/\s+/g, '-')}`}
                      >
                        {isActive ? 'Active' : 'Paused'}
                      </button>
                    </td>

                    {/* Delete action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteSubscription(s.name)}
                        className="p-1.5 rounded-full text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        id={`sub-delete-btn-${s.name.replace(/\s+/g, '-')}`}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
