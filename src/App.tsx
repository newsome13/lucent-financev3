import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, getAccessToken } from './lib/googleAuth';
import { findFinanceSpreadsheet, createFinanceSpreadsheet, fetchFinanceData, saveFinanceData } from './lib/googleSheets';
import { initialMockData } from './lib/mockData';
import { demoMockData } from './lib/demoData';
import { FinanceData, Account, Debt, Bill, Goal, BudgetCategory, PaycheckCovers, SavingsChallenge, Subscription, PaymentHistoryItem } from './types';
import { recalculateBalances } from './lib/financialEngine';

// Component imports
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import UpcomingView from './components/UpcomingView';
import DebtsView from './components/DebtsView';
import GoalsView from './components/GoalsView';
import BudgetView from './components/BudgetView';
import AccountsView from './components/AccountsView';
import ChallengesView from './components/ChallengesView';
import SubscriptionsView from './components/SubscriptionsView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import MoreView from './components/MoreView';
import ReportsView from './components/ReportsView';
import CommunityView from './components/CommunityView';
import RoadmapView from './components/RoadmapView';
import BottomNav from './components/BottomNav';
import FirstLaunchExperience from './components/FirstLaunchExperience';

// Premium Features Component Imports
import FinancialJourney from './components/FinancialJourney';
import AiFinancialCoach from './components/AiFinancialCoach';
import BackupSyncCenter from './components/BackupSyncCenter';
import SmartFAB from './components/SmartFAB';
import SwipeActionContainer from './components/SwipeActionContainer';
import { 
  saveLedgerToFirestore, 
  loadLedgerFromFirestore, 
  savePreferencesToFirestore, 
  loadPreferencesFromFirestore, 
  deleteUserDataFromFirestore 
} from './lib/firestoreSync';
import { motion, AnimatePresence } from 'motion/react';

