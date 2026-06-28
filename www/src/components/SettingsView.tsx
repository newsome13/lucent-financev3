import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  Settings, HelpCircle, AlertCircle, RefreshCw, LogOut, CheckCircle2, 
  FileSpreadsheet, Trash2, Sparkles, Download, FileText, RotateCcw,
  ShieldAlert, Database, Globe, UserCheck
} from 'lucide-react';
import UserAvatar, { getDeterministicAvatarConfig, AvatarConfig } from './UserAvatar';

interface SettingsViewProps {
  user: User | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  onLogout: (clearLocal: boolean) => void;
  onResetToDemo: () => void;
  onRecreateSheet: () => void;
  isSyncing: boolean;
  isDemoActive: boolean;
  onTriggerDemo: () => void;
  onTriggerFresh: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onResetOnboarding: () => void;
  showActualName: boolean;
  onToggleActualName: (show: boolean) => void;
  onDeleteAllCloudData?: () => Promise<void>;
}

export default function SettingsView({
  user,
  spreadsheetId,
  spreadsheetUrl,
  onLogout,
  onResetToDemo,
  onRecreateSheet,
  isSyncing,
  isDemoActive,
  onTriggerDemo,
  onTriggerFresh,
  onExportJson,
  onExportCsv,
  onResetOnboarding,
  showActualName,
  onToggleActualName,
  onDeleteAllCloudData
}: SettingsViewProps) {
  const [showSignOutChoice, setShowSignOutChoice] = useState(false);
  const [showDeleteCloudConfirm, setShowDeleteCloudConfirm] = useState(false);
  const [deletingCloud, setDeletingCloud] = useState(false);

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    const cached = localStorage.getItem('finance_avatar_config');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return getDeterministicAvatarConfig(user?.displayName || 'Chief Commander');
  });

  useEffect(() => {
    const handleUpdate = () => {
      const cached = localStorage.getItem('finance_avatar_config');
      if (cached) {
        try {
          setAvatarConfig(JSON.parse(cached));
        } catch {}
      }
    };
    window.addEventListener('finance_avatar_changed', handleUpdate);
    return () => window.removeEventListener('finance_avatar_changed', handleUpdate);
  }, []);

  const localCommunityOptIn = localStorage.getItem('finance_community_opt_in') === 'true';
  const localCommunityUsername = localStorage.getItem('finance_community_username') || 'Private Alias';
  return (
    <div className="max-w-3xl mx-auto px-4 pb-12 space-y-6 animate-fade-in" id="settings-tab-content">
      <div className="glass-panel rounded-3xl p-6 space-y-6">
        <div>
          <h2 className="text-xl font-display font-extrabold text-slate-800">Ledger & Synchronization Settings</h2>
          <p className="text-xs text-slate-500">Configure parameters for your Personal Finance Command Center</p>
        </div>

        {/* Sync Mode / Google Account Profile */}
        <div className="p-5 rounded-2xl border border-slate-150 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Account & Synchronization Status</h3>
            {user && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center gap-1">
                <Database className="w-3 h-3" /> Cloud Linked
              </span>
            )}
          </div>
          {user ? (
            <div className="space-y-4">
              {/* Profile card row */}
              <div className="flex items-center gap-3 p-3 bg-white border border-slate-200/50 rounded-xl shadow-3xs">
                <div className="shrink-0">
                  <UserAvatar configOrUrl={avatarConfig} size="md" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800">{showActualName && user.displayName ? user.displayName : 'Chief Commander'}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                </div>
              </div>

              {/* Status Indicator grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Google Sheet Sync */}
                <div className="p-3.5 bg-white border border-slate-200/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Google Sheets Sync
                  </div>
                  {spreadsheetId ? (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 inline-block">
                        Active connection
                      </div>
                      <a
                        href={spreadsheetUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-slate-600 hover:text-indigo-600 block underline"
                      >
                        View Drive Spreadsheet
                      </a>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      No sheet connected. Set up connection inside onboarding or settings.
                    </p>
                  )}
                </div>

                {/* Firestore Cloud backup */}
                <div className="p-3.5 bg-white border border-slate-200/50 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Database className="w-4 h-4 text-indigo-500" />
                    Firestore Cloud Backup
                  </div>
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5 inline-block flex items-center gap-1 max-w-max">
                      <CheckCircle2 className="w-3 h-3 text-indigo-500" /> Online & fully synced
                    </div>
                    <p className="text-[9px] text-slate-400">All ledger mutations are automatically baked-up to your safe private database container.</p>
                  </div>
                </div>

                {/* Community profile opt-in status */}
                <div className="p-3.5 bg-white border border-slate-200/50 rounded-xl space-y-2 md:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Globe className="w-4 h-4 text-purple-500" />
                    Accountability Community Status
                  </div>
                  {localCommunityOptIn ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded px-2 py-0.5 inline-block">
                          Community Profile: Opted-In
                        </div>
                        <p className="text-[10px] text-slate-450">Public Alias: <strong className="font-mono text-purple-900">@{localCommunityUsername}</strong></p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                        <UserCheck className="w-3.5 h-3.5" /> Visible
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-[10px] font-bold text-slate-500 bg-slate-150 border border-slate-200 rounded px-2 py-0.5 inline-block">
                          Private Mode (Opted-Out)
                        </div>
                        <p className="text-[9px] text-slate-400">Your profile, streaks, and challenges do not appear in leaderboards or social feeds.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 leading-relaxed p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>No active Google Sign-In found. We are using a client-side localized localstorage sandbox to write transaction nodes. All data remains inside your browser.</span>
            </div>
          )}
        </div>

        {/* Privacy & Personalization */}
        <div className="p-4 rounded-2xl border border-slate-150 bg-slate-50/50 space-y-3" id="privacy-personalization-section">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Privacy & Personalization</h3>
          <div className="flex items-center justify-between gap-4 p-3 bg-white/70 border border-slate-200/50 rounded-xl">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Use Actual Profile Name</h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Toggle whether to display your actual name (e.g., from Google Profile) or keep it hidden with the default friendly greeting <strong>“Chief”</strong>.
              </p>
            </div>
            <button
              onClick={() => onToggleActualName(!showActualName)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${showActualName ? 'bg-indigo-600' : 'bg-slate-200'}`}
              id="toggle-actual-name-btn"
              role="switch"
              aria-checked={showActualName}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${showActualName ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* New App Data Control Section */}
        <div className="p-5 rounded-2xl border border-blue-100 bg-blue-500/5 space-y-4" id="app-data-settings-section">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            <h3 className="text-xs font-mono font-black text-blue-700 uppercase tracking-wider">App Data Cockpit</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gain full command of your ledger data cache. Instantly swap between realistic demo states, empty slates, or safe backup exports.
          </p>

          <div className="grid grid-cols-1 gap-4 pt-2">
            {/* Explore Demo option */}
            <div className="p-4 rounded-xl border border-blue-150 bg-white/80 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Explore Demo Mode
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Instantly load a fully populated demonstration version of the app. This includes realistic checking zones, active savings challenges, bills, activity logs, and beautiful reports so you can explore every feature risk-free.
                  </p>
                </div>
                <button
                  onClick={onTriggerDemo}
                  className="py-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-xs shrink-0 transition-colors cursor-pointer"
                  id="settings-trigger-demo-btn"
                >
                  {isDemoActive ? 'Reload Demo' : 'Load Demo'}
                </button>
              </div>
            </div>

            {/* Start Fresh option */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white/80 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-850 flex items-center gap-1.5">
                    <Trash2 className="w-3.5 h-3.5 text-slate-500" /> Start Fresh Slate
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Performs a complete reset of the application, unlinking Google Sheets or Plaid, and clearing out all Money Spaces, history lines, debt priority structures, and notifications to restore a brand-new installation.
                  </p>
                </div>
                <button
                  onClick={onTriggerFresh}
                  className="py-1.5 px-3.5 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-xs font-bold shadow-xs shrink-0 transition-colors cursor-pointer"
                  id="settings-trigger-fresh-btn"
                >
                  Start Fresh
                </button>
              </div>
            </div>

            {/* Export & Backup block */}
            <div className="p-4 rounded-xl border border-slate-150 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export My Ledger (Backup)
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Download a local snapshot of your current balance sheet configurations, spending history, and goals. Gives you peace of mind before resetting or performing major restructurings.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={onExportJson}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-3xs"
                  id="settings-export-json-btn"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" /> Export JSON Backup
                </button>
                <button
                  onClick={onExportCsv}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-colors cursor-pointer shadow-3xs"
                  id="settings-export-csv-btn"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-600" /> Export CSV (Activity)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Administration Actions */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">System Administrations</h3>
          <div className="divide-y divide-slate-100">
            {user && spreadsheetId && (
              <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Rebuild Drive Spreadsheet</h4>
                  <p className="text-xs text-slate-500">Overwrites and formats a fresh copy of your finance sheet in Drive</p>
                </div>
                <button
                  onClick={onRecreateSheet}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-semibold shadow-md transition-colors"
                  id="settings-recreate-sheet-btn"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Overwrite Drive Copy
                </button>
              </div>
            )}

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Show Launch Screen Onboarding</h4>
                <p className="text-xs text-slate-500">Re-trigger the startup onboarding screen to pick how you want to proceed</p>
              </div>
              <button
                onClick={onResetOnboarding}
                className="flex items-center justify-center gap-1.5 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-semibold shadow-md transition-colors cursor-pointer"
                id="settings-reset-onboarding-btn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Trigger Onboarding
              </button>
            </div>

            {user && (
              <>
                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Sign Out of Google Account</h4>
                    <p className="text-xs text-slate-500">Disconnect from Google Sheets & cloud synchronization</p>
                  </div>
                  <button
                    onClick={() => setShowSignOutChoice(true)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-full text-xs font-semibold shadow-md transition-colors cursor-pointer"
                    id="settings-logout-btn"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Disconnect Account
                  </button>
                </div>

                <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-red-600 flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-red-500" /> Purge Account Cloud Data
                    </h4>
                    <p className="text-xs text-slate-500">Irreversibly wipe all ledger configurations and profile entries from our Firestore servers</p>
                  </div>
                  <button
                    onClick={() => setShowDeleteCloudConfirm(true)}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-650 rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    id="settings-delete-all-cloud-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Erase Server Data
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Motivational Notes */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-purple-100 text-xs text-purple-900 leading-normal space-y-1.5">
          <div className="font-extrabold font-display">Command Center Wisdoms</div>
          <ul className="list-disc list-inside space-y-1 text-[11px] font-sans text-purple-950">
            <li>“You’re building breathing room.”</li>
            <li>“Next win is closer than it feels.”</li>
            <li>“Small payments still move the needle.”</li>
            <li>“This frees up future money.”</li>
            <li>“One less bill, one more step forward.”</li>
          </ul>
        </div>
      </div>

      {/* Sign Out Data Choice Modal Overlay */}
      {showSignOutChoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-slate-700" />
              </div>
              <h3 className="text-lg font-display font-extrabold text-slate-900">Sign Out of Command Center?</h3>
              <p className="text-xs text-slate-550 leading-relaxed">
                Choose what should happen to this device's active budget ledger and accounts cache when you disconnect:
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Keep */}
              <button
                onClick={() => {
                  setShowSignOutChoice(false);
                  onLogout(false);
                }}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-slate-350 bg-slate-50/30 hover:bg-slate-50 transition-all cursor-pointer space-y-1"
              >
                <div className="text-xs font-bold text-slate-800">Keep on this device (Recommended)</div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Leaves your transaction ledger cached locally as an offline sandbox. You can keep editing or sign back in to sync later.
                </p>
              </button>

              {/* Option 2: Remove */}
              <button
                onClick={() => {
                  setShowSignOutChoice(false);
                  onLogout(true);
                }}
                className="w-full text-left p-4 rounded-2xl border border-red-200 hover:border-red-300 bg-red-50/5 hover:bg-red-50/30 transition-all cursor-pointer space-y-1"
              >
                <div className="text-xs font-bold text-red-700 flex items-center gap-1">Remove from this device</div>
                <p className="text-[10px] text-red-550 leading-normal">
                  Wipes all active accounts, budget logs, and histories from this browser's cookies and localstorage. Cloud backups remain safe.
                </p>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutChoice(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Purge Confirm Modal Overlay */}
      {showDeleteCloudConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-red-650" />
              </div>
              <h3 className="text-lg font-display font-extrabold text-slate-900">Purge Server Database?</h3>
              <p className="text-xs text-red-700 bg-red-50 p-3 rounded-xl leading-normal font-medium">
                WARNING: This is completely irreversible. This action instantly deletes all accounts, goals, custom spaces, budget allocations, and accountability posts from our Google Firestore servers.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteCloudConfirm(false)}
                disabled={deletingCloud}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Nevermind, cancel
              </button>
              <button
                onClick={async () => {
                  if (onDeleteAllCloudData) {
                    try {
                      setDeletingCloud(true);
                      await onDeleteAllCloudData();
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setDeletingCloud(false);
                      setShowDeleteCloudConfirm(false);
                    }
                  } else {
                    setShowDeleteCloudConfirm(false);
                  }
                }}
                disabled={deletingCloud}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {deletingCloud ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Purging...
                  </>
                ) : (
                  'Yes, Erase Server Data'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
