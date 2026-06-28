import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK (Lazy loading/Safe check)
let geminiClient: GoogleGenAI | null = null;
const getGeminiClient = () => {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn('GEMINI_API_KEY not configured. Running AI features in Simulation mode.');
      return null;
    }
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
};

// Initialize Plaid Client (Lazy loading)
let plaidClient: PlaidApi | null = null;
const getPlaidClient = () => {
  if (!plaidClient) {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    const env = process.env.PLAID_ENV || 'sandbox';
    if (!clientId || !secret) {
      console.warn('Plaid credentials not fully configured. Using backend simulation mode.');
      return null;
    }
    const configuration = new Configuration({
      basePath: PlaidEnvironments[env],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': clientId,
          'PLAID-SECRET': secret,
        },
      },
    });
    plaidClient = new PlaidApi(configuration);
  }
  return plaidClient;
};

// API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Create link token
app.post('/api/create_link_token', async (req, res) => {
  try {
    const client = getPlaidClient();
    if (!client) {
      return res.json({ link_token: 'mock_link_token_123456', is_mock: true });
    }
    const tokenResponse = await client.linkTokenCreate({
      user: { client_user_id: 'user-id-finance-command' },
      client_name: 'Personal Finance Command Center',
      products: ['transactions'] as any,
      country_codes: ['US'] as any,
      language: 'en',
    });
    res.json({ link_token: tokenResponse.data.link_token, is_mock: false });
  } catch (err: any) {
    console.error('Error in create_link_token:', err?.response?.data || err.message);
    res.json({ link_token: 'mock_link_token_123456', is_mock: true, error: err?.response?.data || err.message });
  }
});

// Exchange public token
app.post('/api/exchange_public_token', async (req, res) => {
  const { public_token } = req.body;
  try {
    const client = getPlaidClient();
    if (!client || public_token === 'mock_link_token_123456' || public_token?.startsWith('mock_')) {
      return res.json({ access_token: 'mock_access_token_789', item_id: 'mock_item_123', is_mock: true });
    }
    const exchangeResponse = await client.itemPublicTokenExchange({ public_token });
    res.json({
      access_token: exchangeResponse.data.access_token,
      item_id: exchangeResponse.data.item_id,
      is_mock: false
    });
  } catch (err: any) {
    console.error('Error in exchange_public_token:', err?.response?.data || err.message);
    res.json({ access_token: 'mock_access_token_789', item_id: 'mock_item_123', is_mock: true });
  }
});

// Get transactions
app.post('/api/transactions', async (req, res) => {
  const { access_token } = req.body;
  try {
    const client = getPlaidClient();
    if (!client || access_token?.startsWith('mock_')) {
      const mockTransactions = [
        {
          account_id: 'acc_checking_01',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          name: "Trader Joe's Delivery",
          amount: 78.43,
          category: ['Food and Drink', 'Groceries'],
        },
        {
          account_id: 'acc_checking_01',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          name: 'Chevron Gas Station',
          amount: 45.00,
          category: ['Travel', 'Gas Stations'],
        },
        {
          account_id: 'acc_checking_01',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          name: 'Netflix Subscription',
          amount: 15.49,
          category: ['Entertainment', 'Subscriptions'],
        },
        {
          account_id: 'acc_checking_01',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          name: 'Direct Deposit Payroll Paycheck',
          amount: -2500.00,
          category: ['Income', 'Payroll'],
        },
        {
          account_id: 'acc_checking_01',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          name: 'Starbucks Coffee',
          amount: 6.75,
          category: ['Food and Drink', 'Coffee Shop'],
        }
      ];
      return res.json({ transactions: mockTransactions, is_mock: true });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const start_date = thirtyDaysAgo.toISOString().split('T')[0];
    const end_date = now.toISOString().split('T')[0];

    const response = await client.transactionsGet({
      access_token,
      start_date,
      end_date,
    });

    res.json({
      transactions: response.data.transactions.map((t: any) => ({
        account_id: t.account_id,
        date: t.date,
        name: t.name,
        amount: t.amount,
        category: t.category,
      })),
      is_mock: false,
    });
  } catch (err: any) {
    console.error('Error fetching transactions:', err?.response?.data || err.message);
    res.json({
      transactions: [
        {
          account_id: 'acc_checking_01',
          date: new Date().toISOString().split('T')[0],
          name: 'Simulated Grocery Spend',
          amount: 32.50,
          category: ['Food and Drink'],
        }
      ],
      is_mock: true
    });
  }
});

// AI Financial Coach endpoint
// Helper to call Gemini with a robust retry mechanism on transient (e.g. 503, 429) errors
async function generateContentWithRetry(ai: any, params: any, retries = 3, delay = 1000): Promise<any> {
  let attempt = 0;
  while (true) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const status = err?.status || err?.code;
      const errMsg = err?.message || '';
      const isTransient = status === 503 || status === 429 || 
                          errMsg.includes('503') || 
                          errMsg.includes('UNAVAILABLE') || 
                          errMsg.includes('high demand') || 
                          errMsg.includes('temporary');
      
      const isQuotaExceeded = errMsg.toLowerCase().includes('quota exceeded') || 
                              errMsg.toLowerCase().includes('exceeded your current quota') ||
                              errMsg.toLowerCase().includes('resource_exhausted');
      
      if (isTransient && !isQuotaExceeded && attempt < retries) {
        console.warn(`Gemini API returned transient error (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`, errMsg);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
        continue;
      }
      throw err;
    }
  }
}

