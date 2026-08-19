import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Scan, 
  Users, 
  Smartphone, 
  Sliders, 
  User as UserIcon, 
  Cloud, 
  BarChart3, 
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { type User } from '../lib/firebase';
import { ThemeToggle } from './ThemeToggle';
import { AseQRLogo } from './AseQRLogo';

interface HeaderProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenScanner: () => void;
  onOpenVault: () => void;
  onOpenLockscreen: () => void;
  onOpenSettings: () => void;
  onOpenAnalytics?: () => void;
  onOpenQRStudio?: () => void;
  contactsCount: number;
  scansCount?: number;
  customQRsCount?: number;
}

export function Header({
  currentUser,
  onOpenAuth,
  onOpenScanner,
  onOpenVault,
  onOpenLockscreen,
  onOpenSettings,
  onOpenAnalytics,
  onOpenQRStudio,
  contactsCount,
  scansCount = 0,
  customQRsCount = 0,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu on Esc key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const totalToolBadges = contactsCount + scansCount + customQRsCount;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-850 px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 text-left">
          <div className="w-10 h-10 shadow-lg shadow-indigo-500/25 shrink-0 group flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
            <AseQRLogo className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tracking-tight leading-none">
                AseQR
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/25 tracking-wide">
                <Cloud className="w-2.5 h-2.5 mr-1 text-indigo-500 dark:text-indigo-400" />
                Cloud
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-medium text-neutral-500 dark:text-neutral-400 tracking-normal mt-0.5 hidden xs:block">
              All-in-One Digital Profile & QR Suite
            </p>
          </div>
        </div>

        {/* Clean Header Controls */}
        <div className="flex items-center gap-2">
          
          {/* Quick Light/Dark Theme Toggle Button */}
          <ThemeToggle />

          {/* Quick Scan Code Button */}
          <button
            id="header-scan-btn"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm active:scale-95"
            title="Scan someone's QR code or badge"
          >
            <Scan className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scan Code</span>
          </button>

          {/* User Account / Sign In Button */}
          <button
            id="header-auth-btn"
            onClick={onOpenAuth}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl border transition-all active:scale-95 ${
              currentUser
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:border-indigo-500/40 dark:text-indigo-200 dark:hover:bg-indigo-900/70'
                : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
            }`}
            title={currentUser ? `Account: ${currentUser.email}` : 'Sign In or Create Account'}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                className="w-4 h-4 rounded-full object-cover border border-indigo-400/50"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            <span className="max-w-[70px] sm:max-w-[100px] truncate text-[11px] font-semibold">
              {currentUser ? currentUser.displayName || currentUser.email?.split('@')[0] : 'Sign In'}
            </span>
          </button>

          {/* TOOLS & APPS MENU DROPDOWN */}
          <div className="relative" ref={menuRef}>
            <button
              id="header-menu-toggle-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition-all active:scale-95 ${
                isMenuOpen
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-950'
                  : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-800 dark:hover:border-neutral-700'
              }`}
              title="Menu & Features"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
              <span className="hidden sm:inline">Menu</span>
              {totalToolBadges > 0 && !isMenuOpen && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>

            {/* Dropdown Menu Popover */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white/98 dark:bg-neutral-900/98 backdrop-blur-xl border border-neutral-200 dark:border-neutral-750 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-neutral-800 dark:text-neutral-200 divide-y divide-neutral-200 dark:divide-neutral-800/80">
                
                {/* Section 1: Main Networking & Creation Apps */}
                <div className="p-1 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Tools & Features
                  </div>

                  {/* QR Studio */}
                  {onOpenQRStudio && (
                    <button
                      id="menu-qr-studio-btn"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenQRStudio();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/90 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-500/15 dark:border-indigo-500/30 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            QR Studio & Generator
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            Create links, texts, images & Wi-Fi QRs
                          </p>
                        </div>
                      </div>
                      {customQRsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                          {customQRsCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Scan Telemetry & Analytics */}
                  {onOpenAnalytics && (
                    <button
                      id="menu-analytics-btn"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAnalytics();
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/90 text-left transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                            Scan Telemetry & Insights
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                            Real-time scans, devices & clicks
                          </p>
                        </div>
                      </div>
                      {scansCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                          {scansCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Contacts Vault */}
                  <button
                    id="menu-vault-btn"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenVault();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/90 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 dark:bg-purple-500/15 dark:border-purple-500/30 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                          Saved Contacts Vault
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          Captured leads & attendee business cards
                        </p>
                      </div>
                    </div>
                    {contactsCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30">
                        {contactsCount}
                      </span>
                    )}
                  </button>

                  {/* Lockscreen Wallpaper */}
                  <button
                    id="menu-lockscreen-btn"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenLockscreen();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/90 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-600 dark:bg-sky-500/15 dark:border-sky-500/30 dark:text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors">
                          Lockscreen Wallpaper
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                          Create 9:16 mobile lockscreen QR image
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Section 2: Preferences & Account */}
                <div className="p-1 space-y-1">
                  {/* Settings */}
                  <button
                    id="menu-settings-btn"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/90 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 flex items-center justify-center group-hover:text-neutral-900 dark:group-hover:text-neutral-200 shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-neutral-900 dark:group-hover:text-neutral-200">
                        Settings & Preferences
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                        Theme, feedback & data options
                      </p>
                    </div>
                  </button>

                  {/* Account / Cloud Sync */}
                  <button
                    id="menu-account-btn"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/90 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 text-indigo-600 dark:bg-neutral-800 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        {currentUser ? 'Cloud Account Details' : 'Sign In / Register'}
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                        {currentUser ? currentUser.email : 'Sync across all your devices'}
                      </p>
                    </div>
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}

