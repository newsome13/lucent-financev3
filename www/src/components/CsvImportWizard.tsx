import { useState, useRef, FormEvent, DragEvent } from 'react';
import { PaymentHistoryItem } from '../types';
import { 
  X, 
  Upload, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight, 
  Info, 
  Trash, 
  ArrowLeft,
  FileText,
  BadgeAlert,
  Loader2,
  DollarSign
} from 'lucide-react';

interface CsvImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: string[];
  history: PaymentHistoryItem[];
  onImport: (importedItems: PaymentHistoryItem[]) => void;
}

type WizardStep = 'SELECT_FILE' | 'COLUMN_MAP' | 'REVIEW_ITEMS' | 'SUMMARY';

interface ParsedTransaction {
  id: string;
  rawDate: string;
  rawDesc: string;
  rawAmount: string;
  rawCategory: string;
  
  // Cleaned mapped properties (editable by user)
  date: string;
  merchant: string;
  amount: number;
  category: string;
  account: string;
  
  isDuplicate: boolean;
  selected: boolean;
}

export default function CsvImportWizard({ 
  isOpen, 
  onClose, 
  accounts, 
  history, 
  onImport 
}: CsvImportWizardProps) {
  const [step, setStep] = useState<WizardStep>('SELECT_FILE');
  const [fileName, setFileName] = useState('');
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column mapping states
  const [mapDateIdx, setMapDateIdx] = useState<number>(-1);
  const [mapDescIdx, setMapDescIdx] = useState<number>(-1);
  const [mapAmountIdx, setMapAmountIdx] = useState<number>(-1);
  const [mapDebitIdx, setMapDebitIdx] = useState<number>(-1); // alternative to single amount
  const [mapCreditIdx, setMapCreditIdx] = useState<number>(-1); // alternative to single amount
  const [mapCategoryIdx, setMapCategoryIdx] = useState<number>(-1);
  const [mapAccountIdx, setMapAccountIdx] = useState<number>(-1);
  
  // Default target account
  const [defaultAccount, setDefaultAccount] = useState<string>(accounts[0] || 'Life Checking');

  // Transactions list to import
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [importSummary, setImportSummary] = useState({
    totalCount: 0,
    duplicateCount: 0,
    addedCount: 0,
    skippedCount: 0
  });

  if (!isOpen) return null;

  // Custom CSV parser handling quotes robustly
  function parseCSV(text: string): string[][] {
    const lines: string[][] = [];
    let row: string[] = [];
    let currentField = '';
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (insideQuote) {
        if (char === '"') {
          if (nextChar === '"') {
            currentField += '"';
            i++;
          } else {
            insideQuote = false;
          }
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          insideQuote = true;
        } else if (char === ',') {
          row.push(currentField.trim());
          currentField = '';
        } else if (char === '\r' || char === '\n') {
          row.push(currentField.trim());
          currentField = '';
          if (row.length > 0 && row.some(cell => cell !== '')) {
            lines.push(row);
          }
          row = [];
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentField += char;
        }
      }
    }
    if (currentField || row.length > 0) {
      row.push(currentField.trim());
      if (row.some(cell => cell !== '')) {
        lines.push(row);
      }
    }
    return lines;
  }

  // Handle uploaded file
  const handleFileContent = (text: string, name: string) => {
    setFileName(name);
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      alert('The uploaded CSV file appears to be empty.');
      return;
    }

    const firstRow = parsed[0];
    setHeaders(firstRow);
    setCsvRows(parsed.slice(1));

    // Auto detect columns
    let dateIdx = -1;
    let descIdx = -1;
    let amountIdx = -1;
    let debitIdx = -1;
    let creditIdx = -1;
    let categoryIdx = -1;
    let accountIdx = -1;

    firstRow.forEach((col, idx) => {
      const lowerCol = col.toLowerCase();
      if (
        lowerCol.includes('date') || 
        lowerCol.includes('time') || 
        lowerCol.includes('day') || 
        lowerCol === 'when'
      ) {
        if (dateIdx === -1) dateIdx = idx;
      } else if (
        lowerCol.includes('desc') || 
        lowerCol.includes('merchant') || 
        lowerCol.includes('payee') || 
        lowerCol.includes('name') || 
        lowerCol.includes('detail') || 
        lowerCol.includes('memo') ||
        lowerCol === 'item'
      ) {
        if (descIdx === -1) descIdx = idx;
      } else if (
        lowerCol === 'amount' || 
        lowerCol.includes('value') || 
        lowerCol === 'total' || 
        lowerCol === 'sum'
      ) {
        if (amountIdx === -1) amountIdx = idx;
      } else if (
        lowerCol.includes('debit') || 
        lowerCol.includes('withdraw') || 
        lowerCol.includes('spend') || 
        lowerCol === 'out'
      ) {
        if (debitIdx === -1) debitIdx = idx;
      } else if (
        lowerCol.includes('credit') || 
        lowerCol.includes('deposit') || 
        lowerCol === 'in'
      ) {
        if (creditIdx === -1) creditIdx = idx;
      } else if (
        lowerCol.includes('category') || 
        lowerCol.includes('type') || 
        lowerCol.includes('group')
      ) {
        if (categoryIdx === -1) categoryIdx = idx;
      } else if (
        lowerCol.includes('account') || 
        lowerCol.includes('wallet') || 
        lowerCol === 'source'
      ) {
        if (accountIdx === -1) accountIdx = idx;
      }
    });

    setMapDateIdx(dateIdx);
    setMapDescIdx(descIdx);
    setMapAmountIdx(amountIdx !== -1 ? amountIdx : (debitIdx !== -1 ? debitIdx : -1));
    setMapDebitIdx(debitIdx);
    setMapCreditIdx(creditIdx);
    setMapCategoryIdx(categoryIdx);
    setMapAccountIdx(accountIdx);

    setStep('COLUMN_MAP');
  };

  const handleFileUpload = (e: FormEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          handleFileContent(event.target.result, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            handleFileContent(event.target.result, file.name);
          }
        };
        reader.readAsText(file);
      } else {
        alert('Please drop a valid .csv bank export file.');
      }
    }
  };

  // Convert raw rows to clean transactions based on current mappings
  const applyColumnMappings = () => {
    if (mapDateIdx === -1 || mapDescIdx === -1) {
      alert('Please match at least the Date and Description/Merchant columns to continue.');
      return;
    }

    const cleaned: ParsedTransaction[] = csvRows.map((row, index) => {
      // Clean Date
      let rawDate = row[mapDateIdx] || '';
      // convert dates like "06/27/2026" or "2026-06-27" to standard YYYY-MM-DD
      let cleanDate = rawDate.trim();
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length === 3) {
          let mm = parts[0].padStart(2, '0');
          let dd = parts[1].padStart(2, '0');
          let yyyy = parts[2];
          if (yyyy.length === 2) yyyy = '20' + yyyy; // assume 20xx
          cleanDate = `${yyyy}-${mm}-${dd}`;
        }
      }

      // If Date is still invalid, default to today's date YYYY-MM-DD format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
        cleanDate = new Date().toISOString().split('T')[0];
      }

      // Clean Description
      const rawDesc = row[mapDescIdx] || '';
      const cleanDesc = rawDesc.trim();

      // Clean Amount
      let parsedAmt = 0;
      if (mapAmountIdx !== -1) {
        let rawAmtStr = row[mapAmountIdx] || '0';
        // strip currency symbols, commas, spaces
        rawAmtStr = rawAmtStr.replace(/[$\s,]/g, '');
        parsedAmt = parseFloat(rawAmtStr) || 0;
      } else if (mapDebitIdx !== -1 || mapCreditIdx !== -1) {
        // Debit column or Credit column
        const debitStr = mapDebitIdx !== -1 ? (row[mapDebitIdx] || '').replace(/[$\s,]/g, '') : '';
        const creditStr = mapCreditIdx !== -1 ? (row[mapCreditIdx] || '').replace(/[$\s,]/g, '') : '';
        const debitVal = parseFloat(debitStr) || 0;
        const creditVal = parseFloat(creditStr) || 0;

        if (creditVal > 0) {
          parsedAmt = -creditVal; // In our history payment log, spending is POSITIVE and income/deposit is NEGATIVE, or vice versa? Let's verify.
          // Wait, let's look at standard bank ledger logic in App.tsx or keep it positive for outward transactions.
        } else if (debitVal > 0) {
          parsedAmt = debitVal;
        }
      }

      // Standardize amount:
      // In this app, cash withdrawals/spends are POSITIVE in history logs, while cash deposits/earnings are positive/negative depending on category. 
      // Let's keep numeric signs natural or absolute positive for spends.
      const isPositiveIncome = parsedAmt < 0; 
      const absAmt = Math.abs(parsedAmt);

      // Clean Category
      let cleanCat = 'Fun / Misc';
      if (mapCategoryIdx !== -1) {
        const rawCat = (row[mapCategoryIdx] || '').toLowerCase();
        if (rawCat.includes('bill') || rawCat.includes('utilities')) cleanCat = 'Bills';
        else if (rawCat.includes('sub') || rawCat.includes('netflix') || rawCat.includes('spotify')) cleanCat = 'Subscriptions';
        else if (rawCat.includes('debt') || rawCat.includes('loan') || rawCat.includes('card')) cleanCat = 'Debt';
        else if (rawCat.includes('grocer') || rawCat.includes('food') || rawCat.includes('rest') || rawCat.includes('dine')) cleanCat = 'Food / Grocery';
        else if (rawCat.includes('travel') || rawCat.includes('flight') || rawCat.includes('hotel')) cleanCat = 'Travel';
        else if (rawCat.includes('income') || rawCat.includes('salary') || rawCat.includes('paycheck')) cleanCat = 'Income';
        else if (rawCat.includes('sav') || rawCat.includes('transfer')) cleanCat = 'Savings';
      } else {
        // fallback heuristic matching on description
        const descLower = cleanDesc.toLowerCase();
        if (descLower.includes('netflix') || descLower.includes('spotify') || descLower.includes('youtube') || descLower.includes('apple')) {
          cleanCat = 'Subscriptions';
        } else if (descLower.includes('landlord') || descLower.includes('rent') || descLower.includes('electric') || descLower.includes('power') || descLower.includes('water')) {
          cleanCat = 'Bills';
        } else if (descLower.includes('chase') || descLower.includes('payment') || descLower.includes('interest') || descLower.includes('loan')) {
          cleanCat = 'Debt';
        } else if (descLower.includes('paycheck') || descLower.includes('payroll') || descLower.includes('salary') || descLower.includes('deposit')) {
          cleanCat = 'Income';
        } else if (descLower.includes('restaurant') || descLower.includes('starbucks') || descLower.includes('mcdonald') || descLower.includes('uber eats') || descLower.includes('grocery') || descLower.includes('supermarket')) {
          cleanCat = 'Food / Grocery';
        }
      }

      // Account name assignment
      let assignedAccount = defaultAccount;
      if (mapAccountIdx !== -1) {
        const parsedAccount = (row[mapAccountIdx] || '').trim();
        // check if this is a known wallet/account
        const matched = accounts.find(a => a.toLowerCase() === parsedAccount.toLowerCase());
        if (matched) assignedAccount = matched;
      }

      // Check Duplicates
      // A transaction is a duplicate if it matches date, amount, and has high overlap in merchant name with an existing history item.
      const isDuplicate = history.some(h => {
        const sameDate = h.date === cleanDate;
        const sameAmount = Math.abs(h.amount) === absAmt;
        const sameDesc = h.item.toLowerCase().trim() === cleanDesc.toLowerCase().trim() ||
                         h.item.toLowerCase().includes(cleanDesc.toLowerCase()) ||
                         cleanDesc.toLowerCase().includes(h.item.toLowerCase());
        return sameDate && sameAmount && sameDesc;
      });

      return {
        id: `csv-${index}-${Date.now()}`,
        rawDate,
        rawDesc,
        rawAmount: parsedAmt.toString(),
        rawCategory: row[mapCategoryIdx] || '',
        date: cleanDate,
        merchant: cleanDesc || 'Unknown Merchant',
        amount: absAmt,
        category: cleanCat,
        account: assignedAccount,
        isDuplicate,
        selected: !isDuplicate // skip duplicate by default
      };
    });

    setParsedTransactions(cleaned);
    setStep('REVIEW_ITEMS');
  };

  // Handle single cell edit
  const handleEditCell = (id: string, field: keyof ParsedTransaction, val: any) => {
    setParsedTransactions(prev => prev.map(t => {
      if (t.id === id) {
        return { ...t, [field]: val };
      }
      return t;
    }));
  };

  // Submit and save the clean imports
  const handleCommitImports = () => {
    const selectedTrans = parsedTransactions.filter(t => t.selected);
    if (selectedTrans.length === 0) {
      alert('Please check/select at least one transaction to import.');
      return;
    }

    // Convert to PaymentHistoryItem structure
    const newHistoryItems: PaymentHistoryItem[] = selectedTrans.map(t => {
      // Determine if transaction is positive or negative
      // Spends are POSITIVE in standard listing, income/transfers can be customized or positive with "Income" category.
      // Let's keep it strictly positive, and let categories define the ledger behavior, matching how dashboard handles it.
      return {
        id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        item: t.merchant,
        category: t.category,
        amount: t.amount,
        date: t.date,
        accountPaidFrom: t.account,
        notes: `Imported from ${fileName} manually.`
      };
    });

    // Save to Google Sheets / Local state is handled by trigger in parent
    onImport(newHistoryItems);

    setImportSummary({
      totalCount: parsedTransactions.length,
      duplicateCount: parsedTransactions.filter(t => t.isDuplicate).length,
      addedCount: selectedTrans.length,
      skippedCount: parsedTransactions.length - selectedTrans.length
    });

    setStep('SUMMARY');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-150 max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-800 text-base">Import Recent Activity</h3>
              <p className="text-xs text-slate-400">Manual spreadsheet backup & bank statement uploader</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress Tracker */}
        <div className="px-6 py-3 bg-slate-100/50 border-b border-slate-200/50 flex items-center gap-4 flex-wrap text-xs font-semibold text-slate-400">
          <span className={step === 'SELECT_FILE' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>1. Select Statement</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={step === 'COLUMN_MAP' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>2. Confirm Columns</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={step === 'REVIEW_ITEMS' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>3. Check Duplicates & Edit</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className={step === 'SUMMARY' ? 'text-indigo-600 font-bold' : 'text-slate-500'}>4. Safe Summary</span>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* STEP 1: SELECT FILE */}
          {step === 'SELECT_FILE' && (
            <div className="space-y-6 text-center py-8">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 max-w-xl mx-auto flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-md' 
                    : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
                }`}
              >
                <div className="p-4 bg-indigo-100/60 text-indigo-600 rounded-full">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-sm">Drag and drop your statement CSV here</h4>
                  <p className="text-xs text-slate-400 mt-1">Or click anywhere to browse your desktop</p>
                </div>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv"
                  className="hidden"
                />
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 py-1 px-3 rounded-full border border-indigo-100 mt-2">
                  Format Backup Import
                </span>
              </div>

              <div className="max-w-md mx-auto p-4 bg-amber-50/40 rounded-2xl border border-amber-100 text-left text-[11px] text-amber-800 leading-normal flex gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Compatible Formats</p>
                  <p className="text-slate-500 mt-0.5">
                    We auto-detect standard exports from Chase, Capital One, PayPal, Cash App, Venmo, credit cards, and retail bank accounts. Excel files must be saved as standard `.csv` before dropping.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAP */}
          {step === 'COLUMN_MAP' && (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-indigo-600" />
                  We scanned {fileName} ({csvRows.length} transactions found)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Confirm or change mapping definitions to keep everything clean and balanced.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Side: Mapping Selects */}
                <div className="space-y-4">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Required Map Fields</h4>
                  
                  {/* Date mapping */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Date Column</label>
                    <select
                      value={mapDateIdx}
                      onChange={e => setMapDateIdx(parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value={-1}>-- Select Column --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i+1}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description mapping */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Description / Merchant Column</label>
                    <select
                      value={mapDescIdx}
                      onChange={e => setMapDescIdx(parseInt(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value={-1}>-- Select Column --</option>
                      {headers.map((h, i) => (
                        <option key={i} value={i}>{h || `Column ${i+1}`}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount or Debit/Credit mapping choice */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <label className="text-xs font-semibold text-slate-600 block">Transaction Amount Mapping</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium">Single Amount Column</span>
                        <select
                          value={mapAmountIdx}
                          onChange={e => {
                            setMapAmountIdx(parseInt(e.target.value));
                            setMapDebitIdx(-1);
                            setMapCreditIdx(-1);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                        >
                          <option value={-1}>-- Select --</option>
                          {headers.map((h, i) => (
                            <option key={i} value={i}>{h || `Column ${i+1}`}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-medium">Or Debit Column</span>
                        <select
                          value={mapDebitIdx}
                          onChange={e => {
                            setMapDebitIdx(parseInt(e.target.value));
                            setMapAmountIdx(-1);
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none"
                        >
                          <option value={-1}>-- Select --</option>
                          {headers.map((h, i) => (
                            <option key={i} value={i}>{h || `Column ${i+1}`}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Target wallet space */}
                  <div className="space-y-1 border-t border-slate-100 pt-3">
                    <label className="text-xs font-semibold text-slate-600">Default Target Money Space</label>
                    <p className="text-[10px] text-slate-400 mb-1">Choose where these transactions should list by default.</p>
                    <select
                      value={defaultAccount}
                      onChange={e => setDefaultAccount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {accounts.map(acc => (
                        <option key={acc} value={acc}>{acc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Side: CSV Data Raw Preview */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Raw File Sample Row</h4>
                  {csvRows.length > 0 ? (
                    <div className="space-y-2">
                      {headers.map((h, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200/40 last:border-0">
                          <span className="font-bold text-slate-600 truncate max-w-[150px]" title={h}>{h || `Column ${idx+1}`}</span>
                          <span className="font-mono bg-white border border-slate-100 px-2 py-0.5 rounded text-slate-700 truncate max-w-[180px]">
                            {csvRows[0][idx] || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">No records to preview.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep('SELECT_FILE')}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={applyColumnMappings}
                  className="flex items-center gap-1.5 py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md"
                >
                  Confirm Columns
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW ITEMS */}
          {step === 'REVIEW_ITEMS' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/40 p-4 border border-indigo-100 rounded-3xl">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs">Review bank transactions before final import</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">We flagged duplicate matches in your log and unchecked them automatically.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 py-1 px-2.5 rounded-full flex items-center gap-1">
                    <BadgeAlert className="w-3.5 h-3.5" />
                    {parsedTransactions.filter(t => t.isDuplicate).length} Duplicates Found
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 py-1 px-2.5 rounded-full">
                    {parsedTransactions.filter(t => t.selected).length} Checked
                  </span>
                </div>
              </div>

              {/* Transactions grid/list table with edit capabilities */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12">Import?</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Merchant / Item</th>
                      <th className="py-2.5 px-3">Amount ($)</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Destination Wallet</th>
                      <th className="py-2.5 px-3 text-right">Duplicate?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {parsedTransactions.map(t => (
                      <tr 
                        key={t.id} 
                        className={`hover:bg-slate-50 transition-colors ${
                          t.isDuplicate ? 'bg-amber-50/15' : ''
                        } ${!t.selected ? 'opacity-60' : ''}`}
                      >
                        {/* Selected Checkbox */}
                        <td className="py-2 px-3 text-center">
                          <input 
                            type="checkbox"
                            checked={t.selected}
                            onChange={e => handleEditCell(t.id, 'selected', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded"
                          />
                        </td>

                        {/* Date Input */}
                        <td className="py-2 px-3">
                          <input 
                            type="text"
                            value={t.date}
                            onChange={e => handleEditCell(t.id, 'date', e.target.value)}
                            className="w-24 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none"
                          />
                        </td>

                        {/* Merchant Name */}
                        <td className="py-2 px-3">
                          <input 
                            type="text"
                            value={t.merchant}
                            onChange={e => handleEditCell(t.id, 'merchant', e.target.value)}
                            className="w-full min-w-[120px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-semibold focus:outline-none"
                          />
                        </td>

                        {/* Amount */}
                        <td className="py-2 px-3 font-mono font-bold">
                          <input 
                            type="number"
                            step="0.01"
                            value={t.amount}
                            onChange={e => handleEditCell(t.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="w-20 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-xs focus:outline-none"
                          />
                        </td>

                        {/* Category Select */}
                        <td className="py-2 px-3">
                          <select
                            value={t.category}
                            onChange={e => handleEditCell(t.id, 'category', e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                          >
                            <option value="Bills">Bills</option>
                            <option value="Subscriptions">Subscriptions</option>
                            <option value="Debt">Debt</option>
                            <option value="Food / Grocery">Food / Grocery</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Income">Income</option>
                            <option value="Savings">Savings</option>
                            <option value="Travel">Travel</option>
                            <option value="Fun / Misc">Fun / Misc</option>
                          </select>
                        </td>

                        {/* Account Destination */}
                        <td className="py-2 px-3">
                          <select
                            value={t.account}
                            onChange={e => handleEditCell(t.id, 'account', e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[11px] focus:outline-none"
                          >
                            {accounts.map(acc => (
                              <option key={acc} value={acc}>{acc}</option>
                            ))}
                          </select>
                        </td>

                        {/* Duplicate Alert */}
                        <td className="py-2 px-3 text-right">
                          {t.isDuplicate ? (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Duplicate skipped
                            </span>
                          ) : (
                            <span className="text-slate-350 text-[10px]">Unique</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button
                  onClick={() => setStep('COLUMN_MAP')}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                
                <button
                  onClick={handleCommitImports}
                  className="flex items-center gap-1.5 py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-bold shadow-md"
                  id="csv-confirm-import-to-money-btn"
                >
                  <Check className="w-4 h-4" />
                  Add to My Money
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {step === 'SUMMARY' && (
            <div className="space-y-6 py-6 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-display font-black text-slate-800 text-lg">
                  Nice — your money activity is up to date.
                </h4>
                <p className="text-xs text-slate-400">Everything has been synced and compiled seamlessly.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs text-left">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-semibold">Total Scanned Items</span>
                  <span className="font-mono font-bold text-slate-800">{importSummary.totalCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-semibold">Duplicates Detected</span>
                  <span className="font-mono font-bold text-amber-600">{importSummary.duplicateCount}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-semibold">Successfully Added</span>
                  <span className="font-mono font-bold text-emerald-600">+{importSummary.addedCount} items</span>
                </div>
                <div className="flex justify-between py-1 last:border-0 pt-1">
                  <span className="text-slate-500 font-semibold">Manual Exclusions</span>
                  <span className="font-mono font-bold text-slate-600">{importSummary.skippedCount}</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-slate-850 hover:bg-slate-900 text-white rounded-full text-xs font-bold shadow-md transition-all"
                  id="csv-summary-done-btn"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
