import { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { generateQRDataURL, generateQRSVG, downloadDataUrl } from '../utils/qrHelper';
import { getMasterProfileURL } from '../utils/shareHelper';
import { 
  Sparkles, 
  Maximize2, 
  Eye, 
  Share2, 
  Copy, 
  Check, 
  Download, 
  Edit3, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Globe, 
  FileText, 
  Linkedin, 
  Github, 
  Twitter, 
  Calendar, 
  Smartphone,
  ExternalLink,
  Layers,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MasterQRHeroProps {
  profile: UserProfile;
  onOpenFullscreen: () => void;
  onPreviewPublicLanding: () => void;
  onOpenLockscreen: () => void;
  onOpenEditProfile: () => void;
  onOpenAnalytics?: () => void;
  onOpenQRStudio?: () => void;
  scansCount?: number;
}

export function MasterQRHero({
  profile,
  onOpenFullscreen,
  onPreviewPublicLanding,
  onOpenLockscreen,
  onOpenEditProfile,
  onOpenAnalytics,
  onOpenQRStudio,
  scansCount = 0,
}: MasterQRHeroProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const masterUrl = getMasterProfileURL(profile);

  useEffect(() => {
    setIsGenerating(true);
    generateQRDataURL(masterUrl, {
      width: 480,
      margin: 3,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'L',
    }).then((url) => {
      setQrUrl(url);
      setIsGenerating(false);
    });
  }, [masterUrl]);

  const handleCopy = async () => {
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

  // Calculate total touchpoints encoded
  const totalTouchpoints = [
    profile.phone,
    profile.email,
    profile.portfolioUrl,
    profile.resumeUrl,
    profile.linkedinUrl,
    profile.githubUrl,
    profile.twitterUrl,
    profile.calendlyUrl,
    ...(profile.customLinks || []).map((l) => l.url),
    profile.pitch,
  ].filter(Boolean).length;

  return (
    <section className="space-y-6">
      {/* Master QR Hero Card */}
      <div className="relative rounded-3xl bg-neutral-900/90 border border-neutral-800 p-5 sm:p-7 shadow-2xl overflow-hidden">
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left Column: QR Code Container */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div 
              onClick={onOpenFullscreen}
              className="group relative cursor-pointer p-4 sm:p-5 rounded-3xl bg-white shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 transform hover:-translate-y-0.5 border-2 border-indigo-500/20 max-w-[280px] sm:max-w-[320px] w-full"
            >
              {/* QR Image */}
              <div className="aspect-square w-full flex items-center justify-center">
                {isGenerating ? (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400 font-mono">
                    <Sparkles className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
                    Generating QR...
                  </div>
                ) : qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Master QR Code"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-rose-500 font-mono">
                    Failed to generate QR
                  </div>
                )}
              </div>

              {/* Click to expand hover overlay */}
              <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity p-4 text-center">
                <Maximize2 className="w-8 h-8 text-indigo-300 mb-1 animate-pulse" />
                <span className="font-bold text-xs uppercase tracking-wider">Tap for Full-Screen Mode</span>
                <span className="text-[10px] text-neutral-300 mt-0.5">High Brightness & Wake-Lock</span>
              </div>

              {/* Footer in QR Card */}
              <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-neutral-900">
                <div className="text-left">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                    All-in-One Master QR
                  </span>
                  <span className="text-[9px] text-neutral-500 block">
                    1 Scan for Profile, Links & .vcf
                  </span>
                </div>
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 mt-2 text-center flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Tap QR code to present full-screen</span>
            </p>
          </div>

          {/* Right Column: Identity, Status & Primary Actions */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Single Master QR Active</span>
                </span>

                {profile.statusBadge && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {profile.statusBadge}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 p-0.5 shadow-md shrink-0 overflow-hidden flex items-center justify-center">
                    {profile.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-[14px] bg-neutral-950"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center text-sm sm:text-base font-extrabold text-indigo-300">
                        {profile.name ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'SN'}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {profile.name}
                  </h2>
                </div>
                <button
                  onClick={onOpenEditProfile}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-semibold transition-all active:scale-95 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <p className="text-sm font-medium text-indigo-200/90 leading-relaxed">
                {profile.headline}
              </p>

              <div className="flex items-center gap-2.5 text-xs text-neutral-400 flex-wrap pt-0.5">
                {profile.company && (
                  <span className="flex items-center gap-1 bg-neutral-950/70 px-2.5 py-1 rounded-lg border border-neutral-800">
                    🏢 {profile.company}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1 bg-neutral-950/70 px-2.5 py-1 rounded-lg border border-neutral-800">
                    📍 {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-neutral-950/70 px-2.5 py-1 rounded-lg border border-neutral-800 text-indigo-300 font-semibold">
                  ⚡ {totalTouchpoints} Touchpoints
                </span>

                {onOpenAnalytics && (
                  <button
                    id="hero-scan-insights-badge"
                    onClick={onOpenAnalytics}
                    className="flex items-center gap-1.5 bg-neutral-950/80 hover:bg-neutral-800 px-2.5 py-1 rounded-lg border border-indigo-500/30 text-indigo-300 hover:text-white font-semibold transition-colors active:scale-95 shadow-sm"
                    title="View QR Scan Telemetry and Real-time Analytics"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{scansCount} {scansCount === 1 ? 'Scan' : 'Scans'} Tracked</span>
                  </button>
                )}
              </div>

              {profile.bio && (
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed pt-1">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Fullscreen Presentation Button */}
              <button
                onClick={onOpenFullscreen}
                className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/40 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Present Fullscreen</span>
              </button>

              {/* Preview Landing Page Button */}
              <button
                onClick={onPreviewPublicLanding}
                className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs border border-neutral-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Test Landing Page</span>
              </button>

              {/* Copy URL Button */}
              <button
                onClick={handleCopy}
                className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs border border-neutral-700 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Web Link'}</span>
              </button>
            </div>

            {/* Secondary Utilities: Lockscreen, QR Studio & Download */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-neutral-800/80 text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={onOpenLockscreen}
                  className="flex items-center gap-1 text-neutral-400 hover:text-indigo-300 transition-colors py-1"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Lockscreen Wallpaper</span>
                </button>

                {onOpenQRStudio && (
                  <button
                    onClick={onOpenQRStudio}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold transition-colors py-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Create Custom QR</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleDownloadPNG}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-neutral-700"
                  title="Download High-Res PNG"
                >
                  <Download className="w-3 h-3" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={handleDownloadSVG}
                  className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 border border-neutral-700"
                  title="Download Vector SVG"
                >
                  <Download className="w-3 h-3" />
                  <span>SVG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Touchpoints & Landing Page Content Summary */}
      <div className="rounded-3xl bg-neutral-900/90 border border-neutral-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              What Scanners See on Your Landing Page
            </h3>
          </div>
          <button
            onClick={onOpenEditProfile}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Information</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* Contact vCard */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">1-Tap Address Book (.vcf)</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {profile.phone || profile.email ? `${profile.phone} · ${profile.email}` : 'Not configured'}
                </p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          </div>

          {/* Portfolio */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">Portfolio Website</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {profile.portfolioUrl || 'None set'}
                </p>
              </div>
            </div>
            {profile.portfolioUrl && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </div>

          {/* Resume */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">Resume & CV (PDF)</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {profile.resumeUrl ? 'Active PDF link' : 'None set'}
                </p>
              </div>
            </div>
            {profile.resumeUrl && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </div>

          {/* LinkedIn */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Linkedin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">LinkedIn Profile</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {profile.linkedinUrl || 'None set'}
                </p>
              </div>
            </div>
            {profile.linkedinUrl && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </div>

          {/* GitHub */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-neutral-700/50 text-neutral-200 flex items-center justify-center shrink-0">
                <Github className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">GitHub Repositories</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {profile.githubUrl || 'None set'}
                </p>
              </div>
            </div>
            {profile.githubUrl && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </div>

          {/* Elevator Pitch */}
          <div className="p-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-white truncate">Elevator Pitch Story</p>
                <p className="text-[11px] text-neutral-400 truncate">
                  {profile.pitch ? `${profile.pitch.slice(0, 30)}...` : 'None set'}
                </p>
              </div>
            </div>
            {profile.pitch && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
          </div>
        </div>
      </div>
    </section>
  );
}