import { ShieldAlert, RefreshCw, Sparkles, Download, FileText, Trash2, X, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // App Onboarding & Demo states
  const [onboarded, setOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('finance_command_center_onboarded') === 'true';
  });
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('finance_command_center_demo_active') === 'true';
  });
  const [activeModal, setActiveModal] = useState<'demo' | 'fresh' | 'leave' | null>(null);
  const [showActualName, setShowActualName] = useState<boolean>(() => {
    return localStorage.getItem('finance_command_center_show_actual_name') === 'true';
  });

  // Core Ledger States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [paycheckCovers, setPaycheckCovers] = useState<PaycheckCovers>(initialMockData.paycheckCovers);
  const [challenges, setChallenges] = useState<SavingsChallenge[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);

  // 1. Initial State Load
  useEffect(() => {
    // Load local storage cached values first
    const cachedData = localStorage.getItem('finance_command_center_data');
    if (cachedData) {
      try {
        const parsed: FinanceData = JSON.parse(cachedData);
        loadFinanceDataIntoState(parsed);
      } catch (e) {
        console.error('Failed to parse cached localstorage finance data:', e);
        loadFinanceDataIntoState(initialMockData);
      }
    } else {
      loadFinanceDataIntoState(initialMockData);
    }

    // Load active spreadsheet reference
    const cachedSheetId = localStorage.getItem('finance_command_center_sheet_id');
    const cachedSheetUrl = localStorage.getItem('finance_command_center_sheet_url');
    if (cachedSheetId) setSpreadsheetId(cachedSheetId);
    if (cachedSheetUrl) setSpreadsheetUrl(cachedSheetUrl);

    // Initialize Firebase authentication listener
    const unsubscribe = initAuth(
      async (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        
        try {
          // Load preferences from Firestore
          const prefs = await loadPreferencesFromFirestore(authUser.uid);
          if (prefs) {
            setShowActualName(prefs.showActualName);
            setOnboarded(prefs.onboarded);
            setIsDemoMode(prefs.isDemoMode);
          }
          
          // Load ledger from Firestore
          const cloudLedger = await loadLedgerFromFirestore(authUser.uid);
          if (cloudLedger) {
            loadFinanceDataIntoState(cloudLedger);
            localStorage.setItem('finance_command_center_data', JSON.stringify(cloudLedger));
          }
        } catch (err) {
          console.error('Failed to load user state from Firestore:', err);
        }
        
        setInitialLoading(false);
        // Automatically check/sync if we have a linked spreadsheet
        if (cachedSheetId && authToken) {
          syncWithGoogleSheets(cachedSheetId, authToken);
        }
      },
      () => {
        setUser(null);
        setToken(null);
        setInitialLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helpers to dump variables cleanly
  const loadFinanceDataIntoState = (data: FinanceData) => {
    setAccounts(data.accounts || []);
    setDebts(data.debts || []);
    setBills(data.bills || []);
    setGoals(data.goals || []);
    setBudgetCategories(data.budgetCategories || []);
    setPaycheckCovers(data.paycheckCovers || initialMockData.paycheckCovers);
    setChallenges(data.challenges || []);
    setSubscriptions(data.subscriptions || []);
    setHistory(data.history || []);
  };

  const getFinanceDataPayload = (): FinanceData => {
    return {
      accounts,
      debts,
      bills,
      goals,
      budgetCategories,
      budgetItems: [],
      paycheckCovers,
      challenges,
      subscriptions,
      history
    };
  };

  // Cache changes locally on every state mutation & auto-save to Firestore
  useEffect(() => {
    if (accounts.length > 0 || debts.length > 0) {
      const payload = getFinanceDataPayload();
      localStorage.setItem('finance_command_center_data', JSON.stringify(payload));
      
      // Auto-save to Firestore if user is authenticated
      if (user) {
        saveLedgerToFirestore(user.uid, payload).catch(err => {
          console.error('Failed to sync state mutation to Firestore:', err);
        });
      }
    }
  }, [accounts, debts, bills, goals, budgetCategories, paycheckCovers, challenges, subscriptions, history, user]);

  // Sync preferences to Firestore when changed
  useEffect(() => {
    if (user && onboarded !== undefined) {
      savePreferencesToFirestore(user.uid, showActualName, onboarded, isDemoMode).catch(err => {
        console.error('Failed to sync preferences to Firestore:', err);
      });
    }
  }, [showActualName, onboarded, isDemoMode, user]);

  // Sync state mutations back to Drive spreadsheet if connected
  const persistToSpreadsheetIfLinked = async (
    accs = accounts,
    dts = debts,
    bls = bills,
    gls = goals,
    cats = budgetCategories,
    covs = paycheckCovers,
    chals = challenges,
    subs = subscriptions,
    hist = history
  ) => {
    if (!spreadsheetId || !token) return;
    try {
      setIsSyncing(true);
      const payload: FinanceData = {
        accounts: accs,
        debts: dts,
        bills: bls,
        goals: gls,
        budgetCategories: cats,
        budgetItems: [],
        paycheckCovers: covs,
        challenges: chals,
        subscriptions: subs,
        history: hist
      };
      await saveFinanceData(spreadsheetId, token, payload);
    } catch (err) {
      console.error('Auto sync back to Google Sheets failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Google OAuth Flows
  const handleLogin = async () => {
    try {
      setIsSyncing(true);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        
        // Find existing spreadsheet or create a new one
        const found = await findFinanceSpreadsheet(result.accessToken);
        if (found) {
          setSpreadsheetId(found.id);
          setSpreadsheetUrl(found.url);
          localStorage.setItem('finance_command_center_sheet_id', found.id);
          localStorage.setItem('finance_command_center_sheet_url', found.url);
          await syncWithGoogleSheets(found.id, result.accessToken);
        } else {
          // Confirm creation of new Google Sheet
          const createNew = window.confirm(
            'Create a new "Personal Finance Command Center" spreadsheet inside your Google Drive?'
          );
          if (createNew) {
            const currentData = getFinanceDataPayload();
            const created = await createFinanceSpreadsheet(result.accessToken, currentData);
            setSpreadsheetId(created.id);
            setSpreadsheetUrl(created.url);
            localStorage.setItem('finance_command_center_sheet_id', created.id);
            localStorage.setItem('finance_command_center_sheet_url', created.url);
            alert('Spreadsheet successfully initialized in Google Drive!');
          }
        }
      }
    } catch (error) {
      console.error('Login integration error:', error);
      alert('Authentication failed. Check your network or permissions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async (clearLocal?: boolean) => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    setToken(null);
    setSpreadsheetId(null);
    setSpreadsheetUrl(null);
    localStorage.removeItem('finance_command_center_sheet_id');
    localStorage.removeItem('finance_command_center_sheet_url');
    
    if (clearLocal) {
      localStorage.removeItem('finance_command_center_data');
      localStorage.removeItem('finance_command_center_onboarded');
      localStorage.removeItem('finance_command_center_demo_active');
      localStorage.removeItem('finance_community_opt_in');
      localStorage.removeItem('finance_community_username');
      localStorage.removeItem('finance_community_avatar_index');
      localStorage.removeItem('goals_custom_checklists');
      setOnboarded(false);
      setIsDemoMode(false);
      loadFinanceDataIntoState(initialMockData);
    }
  };

  const handleDeleteAllCloudData = async () => {
    if (user) {
      try {
        await deleteUserDataFromFirestore(user.uid);
        await handleLogout(true);
      } catch (e) {
        console.error('Could not complete database purge:', e);
        alert('Cloud database purge encountered an error. Please try again.');
      }
    }
  };

  // 3. Google Sheets Synchronizations
  const syncWithGoogleSheets = async (sheetId: string, accessToken: string) => {
    try {
      setIsSyncing(true);
      const remoteData = await fetchFinanceData(sheetId, accessToken);
      loadFinanceDataIntoState(remoteData);
    } catch (err) {
      console.error('Error fetching latest workbook data:', err);
      // Fallback: send local state to sheet if fetch failed due to blank cells
      const localData = getFinanceDataPayload();
      await saveFinanceData(sheetId, accessToken, localData);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = () => {
    const activeToken = token || getAccessToken();
    if (spreadsheetId && activeToken) {
      syncWithGoogleSheets(spreadsheetId, activeToken);
    } else {
      handleLogin();
    }
  };

  // Overwrite Drive Spreadsheets entirely
  const handleRebuildSpreadsheet = async () => {
    const activeToken = token || getAccessToken();
    if (!spreadsheetId || !activeToken) return;
    const confirmRebuild = window.confirm(
      'WARNING: This will completely overwrite and format your current Google Sheet "Personal Finance Command Center" with your current web-app state. Proceed?'
    );
    if (!confirmRebuild) return;

    try {
      setIsSyncing(true);
      const currentData = getFinanceDataPayload();
      await saveFinanceData(spreadsheetId, activeToken, currentData);
      alert('Spreadsheet rewritten and formatted successfully in Google Drive!');
    } catch (e) {
      console.error('Failed to rebuild spreadsheet:', e);
      alert('Failed to rebuild spreadsheet. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 3.5 Backup, Reset, and Onboarding Actions
  const handleExportJson = () => {
    try {
      const data = getFinanceDataPayload();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance_command_center_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export JSON failed:', err);
      alert('Failed to export JSON file.');
    }
  };

  const handleExportCsv = () => {
    try {
      const headers = ['Date', 'Item', 'Category', 'Amount', 'Account Paid From', 'Notes', 'Import Source'];
      const rows = history.map(h => [
        h.date,
        h.item,
        h.category,
        h.amount.toString(),
        h.accountPaidFrom,
        h.notes || '',
        h.importSource || 'Manual'
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `finance_command_center_activity_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('Failed to export CSV file.');
    }
  };

  const handleLoadDemoInstant = () => {
    // Cache any non-empty current state first
    try {
      const currentData = getFinanceDataPayload();
      if (currentData.accounts.length > 0 || currentData.debts.length > 0 || currentData.history.length > 0) {
        localStorage.setItem('finance_command_center_backup_before_demo', JSON.stringify(currentData));
      }
    } catch (e) {}

    loadFinanceDataIntoState(demoMockData);
    localStorage.setItem('finance_command_center_data', JSON.stringify(demoMockData));
    localStorage.setItem('finance_command_center_demo_active', 'true');
    localStorage.setItem('finance_command_center_onboarded', 'true');
    setIsDemoMode(true);
    setOnboarded(true);
    setActiveModal(null);
    setCurrentTab('dashboard');
  };

  const handleLoadFreshInstant = () => {
    // Clear connection profiles
    localStorage.removeItem('plaid_bank_access_token');
    localStorage.removeItem('finance_command_center_sheet_id');
    localStorage.removeItem('finance_command_center_sheet_url');
    localStorage.removeItem('goals_custom_checklists');
    localStorage.removeItem('finance_command_center_demo_active');

    const emptyData: FinanceData = {
      accounts: [],
      debts: [],
      bills: [],
      goals: [],
      budgetCategories: [],
      budgetItems: [],
      paycheckCovers: {
        paycheckDate: new Date().toISOString().slice(0, 10),
        paycheckAmount: 0,
        billsCovered: [],
        debtPayments: [],
        transfers: []
      },
      challenges: [],
      subscriptions: [],
      history: []
    };

    loadFinanceDataIntoState(emptyData);
    localStorage.setItem('finance_command_center_data', JSON.stringify(emptyData));
    localStorage.setItem('finance_command_center_onboarded', 'true');
    setIsDemoMode(false);
    setOnboarded(true);
    setActiveModal(null);
    setCurrentTab('dashboard');
  };

  const handleLoadSkipInstant = () => {
    loadFinanceDataIntoState(initialMockData);
    localStorage.setItem('finance_command_center_data', JSON.stringify(initialMockData));
    localStorage.removeItem('finance_command_center_demo_active');
    localStorage.setItem('finance_command_center_onboarded', 'true');
    setIsDemoMode(false);
    setOnboarded(true);
    setActiveModal(null);
    setCurrentTab('dashboard');
  };

  const handleOnboardingLogin = async (): Promise<boolean> => {
    try {
      setIsSyncing(true);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        
        // Find existing spreadsheet or create a new one
        const found = await findFinanceSpreadsheet(result.accessToken);
        if (found) {
          setSpreadsheetId(found.id);
          setSpreadsheetUrl(found.url);
          localStorage.setItem('finance_command_center_sheet_id', found.id);
          localStorage.setItem('finance_command_center_sheet_url', found.url);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.error('Onboarding authentication failed:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOnboardingComplete = (config: {
    isDemoMode: boolean;
    useGoogleDrive: boolean;
    connectedBanks: string[];
    incomes: { item: string; amount: number; frequency: string; isIncome: boolean }[];
    bills: Partial<Bill>[];
    goals: Partial<Goal>[];
  }) => {
    let finalData: FinanceData;
    
    if (config.isDemoMode) {
      finalData = { ...demoMockData };
    } else {
      const builtAccounts: Account[] = [];
      if (config.connectedBanks.includes('Chase')) {
        builtAccounts.push({
          name: 'Sapphire Checking',
          purpose: 'Primary checking and cash flow hub',
          balance: 1850,
          targetBalance: 1000,
          weeklyTransfer: 0,
          monthlyTransfer: 0,
          notes: 'Connected via Chase automated bank sync',
          institution: 'Chase Bank',
          connectionStatus: 'Connected',
          type: 'checking',
          lastSynced: new Date().toISOString()
        });
      }
      if (config.connectedBanks.includes('Capital One')) {
        builtAccounts.push({
          name: 'Venture High-Yield Savings',
          purpose: 'Secondary savings safety net',
          balance: 4200,
          targetBalance: 5000,
          weeklyTransfer: 0,
          monthlyTransfer: 0,
          notes: 'Connected via Capital One saving sync',
          institution: 'Capital One',
          connectionStatus: 'Connected',
          type: 'savings',
          lastSynced: new Date().toISOString()
        });
      }
      if (config.connectedBanks.length === 0 || config.connectedBanks.includes('Manual')) {
        builtAccounts.push({
          name: 'Primary Cash Wallet',
          purpose: 'On-hand physical cash and custom ledger wallet',
          balance: 500,
          targetBalance: 500,
          weeklyTransfer: 0,
          monthlyTransfer: 0,
          notes: 'Manually logged primary money safe',
          institution: 'Manual Bank',
          connectionStatus: 'Connected',
          type: 'checking',
          lastSynced: new Date().toISOString()
        });
      }

      const builtBills: Bill[] = (config.bills as Bill[]) || [];
      config.incomes.forEach((inc, index) => {
        builtBills.push({
          id: `income-${index}-${Date.now()}`,
          name: inc.item,
          amount: inc.amount,
          category: 'Income',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          autopay: true,
          paid: false,
          accountPaidFrom: builtAccounts[0]?.name || 'Primary Cash Wallet',
          notes: `Scheduled ${inc.frequency} paycheck setup`,
          isIncome: true,
          paycheckUsed: ''
        });
      });

      finalData = {
        accounts: builtAccounts,
        debts: [],
        bills: builtBills,
        goals: (config.goals as Goal[]) || [],
        budgetCategories: [
          { category: 'Housing', budgeted: 1500, spent: 0 },
          { category: 'Utilities', budgeted: 300, spent: 0 },
          { category: 'Food & Dining', budgeted: 400, spent: 0 },
          { category: 'Transport', budgeted: 200, spent: 0 }
        ],
        budgetItems: [],
        paycheckCovers: {
          paycheckDate: new Date().toISOString().slice(0, 10),
          paycheckAmount: config.incomes[0]?.amount || 0,
          billsCovered: [],
          debtPayments: [],
          transfers: []
        },
        challenges: [
          {
            challenge: '7-Day Core Checking Sprint',
            estimatedSavings: 150,
            difficulty: 'Easy',
            goalSupported: 'Buffer Fund',
            startDate: new Date().toISOString().slice(0, 10),
            completed: false,
            amountSaved: 0
          }
        ],
        subscriptions: [],
        history: [
          {
            date: new Date().toISOString().slice(0, 10),
            item: 'Interactive Cockpit Configured & Synced',
            category: 'System',
            amount: 0,
            accountPaidFrom: 'System',
            notes: 'Successfully ran onboarding initialization sequence'
          }
        ]
      };
    }

    loadFinanceDataIntoState(finalData);
    localStorage.setItem('finance_command_center_data', JSON.stringify(finalData));
    localStorage.setItem('finance_command_center_onboarded', 'true');
    localStorage.setItem('finance_command_center_demo_active', config.isDemoMode ? 'true' : 'false');
    
    setIsDemoMode(config.isDemoMode);
    setOnboarded(true);
    setCurrentTab('dashboard');

    if (user) {
      savePreferencesToFirestore(user.uid, showActualName, true, config.isDemoMode).catch(err => {
        console.error('Firestore preferences sync failed:', err);
      });
      saveLedgerToFirestore(user.uid, finalData).catch(err => {
        console.error('Firestore ledger backup failed:', err);
      });
    }
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('finance_command_center_onboarded');
    setOnboarded(false);
  };

  const handleToggleActualName = (val: boolean) => {
    setShowActualName(val);
    localStorage.setItem('finance_command_center_show_actual_name', val ? 'true' : 'false');
  };

  const handleResetToDemo = () => {
    setActiveModal('demo');
  };

  // State Mutators passed to child views (Automatic Sheet push)
  const rebalanceAndPersist = (
    nextAccs?: Account[],
    nextDebts?: Debt[],
    nextHistory?: PaymentHistoryItem[]
  ) => {
    const activeAccs = nextAccs || accounts;
    const activeDebts = nextDebts || debts;
    const activeHistory = nextHistory || history;
    const { rebalancedAccounts, rebalancedDebts } = recalculateBalances(activeAccs, activeDebts, activeHistory);
    setAccounts(rebalancedAccounts);
    setDebts(rebalancedDebts);
    setHistory(activeHistory);
    persistToSpreadsheetIfLinked(
      rebalancedAccounts,
      rebalancedDebts,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      activeHistory
    );
  };

  const handleUpdateAccounts = (updated: Account[]) => {
    rebalanceAndPersist(updated, undefined, undefined);
  };

  const handleUpdateDebts = (updated: Debt[]) => {
    rebalanceAndPersist(undefined, updated, undefined);
  };

  const handleUpdateBills = (updated: Bill[]) => {
    setBills(updated);
    persistToSpreadsheetIfLinked(undefined, undefined, updated);
  };

  const handleUpdateGoals = (updated: Goal[]) => {
    setGoals(updated);
    persistToSpreadsheetIfLinked(undefined, undefined, undefined, updated);
  };

  const handleUpdateBudgetCategories = (updated: BudgetCategory[]) => {
    setBudgetCategories(updated);
    persistToSpreadsheetIfLinked(undefined, undefined, undefined, undefined, updated);
  };

  const handleUpdatePaycheckCovers = (updated: PaycheckCovers) => {
    setPaycheckCovers(updated);
    persistToSpreadsheetIfLinked(undefined, undefined, undefined, undefined, undefined, updated);
  };

  const handleUpdateChallenges = (updated: SavingsChallenge[]) => {
    setChallenges(updated);
    persistToSpreadsheetIfLinked(undefined, undefined, undefined, undefined, undefined, undefined, updated);
  };

  const handleUpdateSubscriptions = (updated: Subscription[]) => {
    setSubscriptions(updated);
    persistToSpreadsheetIfLinked(undefined, undefined, undefined, undefined, undefined, undefined, undefined, updated);
  };

  const handleUpdateHistory = (updated: PaymentHistoryItem[]) => {
    rebalanceAndPersist(undefined, undefined, updated);
  };

  // Rendering matching current tab ID
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView
            accounts={accounts}
            debts={debts}
            bills={bills}
            goals={goals}
            budgetCategories={budgetCategories}
            setCurrentTab={setCurrentTab}
            onUpdateAccounts={handleUpdateAccounts}
            onUpdateDebts={handleUpdateDebts}
            onUpdateHistory={handleUpdateHistory}
            history={history}
            isSyncing={isSyncing}
            spreadsheetId={spreadsheetId}
            showActualName={showActualName}
            user={user}
            paycheckCovers={paycheckCovers}
          />
        );
      case 'upcoming':
        return (
          <UpcomingView
            bills={bills}
            onUpdateBills={handleUpdateBills}
            accounts={accounts}
            subscriptions={subscriptions}
            onUpdateSubscriptions={handleUpdateSubscriptions}
            debts={debts}
            goals={goals}
            history={history}
            paycheckCovers={paycheckCovers}
          />
        );
      case 'debts':
        return (
          <DebtsView
            debts={debts}
            onUpdateDebts={handleUpdateDebts}
            accounts={accounts.map(a => a.name)}
          />
        );
      case 'goals':
        return (
          <GoalsView
            goals={goals}
            onUpdateGoals={handleUpdateGoals}
          />
        );
      case 'budget':
        return (
          <BudgetView
            budgetCategories={budgetCategories}
            onUpdateBudgetCategories={handleUpdateBudgetCategories}
            paycheckCovers={paycheckCovers}
            onUpdatePaycheckCovers={handleUpdatePaycheckCovers}
          />
        );
      case 'accounts':
        return (
          <AccountsView
            accounts={accounts}
            onUpdateAccounts={handleUpdateAccounts}
            history={history}
            onUpdateHistory={handleUpdateHistory}
          />
        );
      case 'challenges':
        return (
          <ChallengesView
            challenges={challenges}
            onUpdateChallenges={handleUpdateChallenges}
            goalsList={goals.map(g => g.name)}
          />
        );
      case 'subscriptions':
        return (
          <SubscriptionsView
            subscriptions={subscriptions}
            onUpdateSubscriptions={handleUpdateSubscriptions}
            accounts={accounts.map(a => a.name)}
          />
        );
      case 'history':
        return (
          <HistoryView
            history={history}
            onUpdateHistory={handleUpdateHistory}
            accounts={accounts.map(a => a.name)}
          />
        );
      case 'settings':
        return (
          <SettingsView
            user={user}
            spreadsheetId={spreadsheetId}
            spreadsheetUrl={spreadsheetUrl}
            onLogout={handleLogout}
            onResetToDemo={handleResetToDemo}
            onRecreateSheet={handleRebuildSpreadsheet}
            isSyncing={isSyncing}
            isDemoActive={isDemoMode}
            onTriggerDemo={() => setActiveModal('demo')}
            onTriggerFresh={() => setActiveModal('fresh')}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
            onResetOnboarding={handleResetOnboarding}
            showActualName={showActualName}
            onToggleActualName={handleToggleActualName}
            onDeleteAllCloudData={handleDeleteAllCloudData}
          />
        );
      case 'more':
        return (
          <MoreView
            onSelectTab={setCurrentTab}
          />
        );
      case 'journey':
        return (
          <FinancialJourney
            accounts={accounts}
            debts={debts}
            bills={bills}
            goals={goals}
            history={history}
            challenges={challenges}
            budgetCategories={budgetCategories}
          />
        );
      case 'coach':
        return (
          <AiFinancialCoach
            accounts={accounts}
            debts={debts}
            bills={bills}
            goals={goals}
            history={history}
            budgetCategories={budgetCategories}
          />
        );
      case 'backup':
        const handleImportBackup = (imported: any) => {
          if (imported.accounts) setAccounts(imported.accounts);
          if (imported.debts) setDebts(imported.debts);
          if (imported.bills) setBills(imported.bills);
          if (imported.goals) setGoals(imported.goals);
          if (imported.history) setHistory(imported.history);
          if (imported.budgetCategories) setBudgetCategories(imported.budgetCategories);
          if (imported.paycheckCovers) setPaycheckCovers(imported.paycheckCovers);
          if (imported.challenges) setChallenges(imported.challenges);
          if (imported.subscriptions) setSubscriptions(imported.subscriptions);

          rebalanceAndPersist(imported.accounts, imported.debts, imported.history);
        };
        return (
          <BackupSyncCenter
            user={user}
            spreadsheetId={spreadsheetId}
            spreadsheetUrl={spreadsheetUrl}
            isSyncing={isSyncing}
            onLogout={handleLogout}
            onSyncNow={handleManualSync}
            onRecreateSheet={handleRebuildSpreadsheet}
            onExportJson={handleExportJson}
            onExportCsv={handleExportCsv}
            accounts={accounts}
            onImportBackup={handleImportBackup}
          />
        );
      case 'roadmap':
        return (
          <RoadmapView
            accounts={accounts}
            debts={debts}
            goals={goals}
            subscriptions={subscriptions}
            bills={bills}
          />
        );
      case 'community':
        return (
          <CommunityView
            accounts={accounts}
            debts={debts}
            goals={goals}
            history={history}
            user={user}
            showActualName={showActualName}
          />
        );
      case 'reports':
        return (
          <ReportsView
            accounts={accounts}
            debts={debts}
            bills={bills}
            goals={goals}
            history={history}
          />
        );
      default:
        return <div className="text-center py-12 text-slate-400 text-sm">Select a tab above</div>;
    }
  };

  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">Booting Finance Command Center...</span>
      </div>
    );
  }

  if (onboarded === false) {
    return (
      <FirstLaunchExperience
        onComplete={handleOnboardingComplete}
        onSkip={handleLoadSkipInstant}
        onExploreDemo={handleLoadDemoInstant}
        onGoogleSignIn={handleOnboardingLogin}
        userEmail={user?.email}
        userPhoto={user?.photoURL}
        userDisplayName={user?.displayName}
      />
    );
  }

  return (
    <div className="min-h-screen liquid-bg pb-28 font-sans antialiased text-slate-800" id="main-application-frame">
      {/* Premium Navigation and Ribbon Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        spreadsheetId={spreadsheetId}
        spreadsheetUrl={spreadsheetUrl}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Demo Status Banner */}
      {isDemoMode && (
        <div className="max-w-3xl mx-auto px-4 mt-4" id="demo-badge-banner">
          <div className="p-3 bg-blue-500/10 border border-blue-200/50 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>You are exploring in <strong>Demo Mode</strong> with realistic sample data. Your real configuration is untouched.</span>
            </div>
            <button
              onClick={() => setActiveModal('leave')}
              className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors text-[11px] cursor-pointer"
              id="exit-demo-banner-btn"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* Main Stage View Content */}
      <main className="relative mt-2">
        {isSyncing && (
          <div className="fixed top-24 right-6 z-50 flex items-center gap-1.5 py-1.5 px-4 bg-teal-500 text-white text-xs font-bold rounded-full shadow-lg border border-teal-400 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Sheets Sync Active...
          </div>
        )}
        {renderTabContent()}
      </main>

      {/* Floating Glass Bottom Nav */}
      <BottomNav currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Smart Floating Action Button */}
      {onboarded && (
        <SmartFAB
          accounts={accounts}
          debts={debts}
          bills={bills}
          goals={goals}
          history={history}
          budgetCategories={budgetCategories}
          onUpdateAccounts={handleUpdateAccounts}
          onUpdateDebts={handleUpdateDebts}
          onUpdateBills={handleUpdateBills}
          onUpdateGoals={handleUpdateGoals}
          onUpdateHistory={handleUpdateHistory}
          onSelectTab={setCurrentTab}
        />
      )}

      {/* App Data Confirmation Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4 py-8 animate-fade-in" id="app-data-confirm-modal">
          <div className="w-full max-w-lg glass-panel rounded-3xl p-6 md:p-8 bg-white/95 shadow-2xl relative border border-slate-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  activeModal === 'fresh' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {activeModal === 'fresh' ? <Trash2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-display font-black text-slate-900">
                  {activeModal === 'demo' && 'Confirm Loading Demo'}
                  {activeModal === 'fresh' && 'Confirm Start Fresh'}
                  {activeModal === 'leave' && 'Confirm Exit Demo'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                id="close-modal-x"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content text */}
            <div className="text-xs text-slate-600 leading-relaxed mb-6 space-y-3">
              {activeModal === 'demo' && (
                <p>
                  This will replace your current data with sample information. You can return to your own data later if you’ve backed it up or clear this anytime in Settings.
                </p>
              )}
              {activeModal === 'fresh' && (
                <p>
                  This permanently removes all of your financial information from this device, including connected sandbox accounts, goals, payoff structures, and activity lists. <strong>This action cannot be undone.</strong>
                </p>
              )}
              {activeModal === 'leave' && (
                <p>
                  Are you ready to leave Demo Mode? This will clear out the sample accounts and reset the app. You can choose to load default initial templates or start with a completely fresh, empty cockpit.
                </p>
              )}
            </div>

            {/* Optional Backup Section inside modal */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-3 mb-6">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Optional: Export Current State</h4>
              <p className="text-[10px] text-slate-500 leading-normal">
                If you have entered any transaction lists, download a secure backup file first for complete peace of mind.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer shadow-3xs"
                  id="modal-export-json"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" /> Export JSON
                </button>
                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer shadow-3xs"
                  id="modal-export-csv"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" /> Export CSV (Activity)
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setActiveModal(null)}
                className="py-2 px-4 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                id="modal-cancel-btn"
              >
                Cancel
              </button>

              {activeModal === 'demo' && (
                <button
                  onClick={handleLoadDemoInstant}
                  className="py-2 px-5 rounded-full text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer shadow-md shadow-blue-500/10"
                  id="modal-confirm-demo-btn"
                >
                  Load Demo Mode
                </button>
              )}

              {activeModal === 'fresh' && (
                <button
                  onClick={handleLoadFreshInstant}
                  className="py-2 px-5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-md shadow-rose-500/10"
                  id="modal-confirm-fresh-btn"
                >
                  Wipe & Start Fresh
                </button>
              )}

              {activeModal === 'leave' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLoadSkipInstant}
                    className="py-2 px-4 rounded-full text-xs font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
                    id="modal-confirm-leave-skip"
                  >
                    Load Default Seeds
                  </button>
                  <button
                    onClick={handleLoadFreshInstant}
                    className="py-2 px-4 rounded-full text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors cursor-pointer shadow-md"
                    id="modal-confirm-leave-fresh"
                  >
                    Start Empty Slate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
