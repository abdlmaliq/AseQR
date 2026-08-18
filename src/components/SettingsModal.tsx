import { useState, ChangeEvent } from 'react';
import { AppSettings, UserProfile, ScannedContact } from '../types';
import { 
  X, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  Sliders,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { downloadDataUrl } from '../utils/qrHelper';
import { DEFAULT_PROFILE, INITIAL_CONTACTS } from '../utils/storage';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  profile: UserProfile;
  contacts: ScannedContact[];
  onResetAllData: () => void;
  onImportData: (data: {
    profile?: UserProfile;
    contacts?: ScannedContact[];
  }) => void;
  onClose: () => void;
}

export function SettingsModal({
  settings,
  onUpdateSettings,
  profile,
  contacts,
  onResetAllData,
  onImportData,
  onClose,
}: SettingsModalProps) {
  const [importError, setImportError] = useState<string | null>(null);

  const handleExportJSON = () => {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      profile,
      contacts,
      settings,
    };
    const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    downloadDataUrl(jsonStr, `aseqr_backup_${Date.now()}.json`);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleImportFile = (e: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.profile || parsed.identity) {
          onImportData({
            profile: parsed.profile || parsed.identity,
            contacts: parsed.contacts,
          });
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
          onClose();
        } else {
          setImportError('Invalid backup file format.');
        }
      } catch (err) {
        setImportError('Failed to parse backup JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">App Settings & Backup</h2>
              <p className="text-xs text-neutral-400">Privacy, hardware wake-lock, and offline data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Presentation Hardware Settings */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Presentation & Hardware Controls
          </h3>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
              <div>
                <p className="text-xs font-bold text-white">Screen Wake-Lock</p>
                <p className="text-[11px] text-neutral-400">
                  Prevents screen from sleeping while presenting Master QR code to recruiters
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoWakeLock}
                onChange={(e) => onUpdateSettings({ ...settings, autoWakeLock: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-neutral-800 border-neutral-700 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 cursor-pointer hover:border-neutral-700 transition-colors">
              <div>
                <p className="text-xs font-bold text-white">Haptic Feedback & Confetti</p>
                <p className="text-[11px] text-neutral-400">
                  Vibrates and plays visual feedback on successful link copy or scan save
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => onUpdateSettings({ ...settings, hapticFeedback: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-neutral-800 border-neutral-700 focus:ring-indigo-500"
              />
            </label>
          </div>
        </div>

        {/* Backup & Restore */}
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Data Backup & Privacy
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left space-y-1 transition-all group"
            >
              <Download className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-white">Export Backup</p>
              <p className="text-[10px] text-neutral-400">Save profile & contacts as JSON</p>
            </button>

            <label className="p-3 rounded-2xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left space-y-1 transition-all cursor-pointer group">
              <Upload className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-white">Import Backup</p>
              <p className="text-[10px] text-neutral-400">Restore from JSON file</p>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>

          {importError && (
            <p className="text-xs text-rose-400 p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
              {importError}
            </p>
          )}
        </div>

        {/* Danger Zone: Reset */}
        <div className="pt-2 border-t border-neutral-800">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to reset your master profile and contacts to initial defaults?')) {
                onResetAllData();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Profile</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-neutral-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Client-Side • Your contact data stays completely on your device</span>
          </p>
        </div>
      </div>
    </div>
  );
}
