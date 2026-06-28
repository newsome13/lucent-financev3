export interface Account {
  name: string;
  purpose: string;
  balance: number;
  targetBalance: number;
  weeklyTransfer: number;
  monthlyTransfer: number;
  notes: string;
  institution?: string; // e.g. 'Chase', 'Capital One', 'Manual'
  connectionStatus?: 'Connected' | 'Syncing' | 'Needs Attention' | 'Connection Expired';
  lastSynced?: string;
  type?: 'checking' | 'savings' | 'credit' | 'loan' | 'cash' | 'other' | 'space';
  availableBalance?: number;
}

export interface Debt {
  priority: number;
  name: string;
  status: 'Active' | 'Not Started' | 'Paid' | 'Archived';
  balance: number;
  minimumPayment: number;
  dueDate: string;
  apr: number;
  accountPaidFrom: string;
  payoffPhase: string;
  whyThisMatters: string;
  amountFreedWhenPaid: number;
  notes: string;
}

export interface Bill {
  id: string;
  dueDate: string;
  name: string;
  category: string;
  amount: number;
  accountPaidFrom: string;
  autopay: boolean;
  paid: boolean;
  paycheckUsed: string;
  notes: string;
  isIncome?: boolean;
  frequency?: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly';
}

export interface Goal {
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  weeklyTransfer: number;
  monthlyTransfer: number;
  status: string;
  whyItMatters: string;
  notes: string;
}

export interface BudgetCategory {
  category: string;
  budgeted: number;
  spent: number;
}

export interface BudgetItem {
  id: string;
  type: 'income' | 'fixed_bill' | 'debt_payment' | 'savings_transfer' | 'food' | 'gas' | 'subscription' | 'cash' | 'leftover';
  name: string;
  amount: number;
}

export interface PaycheckCovers {
  paycheckDate: string;
  paycheckAmount: number;
  billsCovered: string[];
  debtPayments: string[];
  transfers: string[];
}

export interface SavingsChallenge {
  challenge: string;
  estimatedSavings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  goalSupported: string;
  startDate: string;
  completed: boolean;
  amountSaved: number;
}

export interface Subscription {
  name: string;
  cost: number;
  frequency: string;
  nextRenewal: string;
  category: string;
  accountPaidFrom: string;
  status: 'Active' | 'Paused';
}

export interface PaymentHistoryItem {
  date: string;
  item: string;
  category: string;
  amount: number;
  accountPaidFrom: string;
  notes: string;
  isIncome?: boolean;
  isRecurring?: boolean;
  isPending?: boolean;
  isImported?: boolean;
  isConnectedBank?: boolean;
  importSource?: 'CSV' | 'Plaid' | 'Manual' | 'Google Sheets';
}

export interface FinanceData {
  accounts: Account[];
  debts: Debt[];
  bills: Bill[];
  goals: Goal[];
  budgetCategories: BudgetCategory[];
  budgetItems: BudgetItem[];
  paycheckCovers: PaycheckCovers;
  challenges: SavingsChallenge[];
  subscriptions: Subscription[];
  history: PaymentHistoryItem[];
}