// Generate dynamic personalized briefing locally if Gemini client is unavailable or errors out
function getDynamicFallbackBriefing(financeData: any, timeOfDay?: string): string {
  const accounts = financeData?.accounts || [];
  const totalBalance = accounts.reduce((acc: number, a: any) => acc + (a.balance || 0), 0);
  const bills = financeData?.bills || [];
  const unpaidBillsCount = bills.filter((b: any) => !b.paid).length;
  
  if (timeOfDay === 'evening') {
    return `Good Evening, Chief. You stayed within your spending plan today! Your total cash reserves stand strong at $${totalBalance.toLocaleString()}. Your QuickSilver card is only $162 from being completely paid off. Keep your momentum going!`;
  } else {
    const primaryAccount = accounts[0];
    const primaryBalance = primaryAccount ? primaryAccount.balance : 0;
    return `Good Morning, Chief. Today: $${primaryBalance.toLocaleString()} available in your primary account. You have ${unpaidBillsCount} unpaid bills this cycle. Remember, your Vacation Fund will receive its scheduled transfer tomorrow!`;
  }
}

app.post('/api/gemini/coach', async (req, res) => {
  const { prompt, financeData, chatHistory } = req.body;
  try {
    const ai = getGeminiClient();
    if (!ai) {
      // Simulate coach response beautifully with localized smart logic
      const mockResponses: { [key: string]: string } = {
        "afford": "As your simulated Commander Coach, looking at your checkings and goals, you have a solid balance. However, if you spend $600 on a TV right now, it will temporarily drop your cash flow safety index. I recommend setting up a dedicated 'TV Goal' in your Goals tab and saving $150/month for 4 months to pay in pure cash!",
        "truck": "If you add $300 as an extra payment toward your truck, you will save approximately $142 in interest charges and shorten your payoff period by about 2 full months! This is an excellent, high-impact velocity move.",
        "spend": "Based on your checking balance of $1,850 and upcoming bills of $1,200 this week, you have approximately $650 left over. To stay perfectly safe and keep your Buffer Fund healthy, you can safely spend up to $150 this weekend.",
        "default": "Greetings! I am Commander Coach, your personalized AI Financial Assistant. I can see you have accounts logged with us. I would love to advise you on how to pay off debt faster, structure your savings goals, or evaluate large purchases! Please connect your Gemini API key in the AI Studio Settings for live AI-driven analysis!"
      };
      let match = mockResponses.default;
      const lower = (prompt || '').toLowerCase();
      if (lower.includes('afford') || lower.includes('tv') || lower.includes('600')) match = mockResponses.afford;
      else if (lower.includes('truck') || lower.includes('300') || lower.includes('extra')) match = mockResponses.truck;
      else if (lower.includes('spend') || lower.includes('weekend') || lower.includes('safely')) match = mockResponses.spend;
      
      return res.json({ text: match, is_simulated: true });
    }

    // Format financeData into a tight readable context
    const dataSummary = `
Active Financial Profile:
Accounts:
${(financeData?.accounts || []).map((a: any) => `- ${a.name} (${a.type}): Balance: $${a.balance}, Notes: ${a.notes || ''}`).join('\n')}
Debts:
${(financeData?.debts || []).map((d: any) => `- ${d.name}: Balance: $${d.balance}, Min Payment: $${d.minimumPayment}, APR: ${d.apr}%`).join('\n')}
Bills:
${(financeData?.bills || []).map((b: any) => `- ${b.name}: $${b.amount} due on ${b.dueDate}, Paid: ${b.paid}`).join('\n')}
Goals:
${(financeData?.goals || []).map((g: any) => `- ${g.name}: Saved $${g.currentAmount}/$${g.targetAmount}`).join('\n')}
Budget:
${(financeData?.budgetCategories || []).map((c: any) => `- ${c.category}: Budgeted $${c.budgeted}, Spent: ${c.spent || 0}`).join('\n')}
`;

    const systemInstruction = `You are a world-class financial coach called Commander Coach. You analyze the user's accounts, bills, goals, and debts, and answer their personal finance questions. 
Always use the user's actual live financial data provided in the prompt to give highly specific calculations and advice. 
Explain your calculations step-by-step. Speak in a confident, supportive, clear, and encouraging tone. Use clean bullet points where appropriate. Keep answers highly professional, scannable, and actionable. Do not use generic advice like "spend less"; say exactly how much they can spend or save based on their numbers.`;

    const contents = [
      { role: 'user', parts: [{ text: `Here is my financial state:\n${dataSummary}\n\nChat History:\n${(chatHistory || []).map((h: any) => `${h.sender === 'user' ? 'User' : 'Coach'}: ${h.text}`).join('\n')}\n\nMy Question:\n${prompt}` }] }
    ];

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ text: response.text, is_simulated: false });
  } catch (err: any) {
    console.error('Error in gemini/coach:', err);
    res.json({ text: "I ran into a slight network connection issue. However, based on your local metrics, you're doing great! Keep up your budget discipline.", is_simulated: true });
  }
});

