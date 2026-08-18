import React, { useState, useEffect } from 'react';
import { UserProfile, ScannedContact } from '../types';
import { generateVCardString } from '../utils/vcard';
import { generateQRDataURL, downloadDataUrl } from '../utils/qrHelper';
import { getMasterProfileURL } from '../utils/shareHelper';
import { saveCloudContact, fetchCloudProfile } from '../lib/firebase';
import { loadContacts, saveContacts } from '../utils/storage';
import { trackProfileScan, trackEngagementAction } from '../utils/analyticsTracker';
import { 
  UserCheck, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  ExternalLink, 
  Building2, 
  MapPin, 
  Globe, 
  FileText, 
  Github, 
  Linkedin, 
  Calendar, 
  Mail, 
  Phone, 
  Twitter, 
  Sparkles, 
  QrCode, 
  X, 
  Send,
  ArrowRight,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ThemeToggle } from './ThemeToggle';

interface PublicProfileViewProps {
  profile: UserProfile;
  onOpenAppEditor: () => void;
  onContactAdded?: (contact: ScannedContact) => void;
}

export function PublicProfileView({ profile: initialProfile, onOpenAppEditor, onContactAdded }: PublicProfileViewProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(() => {
    // If initialProfile only has userId and stub name, mark as loading
    return Boolean(initialProfile.userId && (!initialProfile.email && !initialProfile.phone && initialProfile.name === 'Loading Profile...'));
  });
  const [copied, setCopied] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  
  // Contact Exchange Form State
  const [exchangeSent, setExchangeSent] = useState(false);
  const [exchangeName, setExchangeName] = useState('');
  const [exchangeEmail, setExchangeEmail] = useState('');
  const [exchangePhone, setExchangePhone] = useState('');
  const [exchangeRole, setExchangeRole] = useState('');
  const [exchangeCompany, setExchangeCompany] = useState('');
  const [exchangeNote, setExchangeNote] = useState('');
  const [isSubmittingExchange, setIsSubmittingExchange] = useState(false);
  const [lastExchangedContact, setLastExchangedContact] = useState<ScannedContact | null>(null);

  // Sync state if initialProfile prop changes
  useEffect(() => {
    setProfile(initialProfile);
    if (initialProfile.userId) {
      if (!initialProfile.phone && !initialProfile.email && initialProfile.name === 'Loading Profile...') {
        setIsCloudLoading(true);
      }
      fetchCloudProfile(initialProfile.userId)
        .then((cloudData) => {
          if (cloudData) {
            setProfile((prev) => ({
              ...prev,
              ...cloudData,
              avatarUrl: cloudData.avatarUrl || prev.avatarUrl,
            }));
          }
        })
        .catch(() => {
          // Offline or profile not yet in cloud, fallback gracefully to initialProfile
        })
        .finally(() => {
          setIsCloudLoading(false);
        });
    }
  }, [initialProfile]);

  useEffect(() => {
    // Automatically track QR scan for analytics in the background (non-blocking)
    if (profile.userId) {
      const timer = setTimeout(() => {
        trackProfileScan(profile.userId);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [profile.userId]);

  // Ensure the shared URL and QR code directly point to the landing page
  const landingUrl = getMasterProfileURL(profile);

  // Lazy-generate modal QR only when requested
  useEffect(() => {
    if (showQRModal) {
      generateQRDataURL(landingUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#0a0a0a', light: '#ffffff' },
        errorCorrectionLevel: 'L',
      }).then(setQrUrl);
    }
  }, [showQRModal, landingUrl]);

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'SN'
    );
  };

  const handleSaveContactVCF = () => {
    trackEngagementAction(profile.userId, 'downloaded_vcard');
    const nameParts = (profile.name || 'Contact').split(' ');
    const vcardStr = generateVCardString({
      firstName: nameParts[0] || profile.name,
      lastName: nameParts.slice(1).join(' ') || '',
      organization: profile.company,
      jobTitle: profile.headline,
      phone: profile.phone,
      email: profile.email,
      url: profile.portfolioUrl || profile.linkedinUrl,
      location: profile.location,
      note: profile.bio || profile.pitch,
    });

    const blob = new Blob([vcardStr], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, `${(profile.name || 'contact').replace(/\s+/g, '_')}_contact.vcf`);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
  };

  const handleCopyLink = async () => {
    trackEngagementAction(profile.userId, 'copied_link');
    try {
      await navigator.clipboard.writeText(landingUrl);
      setCopied(true);
      confetti({ particleCount: 25, spread: 40, origin: { y: 0.8 } });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleShare = async () => {
    trackEngagementAction(profile.userId, 'shared_profile');
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} — Professional Digital Card`,
          text: `${profile.name} (${profile.headline})`,
          url: landingUrl,
        });
      } catch {
        // ignore
      }
    } else {
      handleCopyLink();
    }
  };

  const handleExchangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exchangeName.trim()) return;

    setIsSubmittingExchange(true);
    trackEngagementAction(profile.userId, 'exchanged_contact');

    const contactId = `exchange_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const vcardStr = generateVCardString({
      firstName: exchangeName.trim().split(' ')[0] || exchangeName.trim(),
      lastName: exchangeName.trim().split(' ').slice(1).join(' ') || '',
      organization: exchangeCompany.trim() || undefined,
      jobTitle: exchangeRole.trim() || undefined,
      phone: exchangePhone.trim() || undefined,
      email: exchangeEmail.trim() || undefined,
      note: exchangeNote.trim() || undefined,
    });

    const newContact: ScannedContact = {
      id: contactId,
      rawText: vcardStr,
      type: 'vcard',
      parsedTitle: exchangeName.trim(),
      parsedSubtitle: [exchangeRole.trim(), exchangeCompany.trim()].filter(Boolean).join(' · ') || undefined,
      vCardData: {
        firstName: exchangeName.trim().split(' ')[0] || exchangeName.trim(),
        lastName: exchangeName.trim().split(' ').slice(1).join(' ') || '',
        organization: exchangeCompany.trim() || undefined,
        jobTitle: exchangeRole.trim() || undefined,
        phone: exchangePhone.trim() || undefined,
        email: exchangeEmail.trim() || undefined,
        note: exchangeNote.trim() || undefined,
      },
      eventTag: 'QR Contact Exchange',
      notes: exchangeNote.trim() || `Met via ${profile.name}'s digital QR profile`,
      scannedAt: new Date().toISOString(),
      starred: true,
    };

    // 1. If profile has a cloud userId, save to Firestore
    if (profile.userId) {
      try {
        await saveCloudContact(profile.userId, newContact);
      } catch (err) {
        console.error('Error saving exchanged contact to Firestore:', err);
      }
    }

    // 2. Also save to local storage & broadcast event so host/current session receives it
    const currentContacts = loadContacts();
    const updatedContacts = [newContact, ...currentContacts.filter((c) => c.id !== newContact.id)];
    saveContacts(updatedContacts);

    window.dispatchEvent(new CustomEvent('smart_networking_new_contact', { detail: newContact }));
    onContactAdded?.(newContact);

    setLastExchangedContact(newContact);
    setExchangeSent(true);
    setIsSubmittingExchange(false);
    confetti({ particleCount: 45, spread: 65, origin: { y: 0.7 } });
  };

  // Compile list of active links
  const linksList: Array<{
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    url: string;
    icon: React.ReactNode;
    badgeText?: string;
  }> = [];

  if (profile.portfolioUrl) {
    linksList.push({
      id: 'portfolio',
      type: 'portfolio',
      title: 'Interactive Portfolio',
      subtitle: 'Live projects, case studies & design work',
      url: profile.portfolioUrl,
      icon: <Globe className="w-5 h-5 text-violet-400" />,
      badgeText: 'Web',
    });
  }

  if (profile.resumeUrl) {
    linksList.push({
      id: 'resume',
      type: 'resume',
      title: 'Resume & CV (PDF)',
      subtitle: 'Career background & skill highlights',
      url: profile.resumeUrl,
      icon: <FileText className="w-5 h-5 text-amber-400" />,
      badgeText: 'PDF',
    });
  }

  if (profile.linkedinUrl) {
    linksList.push({
      id: 'linkedin',
      type: 'linkedin',
      title: 'LinkedIn Profile',
      subtitle: 'Connect on LinkedIn with 1 tap',
      url: profile.linkedinUrl,
      icon: <Linkedin className="w-5 h-5 text-sky-400" />,
      badgeText: 'Connect',
    });
  }

  if (profile.githubUrl) {
    linksList.push({
      id: 'github',
      type: 'github',
      title: 'GitHub Repositories',
      subtitle: 'Open source code, tools & architectures',
      url: profile.githubUrl,
      icon: <Github className="w-5 h-5 text-neutral-300" />,
      badgeText: 'Code',
    });
  }

  if (profile.calendlyUrl) {
    linksList.push({
      id: 'calendly',
      type: 'calendly',
      title: 'Schedule a Call (Calendly)',
      subtitle: 'Book 30-min meeting or coffee chat',
      url: profile.calendlyUrl,
      icon: <Calendar className="w-5 h-5 text-blue-400" />,
      badgeText: 'Calendar',
    });
  }

  if (profile.twitterUrl) {
    linksList.push({
      id: 'twitter',
      type: 'twitter',
      title: 'X / Twitter Profile',
      subtitle: 'Follow tech discussions & updates',
      url: profile.twitterUrl,
      icon: <Twitter className="w-5 h-5 text-sky-300" />,
      badgeText: 'Social',
    });
  }

  if (profile.customLinks && profile.customLinks.length > 0) {
    profile.customLinks.forEach((cLink) => {
      linksList.push({
        id: cLink.id,
        type: 'custom',
        title: cLink.title,
        subtitle: cLink.subtitle || 'Custom Link',
        url: cLink.url,
        icon: <Globe className="w-5 h-5 text-indigo-400" />,
        badgeText: cLink.badgeText || 'Link',
      });
    });
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-20 transition-colors">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-white">
              AseQR Card
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Switcher Toggle */}
            <ThemeToggle />

            <button
              id="public-share-qr-btn"
              onClick={() => setShowQRModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold transition-all shadow-xs"
              title="Show QR Code"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">QR Code</span>
            </button>

            <button
              id="public-share-link-btn"
              onClick={handleShare}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Profile Canvas */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 space-y-5">
        {/* Profile Hero Card */}
        <div className="relative rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 p-6 shadow-xl dark:shadow-2xl overflow-hidden transition-colors">
          {/* Decorative Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="relative flex flex-col items-center text-center">
            {/* Avatar Photo or Initials with Gradient Ring */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-xl mb-4 shrink-0 overflow-hidden">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-[20px] bg-neutral-100 dark:bg-neutral-950"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.className = 'w-full h-full bg-neutral-900 rounded-[20px] flex items-center justify-center text-3xl font-extrabold text-white tracking-wider';
                      fallbackDiv.innerText = getInitials(profile.name);
                      parent.appendChild(fallbackDiv);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 rounded-[20px] flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-white tracking-wider">
                  {getInitials(profile.name)}
                </div>
              )}
            </div>

            {/* Name & Verified Badge */}
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                {profile.name}
              </h1>
              <span title="Verified Digital Card">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </span>
            </div>

            {/* Headline */}
            <p className="text-sm sm:text-base font-medium text-indigo-600 dark:text-indigo-300 mt-1 max-w-md">
              {profile.headline}
            </p>

            {/* Status Badge */}
            {profile.statusBadge && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                  {profile.statusBadge}
                </span>
              </div>
            )}

            {/* Company & Location Badges */}
            <div className="flex items-center justify-center gap-3 mt-3.5 text-xs text-neutral-600 dark:text-neutral-400 flex-wrap">
              {profile.company && (
                <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700/60 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  {profile.company}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-700/60 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                  {profile.location}
                </span>
              )}
            </div>

            {/* Direct Quick Contact Buttons (Phone / Email) */}
            {(profile.phone || profile.email) && (
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 transition-colors shadow-2xs"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{profile.phone}</span>
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 transition-colors shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    <span>{profile.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Bio Paragraph */}
            {profile.bio && (
              <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 mt-4 leading-relaxed max-w-md bg-neutral-50 dark:bg-neutral-950/60 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800/80 text-left">
                {profile.bio}
              </p>
            )}

            {/* Primary High-Priority CTA: Save Contact to Phone */}
            <div className="w-full mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800/80">
              <button
                id="public-save-contact-btn"
                onClick={handleSaveContactVCF}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 dark:shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <UserCheck className="w-5 h-5" />
                <span>Save Contact to Address Book (.vcf)</span>
              </button>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1.5 text-center">
                1-tap export • Adds full name, phone, email, and company directly to your contacts
              </p>
            </div>
          </div>
        </div>

        {/* Links & Portfolios Section */}
        {linksList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Links & Portfolios ({linksList.length})
              </h2>
              <span className="text-[11px] text-neutral-400">Tap to open</span>
            </div>

            <div className="space-y-2.5">
              {linksList.map((link) => {
                let href = link.url;
                if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                  href = `https://${href}`;
                }

                return (
                  <a
                    key={link.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEngagementAction(profile.userId, `clicked_${link.type}`)}
                    className="group block p-3.5 rounded-2xl bg-white dark:bg-neutral-900/90 hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800/90 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-sm active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {link.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                              {link.title}
                            </h3>
                            {link.badgeText && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                                {link.badgeText}
                              </span>
                            )}
                          </div>
                          {link.subtitle && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                              {link.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-500 group-hover:text-neutral-900 group-hover:bg-neutral-200 dark:bg-neutral-800/80 dark:text-neutral-400 dark:group-hover:text-white dark:group-hover:bg-neutral-700 flex items-center justify-center shrink-0 transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Elevator Pitch Card */}
        {profile.pitch && (
          <div className="p-5 rounded-2xl bg-white dark:bg-gradient-to-br dark:from-indigo-950/40 dark:via-neutral-900 dark:to-neutral-900 border border-neutral-200 dark:border-indigo-500/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Elevator Pitch & Background
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {profile.pitch}
            </p>
          </div>
        )}

        {/* Quick Exchange / Send My Info Form */}
        <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Exchange Contact Details with {profile.name.split(' ')[0]}
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Send your contact card directly to {profile.name.split(' ')[0]}'s contacts vault so they can follow up with you.
          </p>

          {exchangeSent ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Contact Details Added!
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-0.5">
                    Your information has been saved directly to {profile.name.split(' ')[0]}'s contacts vault.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (lastExchangedContact) {
                      const blob = new Blob([lastExchangedContact.rawText], { type: 'text/vcard;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      downloadDataUrl(url, `${lastExchangedContact.parsedTitle.replace(/\s+/g, '_')}_contact.vcf`);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download My .vcf</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExchangeSent(false);
                    setExchangeName('');
                    setExchangeEmail('');
                    setExchangePhone('');
                    setExchangeRole('');
                    setExchangeCompany('');
                    setExchangeNote('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 transition-all"
                >
                  Send Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleExchangeSubmit} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={exchangeName}
                    onChange={(e) => setExchangeName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="sarah@example.com"
                    value={exchangeEmail}
                    onChange={(e) => setExchangeEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 019-2834"
                    value={exchangePhone}
                    onChange={(e) => setExchangePhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                    Role & Company
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Recruiter"
                      value={exchangeRole}
                      onChange={(e) => setExchangeRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="e.g. Google"
                      value={exchangeCompany}
                      onChange={(e) => setExchangeCompany(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Note / Follow-up Message
                </label>
                <input
                  type="text"
                  placeholder="e.g. Great meeting you at the booth! Let's talk about the senior engineer role."
                  value={exchangeNote}
                  onChange={(e) => setExchangeNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingExchange}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmittingExchange ? 'Saving to Contacts...' : `Exchange & Send to ${profile.name.split(' ')[0]}'s Contacts`}
                </span>
              </button>
            </form>
          )}
        </div>

        {/* Footer & App Creator CTA */}
        <div className="pt-6 text-center space-y-3">
          <button
            onClick={onOpenAppEditor}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white border border-neutral-200 dark:border-neutral-800 text-xs font-semibold transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Open AseQR Studio</span>
            <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            100% Offline-Capable • No App Download Required
          </p>
        </div>
      </main>

      {/* QR Code Modal for Viral Sharing */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{profile.name}</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Scan to open this digital card</p>
            </div>

            <div className="bg-white p-4 rounded-2xl mx-auto max-w-[260px] shadow-sm border border-neutral-100">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Profile QR Code"
                  className="w-full aspect-square object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-neutral-400 font-mono">
                  Loading QR...
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link' : 'Copy URL'}</span>
              </button>

              <button
                onClick={() => {
                  if (qrUrl) downloadDataUrl(qrUrl, `${profile.name}_qr.png`);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
