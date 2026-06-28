import { useState, FormEvent } from 'react';
import { BudgetCategory, BudgetItem, PaycheckCovers } from '../types';
import { Sparkles, AlertTriangle, ShieldCheck, HelpCircle, Save, Plus, Trash, Check, X } from 'lucide-react';

interface BudgetViewProps {
  budgetCategories: BudgetCategory[];
  onUpdateBudgetCategories: (updated: BudgetCategory[]) => void;
  paycheckCovers: PaycheckCovers;
  onUpdatePaycheckCovers: (updated: PaycheckCovers) => void;
}

export default function BudgetView({
  budgetCategories,
  onUpdateBudgetCategories,
  paycheckCovers,
  onUpdatePaycheckCovers
}: BudgetViewProps) {
  // Budget Category Editing states
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editBudgeted, setEditBudgeted] = useState('');
  const [editSpent, setEditSpent] = useState('');

  // Paycheck covers form states
  const [paycheckDate, setPaycheckDate] = useState(paycheckCovers.paycheckDate);
  const [paycheckAmount, setPaycheckAmount] = useState(paycheckCovers.paycheckAmount.toString());
  
  // Custom temporary checklist options
  const [selectedBills, setSelectedBills] = useState<string[]>(paycheckCovers.billsCovered);
  const [selectedDebts, setSelectedDebts] = useState<string[]>(paycheckCovers.debtPayments);
  const [selectedTransfers, setSelectedTransfers] = useState<string[]>(paycheckCovers.transfers);

  // Available options matching mock items
  const billOptions = ['Rent / Mortgage', 'Car Insurance', 'Electric Bill', 'Water Utility', 'Gym Membership'];
  const debtOptions = ['Chase Card', 'Auto Loan', 'Student Loan'];
  const transferOptions = ['Boss Fight Fund 🗡️', 'Escape Fund 🌴', 'Bill Hub 📦', 'Safety Net 🛟'];

  // Save category edits
  const saveCategoryEdit = (catName: string) => {
    const updated = budgetCategories.map(c => {
      if (c.category === catName) {
        return {
          ...c,
          budgeted: parseFloat(editBudgeted) || 0,
          spent: parseFloat(editSpent) || 0
        };
      }
      return c;
    });
    onUpdateBudgetCategories(updated);
    setEditingCategory(null);
  };

  // Toggle checks in paycheck planner
  const toggleItem = (item: string, type: 'bill' | 'debt' | 'transfer') => {
    if (type === 'bill') {
      const next = selectedBills.includes(item) ? selectedBills.filter(i => i !== item) : [...selectedBills, item];
      setSelectedBills(next);
      updateCovers(next, selectedDebts, selectedTransfers);
    } else if (type === 'debt') {
      const next = selectedDebts.includes(item) ? selectedDebts.filter(i => i !== item) : [...selectedDebts, item];
      setSelectedDebts(next);
      updateCovers(selectedBills, next, selectedTransfers);
    } else {
      const next = selectedTransfers.includes(item) ? selectedTransfers.filter(i => i !== item) : [...selectedTransfers, item];
      setSelectedTransfers(next);
      updateCovers(selectedBills, selectedDebts, next);
    }
  };

  const updateCovers = (bills: string[], debts: string[], transfers: string[]) => {
    onUpdatePaycheckCovers({
      paycheckDate,
      paycheckAmount: parseFloat(paycheckAmount) || 0,
      billsCovered: bills,
      debtPayments: debts,
      transfers
    });
  };

  // Handle Paycheck Amount and Date adjustments
  const handlePaycheckSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdatePaycheckCovers({
      paycheckDate,
      paycheckAmount: parseFloat(paycheckAmount) || 0,
      billsCovered: selectedBills,
      debtPayments: selectedDebts,
      transfers: selectedTransfers
    });
    alert('Paycheck planner updated successfully!');
  };

  // Calculate allocated cost
  // Let's assume some estimated values for covered items:
  // Rent/Mortgage = 1100, Car Insurance = 145, Electric = 125, Water = 55, Gym = 30
  // Chase = 75, Auto = 320, Student = 150
  // Freedom = 250, Vacation = 100, Vault = 150, Buffer = 0
  const getItemCost = (name: string): number => {
    switch (name) {
      case 'Rent / Mortgage': return 1100;
      case 'Car Insurance': return 145;
      case 'Electric Bill': return 125;
      case 'Water Utility': return 55;
      case 'Gym Membership': return 30;
      case 'Chase Card': return 75;
      case 'Auto Loan': return 320;
      case 'Student Loan': return 150;
      case 'Boss Fight Fund 🗡️': return 250;
      case 'Escape Fund 🌴': return 100;
      case 'Bill Hub 📦': return 150;
      case 'Safety Net 🛟': return 100;
      default: return 50;
    }
  };

  const totalPaycheck = parseFloat(paycheckAmount) || 0;
  const totalAllocated = [
    ...selectedBills.map(b => getItemCost(b)),
    ...selectedDebts.map(d => getItemCost(d)),
    ...selectedTransfers.map(t => getItemCost(t))
  ].reduce((acc, curr) => acc + curr, 0);

  const leftover = totalPaycheck - totalAllocated;
  const isTight = leftover < 100;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-12 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="budget-tab-content">
      {/* LEFT COLUMN: PAYCHECK PLANNER (Col span 7) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass-panel rounded-3xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-display font-extrabold text-slate-800">Interactive Paycheck Planner</h2>
            <p className="text-xs text-slate-500">Calculate leftover cash flow before depositing your income</p>
          </div>

          <form onSubmit={handlePaycheckSubmit} className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Paycheck Drop Date</label>
              <input
                type="date"
                value={paycheckDate}
                onChange={e => { setPaycheckDate(e.target.value); updateCovers(selectedBills, selectedDebts, selectedTransfers); }}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500 font-mono"
                id="paycheck-form-date"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Paycheck Net Income ($)</label>
              <input
                type="number"
                step="0.01"
                value={paycheckAmount}
                onChange={e => { setPaycheckAmount(e.target.value); updateCovers(selectedBills, selectedDebts, selectedTransfers); }}
                className="w-full bg-white border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                id="paycheck-form-amount"
              />
            </div>
          </form>

          {/* CHECKLIST */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">"This Paycheck Covers" Allocations</h3>
            
            {/* Bills Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-orange-600 uppercase tracking-wider">Fixed bills covered</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {billOptions.map(b => {
                  const isChecked = selectedBills.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => toggleItem(b, 'bill')}
                      className={`p-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all ${
                        isChecked 
                          ? 'bg-orange-50 border-orange-200 text-orange-950 font-semibold' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                      type="button"
                      id={`paycheck-toggle-bill-${b.replace(/\s+/g, '-')}`}
                    >
                      <span>{b}</span>
                      <span className="font-mono font-bold text-slate-500">{formatCurrency(getItemCost(b))}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Debt Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-rose-600 uppercase tracking-wider">Debt avalanche additions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {debtOptions.map(d => {
                  const isChecked = selectedDebts.includes(d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggleItem(d, 'debt')}
                      className={`p-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all ${
                        isChecked 
                          ? 'bg-rose-50 border-rose-200 text-rose-950 font-semibold' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                      type="button"
                      id={`paycheck-toggle-debt-${d.replace(/\s+/g, '-')}`}
                    >
                      <span>{d}</span>
                      <span className="font-mono font-bold text-slate-500">{formatCurrency(getItemCost(d))}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Savings Transfers Section */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-purple-600 uppercase tracking-wider">Savings transfers</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {transferOptions.map(t => {
                  const isChecked = selectedTransfers.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleItem(t, 'transfer')}
                      className={`p-2.5 rounded-xl border text-xs text-left flex items-center justify-between transition-all ${
                        isChecked 
                          ? 'bg-purple-50 border-purple-200 text-purple-950 font-semibold' 
                          : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                      }`}
                      type="button"
                      id={`paycheck-toggle-transfer-${t.replace(/\s+/g, '-')}`}
                    >
                      <span>{t}</span>
                      <span className="font-mono font-bold text-slate-500">{formatCurrency(getItemCost(t))}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DYNAMIC CALCULATION BAR */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 font-mono">ALLOCATED: {formatCurrency(totalAllocated)}</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-semibold text-slate-700">Leftover Buffer:</span>
                <span className={`text-lg font-mono font-extrabold ${isTight ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatCurrency(leftover)}
                </span>
              </div>
            </div>

            {isTight ? (
              <div className="flex items-start gap-2 max-w-[280px] bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-[10px] text-rose-800 leading-tight">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">WARNING: Budget Tight!</span> Keep a buffer of at least $100. Consider reducing non-essential transfers.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 max-w-[280px] bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-[10px] text-emerald-800 leading-tight">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold">STATUS: SAFE BUFFER!</span> Excellent cash planning. Your leftover reserves are secure.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: BUDGET CATEGORIES ENVELOPES (Col span 5) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-panel rounded-3xl p-6">
          <div className="mb-4">
            <h2 className="text-lg font-display font-bold text-slate-800">Budget Category Envelopes</h2>
            <p className="text-xs text-slate-500">Edit limits or recorded spending to adjust automatic warnings</p>
          </div>

          <div className="space-y-4">
            {budgetCategories.map(cat => {
              const isEditing = editingCategory === cat.category;
              const percent = Math.min((cat.spent / cat.budgeted) * 100, 100);
              const remaining = cat.budgeted - cat.spent;
              const isOver = cat.spent > cat.budgeted;
              const isTight = !isOver && percent >= 85;

              return (
                <div key={cat.category} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">{cat.category}</span>
                    <span className={`text-[10px] font-mono font-bold py-0.5 px-2 rounded-full ${
                      isOver 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : isTight 
                          ? 'bg-orange-50 text-orange-600 border border-orange-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {isOver ? 'Over' : isTight ? 'Tight' : 'Good'}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-500">Budgeted ($)</label>
                        <input
                          type="number"
                          value={editBudgeted}
                          onChange={e => setEditBudgeted(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs focus:outline-none"
                          id={`input-edit-budgeted-${cat.category.replace(/\s+/g, '-')}`}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-semibold text-slate-500">Spent ($)</label>
                        <input
                          type="number"
                          value={editSpent}
                          onChange={e => setEditSpent(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs focus:outline-none"
                          id={`input-edit-spent-${cat.category.replace(/\s+/g, '-')}`}
                        />
                      </div>
                      <div className="col-span-2 flex justify-end gap-1.5 pt-2">
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="p-1 text-xs text-slate-500 hover:bg-slate-100 rounded"
                          type="button"
                          id={`cancel-edit-${cat.category.replace(/\s+/g, '-')}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => saveCategoryEdit(cat.category)}
                          className="p-1 text-xs text-emerald-600 hover:bg-emerald-50 rounded"
                          type="button"
                          id={`save-edit-${cat.category.replace(/\s+/g, '-')}`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Envelope Numbers */}
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-500">Budgeted: {formatCurrency(cat.budgeted)}</span>
                        <span className="text-slate-500">Spent: {formatCurrency(cat.spent)}</span>
                      </div>
                      
                      {/* Progress line */}
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isOver ? 'bg-rose-500' : isTight ? 'bg-orange-400' : 'bg-blue-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 font-medium">
                        <span>Remaining: {formatCurrency(remaining)}</span>
                        <button
                          onClick={() => {
                            setEditingCategory(cat.category);
                            setEditBudgeted(cat.budgeted.toString());
                            setEditSpent(cat.spent.toString());
                          }}
                          className="text-[10px] font-semibold text-blue-600 hover:underline"
                          id={`btn-edit-envelope-${cat.category.replace(/\s+/g, '-')}`}
                        >
                          Edit Envelope
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
