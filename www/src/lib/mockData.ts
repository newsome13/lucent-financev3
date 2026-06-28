import { FinanceData } from '../types';

export const initialMockData: FinanceData = {
  accounts: [
    {
      name: 'Life Wallet 🧍',
      purpose: 'Daily spending & income reception',
      balance: 1450,
      targetBalance: 2000,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Main hub for general daily spending'
    },
    {
      name: 'Bill Hub 📦',
      purpose: 'Protected account for bill autopays',
      balance: 3200,
      targetBalance: 4500,
      weeklyTransfer: 150,
      monthlyTransfer: 649.50,
      notes: 'Bills auto-draft from here'
    },
    {
      name: 'Safety Net 🛟',
      purpose: 'Emergency pad / breathing room',
      balance: 1000,
      targetBalance: 1000,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Fully funded base emergency fund'
    },
    {
      name: 'Escape Fund 🌴',
      purpose: 'Rollover trip savings',
      balance: 450,
      targetBalance: 2000,
      weeklyTransfer: 25,
      monthlyTransfer: 108.25,
      notes: 'Keeps rolling over after $2,000 reached'
    },
    {
      name: 'Boss Fight Fund 🗡️',
      purpose: 'Wealth & opportunity fund',
      balance: 5000,
      targetBalance: 10000,
      weeklyTransfer: 100,
      monthlyTransfer: 433.00,
      notes: 'Long term wealth accumulation'
    },
    {
      name: 'Cash',
      purpose: 'Physical paper cash',
      balance: 150,
      targetBalance: 300,
      weeklyTransfer: 10,
      monthlyTransfer: 43.30,
      notes: 'Emergency physical wallet cash'
    },
    {
      name: 'PayPal',
      purpose: 'Online purchases',
      balance: 85,
      targetBalance: 0,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Digital wallet'
    },
    {
      name: 'Cash App',
      purpose: 'Peer transactions',
      balance: 40,
      targetBalance: 0,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Instant transfers'
    },
    {
      name: 'OnePay',
      purpose: 'Secondary checking',
      balance: 120,
      targetBalance: 0,
      weeklyTransfer: 0,
      monthlyTransfer: 0,
      notes: 'Backup card'
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
      notes: 'Stop using immediately'
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
    },
    {
      priority: 4,
      name: 'Affirm Purchase',
      status: 'Paid',
      balance: 0,
      minimumPayment: 0,
      dueDate: 'Completed',
      apr: 0.0,
      accountPaidFrom: 'Life Wallet 🧍',
      payoffPhase: 'Completed',
      whyThisMatters: 'Point of sale debt now fully wiped out',
      amountFreedWhenPaid: 45,
      notes: 'Paid off early in March'
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
      amount: 125,
      accountPaidFrom: 'Bill Hub 📦',
      autopay: false,
      paid: false,
      paycheckUsed: 'July 1st Paycheck',
      notes: 'Varies by season'
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
      notes: 'Quarterly adjustment'
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
      notes: 'Wont touch unless emergency'
    },
    {
      name: 'Escape Fund 🌴',
      category: 'Savings',
      targetAmount: 2000,
      currentAmount: 450,
      weeklyTransfer: 25,
      monthlyTransfer: 108.25,
      status: 'In Progress',
      whyItMatters: 'For Tennessee family trip, rolls over after $2,000',
      notes: 'Keeps rolling over unless manually stopped'
    },
    {
      name: 'Bill Hub 📦',
      category: 'Savings',
      targetAmount: 4500,
      currentAmount: 3200,
      weeklyTransfer: 50,
      monthlyTransfer: 216.50,
      status: 'In Progress',
      whyItMatters: 'Protected bill balance pad',
      notes: 'Target matches 3 months of fixed bills'
    },
    {
      name: 'Boss Fight Fund 🗡️',
      category: 'Savings',
      targetAmount: 10000,
      currentAmount: 5000,
      weeklyTransfer: 100,
      monthlyTransfer: 433.00,
      status: 'In Progress',
      whyItMatters: 'General wealth and future options',
      notes: 'Investing foundation'
    },
    {
      name: 'Christmas',
      category: 'Savings',
      targetAmount: 800,
      currentAmount: 350,
      weeklyTransfer: 15,
      monthlyTransfer: 64.95,
      status: 'In Progress',
      whyItMatters: 'Holiday gifts and travel',
      notes: 'Auto-transfer weekly'
    },
    {
      name: 'Car repairs',
      category: 'Savings',
      targetAmount: 1200,
      currentAmount: 600,
      weeklyTransfer: 20,
      monthlyTransfer: 86.60,
      status: 'In Progress',
      whyItMatters: 'Vehicle maintenance emergency fund',
      notes: 'Keeps standard auto running'
    },
    {
      name: 'Tennessee / family trip',
      category: 'Savings',
      targetAmount: 1500,
      currentAmount: 800,
      weeklyTransfer: 30,
      monthlyTransfer: 129.90,
      status: 'In Progress',
      whyItMatters: 'Annual family reunion homecoming',
      notes: 'Book tickets by September'
    }
  ],
  budgetCategories: [
    { category: 'Food', budgeted: 500, spent: 320 },
    { category: 'Gas', budgeted: 180, spent: 120 },
    { category: 'Bills', budgeted: 1455, spent: 1100 },
    { category: 'Debt', budgeted: 545, spent: 545 },
    { category: 'Savings', budgeted: 600, spent: 400 },
    { category: 'Subscriptions', budgeted: 90, spent: 90 },
    { category: 'Cash', budgeted: 100, spent: 50 },
    { category: 'Fun / Misc', budgeted: 250, spent: 180 }
  ],
  budgetItems: [
    { id: 'bi1', type: 'income', name: 'Primary Paycheck', amount: 2500 },
    { id: 'bi2', type: 'income', name: 'Side Gig Revenue', amount: 350 },
    { id: 'bi3', type: 'fixed_bill', name: 'Rent Payment', amount: 1100 },
    { id: 'bi4', type: 'fixed_bill', name: 'Electric Utility', amount: 125 },
    { id: 'bi5', type: 'fixed_bill', name: 'Car Insurance', amount: 145 },
    { id: 'bi6', type: 'debt_payment', name: 'Chase Card Min', amount: 75 },
    { id: 'bi7', type: 'debt_payment', name: 'Auto Loan Payment', amount: 320 },
    { id: 'bi8', type: 'savings_transfer', name: 'Freedom Transfer', amount: 433 },
    { id: 'bi9', type: 'savings_transfer', name: 'Vacation Transfer', amount: 108 },
    { id: 'bi10', type: 'subscription', name: 'Netflix', amount: 15 },
    { id: 'bi11', type: 'subscription', name: 'Spotify', amount: 12 },
    { id: 'bi12', type: 'cash', name: 'Weekly Cash Withdraw', amount: 100 },
    { id: 'bi13', type: 'leftover', name: 'Breathing Room Allocation', amount: 220 }
  ],
  paycheckCovers: {
    paycheckDate: '2026-07-01',
    paycheckAmount: 2500,
    billsCovered: ['Rent / Mortgage', 'Car Insurance', 'Electric Bill'],
    debtPayments: ['Chase Card'],
    transfers: ['Boss Fight Fund 🗡️', 'Escape Fund 🌴']
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
      challenge: 'Round-Up Savings 🪙',
      estimatedSavings: 45,
      difficulty: 'Easy',
      goalSupported: 'Boss Fight Fund 🗡️',
      startDate: '2026-06-01',
      completed: true,
      amountSaved: 52
    },
    {
      challenge: '52 Week Challenge 📅',
      estimatedSavings: 1378,
      difficulty: 'Hard',
      goalSupported: 'Safety Net 🛟',
      startDate: '2026-01-01',
      completed: false,
      amountSaved: 650
    },
    {
      challenge: 'Coffee Challenge ☕',
      estimatedSavings: 35,
      difficulty: 'Easy',
      goalSupported: 'Escape Fund 🌴',
      startDate: '2026-06-25',
      completed: false,
      amountSaved: 0
    },
    {
      challenge: 'No Takeout Week 🥡',
      estimatedSavings: 80,
      difficulty: 'Medium',
      goalSupported: 'Escape Fund 🌴',
      startDate: '2026-06-26',
      completed: false,
      amountSaved: 0
    }
  ],
  subscriptions: [
    {
      name: 'Netflix',
      cost: 15.49,
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
    },
    {
      name: 'Adobe Creative Cloud',
      cost: 54.99,
      frequency: 'Monthly',
      nextRenewal: '2026-07-20',
      category: 'Subscriptions',
      accountPaidFrom: 'Life Wallet 🧍',
      status: 'Active'
    }
  ],
  history: [
    {
      date: '2026-06-25',
      item: 'Rent Payment',
      category: 'Bills',
      amount: 1100,
      accountPaidFrom: 'Bill Hub 📦',
      notes: 'Cleared on time'
    },
    {
      date: '2026-06-24',
      item: 'Chase Minimum Payment',
      category: 'Debt',
      amount: 75,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Monthly min pay'
    },
    {
      date: '2026-06-20',
      item: 'Groceries (Kroger)',
      category: 'Food',
      amount: 112.50,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Weekly groceries run'
    },
    {
      date: '2026-06-18',
      item: 'Gasoline (Shell)',
      category: 'Gas',
      amount: 45.00,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Full tank fill-up'
    },
    {
      date: '2026-06-15',
      item: 'Netflix Subscription',
      category: 'Subscriptions',
      amount: 15.49,
      accountPaidFrom: 'Life Wallet 🧍',
      notes: 'Auto-billed'
    }
  ]
};
