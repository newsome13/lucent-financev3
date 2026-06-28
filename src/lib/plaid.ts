// Plaid Client Integration Layer

export interface PlaidTransaction {
  account_id: string;
  date: string;
  name: string;
  amount: number;
  category: string[];
}

export interface PlaidSyncResult {
  transactions: PlaidTransaction[];
  is_mock: boolean;
}

/**
 * Creates a Plaid Link token by contacting our backend.
 */
export async function createLinkToken(): Promise<{ link_token: string; is_mock: boolean }> {
  try {
    const res = await fetch('/api/create_link_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to create link token');
    return await res.json();
  } catch (err) {
    console.warn('Using client-side simulated link token:', err);
    return { link_token: 'mock_link_token_client_fallback', is_mock: true };
  }
}

/**
 * Exchanges a public token for an access token via our secure backend.
 */
export async function exchangePublicToken(public_token: string): Promise<{ access_token: string; is_mock: boolean }> {
  try {
    const res = await fetch('/api/exchange_public_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ public_token }),
    });
    if (!res.ok) throw new Error('Failed to exchange public token');
    return await res.json();
  } catch (err) {
    console.warn('Using client-side simulated access token:', err);
    return { access_token: 'mock_access_token_client_fallback', is_mock: true };
  }
}

/**
 * Pulls synced bank transactions from our secure backend.
 */
export async function fetchBankTransactions(accessToken: string): Promise<PlaidSyncResult> {
  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken }),
    });
    if (!res.ok) throw new Error('Failed to fetch bank transactions');
    return await res.json();
  } catch (err) {
    console.error('Error fetching bank transactions, returning mock:', err);
    return {
      transactions: [
        {
          account_id: 'acc_checking_01',
          date: new Date().toISOString().split('T')[0],
          name: "Trader Joe's Supermarket",
          amount: 64.20,
          category: ['Food and Drink', 'Groceries'],
        }
      ],
      is_mock: true,
    };
  }
}
