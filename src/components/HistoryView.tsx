import { useState, FormEvent, useRef } from 'react';
import { PaymentHistoryItem } from '../types';
import { 
  Plus, 
  Trash, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Check, 
  SlidersHorizontal, 
  X, 
  Repeat, 
  Smartphone, 
  Database, 
  CloudLightning, 
  Sparkles,
  Edit3,
  Calendar,
  DollarSign,
  Tag,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryViewProps {
  history: PaymentHistoryItem[];
  onUpdateHistory: (updated: PaymentHistoryItem[]) => void;
  accounts: string[];
}

export default function HistoryView({ history, onUpdateHistory, accounts }: HistoryViewProps) {
  // Navigation / View states
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('All');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Detailed Modal state
  const [activeDetailItem, setActiveDetailItem] = useState<PaymentHistoryItem | null>(null);
  const [activeDetailIndex, setActiveDetailIndex] = useState<number | null>(null);
  const [isEditingItem, setIsEditingItem] = useState(false);

  // Quick edit state (specifically for Categorize swipe or quick change)
  const [quickCategorizeItem, setQuickCategorizeItem] = useState<PaymentHistoryItem | null>(null);
  const [quickCategorizeIndex, setQuickCategorizeIndex] = useState<number | null>(null);

  // Form Fields for new transaction
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(accounts[0] || 'Life Wallet');
  const [notes, setNotes] = useState('');
  const [isIncome, setIsIncome] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Edit fields for active detail item
  const [editMerchant, setEditMerchant] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAccount, setEditAccount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editIsIncome, setEditIsIncome] = useState(false);
  const [editIsPending, setEditIsPending] = useState(false);
  const [editIsRecurring, setEditIsRecurring] = useState(false);

  const categoriesList = ['Bills', 'Food', 'Gas', 'Debt', 'Savings', 'Subscriptions', 'Income', 'Leisure', 'Misc'];

  // Add Log Entry
  const handleAddHistory = (e: FormEvent) => {
    e.preventDefault();
    if (!item || !amount) return;

    // Build the premium payment item
    const newItem: PaymentHistoryItem = {
      date: date || new Date().toISOString().split('T')[0],
      item,
      category,
      amount: parseFloat(amount) || 0,
      accountPaidFrom: account,
      notes,
      isIncome,
      isRecurring,
      isPending,
      isImported: false,
      isConnectedBank: false,
      importSource: 'Manual'
    };

    onUpdateHistory([newItem, ...history]);
    setIsAdding(false);

    // Reset
    setItem('');
    setAmount('');
    setNotes('');
    setIsIncome(false);
    setIsRecurring(false);
    setIsPending(false);
  };

  // Delete Entry
  const handleDeleteHistory = (idx: number) => {
    const updated = history.filter((_, i) => i !== idx);
    onUpdateHistory(updated);
    setActiveDetailItem(null);
    setActiveDetailIndex(null);
  };

  // Open Edit Pane for Details
  const startEditingItem = (h: PaymentHistoryItem, idx: number) => {
    setEditMerchant(h.item);
    setEditAmount(h.amount.toString());
    setEditCategory(h.category);
    setEditAccount(h.accountPaidFrom);
    setEditNotes(h.notes || '');
    setEditIsIncome(!!h.isIncome);
    setEditIsPending(!!h.isPending);
    setEditIsRecurring(!!h.isRecurring);
    setIsEditingItem(true);
  };

  // Save changes
  const handleSaveItemChanges = (e: FormEvent) => {
    e.preventDefault();
    if (activeDetailIndex === null) return;

    const updatedList = [...history];
    updatedList[activeDetailIndex] = {
      ...updatedList[activeDetailIndex],
      item: editMerchant,
      amount: parseFloat(editAmount) || 0,
      category: editCategory,
      accountPaidFrom: editAccount,
      notes: editNotes,
      isIncome: editIsIncome,
      isPending: editIsPending,
      isRecurring: editIsRecurring
    };

    onUpdateHistory(updatedList);
    setIsEditingItem(false);
    setActiveDetailItem(updatedList[activeDetailIndex]);
  };

  // Apply quick categorization
  const handleApplyQuickCategory = (cat: string) => {
    if (quickCategorizeIndex === null) return;
    const updatedList = [...history];
    updatedList[quickCategorizeIndex] = {
      ...updatedList[quickCategorizeIndex],
      category: cat
    };
    onUpdateHistory(updatedList);
    setQuickCategorizeItem(null);
    setQuickCategorizeIndex(null);
  };

  // Filtering implementation
  const filteredHistory = history.filter(h => {
    // Search filter
    const matchesSearch = 
      h.item.toLowerCase().includes(search.toLowerCase()) || 
      h.category.toLowerCase().includes(search.toLowerCase()) ||
      (h.notes && h.notes.toLowerCase().includes(search.toLowerCase())) ||
      h.accountPaidFrom.toLowerCase().includes(search.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategoryFilter === 'All' || h.category === selectedCategoryFilter;

    // Account filter
    const matchesAccount = selectedAccountFilter === 'All' || h.accountPaidFrom === selectedAccountFilter;

    // Status filter
    let matchesStatus = true;
    if (selectedStatusFilter === 'Pending') {
      matchesStatus = !!h.isPending;
    } else if (selectedStatusFilter === 'Cleared') {
      matchesStatus = !h.isPending;
    }

    // Source filter
    let matchesSource = true;
    if (selectedSourceFilter === 'Manual') {
      matchesSource = !h.isImported;
    } else if (selectedSourceFilter === 'Imported') {
      matchesSource = !!h.isImported;
    } else if (selectedSourceFilter === 'Plaid') {
      matchesSource = h.importSource === 'Plaid';
    } else if (selectedSourceFilter === 'CSV') {
      matchesSource = h.importSource === 'CSV';
    } else if (selectedSourceFilter === 'Google Sheets') {
      matchesSource = h.importSource === 'Google Sheets';
    }

    return matchesSearch && matchesCategory && matchesAccount && matchesStatus && matchesSource;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Handle Drag / Swipe gestures
  const handleDragEnd = (event: any, info: any, h: PaymentHistoryItem, idx: number) => {
    // Swipe Left (delete trigger) threshold is -120px
    if (info.offset.x < -100) {
      handleDeleteHistory(idx);
    } 
    // Swipe Right (categorize trigger) threshold is 100px
    else if (info.offset.x > 100) {
      setQuickCategorizeItem(h);
      setQuickCategorizeIndex(idx);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pb-24 space-y-6 animate-fade-in" id="activity-timeline-view">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">Activity</h2>
          <p className="text-xs text-slate-400">Every movement of money in one unified, real-time timeline</p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1.5 py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-medium shadow-sm transition-all self-start"
          id="btn-add-activity-manual"
        >
          <Plus className="w-3.5 h-3.5" />
          Log transaction
        </button>
      </div>

      {/* Control Console: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 bg-white border border-slate-100 py-2.5 px-4 rounded-2xl shadow-xs w-full">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search merchants, categories, accounts..."
            className="bg-transparent border-none text-xs text-slate-600 focus:outline-none w-full placeholder-slate-400"
            id="activity-search-box"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-0.5 rounded-full hover:bg-slate-100">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowFiltersModal(true)}
            className={`flex items-center gap-1.5 py-2.5 px-4 rounded-2xl border text-xs font-medium transition-all w-full sm:w-auto justify-center ${
              selectedCategoryFilter !== 'All' || selectedAccountFilter !== 'All' || selectedSourceFilter !== 'All' || selectedStatusFilter !== 'All'
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-slate-100 hover:border-slate-200 text-slate-600'
            }`}
            id="btn-activity-filters-modal"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filter
            {(selectedCategoryFilter !== 'All' || selectedAccountFilter !== 'All' || selectedSourceFilter !== 'All' || selectedStatusFilter !== 'All') && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Badges */}
      {(selectedCategoryFilter !== 'All' || selectedAccountFilter !== 'All' || selectedSourceFilter !== 'All' || selectedStatusFilter !== 'All') && (
        <div className="flex flex-wrap gap-2 items-center text-[10px]">
          <span className="text-slate-400 font-mono uppercase tracking-wider font-semibold">Active filters:</span>
          {selectedCategoryFilter !== 'All' && (
            <span className="bg-slate-100 border border-slate-200/60 rounded-full py-0.5 px-2 text-slate-600 flex items-center gap-1">
              Cat: {selectedCategoryFilter}
              <button onClick={() => setSelectedCategoryFilter('All')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedAccountFilter !== 'All' && (
            <span className="bg-slate-100 border border-slate-200/60 rounded-full py-0.5 px-2 text-slate-600 flex items-center gap-1">
              Wallet: {selectedAccountFilter}
              <button onClick={() => setSelectedAccountFilter('All')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedStatusFilter !== 'All' && (
            <span className="bg-slate-100 border border-slate-200/60 rounded-full py-0.5 px-2 text-slate-600 flex items-center gap-1">
              Status: {selectedStatusFilter}
              <button onClick={() => setSelectedStatusFilter('All')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          {selectedSourceFilter !== 'All' && (
            <span className="bg-slate-100 border border-slate-200/60 rounded-full py-0.5 px-2 text-slate-600 flex items-center gap-1">
              Source: {selectedSourceFilter}
              <button onClick={() => setSelectedSourceFilter('All')}><X className="w-2.5 h-2.5" /></button>
            </span>
          )}
          <button 
            onClick={() => {
              setSelectedCategoryFilter('All');
              setSelectedAccountFilter('All');
              setSelectedStatusFilter('All');
              setSelectedSourceFilter('All');
            }}
            className="text-blue-600 font-medium hover:underline text-[11px] ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Manual log form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel rounded-3xl p-5 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-medium text-sm text-slate-800">New transaction record</h3>
              <button onClick={() => setIsAdding(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHistory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Merchant / Title</label>
                  <input
                    type="text"
                    required
                    value={item}
                    onChange={e => setItem(e.target.value)}
                    placeholder="e.g. Acme Coffee"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Spending plan</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Paid from wallet</label>
                  <select
                    value={account}
                    onChange={e => setAccount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
                  >
                    {accounts.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Notes / Confirmation</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Receipt or billing tag"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-slate-300 transition-all"
                  />
                </div>
              </div>

              {/* Status toggles */}
              <div className="flex flex-wrap gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={isIncome}
                    onChange={e => setIsIncome(e.target.checked)}
                    className="rounded text-emerald-600 border-slate-200 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>Income transaction</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={isPending}
                    onChange={e => setIsPending(e.target.checked)}
                    className="rounded text-orange-600 border-slate-200 focus:ring-orange-500 w-4 h-4"
                  />
                  <span>Pending (not cleared)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={e => setIsRecurring(e.target.checked)}
                    className="rounded text-blue-600 border-slate-200 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Recurring membership / autopay</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="py-2 px-4 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-6 bg-slate-900 hover:bg-slate-850 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
                >
                  Log activity
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Guide Alert */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Interactive Swipe Timeline: Drag items <b>right</b> to categorize, <b>left</b> to delete, or <b>tap</b> for invoice card.</span>
        </div>
      </div>

      {/* Unified Timeline List */}
      <div className="space-y-2 relative" id="activity-unified-timeline">
        <AnimatePresence initial={false}>
          {filteredHistory.map((h, idx) => {
            const isExpense = !h.isIncome;
            const absoluteAmount = Math.abs(h.amount);

            // Determine icons to display
            let sourceIcon = <Smartphone className="w-3.5 h-3.5" title="Manual" />;
            if (h.isImported) {
              if (h.importSource === 'Plaid') {
                sourceIcon = <CloudLightning className="w-3.5 h-3.5 text-blue-500 animate-pulse" title="Plaid Bank Link" />;
              } else if (h.importSource === 'CSV') {
                sourceIcon = <Database className="w-3.5 h-3.5 text-orange-400" title="CSV Imported" />;
              } else if (h.importSource === 'Google Sheets') {
                sourceIcon = <Sparkles className="w-3.5 h-3.5 text-emerald-500" title="Google Sheets Link" />;
              }
            }

            return (
              <div key={idx} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
                {/* Swipe background indicators */}
                <div className="absolute inset-0 flex justify-between items-center px-6 z-0">
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold font-mono">
                    <Tag className="w-4 h-4" />
                    <span>Swipe to categorize</span>
                  </div>
                  <div className="flex items-center gap-2 text-rose-600 text-xs font-bold font-mono">
                    <span>Delete record</span>
                    <Trash className="w-4 h-4" />
                  </div>
                </div>

                {/* Main Swipeable Row Body */}
                <motion.div
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: -140, right: 140 }}
                  dragElastic={0.4}
                  onDragEnd={(e, info) => handleDragEnd(e, info, h, idx)}
                  onClick={() => {
                    setActiveDetailItem(h);
                    setActiveDetailIndex(idx);
                    setIsEditingItem(false);
                  }}
                  className="relative z-10 bg-white hover:bg-slate-50 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors border-b border-transparent shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Income/Expense indicator bullet */}
                    <div className={`p-2.5 rounded-full shrink-0 ${
                      isExpense ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {isExpense ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs text-slate-800 truncate block max-w-[200px] md:max-w-[320px]">
                          {h.item}
                        </span>
                        {h.isPending && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 uppercase tracking-wider font-mono">
                            Pending
                          </span>
                        )}
                        {h.isRecurring && (
                          <Repeat className="w-3 h-3 text-blue-400" title="Recurring Autopay" />
                        )}
                      </div>

                      {/* Descriptive metadata labels */}
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                        <span>{h.date}</span>
                        <span>•</span>
                        <span className="capitalize">{h.category}</span>
                        <span>•</span>
                        <span>{h.accountPaidFrom}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right hand details: amount and origin sources */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className={`text-xs font-semibold block ${
                        isExpense ? 'text-slate-800' : 'text-emerald-600'
                      }`}>
                        {isExpense ? '-' : '+'}{formatCurrency(absoluteAmount)}
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px] text-slate-400 font-mono">
                        {sourceIcon}
                        <span>{h.importSource || 'Manual'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}

          {filteredHistory.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-white rounded-3xl border border-slate-100 space-y-2"
            >
              <Clock className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-400">No transactions match your search filter</p>
              <button 
                onClick={() => {
                  setSearch('');
                  setSelectedCategoryFilter('All');
                  setSelectedAccountFilter('All');
                  setSelectedStatusFilter('All');
                  setSelectedSourceFilter('All');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Reset active filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DETAILED WALLET MODAL / SHEET INVOICE */}
      <AnimatePresence>
        {activeDetailItem && activeDetailIndex !== null && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-150 animate-slide-up flex flex-col max-h-[90vh]"
            >
              
              {/* Receipt Header Style */}
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Wallet receipt</span>
                  <h3 className="font-display font-semibold text-sm text-slate-900 mt-1 max-w-[200px] truncate">{activeDetailItem.item}</h3>
                </div>
                <button 
                  onClick={() => {
                    setActiveDetailItem(null);
                    setActiveDetailIndex(null);
                  }}
                  className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-6">
                
                {/* Large Amount display */}
                <div className="text-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Cleared Amount</span>
                  <h2 className={`text-3xl font-display font-medium ${
                    activeDetailItem.isIncome ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {activeDetailItem.isIncome ? '+' : '-'}{formatCurrency(activeDetailItem.amount)}
                  </h2>
                  <div className="flex justify-center gap-1.5 mt-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      activeDetailItem.isIncome ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                    }`}>
                      {activeDetailItem.isIncome ? 'Income' : 'Expense'}
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      activeDetailItem.isPending ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-slate-100 text-slate-600 border border-slate-200/40'
                    }`}>
                      {activeDetailItem.isPending ? 'Pending' : 'Cleared'}
                    </span>
                  </div>
                </div>

                {/* Edit Form / Details List toggle */}
                {isEditingItem ? (
                  <form onSubmit={handleSaveItemChanges} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Merchant</label>
                      <input 
                        type="text" 
                        required
                        value={editMerchant}
                        onChange={e => setEditMerchant(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Amount ($)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={editAmount}
                        onChange={e => setEditAmount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Spending plan</label>
                      <select 
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs text-slate-800"
                      >
                        {categoriesList.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Wallet</label>
                      <select 
                        value={editAccount}
                        onChange={e => setEditAccount(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs text-slate-800"
                      >
                        {accounts.map(acc => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">Notes</label>
                      <input 
                        type="text" 
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2 text-xs text-slate-800"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={editIsIncome}
                          onChange={e => setEditIsIncome(e.target.checked)}
                          className="rounded text-emerald-600 border-slate-200"
                        />
                        <span>Income</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={editIsPending}
                          onChange={e => setEditIsPending(e.target.checked)}
                          className="rounded text-orange-600 border-slate-200"
                        />
                        <span>Pending</span>
                      </label>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setIsEditingItem(false)}
                        className="w-1/2 py-2 border border-slate-150 text-slate-500 rounded-full text-xs font-medium"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        className="w-1/2 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Invoice items layout */}
                    <div className="divide-y divide-slate-50 text-xs">
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-400 font-mono">Date</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {activeDetailItem.date}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-400 font-mono">Spending Plan</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          {activeDetailItem.category}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-400 font-mono">Account Wallet</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          {activeDetailItem.accountPaidFrom}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-400 font-mono">Autopay Recurring</span>
                        <span className="font-semibold text-slate-800">
                          {activeDetailItem.isRecurring ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="py-2.5 flex justify-between items-center">
                        <span className="text-slate-400 font-mono">Source Link</span>
                        <span className="font-semibold text-slate-800">
                          {activeDetailItem.isImported ? `Imported (${activeDetailItem.importSource})` : 'Manual Record'}
                        </span>
                      </div>
                      <div className="py-2.5">
                        <span className="text-slate-400 font-mono block mb-1">Notes / Receipts</span>
                        <span className="font-normal text-slate-600 block bg-slate-50 p-2.5 rounded-xl border border-slate-100 min-h-[40px] italic">
                          {activeDetailItem.notes || 'No receipts or notes linked to this transaction.'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={() => startEditingItem(activeDetailItem, activeDetailIndex)}
                        className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit record
                      </button>

                      <button
                        onClick={() => handleDeleteHistory(activeDetailIndex)}
                        className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK CATEGORIZATION PANEL (triggered by Swipe Right) */}
      <AnimatePresence>
        {quickCategorizeItem && quickCategorizeIndex !== null && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-150 relative"
            >
              <button 
                onClick={() => {
                  setQuickCategorizeItem(null);
                  setQuickCategorizeIndex(null);
                }}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-4">
                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Categorize Swipe</span>
                <h3 className="font-display font-bold text-sm text-slate-800 mt-1 truncate">Change category for "{quickCategorizeItem.item}"</h3>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleApplyQuickCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-[11px] font-semibold text-center border transition-all ${
                      quickCategorizeItem.category === cat
                        ? 'bg-blue-50 border-blue-200 text-blue-600'
                        : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => {
                  setQuickCategorizeItem(null);
                  setQuickCategorizeIndex(null);
                }}
                className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full text-xs font-semibold"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FILTER BUILDER MODAL */}
      <AnimatePresence>
        {showFiltersModal && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-150 flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <h3 className="font-display font-bold text-sm text-slate-900">Activity filter console</h3>
                <button onClick={() => setShowFiltersModal(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-1 text-xs">
                
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Category (spending plan)</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedCategoryFilter('All')}
                      className={`py-1 px-2.5 rounded-lg text-[10px] font-medium border ${
                        selectedCategoryFilter === 'All' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                      }`}
                    >
                      All Plan Categories
                    </button>
                    {categoriesList.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-medium border ${
                          selectedCategoryFilter === cat ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account Selection */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Paying Wallet</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedAccountFilter('All')}
                      className={`py-1 px-2.5 rounded-lg text-[10px] font-medium border ${
                        selectedAccountFilter === 'All' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                      }`}
                    >
                      All Wallets
                    </button>
                    {accounts.map(acc => (
                      <button
                        key={acc}
                        onClick={() => setSelectedAccountFilter(acc)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-medium border ${
                          selectedAccountFilter === acc ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {acc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status selection */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Clearing state</span>
                  <div className="flex gap-1.5">
                    {['All', 'Cleared', 'Pending'].map(st => (
                      <button
                        key={st}
                        onClick={() => setSelectedStatusFilter(st)}
                        className={`flex-1 py-1 px-2 text-center rounded-lg text-[10px] font-medium border ${
                          selectedStatusFilter === st ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Source Selection */}
                <div className="space-y-1.5">
                  <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider block font-bold">Data feed origin</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Manual', 'Imported', 'Plaid', 'CSV', 'Google Sheets'].map(srcItem => (
                      <button
                        key={srcItem}
                        onClick={() => setSelectedSourceFilter(srcItem)}
                        className={`py-1 px-2.5 rounded-lg text-[10px] font-medium border ${
                          selectedSourceFilter === srcItem ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {srcItem}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryFilter('All');
                    setSelectedAccountFilter('All');
                    setSelectedStatusFilter('All');
                    setSelectedSourceFilter('All');
                  }}
                  className="w-1/2 py-2 border border-slate-150 hover:bg-slate-50 text-slate-500 rounded-full text-xs font-semibold"
                >
                  Reset defaults
                </button>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="w-1/2 py-2 bg-slate-900 hover:bg-slate-850 text-white rounded-full text-xs font-semibold shadow-sm"
                >
                  Apply filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
