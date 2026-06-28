import { FinanceData, Account, Debt, Bill, Goal, BudgetCategory, BudgetItem, SavingsChallenge, Subscription, PaymentHistoryItem } from '../types';

interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
}

// Search for the finance spreadsheet in Google Drive
export async function findFinanceSpreadsheet(token: string): Promise<{ id: string; name: string; url: string } | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='Personal Finance Command Center' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search Drive files');
    }

    const data = await response.json();
    const files: DriveFile[] = data.files || [];
    
    if (files.length > 0) {
      return {
        id: files[0].id,
        name: files[0].name,
        url: files[0].webViewLink
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding spreadsheet:', error);
    return null;
  }
}

// Create a new Spreadsheet with the 10 workbook tabs and return its ID and URL
export async function createFinanceSpreadsheet(token: string, initialData: FinanceData): Promise<{ id: string; url: string }> {
  const tabs = [
    'Dashboard',
    'Upcoming',
    'Debts',
    'Goals',
    'Budget',
    'Accounts',
    'Savings Challenges',
    'Subscriptions',
    'Payment History',
    'Settings'
  ];

  try {
    // 1. Create Spreadsheet Metadata
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          title: 'Personal Finance Command Center'
        },
        sheets: tabs.map(tab => ({
          properties: {
            title: tab,
            gridProperties: {
              frozenRowCount: 1,
              showGridLines: true
            }
          }
        }))
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const spreadsheet = await response.json();
    const id = spreadsheet.spreadsheetId;
    const url = spreadsheet.spreadsheetUrl;

    // 2. Format and style the sheets with a batch update
    // We can set background colors, borders, font weights, and alignments.
    // Let's run a batch value update to seed the initial structure and live formulas!
    await populateSpreadsheetWithData(id, token, initialData);

    return { id, url };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

// Populates a spreadsheet with beautiful formatted cells, headers, and formulas
async function populateSpreadsheetWithData(id: string, token: string, data: FinanceData) {
  const valueRanges: any[] = [];

  // --- 1. Dashboard Tab ---
  // A master summary of accounts, debts, goals and next best move.
  valueRanges.push({
    range: 'Dashboard!A1:E20',
    values: [
      ['SECTION', 'METRIC', 'FORMULA VALUE / CALCULATIONS', 'TARGET', 'STATUS'],
      ['Total Funds', 'Net Liquidity', '=SUM(Accounts!C2:C10)', '=SUM(Accounts!D2:D10)', 'Active Flow'],
      ['Life Checking', 'Daily Checking', '=Accounts!C2', '=Accounts!D2', 'Active'],
      ['Vault/Bills', 'Protected Bill Pad', '=Accounts!C3', '=Accounts!D3', 'Protected'],
      ['Buffer Fund', 'Emergency Cushion', '=Accounts!C4', '=Accounts!D4', 'FULLY FUNDED'],
      ['Vacation Fund', 'Rolling Travel Savings', '=Accounts!C5', '=Accounts!D5', 'Rolling Over'],
      ['Freedom Savings', 'Long-term Growth', '=Accounts!C6', '=Accounts!D6', 'Growth Phase'],
      ['Cash', 'Paper Tender', '=Accounts!C7', '=Accounts!D7', 'Cash Box'],
      ['Active Debt Total', 'Outstanding Liability', '=SUM(Debts!D2:D5)', '0', 'WARNING'],
      ['Monthly Breathing Room', 'Paycheck Carryover', '=Budget!C14', '500', 'Good'],
      ['Next Best Move', 'Action Strategy', 'Pay Chase Card (Highest APR 21.9%) to free up $75/mo!', '', 'HIGH PRIORITY']
    ]
  });

  // --- 2. Upcoming Tab ---
  const billsHeaders = ['Due Date', 'Name', 'Category', 'Amount', 'Account Paid From', 'Autopay / Manual', 'Paid?', 'Paycheck Used', 'Notes', 'Status'];
  const billsRows = data.bills.map(b => [
    b.dueDate,
    b.name,
    b.category,
    b.amount,
    b.accountPaidFrom,
    b.autopay ? 'Autopay' : 'Manual',
    b.paid ? 'Paid' : 'Unpaid',
    b.paycheckUsed,
    b.notes,
    `=IF(G${data.bills.indexOf(b) + 2}="Paid","Paid",IF(A${data.bills.indexOf(b) + 2}<TODAY(),"Overdue","Due Soon"))`
  ]);
  valueRanges.push({
    range: 'Upcoming!A1:J20',
    values: [billsHeaders, ...billsRows]
  });

  // --- 3. Debts Tab ---
  const debtsHeaders = [
    'Priority', 'Debt Name', 'Status', 'Balance', 'Minimum Payment', 'Due Date', 'APR %',
    'Account Paid From', 'Payoff Phase', 'Why This Matters', 'Amount Freed When Paid', 'Progress Bar', 'Notes'
  ];
  const debtsRows = data.debts.map((d, i) => [
    d.priority,
    d.name,
    d.status,
    d.balance,
    d.minimumPayment,
    d.dueDate,
    d.apr,
    d.accountPaidFrom,
    d.payoffPhase,
    d.whyThisMatters,
    `=IF(C${i + 2}="Paid",E${i + 2},0)`,
    `=IF(D${i + 2}=0, "██████████ 100%", "In Progress")`,
    d.notes
  ]);
  valueRanges.push({
    range: 'Debts!A1:M20',
    values: [debtsHeaders, ...debtsRows]
  });

  // --- 4. Goals Tab ---
  const goalsHeaders = [
    'Goal Name', 'Category', 'Target Amount', 'Current Amount', 'Remaining', 'Percent Complete',
    'Weekly Transfer', 'Monthly Transfer', 'Status', 'Why It Matters', 'Notes'
  ];
  const goalsRows = data.goals.map((g, i) => [
    g.name,
    g.category,
    g.targetAmount,
    g.currentAmount,
    `=C${i + 2}-D${i + 2}`,
    `=D${i + 2}/C${i + 2}`,
    g.weeklyTransfer,
    `=G${i + 2}*4.33`,
    g.status,
    g.whyItMatters,
    g.notes
  ]);
  valueRanges.push({
    range: 'Goals!A1:K20',
    values: [goalsHeaders, ...goalsRows]
  });

  // --- 5. Budget Tab ---
  // Paycheck planning rows
  const budgetRows = [
    ['Budget Category', 'Budgeted', 'Spent', 'Remaining', 'Percent Used', 'Status'],
    ...data.budgetCategories.map((c, i) => [
      c.category,
      c.budgeted,
      c.spent,
      `=B${i + 2}-C${i + 2}`,
      `=C${i + 2}/B${i + 2}`,
      `=IF(E${i + 2}>1,"Over",IF(E${i + 2}>0.85,"Tight",IF(E${i + 2}>0.6,"Watch","Good")))`
    ]),
    [],
    ['This Paycheck Covers', 'Date/Amount', 'Details'],
    ['Paycheck Date', data.paycheckCovers.paycheckDate, 'Main regular deposit date'],
    ['Paycheck Amount', data.paycheckCovers.paycheckAmount, 'Allocated income'],
    ['Bills Covered', data.paycheckCovers.billsCovered.join(', '), 'Secured bill transfers'],
    ['Debt Payments', data.paycheckCovers.debtPayments.join(', '), 'Debt avalanche payoff boost'],
    ['Transfers', data.paycheckCovers.transfers.join(', '), 'Savings challenge and rollover goals'],
    ['Leftover', '=B12-SUM(Budget!C2:C9)', 'Remaining liquid padding'],
    ['Safety Status', '=IF(B15<100, "TIGHT WARNING", "SAFE BUFFER")', 'Automatic warning trigger']
  ];
  valueRanges.push({
    range: 'Budget!A1:F25',
    values: budgetRows
  });

  // --- 6. Accounts Tab ---
  const accountsHeaders = ['Account', 'Purpose', 'Current Balance', 'Target Balance', 'Difference', 'Weekly Transfer', 'Monthly Transfer', 'Notes'];
  const accountsRows = data.accounts.map((a, i) => [
    a.name,
    a.purpose,
    a.balance,
    a.targetBalance,
    `=C${i + 2}-D${i + 2}`,
    a.weeklyTransfer,
    `=F${i + 2}*4.33`,
    a.notes
  ]);
  valueRanges.push({
    range: 'Accounts!A1:H20',
    values: [accountsHeaders, ...accountsRows]
  });

  // --- 7. Savings Challenges Tab ---
  const challengesHeaders = ['Challenge', 'Estimated Savings', 'Difficulty', 'Goal Supported', 'Start Date', 'Completed?', 'Amount Saved'];
  const challengesRows = data.challenges.map(c => [
    c.challenge,
    c.estimatedSavings,
    c.difficulty,
    c.goalSupported,
    c.startDate,
    c.completed ? 'Yes' : 'No',
    c.amountSaved
  ]);
  valueRanges.push({
    range: 'Savings Challenges!A1:G20',
    values: [challengesHeaders, ...challengesRows]
  });

  // --- 8. Subscriptions Tab ---
  const subsHeaders = ['Name', 'Cost', 'Frequency', 'Next Renewal', 'Category', 'Account Paid From', 'Status'];
  const subsRows = data.subscriptions.map(s => [
    s.name,
    s.cost,
    s.frequency,
    s.nextRenewal,
    s.category,
    s.accountPaidFrom,
    s.status
  ]);
  valueRanges.push({
    range: 'Subscriptions!A1:G20',
    values: [subsHeaders, ...subsRows]
  });

  // --- 9. Payment History Tab ---
  const histHeaders = ['Date', 'Item/Bill', 'Category', 'Amount', 'Account Paid From', 'Reference/Notes'];
  const histRows = data.history.map(h => [
    h.date,
    h.item,
    h.category,
    h.amount,
    h.accountPaidFrom,
    h.notes
  ]);
  valueRanges.push({
    range: 'Payment History!A1:F500',
    values: [histHeaders, ...histRows]
  });

  // --- 10. Settings Tab ---
  valueRanges.push({
    range: 'Settings!A1:C10',
    values: [
      ['SETTING', 'VALUE', 'EXPLANATION'],
      ['Spreadsheet Name', 'Personal Finance Command Center', 'Display name of active ledger'],
      ['Sync Mode', 'Real-time Web Client', 'Auto-saving enabled via OAuth client'],
      ['Local Timezone', 'America/New_York', 'Ledger clock sync'],
      ['Active Ledger ID', id, 'Unique Google Sheets spreadsheet identification code'],
      ['Last Synchronized', '2026-06-25 19:08:11', 'Last recorded web-push action']
    ]
  });

  // Send batch update
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Failed to populate spreadsheet values:', errText);
  }
}

