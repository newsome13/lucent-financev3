import { useState, FormEvent } from 'react';
import { Account, PaymentHistoryItem } from '../types';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Shield, 
  RefreshCw, 
  Landmark, 
  Wallet, 
  ArrowLeftRight, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Eye,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AccountsViewProps {
  accounts: Account[];
  onUpdateAccounts: (updated: Account[]) => void;
  onUpdateHistory?: (updated: PaymentHistoryItem[]) => void;
  history?: PaymentHistoryItem[];
}

export default function AccountsView({ accounts, onUpdateAccounts, onUpdateHistory, history = [] }: AccountsViewProps) {
  // Normalize accounts upon loading to make sure we have metadata fields
  const getNormalizedAccounts = (): Account[] => {
    return accounts.map(a => {
      if (a.institution) return a;
      const nameLower = a.name.toLowerCase();
      if (nameLower.includes('life')) {
        return { ...a, institution: 'Money Space', type: 'space', lastSynced: 'Just now', connectionStatus: 'Connected' };
      } else if (nameLower.includes('bill')) {
        return { ...a, institution: 'Money Space', type: 'space', lastSynced: 'Just now', connectionStatus: 'Connected' };
      } else if (nameLower.includes('safety') || nameLower.includes('buffer')) {
        return { ...a, institution: 'Money Space', type: 'space', lastSynced: 'Just now', connectionStatus: 'Connected' };
      } else if (nameLower.includes('escape') || nameLower.includes('vacation')) {
        return { ...a, institution: 'Money Space', type: 'space', lastSynced: 'Just now', connectionStatus: 'Connected' };
      } else if (nameLower.includes('boss') || nameLower.includes('freedom')) {
        return { ...a, institution: 'Money Space', type: 'space', lastSynced: 'Just now', connectionStatus: 'Connected' };
      } else if (nameLower.includes('chase')) {
        return { ...a, institution: 'Chase', type: 'credit', connectionStatus: 'Connected', lastSynced: 'Today, 10:24 AM' };
      } else if (nameLower.includes('paypal')) {
        return { ...a, institution: 'PayPal', type: 'checking', connectionStatus: 'Connected', lastSynced: 'Today, 10:15 AM' };
      } else if (nameLower.includes('cash app')) {
        return { ...a, institution: 'Cash App', type: 'checking', connectionStatus: 'Connected', lastSynced: 'Today, 10:15 AM' };
      } else if (nameLower.includes('cash')) {
        return { ...a, institution: 'Manual', type: 'cash' };
      } else {
        return { ...a, institution: 'Manual', type: 'checking' };
      }
    });
  };

  const normalized = getNormalizedAccounts();

  // Dialog & Modal States
  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [plaidStep, setPlaidStep] = useState<'intro' | 'select' | 'credentials' | 'verifying' | 'success'>('intro');
  const [selectedPlaidBank, setSelectedPlaidBank] = useState<string>('');
  const [plaidUsername, setPlaidUsername] = useState('');
  const [plaidPassword, setPlaidPassword] = useState('');

  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState<'checking' | 'savings' | 'credit' | 'loan' | 'cash' | 'other'>('cash');
  const [manualBalance, setManualBalance] = useState('');
  const [manualTarget, setManualTarget] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const [selectedInstitutionForDetail, setSelectedInstitutionForDetail] = useState<string | null>(null);
  const [syncingInstitutions, setSyncingInstitutions] = useState<Record<string, boolean>>({});

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState('');
  const [transferDest, setTransferDest] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editWeekly, setEditWeekly] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [selectedAccountForActivity, setSelectedAccountForActivity] = useState<string | null>(null);

  // Bank Institutions presets
  const bankPresets = [
    { name: 'Chase', logoColor: 'bg-blue-600', textColor: 'text-blue-600', accounts: [
      { name: 'Chase Premier Checking', type: 'checking', balance: 2450.15, availableBalance: 2450.15 },
      { name: 'Chase Freedom Unlimited', type: 'credit', balance: -1200.00, availableBalance: 8800.00 }
    ]},
    { name: 'Capital One', logoColor: 'bg-red-700', textColor: 'text-red-700', accounts: [
      { name: 'Capital One 360 Savings', type: 'savings', balance: 12500.50, availableBalance: 12500.50 },
      { name: 'Capital One Venture Card', type: 'credit', balance: -340.22, availableBalance: 14660.00 }
    ]},
    { name: 'Discover', logoColor: 'bg-orange-500', textColor: 'text-orange-500', accounts: [
      { name: 'Discover IT Card', type: 'credit', balance: -150.00, availableBalance: 4850.00 }
    ]},
    { name: 'American Express', logoColor: 'bg-sky-600', textColor: 'text-sky-600', accounts: [
      { name: 'Amex Gold Card', type: 'credit', balance: -450.00, availableBalance: 10000.00 }
    ]},
    { name: 'PayPal', logoColor: 'bg-blue-800', textColor: 'text-blue-800', accounts: [
      { name: 'PayPal Balance', type: 'checking', balance: 85.00, availableBalance: 85.00 }
    ]},
    { name: 'Cash App', logoColor: 'bg-emerald-500', textColor: 'text-emerald-500', accounts: [
      { name: 'Cash App Balance', type: 'checking', balance: 40.00, availableBalance: 40.00 }
    ]}
  ];

  // Group accounts
  const moneySpaces = normalized.filter(a => a.type === 'space' || a.institution === 'Money Space');
  const connectedInstitutions = Array.from(new Set(normalized.filter(a => a.institution && a.institution !== 'Money Space' && a.institution !== 'Manual').map(a => a.institution))) as string[];
  const manualAccounts = normalized.filter(a => a.institution === 'Manual' || a.institution === undefined);

  // Compute stats
  const totalLinkedBalance = normalized.reduce((sum, a) => {
    // If credit card or loan, subtract balance, else add
    if (a.type === 'credit' || a.type === 'loan') {
      return sum + a.balance; // usually credit card balance is stored positive or negative. Let's normalize positive debt as negative for total cash or keep simple.
    }
    return sum + a.balance;
  }, 0);

  const connectedAccountsCount = normalized.filter(a => a.institution && a.institution !== 'Money Space' && a.institution !== 'Manual').length;
  const manualAccountsCount = manualAccounts.length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  // Plaid Link Actions
  const handleLaunchPlaid = () => {
    setPlaidStep('intro');
    setShowPlaidModal(true);
  };

  const handlePlaidSubmitCredentials = () => {
    setPlaidStep('verifying');
    setTimeout(() => {
      setPlaidStep('success');
      // Add preset accounts to list
      const preset = bankPresets.find(p => p.name === selectedPlaidBank);
      if (preset) {
        const newAccs: Account[] = preset.accounts.map(acc => ({
          name: acc.name,
          purpose: `Automatically connected ${preset.name} account`,
          balance: acc.balance,
          targetBalance: 0,
          weeklyTransfer: 0,
          monthlyTransfer: 0,
          notes: 'Secure bank sync via Plaid',
          institution: preset.name,
          connectionStatus: 'Connected',
          lastSynced: 'Just now',
          type: acc.type as any,
          availableBalance: acc.availableBalance
        }));

        // Filter out existing accounts with the same name to prevent duplicates
        const filteredOld = accounts.filter(old => !newAccs.some(n => n.name === old.name));
        onUpdateAccounts([...filteredOld, ...newAccs]);
      }
    }, 2000);
  };

  const handleSyncInstitution = (inst: string) => {
    setSyncingInstitutions(prev => ({ ...prev, [inst]: true }));
    
    // Simulate sync
    setTimeout(() => {
      setSyncingInstitutions(prev => ({ ...prev, [inst]: false }));
      const updated = accounts.map(a => {
        if (a.institution === inst) {
          return {
            ...a,
            connectionStatus: 'Connected' as const,
            lastSynced: 'Just now'
          };
        }
        return a;
      });
      onUpdateAccounts(updated);
    }, 1500);
  };

  const handleDisconnectInstitution = (inst: string) => {
    const confirmDisconnect = window.confirm(`Are you sure you want to disconnect ${inst}? All linked accounts will be removed from your dashboard.`);
    if (!confirmDisconnect) return;

    const remaining = accounts.filter(a => a.institution !== inst);
    onUpdateAccounts(remaining);
    setSelectedInstitutionForDetail(null);
  };

  const handleAddManualAccount = (e: FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualBalance) return;

    const newAcc: Account = {
      name: manualName,
      purpose: manualNotes || 'Manual Offline Account',
      balance: parseFloat(manualBalance) || 0,
      targetBalance: parseFloat(manualTarget) || 0,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: manualNotes,
      institution: 'Manual',
      type: manualType,
      connectionStatus: 'Connected',
      lastSynced: 'Just now'
    };

    onUpdateAccounts([...accounts, newAcc]);
    setShowAddManualModal(false);
    setManualName('');
    setManualBalance('');
    setManualTarget('');
    setManualNotes('');
  };

  const handleOpenEditModal = (acc: Account) => {
    setEditingAccount(acc);
    setEditBalance(acc.balance.toString());
    setEditTarget((acc.targetBalance || 0).toString());
    setEditWeekly((acc.weeklyTransfer || 0).toString());
    setEditNotes(acc.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editingAccount) return;
    const updated = accounts.map(a => {
      if (a.name === editingAccount.name) {
        const weekly = parseFloat(editWeekly) || 0;
        return {
          ...a,
          balance: parseFloat(editBalance) || 0,
          targetBalance: parseFloat(editTarget) || 0,
          weeklyTransfer: weekly,
          monthlyTransfer: weekly * 4.33,
          notes: editNotes
        };
      }
      return a;
    });
    onUpdateAccounts(updated);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (accName: string) => {
    const confirmDel = window.confirm(`Are you sure you want to delete ${accName}?`);
    if (!confirmDel) return;

    const remaining = accounts.filter(a => a.name !== accName);
    onUpdateAccounts(remaining);
    setEditingAccount(null);
  };

  const handleTransferSubmit = (e: FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (!transferSource || !transferDest || isNaN(amountNum) || amountNum <= 0) return;

    // Deduct from source, add to dest
    const sourceAcc = accounts.find(a => a.name === transferSource);
    const destAcc = accounts.find(a => a.name === transferDest);

    if (!sourceAcc || !destAcc) return;

    const updated = accounts.map(a => {
      if (a.name === transferSource) {
        return { ...a, balance: a.balance - amountNum };
      }
      if (a.name === transferDest) {
        return { ...a, balance: a.balance + amountNum };
      }
      return a;
    });

    onUpdateAccounts(updated);

    // If history updates are enabled, push a transaction log!
    if (onUpdateHistory) {
      const newTx: PaymentHistoryItem = {
        date: new Date().toISOString().split('T')[0],
        item: `Transfer from ${transferSource.split(' ')[0]} to ${transferDest.split(' ')[0]}`,
        category: 'Savings',
        amount: amountNum,
        accountPaidFrom: transferSource,
        notes: `Transfer Move`
      };
      onUpdateHistory([newTx, ...history]);
    }

    setShowTransferModal(false);
    setTransferSource('');
    setTransferDest('');
    setTransferAmount('');
    alert(`Successfully moved ${formatCurrency(amountNum)}!`);
  };

  // Helper icons
  const getAccountTypeIcon = (type?: string) => {
    switch (type) {
      case 'credit': return <Landmark className="w-4 h-4 text-rose-500" />;
      case 'loan': return <Landmark className="w-4 h-4 text-amber-500" />;
      case 'savings': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'space': return <Wallet className="w-4 h-4 text-blue-500" />;
      default: return <Wallet className="w-4 h-4 text-slate-500" />;
    }
  };

  const getConnectionStatusIcon = (status?: string) => {
    switch (status) {
      case 'Connected': return <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Connected</span>;
      case 'Syncing': return <span className="flex items-center gap-1 text-[11px] font-medium text-amber-500 animate-pulse"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing</span>;
      case 'Needs Attention': return <span className="flex items-center gap-1 text-[11px] font-medium text-orange-500"><AlertCircle className="w-3.5 h-3.5" /> Needs Attention</span>;
      case 'Connection Expired': return <span className="flex items-center gap-1 text-[11px] font-medium text-rose-500"><AlertCircle className="w-3.5 h-3.5" /> Expired</span>;
      default: return <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">Offline</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 pb-32 space-y-8 animate-fade-in" id="accounts-hub-frame">
      
      {/* SECTION 1: MASTER SUMMARY BLOCK (Apple Wallet Style Header Card) */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-display font-semibold text-slate-900 tracking-tight">Accounts & Ledger</h2>
          <p className="text-xs text-slate-500">The centralized control room for personal liquidity, connected banks, and automatic buffer rules.</p>
        </div>
        
        {/* Apple Wallet inspired Summary Card */}
        <div className="w-full md:max-w-md bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between" id="apple-summary-card">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/0 rounded-full blur-2xl" />
          
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">Combined Assets</span>
            <Landmark className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="my-3">
            <h3 className="text-2xl font-display font-bold tracking-tight text-white">{formatCurrency(totalLinkedBalance)}</h3>
            <p className="text-[9px] text-slate-400 mt-1">Real-time valuation across spaces & connected banks</p>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-[10px] text-slate-400">
            <div>
              <span className="block font-bold text-slate-200">{connectedAccountsCount}</span>
              <span>Connected Accounts</span>
            </div>
            <div className="text-center">
              <span className="block font-bold text-slate-200">{manualAccountsCount}</span>
              <span>Manual Assets</span>
            </div>
            <div className="text-right">
              <span className="block font-bold text-emerald-400">Synced</span>
              <span>Today at 10:40 AM</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PROMINENT CONNECT BANK ACTIONS BAR */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 rounded-3xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs" id="plaid-prominent-action-bar">
        <div className="space-y-1">
          <h4 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-blue-600" /> Connect Bank Account
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
            Securely connect your bank accounts to automatically import balances, credit liabilities, and live financial activity via Plaid.
          </p>
        </div>
        <button
          onClick={handleLaunchPlaid}
          className="py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
          id="btn-launch-plaid-sync"
        >
          <Plus className="w-4 h-4" />
          Connect with Plaid
        </button>
      </div>

      {/* SECTION 3: PERSONAL MONEY SPACES (Cards representing core allocation buckets) */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-slate-400">Personal Money Spaces</h3>
          <button 
            onClick={() => {
              setTransferSource(moneySpaces[0]?.name || '');
              setTransferDest(moneySpaces[1]?.name || '');
              setShowTransferModal(true);
            }}
            className="flex items-center gap-1.5 py-1 px-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-medium transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
            Quick Move Funds
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {moneySpaces.map((space, idx) => {
            const hasTarget = space.targetBalance > 0;
            const progress = hasTarget ? Math.min((space.balance / space.targetBalance) * 100, 100) : 100;
            const isShort = hasTarget && space.balance < space.targetBalance;
            
            // Colorful accent borders/bgs based on space names
            const spaceName = space.name.toLowerCase();
            let accentBg = 'from-blue-500 to-sky-400';
            let dotColor = 'bg-blue-500';
            if (spaceName.includes('bill')) {
              accentBg = 'from-orange-500 to-amber-400';
              dotColor = 'bg-orange-500';
            } else if (spaceName.includes('safety') || spaceName.includes('buffer')) {
              accentBg = 'from-emerald-500 to-teal-400';
              dotColor = 'bg-emerald-500';
            } else if (spaceName.includes('escape') || spaceName.includes('vacation')) {
              accentBg = 'from-teal-500 to-cyan-400';
              dotColor = 'bg-teal-500';
            } else if (spaceName.includes('boss') || spaceName.includes('freedom')) {
              accentBg = 'from-purple-500 to-indigo-400';
              dotColor = 'bg-purple-500';
            }

            return (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs relative overflow-hidden hover:shadow-md transition-all flex flex-col justify-between group"
                id={`space-card-${idx}`}
              >
                {/* Thin top colored line */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${accentBg}`} />

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-800">{space.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  </div>
                  
                  <p className="text-[10px] text-slate-400 leading-relaxed min-h-[30px]">{space.purpose}</p>

                  <div className="my-4">
                    <span className="block text-[10px] text-slate-400 font-sans">Available Funds</span>
                    <span className="text-xl font-display font-bold tracking-tight text-slate-850">{formatCurrency(space.balance)}</span>
                  </div>

                  {hasTarget && (
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Cushion target: {formatCurrency(space.targetBalance)}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${accentBg}`} 
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-50 flex justify-between items-center">
                  <button 
                    onClick={() => handleOpenEditModal(space)}
                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => setSelectedAccountForActivity(space.name)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-0.5"
                  >
                    <Activity className="w-3 h-3" /> Log
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: CONNECTED FINANCIAL INSTITUTIONS */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-slate-400">Connected Banks & Cards</h3>
        
        {connectedInstitutions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <Landmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-700">No external accounts linked yet</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">Connect your active checking hubs or credit cards to see them organized in premium Apple Wallet stacks.</p>
            <button 
              onClick={handleLaunchPlaid}
              className="mt-3 py-1.5 px-4 bg-slate-900 text-white rounded-full text-[10px] font-semibold hover:bg-slate-800 transition-colors"
            >
              Start Connection Flow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {connectedInstitutions.map((inst, index) => {
              const instAccounts = normalized.filter(a => a.institution === inst);
              const connectionStatus = instAccounts[0]?.connectionStatus || 'Connected';
              const lastSynced = instAccounts[0]?.lastSynced || 'Today, 10:40 AM';
              
              // Preset styles
              const preset = bankPresets.find(p => p.name === inst);
              const logoColor = preset?.logoColor || 'bg-slate-800';
              const textAccent = preset?.textColor || 'text-slate-800';

              return (
                <div 
                  key={index}
                  onClick={() => setSelectedInstitutionForDetail(inst)}
                  className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group"
                  id={`bank-card-${inst}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl ${logoColor} text-white flex items-center justify-center font-bold font-display text-sm shadow-xs`}>
                        {inst.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{inst}</h4>
                        <span className="text-[9px] text-slate-400">Synced {lastSynced}</span>
                      </div>
                    </div>
                    {getConnectionStatusIcon(connectionStatus)}
                  </div>

                  <div className="my-5 space-y-1">
                    <span className="text-[10px] text-slate-400">Linked Products ({instAccounts.length})</span>
                    <div className="divide-y divide-slate-50">
                      {instAccounts.slice(0, 2).map((acc, aIdx) => (
                        <div key={aIdx} className="flex justify-between py-1.5 text-xs">
                          <span className="text-slate-600 truncate max-w-[150px]">{acc.name}</span>
                          <span className="font-mono font-bold text-slate-800">{formatCurrency(acc.balance)}</span>
                        </div>
                      ))}
                      {instAccounts.length > 2 && (
                        <div className="text-[10px] text-blue-600 pt-1.5 font-semibold">
                          + {instAccounts.length - 2} more accounts
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-700 flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                      Manage Connection <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-[9px]">Plaid Connection Verified</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 5: MANUAL / OFFLINE ACCOUNTS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-mono font-bold tracking-widest uppercase text-slate-400">Manual Offline Assets</h3>
          <button 
            onClick={() => setShowAddManualModal(true)}
            className="flex items-center gap-1 py-1 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-medium transition-colors"
            id="btn-add-manual-asset"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Offline Asset
          </button>
        </div>

        {manualAccounts.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No offline accounts registered. Use "+ Add Offline Asset" to include physical cash or backup vaults.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {manualAccounts.map((acc, idx) => (
              <div 
                key={idx}
                className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80 hover:bg-white hover:border-slate-200 transition-all flex justify-between items-center group"
                id={`manual-acc-card-${idx}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-slate-200/50 rounded-xl text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                    {getAccountTypeIcon(acc.type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{acc.name}</h4>
                    <span className="text-[9px] text-slate-400 capitalize">{acc.type || 'Asset'} • Offline</span>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-xs font-mono font-bold text-slate-800">{formatCurrency(acc.balance)}</span>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    <button 
                      onClick={() => handleOpenEditModal(acc)}
                      className="text-[9px] text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteAccount(acc.name)}
                      className="text-[9px] text-rose-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODALS & OVERLAYS --- */}

      {/* PLAID LINK FLOW OVERLAY */}
      <AnimatePresence>
        {showPlaidModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-150"
            >
              <button 
                onClick={() => setShowPlaidModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* STEP 1: INTRO */}
              {plaidStep === 'intro' && (
                <div className="space-y-5">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-display font-bold text-slate-800">Secure Link with Plaid</h3>
                    <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                      Personal Finance Command Center uses Plaid to securely connect your bank credentials. Your secrets are always client-side and never exposed.
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Bank-grade 256-bit encryption protocol</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Over 12,000 supported financial institutions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Instant balance imports & live activity logs</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setPlaidStep('select')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-md transition-all"
                  >
                    Continue
                  </button>
                </div>
              )}

              {/* STEP 2: SELECT INSTITUTION */}
              {plaidStep === 'select' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800">Select your bank institution</h3>
                  <p className="text-xs text-slate-400">Choose from major recommended institutions:</p>

                  <div className="grid grid-cols-2 gap-3">
                    {bankPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setSelectedPlaidBank(preset.name);
                          setPlaidStep('credentials');
                        }}
                        className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-300 transition-all flex flex-col items-center gap-2 text-center group"
                      >
                        <div className={`w-8 h-8 rounded-xl ${preset.logoColor} text-white flex items-center justify-center font-bold text-xs`}>
                          {preset.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-center pt-2">
                    <span className="text-[10px] text-slate-400">Can't find your bank? Search other institutions</span>
                  </div>
                </div>
              )}

              {/* STEP 3: LOG IN TO BANK */}
              {plaidStep === 'credentials' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={() => setPlaidStep('select')}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      ← Back
                    </button>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs text-slate-500 font-semibold">Verify with {selectedPlaidBank}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800">Log in to your account</h3>
                  <p className="text-xs text-slate-400">Please provide your bank access credentials:</p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Username / ID</label>
                      <input 
                        type="text" 
                        value={plaidUsername}
                        onChange={e => setPlaidUsername(e.target.value)}
                        placeholder="e.g. user_123"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Password</label>
                      <input 
                        type="password" 
                        value={plaidPassword}
                        onChange={e => setPlaidPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={handlePlaidSubmitCredentials}
                    disabled={!plaidUsername || !plaidPassword}
                    className="w-full py-2.5 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-md disabled:bg-slate-300 disabled:shadow-none transition-all"
                  >
                    Authorize Secure Link
                  </button>
                </div>
              )}

              {/* STEP 4: VERIFYING */}
              {plaidStep === 'verifying' && (
                <div className="py-8 flex flex-col items-center text-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Verifying secure keys...</h4>
                    <p className="text-xs text-slate-400 mt-1">Establishing handshakes with {selectedPlaidBank} ledger database</p>
                  </div>
                </div>
              )}

              {/* STEP 5: SUCCESS CELEBRATION */}
              {plaidStep === 'success' && (
                <div className="py-4 flex flex-col items-center text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm animate-bounce">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Connection Successful!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedPlaidBank} has been connected. Accounts automatically added to your personal balance sheet.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setShowPlaidModal(false);
                      setPlaidUsername('');
                      setPlaidPassword('');
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold mt-2"
                  >
                    Got It, Let's Go!
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD MANUAL ACCOUNT MODAL */}
      <AnimatePresence>
        {showAddManualModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-150"
            >
              <button 
                onClick={() => setShowAddManualModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-display font-bold text-slate-800 mb-4">Add Manual Offline Asset</h3>

              <form onSubmit={handleAddManualAccount} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Asset Name</label>
                  <input
                    type="text"
                    required
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    placeholder="e.g. Physical Safe Cash, Gift Cards"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Asset Type</label>
                    <select
                      value={manualType}
                      onChange={e => setManualType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="cash">Physical Cash</option>
                      <option value="checking">Checking/Bank</option>
                      <option value="savings">Savings / Envelope</option>
                      <option value="credit">Credit / Offline Debt</option>
                      <option value="loan">Offline Loan</option>
                      <option value="other">Gift Card / Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Initial Balance ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={manualBalance}
                      onChange={e => setManualBalance(e.target.value)}
                      placeholder="150.00"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Target Balance ($) - Optional</label>
                    <input
                      type="number"
                      step="0.01"
                      value={manualTarget}
                      onChange={e => setManualTarget(e.target.value)}
                      placeholder="e.g. 500.00"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Special Notes</label>
                  <textarea
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    placeholder="e.g. Envelope kept in closet, gift voucher expiration dates"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500 h-16 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddManualModal(false)}
                    className="py-2 px-4 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-slate-900 hover:bg-slate-850 text-white rounded-full text-xs font-semibold shadow-md"
                  >
                    Register Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONNECTED INSTITUTION DETAIL MODAL */}
      <AnimatePresence>
        {selectedInstitutionForDetail && (() => {
          const inst = selectedInstitutionForDetail;
          const instAccounts = normalized.filter(a => a.institution === inst);
          const connectionStatus = instAccounts[0]?.connectionStatus || 'Connected';
          const lastSynced = instAccounts[0]?.lastSynced || 'Just now';
          const preset = bankPresets.find(p => p.name === inst);
          const logoColor = preset?.logoColor || 'bg-slate-800';

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative border border-slate-150"
              >
                <button 
                  onClick={() => setSelectedInstitutionForDetail(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3.5 mb-6">
                  <div className={`w-10 h-10 rounded-2xl ${logoColor} text-white flex items-center justify-center font-bold font-display text-lg shadow-sm shrink-0`}>
                    {inst.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-display font-bold text-slate-800">{inst} Connected Stack</h3>
                      {getConnectionStatusIcon(connectionStatus)}
                    </div>
                    <p className="text-[10px] text-slate-400">Plaid Secure Token Synced: {lastSynced}</p>
                  </div>
                </div>

                <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                  {instAccounts.map((acc, aIdx) => (
                    <div 
                      key={aIdx} 
                      className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors bg-slate-50/40 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl border border-slate-100 shrink-0">
                          {getAccountTypeIcon(acc.type)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{acc.name}</h4>
                          <span className="text-[9px] text-slate-400 font-mono">Available: {formatCurrency(acc.availableBalance || acc.balance)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-slate-850">{formatCurrency(acc.balance)}</span>
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[9px] text-blue-600">
                          <button 
                            onClick={() => handleOpenEditModal(acc)}
                            className="hover:underline font-semibold"
                          >
                            Rename
                          </button>
                          <span>•</span>
                          <button 
                            onClick={() => setSelectedAccountForActivity(acc.name)}
                            className="hover:underline font-semibold"
                          >
                            Log
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                  <button 
                    onClick={() => handleSyncInstitution(inst)}
                    disabled={syncingInstitutions[inst]}
                    className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 disabled:bg-slate-200 text-white rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncingInstitutions[inst] ? 'animate-spin' : ''}`} />
                    {syncingInstitutions[inst] ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button 
                    onClick={() => handleDisconnectInstitution(inst)}
                    className="flex-1 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-full text-xs font-semibold"
                  >
                    Disconnect Stack
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* QUICK TRANSFER / MOVE FUNDS MODAL */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-150"
            >
              <button 
                onClick={() => setShowTransferModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-display font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <ArrowLeftRight className="w-4.5 h-4.5 text-blue-500" /> Transfer Money Spaces
              </h3>
              <p className="text-xs text-slate-400 mb-5">Move cash balances seamlessly between your checking hubs, emergency pads, and goal spaces.</p>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Source Account</label>
                  <select
                    required
                    value={transferSource}
                    onChange={e => setTransferSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Source --</option>
                    {normalized.filter(a => a.type !== 'credit').map((a, i) => (
                      <option key={i} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Destination Space</label>
                  <select
                    required
                    value={transferDest}
                    onChange={e => setTransferDest(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Choose Destination --</option>
                    {normalized.filter(a => a.name !== transferSource).map((a, i) => (
                      <option key={i} value={a.name}>{a.name} ({formatCurrency(a.balance)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Amount ($)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3 pl-8 text-xs font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="py-2 px-4 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-semibold shadow-md"
                  >
                    Transfer Funds
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT MODAL FOR SPACE & MANUAL ACCOUNTS */}
      <AnimatePresence>
        {editingAccount && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-150"
            >
              <button 
                onClick={() => setEditingAccount(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-display font-bold text-slate-800 mb-1">Edit Account Settings</h3>
              <p className="text-xs text-slate-400 mb-5">Adjust current assets, reserve cushions, and automated move preferences for: <b>{editingAccount.name}</b></p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editBalance}
                    onChange={e => setEditBalance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                {editingAccount.type === 'space' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Reserve Cushion Target ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editTarget}
                        onChange={e => setEditTarget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 block mb-1">Weekly Automated Move ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editWeekly}
                        onChange={e => setEditWeekly(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Special Notes</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <button
                    onClick={() => handleDeleteAccount(editingAccount.name)}
                    className="py-2 px-4 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100"
                  >
                    Delete Account
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingAccount(null)}
                      className="py-2 px-4 rounded-full text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECENT ACTIVITY LOGS FILTERED MODAL */}
      <AnimatePresence>
        {selectedAccountForActivity && (() => {
          const accName = selectedAccountForActivity;
          const filteredTxs = history.filter(tx => tx.accountPaidFrom === accName);

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-150"
              >
                <button 
                  onClick={() => setSelectedAccountForActivity(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-base font-display font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Activity className="w-4.5 h-4.5 text-blue-500" /> {accName} Activity
                </h3>
                <p className="text-xs text-slate-400 mb-5">Audit chronological payments, withdrawals, and syncing history for this ledger node.</p>

                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredTxs.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No activity logs recorded for this space. Transactions appear here once parsed or linked.
                    </div>
                  ) : (
                    filteredTxs.map((tx, txIdx) => (
                      <div key={txIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-100/60 flex justify-between items-center">
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{tx.item}</h5>
                          <span className="text-[9px] text-slate-400">{tx.date} • {tx.category}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700">
                          {tx.amount > 0 ? '-' : '+'}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <button 
                  onClick={() => setSelectedAccountForActivity(null)}
                  className="w-full mt-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold"
                >
                  Close Activity Log
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
