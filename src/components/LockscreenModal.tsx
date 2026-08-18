import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateLockscreenWallpaper, downloadDataUrl } from '../utils/qrHelper';
import { X, Download, Smartphone, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LockscreenModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export function LockscreenModal({ profile, onClose }: LockscreenModalProps) {
  const [wallpaperUrl, setWallpaperUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setIsGenerating(true);
    generateLockscreenWallpaper(profile).then((url) => {
      setWallpaperUrl(url);
      setIsGenerating(false);
    });
  }, [profile]);

  const handleDownload = () => {
    if (!wallpaperUrl) return;
    downloadDataUrl(wallpaperUrl, `${profile.name.replace(/\s+/g, '_')}_lockscreen_qr.png`);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Lockscreen QR Wallpaper</h2>
              <p className="text-xs text-neutral-400">Scan straight from your lock screen without unlocking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallpaper Phone Preview Container */}
        <div className="relative mx-auto w-48 sm:w-56 aspect-[9/16] rounded-3xl bg-neutral-950 border-4 border-neutral-700 shadow-2xl overflow-hidden flex items-center justify-center">
          {isGenerating ? (
            <div className="text-center p-4 space-y-2">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Rendering wallpaper...</p>
            </div>
          ) : wallpaperUrl ? (
            <img
              src={wallpaperUrl}
              alt="Lockscreen Wallpaper Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-xs text-neutral-500">Failed to render preview</div>
          )}
        </div>

        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-neutral-300">
            Encodes your Master Profile & 1-Tap Address Book Contact
          </p>
          <p className="text-[11px] text-neutral-500">
            Set as your iPhone or Android lockscreen photo when at job fairs, conferences, or mixers.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={!wallpaperUrl || isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-950/40 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Wallpaper (1080x1920)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
