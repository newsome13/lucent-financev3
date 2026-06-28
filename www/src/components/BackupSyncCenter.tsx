import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  Cloud, 
  Database, 
  RefreshCw, 
  FileSpreadsheet, 
  ShieldCheck, 
  Download, 
  Upload, 
  LogOut, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  FileJson,
  KeyRound
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BackupSyncCenterProps {
  user: any;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  isSyncing: boolean;
  onLogout: (clearLocal?: boolean) => void;
  onSyncNow: () => void;
  onRecreateSheet: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  accounts: any[];
  onImportBackup: (importedData: any) => void;
}

export default function BackupSyncCenter({
  user,
  spreadsheetId,
  spreadsheetUrl,
  isSyncing,
  onLogout,
  onSyncNow,
  onRecreateSheet,
  onExportJson,
  onExportCsv,
  accounts,
  onImportBackup
}: BackupSyncCenterProps) {
  const [dragOver, setDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute status metrics
  const isPlaidConnected = accounts?.some(a => a.institution && a.institution !== 'Manual');
  const connectedBankCount = accounts?.filter(a => a.institution && a.institution !== 'Manual').length || 0;
  const storageUsed = '32 KB'; // Realistic mockup size
  const lastSyncTime = localStorage.getItem('finance_last_sheet_sync_time') || 'Never';
  const lastBackupTime = localStorage.getItem('finance_last_backup_time') || 'Never';

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic schema verification
        if (!json.accounts || !json.debts || !json.history) {
          throw new Error('Invalid schema: Missing accounts, debts or history lists');
        }
        onImportBackup(json);
        setImportSuccess(true);
        setImportError(null);
        localStorage.setItem('finance_last_backup_time', new Date().toLocaleString());
        setTimeout(() => setImportSuccess(false), 4000);
      } catch (err: any) {
        setImportError(err.message || 'Malformed JSON file structure');
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processBackupFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processBackupFile(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 pb-20 space-y-8 animate-fade-in" id="backup-sync-center-view">
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-display font-semibold text-slate-800 tracking-tight">Backup & Sync Center</h2>
        <p className="text-sm text-slate-500">Manage Google Cloud connections, Plaid integration links, and secure JSON system dumps</p>
      </div>

      {/* Primary Integration Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="sync-services-grid">
        {/* Google Drive / Sheet Connection status */}
        <div className="p-5 md:p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-3xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/50">
                <Cloud className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded-full border ${
                user ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
              }`}>
                {user ? 'Cloud Active' : 'Offline Sandbox'}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-sm text-slate-800">Google Drive Integration</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Pushes real-time checkpoints directly into your personal secure Google Sheets workspace to prevent local data loss.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Google Account</span>
                <span className="font-bold text-slate-700">{user?.email || 'Not Connected'}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Google Sheet Linked</span>
                <span className="font-bold text-slate-700 max-w-[160px] truncate">
                  {spreadsheetId ? `ID: ${spreadsheetId}` : 'None'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Last Sheets Sync</span>
                <span className="font-bold text-slate-700">{lastSyncTime}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-4">
            {spreadsheetId ? (
              <>
                <button
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing && 'animate-spin'}`} />
                  Sync Now
                </button>
                <button
                  onClick={onRecreateSheet}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Rebuild Sheet
                </button>
              </>
            ) : (
              <p className="text-[11px] text-amber-600 leading-normal bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/30 w-full text-center">
                Connect your Google Drive account in settings to activate real-time Sheets syncing.
              </p>
            )}
          </div>
        </div>

        {/* Plaid and Cloud Backup Status */}
        <div className="p-5 md:p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-3xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/50">
                <Database className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-mono font-bold uppercase py-0.5 px-2 rounded-full border ${
                isPlaidConnected ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                {isPlaidConnected ? 'Plaid Link Active' : 'Manual Ledger'}
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="font-display font-bold text-sm text-slate-800">Connection & Infrastructure</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Monitors secure Plaid bank credentials, cloud Firestore database status, and encrypted client-side package volume.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Plaid Link Status</span>
                <span className="font-bold text-slate-700">
                  {isPlaidConnected ? `${connectedBankCount} Bank(s) connected` : 'Sandbox Simulator'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Cloud Backup Status</span>
                <span className="font-bold text-slate-700">
                  {user ? 'Active Firestore Storage' : 'Local Storage Only'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Encrypted Storage Used</span>
                <span className="font-bold text-slate-700">{storageUsed}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            {user && (
              <button
                onClick={() => onLogout(false)}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 border border-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Disconnect Cloud Services
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Manual Backup and Restore Drag-and-Drop Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Drag and drop panel (takes 2 columns) */}
        <div className="md:col-span-2">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-full min-h-[220px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
              dragOver 
                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-md' 
                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-350 hover:bg-slate-50/30'
            }`}
            id="drag-drop-backup-zone"
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            
            <Upload className={`w-10 h-10 mb-3 text-slate-400 ${dragOver && 'animate-bounce text-indigo-500'}`} />
            
            <h4 className="font-display font-bold text-sm text-slate-700">Restore System State from JSON</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1 leading-normal">
              Drag & drop a valid <b>Personal Finance Backup JSON</b> here, or click to choose from your disk. Supporting all checked spaces, active liabilities, and transaction logs.
            </p>

            <AnimatePresence>
              {importSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 py-1.5 px-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  State Restored Successfully! +100 XP
                </motion.div>
              )}
              {importError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 py-1.5 px-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[11px] font-bold flex items-center gap-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  {importError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Actions panel */}
        <div className="p-5 md:p-6 bg-white border border-slate-200 rounded-3xl space-y-4 shadow-3xs flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-display font-bold text-sm text-slate-800">Export System Records</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Instantly compile your checking spaces, balances, monthly budgets, and audit history. Securely stored locally.
            </p>

            <div className="space-y-1.5 pt-2 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Backup Dumps Log</span>
                <span className="font-semibold text-slate-600">{lastBackupTime}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={onExportJson}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileJson className="w-4 h-4 text-indigo-400" />
              Download JSON State
            </button>

            <button
              onClick={onExportCsv}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200/50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export CSV Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
