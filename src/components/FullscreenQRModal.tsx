import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateQRDataURL, generateQRSVG, downloadDataUrl } from '../utils/qrHelper';
import { getMasterProfileURL } from '../utils/shareHelper';
import { 
  X, 
  Sun, 
  Maximize2, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FullscreenQRModalProps {
  profile: UserProfile;
  onClose: () => void;
  onPreviewLanding: () => void;
}

export function FullscreenQRModal({ profile, onClose, onPreviewLanding }: FullscreenQRModalProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isWhiteMode, setIsWhiteMode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  const masterUrl = getMasterProfileURL(profile);

  useEffect(() => {
    // Generate high resolution QR code
    generateQRDataURL(masterUrl, {
      width: 600,
      margin: 3,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'L',
    }).then(setQrUrl);

    // Request screen wake-lock so screen doesn't sleep while presenting to recruiters
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock
        ?.request('screen')
        .then((lock: any) => {
          wakeLock = lock;
          setWakeLockActive(true);
        })
        .catch(() => {
          // Wake lock not allowed or unavailable
        });
    }

    return () => {
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, [masterUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(masterUrl);
      setCopied(true);
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleDownloadPNG = () => {
    if (!qrUrl) return;
    downloadDataUrl(qrUrl, `${profile.name.replace(/\s+/g, '_')}_master_qr.png`);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
  };

  const handleDownloadSVG = async () => {
    const svgStr = await generateQRSVG(masterUrl, {
      width: 800,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'L',
    });
    if (!svgStr) return;
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `${profile.name.replace(/\s+/g, '_')}_master_qr.svg`);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between transition-colors duration-300 ${
        isWhiteMode ? 'bg-white text-neutral-900' : 'bg-neutral-950 text-white'
      }`}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800/40">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Master QR Presentation Mode</span>
          </span>
          {wakeLockActive && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
              <Sun className="w-3 h-3" /> Screen Wake Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Max Contrast White Background Toggle */}
          <button
            onClick={() => setIsWhiteMode(!isWhiteMode)}
            className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isWhiteMode
                ? 'bg-neutral-900 text-white border-neutral-700'
                : 'bg-neutral-900 text-neutral-200 border-neutral-800 hover:bg-neutral-800'
            }`}
            title="Toggle Max Contrast Background"
          >
            <Sun className="w-4 h-4" />
            <span className="hidden sm:inline">{isWhiteMode ? 'Dark Theme' : 'Max Brightness'}</span>
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Centered Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center">
        <div className="max-w-md w-full flex flex-col items-center">
          {/* Header Info */}
          <div className="mb-5">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isWhiteMode ? 'text-black' : 'text-white'}`}>
              {profile.name}
            </h1>
            <p className={`text-xs sm:text-sm font-semibold mt-1 ${isWhiteMode ? 'text-neutral-700' : 'text-indigo-300'}`}>
              {profile.headline}
            </p>
            {profile.statusBadge && (
              <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {profile.statusBadge}
              </span>
            )}
          </div>

          {/* High-Resolution QR Card with clean border and optical padding */}
          <div className="relative p-5 sm:p-7 rounded-3xl bg-white shadow-2xl border-4 border-indigo-500/30 max-w-[340px] sm:max-w-[400px] w-full">
            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Master QR Code"
                className="w-full aspect-square object-contain mx-auto"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-xs text-neutral-400 font-mono">
                Generating Master QR...
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-neutral-900">
              <div className="text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-700">1-Scan All-In-One</p>
                <p className="text-[10px] text-neutral-500">Profile, Portfolio, Links & .vcf Contact</p>
              </div>
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          {/* Subtitle instructions */}
          <p className={`text-xs mt-5 ${isWhiteMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Point standard phone camera • Works on iOS & Android without installing an app
          </p>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-4 sm:p-6 border-t border-neutral-800/40 bg-neutral-900/60 backdrop-blur-md">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={onPreviewLanding}
            className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Test Landing Page</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'URL Copied!' : 'Copy Web Link'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPNG}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1 border border-neutral-700"
              title="Download High-Res PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>

            <button
              onClick={handleDownloadSVG}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1 border border-neutral-700"
              title="Download Vector SVG for Print"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SVG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
