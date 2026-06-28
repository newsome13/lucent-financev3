import { FinanceData } from '../types';

export const demoMockData: FinanceData = {
  accounts: [
    {
      name: 'Life Wallet 🧍',
      purpose: 'Daily spending & income reception',
      balance: 1850.50,
      targetBalance: 2000,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Main hub for general daily spending',
      institution: 'Chase Bank',
      connectionStatus: 'Connected',
      lastSynced: 'Just now',
      type: 'checking'
    },
    {
      name: 'Bill Hub 📦',
      purpose: 'Protected account for bill autopays',
      balance: 3450.00,
      targetBalance: 4500,
      weeklyTransfer: 150,
      monthlyTransfer: 649.50,
      notes: 'Bills auto-draft from here',
      institution: 'Capital One',
      connectionStatus: 'Connected',
      lastSynced: 'Just now',
      type: 'checking'
    },
    {
      name: 'Safety Net 🛟',
      purpose: 'Emergency pad / breathing room (Buffer Fund)',
      balance: 1000.00,
      targetBalance: 1000,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Fully funded base emergency fund',
      type: 'space'
    },
    {
      name: 'Escape Fund 🌴',
      purpose: 'Vacation Fund & rollover trip savings',
      balance: 1550.00,
      targetBalance: 2500,
      weeklyTransfer: 50,
      monthlyTransfer: 216.50,
      notes: '62% complete vacation target!',
      type: 'space'
    },
    {
      name: 'Boss Fight Fund 🗡️',
      purpose: 'Freedom Fund & long term options',
      balance: 5000.00,
      targetBalance: 10000,
      weeklyTransfer: 100,
      monthlyTransfer: 433.00,
      notes: 'Long term wealth accumulation foundation',
      type: 'space'
    },
    {
      name: 'Cash',
      purpose: 'Physical paper cash',
      balance: 180.00,
      targetBalance: 300,
      weeklyTransfer: 10,
      monthlyTransfer: 43.30,
      notes: 'Emergency physical wallet cash',
      type: 'cash'
    },
    {
      name: 'PayPal',
      purpose: 'Online purchases',
      balance: 95.00,
      targetBalance: 100,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Digital wallet',
      type: 'other'
    }
  ],
  debts: [
    {
      priority: 1,
      name: 'Chase Card',
      status: 'Active',
      balance: 2400,
      minimumPayment: 75,
      dueDate: '15th',
      apr: 21.9,
      accountPaidFrom: 'Life Wallet 🧍',
      payoffPhase: 'Phase 1 - Avalanche Focus',
      whyThisMatters: 'Highest APR draining monthly breathing room',
      amountFreedWhenPaid: 75,
      notes: 'Prioritized payoff targeting'
    },
    {
      priority: 2,
      name: 'Auto Loan',
      status: 'Active',
      balance: 14000,
      minimumPayment: 320,
      dueDate: '22nd',
      apr: 5.4,
      accountPaidFrom: 'Life Wallet 🧍',
      payoffPhase: 'Phase 2 - Secondary Paydown',
      whyThisMatters: 'Fixed interest vehicle asset',
      amountFreedWhenPaid: 320,
      notes: 'Standard payment auto-drafted'
    },
    {
      priority: 3,
      name: 'Student Loan',
      status: 'Not Started',
      balance: 28000,
      minimumPayment: 150,
      dueDate: '05th',
      apr: 4.2,
      accountPaidFrom: 'Life Wallet 🧍',
      payoffPhase: 'Phase 3 - Long Term Paydown',
      whyThisMatters: 'Low federal interest rate, standard plan',
      amountFreedWhenPaid: 150,
      notes: 'In active repayment'
    }
  ],
  bills: [
    {
      id: 'b1',
      dueDate: '2026-07-01',
      name: 'Rent / Mortgage',
      category: 'Bills',
      amount: 1100,
      accountPaidFrom: 'Bill Hub 📦',
      autopay: true,
      paid: true,
      paycheckUsed: 'July 1st Paycheck',
      notes: 'Primary housing cost'
    },
    {
      id: 'b2',
      dueDate: '2026-07-05',
      name: 'Car Insurance',
      category: 'Bills',
      amount: 145,
      accountPaidFrom: 'Bill Hub 📦',
      autopay: true,
      paid: false,
      paycheckUsed: 'July 1st Paycheck',
      notes: 'Progressive Auto Policy'
    },
    {
      id: 'b3',
      dueDate: '2026-07-12',
      name: 'Electric Bill',
      category: 'Bills',
      amount: 124.87,
      accountPaidFrom: 'Bill Hub 📦',
      autopay: false,
      paid: false,
      paycheckUsed: 'July 1st Paycheck',
      notes: 'Seasonal adjustments apply'
    },
    {
      id: 'b4',
      dueDate: '2026-07-15',
      name: 'Gym Membership',
      category: 'Subscriptions',
      amount: 30,
      accountPaidFrom: 'Life Wallet 🧍',
      autopay: true,
      paid: false,
      paycheckUsed: 'July 1st Paycheck',
      notes: 'Planet Fitness Black Card'
    },
    {
      id: 'b5',
      dueDate: '2026-07-18',
      name: 'Water Utility',
      category: 'Bills',
      amount: 55,
      accountPaidFrom: 'Bill Hub 📦',
      autopay: false,
      paid: false,
      paycheckUsed: 'July 1st Paycheck',
      notes: 'City Water District'
    }
  ],
  goals: [
    {
      name: 'Safety Net 🛟',
      category: 'Savings',
      targetAmount: 1000,
      currentAmount: 1000,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      status: 'Fully Funded',
      whyItMatters: 'Base buffer to prevent floating debts',
      notes: 'Buffer Fund fully active'
    },
    {
      name: 'Vacation Goal 🌴',
      category: 'Savings',
      targetAmount: 2500,
      currentAmount: 1550,
      weeklyTransfer: 50,
      monthlyTransfer: 216.50,
      status: 'In Progress',
      whyItMatters: 'Summer flight tickets and Airbnb bookings',
      notes: 'Exactly 62% complete vacation cushion'
    },
    {
      name: 'Freedom Fund 🗡️',
      category: 'Savings',
      targetAmount: 10000,
      currentAmount: 5000,
      weeklyTransfer: 100,
      monthlyTransfer: 433.00,
      status: 'In Progress',
      whyItMatters: 'Long term options, wealth foundation',
      notes: 'Sequentially funded surplus pool'
    },
    {
      name: 'Christmas Gifts 🎁',
      category: 'Savings',
      targetAmount: 800,
      currentAmount: 600,
      weeklyTransfer: 15,
      monthlyTransfer: 64.95,
      status: 'In Progress',
      whyItMatters: 'Holiday season travel and shopping',
      notes: '75% Complete'
    }
  ],
  budgetCategories: [
    { category: 'Food', budgeted: 500, spent: 342.50 },
    { category: 'Gas', budgeted: 180, spent: 110 },
    { category: 'Bills', budgeted: 1455, spent: 1224.87 },
    { category: 'Debt', budgeted: 545, spent: 545 },
    { category: 'Savings', budgeted: 600, spent: 400 },
    { category: 'Subscriptions', budgeted: 90, spent: 78.48 },
    { category: 'Fun / Misc', budgeted: 250, spent: 165 }
  ],
  budgetItems: [
    { id: 'bi1', type: 'income', name: 'Primary Paycheck', amount: 2500 },
    { id: 'bi2', type: 'income', name: 'Weekly Freelance Check', amount: 812.34 },
    { id: 'bi3', type: 'fixed_bill', name: 'Rent Payment', amount: 1100 },
    { id: 'bi4', type: 'fixed_bill', name: 'Electric Utility', amount: 124.87 },
    { id: 'bi5', type: 'fixed_bill', name: 'Car Insurance', amount: 145 },
    { id: 'bi6', type: 'debt_payment', name: 'Chase Card Min', amount: 75 },
    { id: 'bi7', type: 'debt_payment', name: 'Auto Loan Payment', amount: 320 },
    { id: 'bi8', type: 'savings_transfer', name: 'Freedom Transfer', amount: 433 },
    { id: 'bi9', type: 'savings_transfer', name: 'Vacation Transfer', amount: 216.50 },
    { id: 'bi10', type: 'subscription', name: 'Netflix', amount: 17.99 },
    { id: 'bi11', type: 'subscription', name: 'Spotify', amount: 11.99 },
    { id: 'bi12', type: 'cash', name: 'Weekly Cash Withdraw', amount: 100 }
  ],
  paycheckCovers: {
    paycheckDate: '2026-07-01',
    paycheckAmount: 2500,
    billsCovered: ['Rent / Mortgage', 'Car Insurance', 'Electric Bill'],
    debtPayments: ['Chase Card'],
    transfers: ['Freedom Fund 🗡️', 'Vacation Goal 🌴']
  },
  challenges: [
    {
      challenge: 'No Spend Weekend 🚫',
      estimatedSavings: 150,
      difficulty: 'Medium',
      goalSupported: 'Safety Net 🛟',
      startDate: '2026-06-20',
      completed: true,
      amountSaved: 150
    },
    {
      challenge: 'Coffee Challenge ☕',
      estimatedSavings: 50,
      difficulty: 'Easy',
      goalSupported: 'Vacation Goal 🌴',
      startDate: '2026-06-15',
      completed: false,
      amountSaved: 35
    },
    {
      challenge: '52 Week Challenge 📅',
      estimatedSavings: 1378,
      difficulty: 'Hard',
      goalSupported: 'Freedom Fund 🗡️',
      startDate: '2026-01-01',
      completed: false,
      amountSaved: 650
    }
  ],
  subscriptions: [
    {
      name: 'Netflix',
      cost: 17.99,
      frequency: 'Monthly',
      nextRenewal: '2026-07-02',
      category: 'Subscriptions',
      accountPaidFrom: 'Life Wallet 🧍',
      status: 'Active'
    },
    {
      name: 'Spotify Premium',
      cost: 11.99,
      frequency: 'Monthly',
      nextRenewal: '2026-07-08',
      category: 'Subscriptions',
      accountPaidFrom: 'Life Wallet 🧍',
      status: 'Active'
    },
    {
      name: 'Google One Storage',
      cost: 1.99,
      frequency: 'Monthly',
      nextRenewal: '2026-07-14',
      category: 'Subscriptions',
      accountPaidFrom: 'Life Wallet 🧍',
      status: 'Active'
    }
  ],
  history: [
    {
      date: '2026-06-26',
      item: 'Coffee Shop',
      category: 'Food',
      amount: 6.42,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Local barista blend drip coffee',
      importSource: 'Plaid',
      isConnectedBank: true
    },
    {
      date: '2026-06-25',
      item: 'Electric Bill',
      category: 'Bills',
      amount: 124.87,
      accountPaidFrom: 'Bill Hub 📦',
      notes: 'Electric company direct draft',
      importSource: 'Plaid',
      isConnectedBank: true
    },
    {
      date: '2026-06-24',
      item: 'Weekly Paycheck',
      category: 'Food',
      amount: 812.34,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Freelance gig contract direct deposit',
      isIncome: true,
      importSource: 'Plaid',
      isConnectedBank: true
    },
    {
      date: '2026-06-23',
      item: 'Gas Station',
      category: 'Gas',
      amount: 48.12,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Gas tank fill up - Shell Station',
      importSource: 'Plaid',
      isConnectedBank: true
    },
    {
      date: '2026-06-22',
      item: 'Netflix',
      category: 'Subscriptions',
      amount: 17.99,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Monthly standard HD tier streaming',
      importSource: 'Plaid',
      isConnectedBank: true
    },
    {
      date: '2026-06-20',
      item: 'Grocery Store (Whole Foods)',
      category: 'Food',
      amount: 84.50,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Fresh food restock',
      importSource: 'Plaid',
      isConnectedBank: true
    }
  ]
};