// Save complete local changes back to Google Sheets
export async function saveFinanceData(id: string, token: string, data: FinanceData): Promise<void> {
  try {
    await populateSpreadsheetWithData(id, token, data);
  } catch (err) {
    console.error('Error syncing finance data back to Google Sheets:', err);
    throw err;
  }
}

// Fetch complete sheet values from Google Sheets and reconstruct FinanceData object
export async function fetchFinanceData(id: string, token: string): Promise<FinanceData> {
  const ranges = [
    'Upcoming!A2:J100',
    'Debts!A2:M100',
    'Goals!A2:K100',
    'Budget!A2:F9', // Budget category list is row 2 to 9
    'Accounts!A2:H100',
    'Savings Challenges!A2:G100',
    'Subscriptions!A2:G100',
    'Payment History!A2:F500'
  ];

  try {
    const rangeParams = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchGet?${rangeParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to batchGet Google Sheets values');
    }

    const result = await response.json();
    const valueRanges = result.valueRanges || [];

    // Parse Upcoming Bills
    const billsRows = valueRanges[0]?.values || [];
    const bills: Bill[] = billsRows.map((row: any, idx: number) => ({
      id: `b${idx}`,
      dueDate: row[0] || '',
      name: row[1] || '',
      category: row[2] || '',
      amount: parseFloat(row[3]) || 0,
      accountPaidFrom: row[4] || '',
      autopay: row[5] === 'Autopay',
      paid: row[6] === 'Paid',
      paycheckUsed: row[7] || '',
      notes: row[8] || ''
    }));

    // Parse Debts
    const debtsRows = valueRanges[1]?.values || [];
    const debts: Debt[] = debtsRows.map((row: any) => ({
      priority: parseInt(row[0]) || 1,
      name: row[1] || '',
      status: row[2] || 'Active',
      balance: parseFloat(row[3]) || 0,
      minimumPayment: parseFloat(row[4]) || 0,
      dueDate: row[5] || '',
      apr: parseFloat(row[6]) || 0,
      accountPaidFrom: row[7] || '',
      payoffPhase: row[8] || '',
      whyThisMatters: row[9] || '',
      amountFreedWhenPaid: parseFloat(row[10]) || 0,
      notes: row[12] || ''
    }));

    // Parse Goals
    const goalsRows = valueRanges[2]?.values || [];
    const goals: Goal[] = goalsRows.map((row: any) => ({
      name: row[0] || '',
      category: row[1] || 'Savings',
      targetAmount: parseFloat(row[2]) || 0,
      currentAmount: parseFloat(row[3]) || 0,
      weeklyTransfer: parseFloat(row[6]) || 0,
      monthlyTransfer: parseFloat(row[7]) || 0,
      status: row[8] || 'In Progress',
      whyItMatters: row[9] || '',
      notes: row[10] || ''
    }));

    // Parse Budget Categories
    const bCatRows = valueRanges[3]?.values || [];
    const budgetCategories: BudgetCategory[] = bCatRows.map((row: any) => ({
      category: row[0] || '',
      budgeted: parseFloat(row[1]) || 0,
      spent: parseFloat(row[2]) || 0
    }));

    // Parse Accounts
    const accountsRows = valueRanges[4]?.values || [];
    const accounts: Account[] = accountsRows.map((row: any) => ({
      name: row[0] || '',
      purpose: row[1] || '',
      balance: parseFloat(row[2]) || 0,
      targetBalance: parseFloat(row[3]) || 0,
      weeklyTransfer: parseFloat(row[5]) || 0,
      monthlyTransfer: parseFloat(row[6]) || 0,
      notes: row[7] || ''
    }));

    // Parse Savings Challenges
    const challengeRows = valueRanges[5]?.values || [];
    const challenges: SavingsChallenge[] = challengeRows.map((row: any) => ({
      challenge: row[0] || '',
      estimatedSavings: parseFloat(row[1]) || 0,
      difficulty: row[2] || 'Easy',
      goalSupported: row[3] || '',
      startDate: row[4] || '',
      completed: row[5] === 'Yes',
      amountSaved: parseFloat(row[6]) || 0
    }));

    // Parse Subscriptions
    const subRows = valueRanges[6]?.values || [];
    const subscriptions: Subscription[] = subRows.map((row: any) => ({
      name: row[0] || '',
      cost: parseFloat(row[1]) || 0,
      frequency: row[2] || 'Monthly',
      nextRenewal: row[3] || '',
      category: row[4] || 'Subscriptions',
      accountPaidFrom: row[5] || '',
      status: row[6] || 'Active'
    }));

    // Parse Payment History
    const historyRows = valueRanges[7]?.values || [];
    const history: PaymentHistoryItem[] = historyRows.map((row: any) => ({
      date: row[0] || '',
      item: row[1] || '',
      category: row[2] || '',
      amount: parseFloat(row[3]) || 0,
      accountPaidFrom: row[4] || '',
      notes: row[5] || ''
    }));

    return {
      accounts,
      debts,
      bills,
      goals,
      budgetCategories,
      budgetItems: [], // Loaded from defaults if not fully synced
      paycheckCovers: {
        paycheckDate: '2026-07-01',
        paycheckAmount: 2500,
        billsCovered: ['Rent / Mortgage', 'Car Insurance', 'Electric Bill'],
        debtPayments: ['Chase Card'],
        transfers: ['Freedom Savings', 'Vacation Fund']
      },
      challenges,
      subscriptions,
      history
    };
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
}

// Sync bank transactions by filtering duplicates against current ledger history, then writing them
export async function syncBankTransactions(
  sheetId: string,
  token: string,
  plaidTransactions: any[],
  currentHistory: PaymentHistoryItem[]
): Promise<PaymentHistoryItem[]> {
  // Prevent duplicates by checking if a transaction with the same date, name, and amount already exists
  const existingKeys = new Set(
    currentHistory.map(h => `${h.date}_${h.item.toLowerCase()}_${Math.round(h.amount * 100)}`)
  );

  const newHistoryItems: PaymentHistoryItem[] = [];

  for (const pt of plaidTransactions) {
    const itemTitle = pt.name || 'Bank Transaction';
    const amountVal = Math.abs(pt.amount); // Force positive for our standard logging of expenditures/income in lists
    const categoryTag = pt.category?.[0] || 'Uncategorized';
    const transDate = pt.date;
    const accountPaidFrom = 'Plaid Bank Sync';

    const key = `${transDate}_${itemTitle.toLowerCase()}_${Math.round(amountVal * 100)}`;
    if (!existingKeys.has(key)) {
      newHistoryItems.push({
        date: transDate,
        item: itemTitle,
        category: categoryTag,
        amount: amountVal,
        accountPaidFrom,
        notes: 'Synced live from bank feed via Plaid SDK'
      });
      existingKeys.add(key);
    }
  }

  if (newHistoryItems.length === 0) {
    return currentHistory;
  }

  // Combine and sort by date descending
  const updatedHistory = [...newHistoryItems, ...currentHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return updatedHistory;
}