// Daily Financial Snapshot / Briefing endpoint
app.post('/api/gemini/briefing', async (req, res) => {
  const { financeData, timeOfDay } = req.body;
  try {
    const ai = getGeminiClient();
    if (!ai) {
      const briefing = getDynamicFallbackBriefing(financeData, timeOfDay);
      return res.json({ briefing, is_simulated: true });
    }

    const summary = `
Accounts: ${(financeData?.accounts || []).map((a: any) => `${a.name}: $${a.balance}`).join(', ')}
Unpaid Bills: ${(financeData?.bills || []).filter((b: any) => !b.paid).map((b: any) => `${b.name} ($${b.amount} on ${b.dueDate})`).join(', ')}
Active Goals: ${(financeData?.goals || []).map((g: any) => `${g.name}: $${g.currentAmount}/$${g.targetAmount}`).join(', ')}
Debts: ${(financeData?.debts || []).map((d: any) => `${d.name}: $${d.balance}`).join(', ')}
`;

    const promptText = `Generate a personalized financial briefing for the user for the ${timeOfDay || 'morning'}. 
Based on these numbers:\n${summary}\n
Rules:
1. Start with "Good Morning, Chief." or "Good Evening, Chief." depending on the time of day.
2. Provide a 2-3 sentence briefing.
3. Keep it short, highly encouraging, punchy, and based strictly on their live data.
4. If morning, highlight available cash, immediate bills, or next payday.
5. If evening, praise their discipline, mention an upcoming goal milestone or debt payoff.
6. Make it feel elite, like a command briefing. Do not include any meta-language or placeholders.`;

    const response = await generateContentWithRetry(ai, {
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        temperature: 0.85,
      }
    });

    res.json({ briefing: response.text?.trim(), is_simulated: false });
  } catch (err: any) {
    console.error('Error in gemini/briefing:', err);
    const briefing = getDynamicFallbackBriefing(financeData, timeOfDay);
    res.json({ briefing, is_simulated: true });
  }
});

// Configure Vite integration or Static delivery
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

setupViteOrStatic();
