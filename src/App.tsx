import { useState, useEffect } from 'react';
import { UserProfile, ScannedContact, AppSettings, ScanEvent, CustomQRCode } from './types';
import {
  loadProfile,
  saveProfile,
  loadContacts,
  saveContacts,
  loadSettings,
  saveSettings,
  loadCustomQRs,
  saveCustomQRs,
  DEFAULT_PROFILE,
  INITIAL_CONTACTS,
  DEFAULT_SETTINGS,
  DEFAULT_CUSTOM_QRS
} from './utils/storage';
import { decodeProfileFromHash } from './utils/shareHelper';
import { getLocalScans, saveLocalScans } from './utils/analyticsTracker';
import {
  auth,
  db,
  collection,
  onSnapshot,
  onAuthStateChanged,
  fetchCloudProfile,
  saveCloudProfile,
  fetchCloudContacts,
  saveCloudContact,
  deleteCloudContact,
  fetchCloudSettings,
  saveCloudSettings,
  fetchCloudScans,
  deleteCloudScan,
  clearCloudScans,
  fetchCloudCustomQRs,
  saveCloudCustomQR,
  deleteCloudCustomQR,
  clearCloudCustomQRs,
  type User
} from './lib/firebase';
import { Header } from './components/Header';
import { MasterQRHero } from './components/MasterQRHero';
import { PublicProfileView } from './components/PublicProfileView';
import { FullscreenQRModal } from './components/FullscreenQRModal';
import { EditProfileModal } from './components/EditProfileModal';
import { QRScannerModal } from './components/QRScannerModal';
import { ContactsVaultModal } from './components/ContactsVaultModal';
import { LockscreenModal } from './components/LockscreenModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { QRStudioModal } from './components/QRStudioModal';
import { WelcomeLandingPage } from './components/WelcomeLandingPage';
import { Sparkles, Maximize2, Eye, Edit3, Smartphone, QrCode, Cloud, User as UserIcon, BarChart3 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Current Authenticated User (Firebase)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Master Profile State
  const [profile, setProfile] = useState<UserProfile>(loadProfile);
  const [contacts, setContacts] = useState<ScannedContact[]>(loadContacts);
  const [scans, setScans] = useState<ScanEvent[]>(getLocalScans);
  const [customQRs, setCustomQRs] = useState<CustomQRCode[]>(loadCustomQRs);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Check if current URL is a shared public profile link (?p=... or #profile=...)
  const [publicPayload, setPublicPayload] = useState<UserProfile | null>(() => {
    return decodeProfileFromHash(window.location.href);
  });

  // Modals state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isPreviewingLanding, setIsPreviewingLanding] = useState<boolean>(false);
  const [isViewingLockscreen, setIsViewingLockscreen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isViewingVault, setIsViewingVault] = useState<boolean>(false);
  const [isViewingSettings, setIsViewingSettings] = useState<boolean>(false);
  const [isViewingAuth, setIsViewingAuth] = useState<boolean>(false);
  const [isViewingAnalytics, setIsViewingAnalytics] = useState<boolean>(false);
  const [isViewingQRStudio, setIsViewingQRStudio] = useState<boolean>(false);

  // Preview profile target (for demo preview or personal preview)
  const [previewProfileTarget, setPreviewProfileTarget] = useState<UserProfile>(profile);

  // Listen to hash and query param changes in browser
  useEffect(() => {
    const handleUrlChange = () => {
      const decoded = decodeProfileFromHash(window.location.href);
      setPublicPayload(decoded);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Firebase Auth State Listener & Multi-Account Cloud Synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthLoading(false);

      if (user) {
        // User is logged in: load account data from Firestore
        try {
          // 1. Fetch or initialize user's profile in Firestore
          const cloudProf = await fetchCloudProfile(user.uid);
          if (cloudProf) {
            const enriched = { ...cloudProf, userId: user.uid };
            setProfile(enriched);
            saveProfile(enriched);
          } else {
            // New user account: seed initial generic profile in Firestore so it's permanently saved
            const initialForUser: UserProfile = {
              ...DEFAULT_PROFILE,
              userId: user.uid,
              name: user.displayName || 'Alex Morgan',
              email: user.email || 'alex.morgan@example.com',
            };
            setProfile(initialForUser);
            saveProfile(initialForUser);
            await saveCloudProfile(user.uid, initialForUser);
          }

          // 2. Fetch user's saved contacts in Firestore
          const cloudConts = await fetchCloudContacts(user.uid);
          if (cloudConts && cloudConts.length > 0) {
            setContacts(cloudConts);
            saveContacts(cloudConts);
          } else {
            setContacts([]);
            saveContacts([]);
          }

          // 3. Fetch user's settings
          const cloudSets = await fetchCloudSettings(user.uid);
          if (cloudSets) {
            setSettings(cloudSets);
            saveSettings(cloudSets);
          }

          // 4. Fetch user's scan analytics
          const cloudScansList = await fetchCloudScans(user.uid);
          if (cloudScansList && cloudScansList.length > 0) {
            setScans(cloudScansList);
            saveLocalScans(cloudScansList);
          } else {
            setScans([]);
            saveLocalScans([]);
          }

          // 5. Fetch user's custom generated QR codes
          const cloudQRsList = await fetchCloudCustomQRs(user.uid);
          if (cloudQRsList && cloudQRsList.length > 0) {
            setCustomQRs(cloudQRsList);
            saveCustomQRs(cloudQRsList);
          } else {
            setCustomQRs(DEFAULT_CUSTOM_QRS);
            saveCustomQRs(DEFAULT_CUSTOM_QRS);
          }
        } catch (err) {
          console.error('Error syncing cloud data on auth change:', err);
        }
      } else {
        // When a user logs out, reset state
        setProfile(DEFAULT_PROFILE);
        setContacts(INITIAL_CONTACTS);
        setScans(getLocalScans());
        setCustomQRs(loadCustomQRs());
        setSettings(DEFAULT_SETTINGS);
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Contacts, Scans & Custom QRs Synchronization for Authenticated Users
  useEffect(() => {
    if (!currentUser) return;

    // 1. Contacts Listener
    const contactsCol = collection(db, 'users', currentUser.uid, 'contacts');
    const unsubContacts = onSnapshot(
      contactsCol,
      (snapshot) => {
        const list: ScannedContact[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as ScannedContact);
        });
        list.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
        setContacts(list);
        saveContacts(list);
      },
      (err) => {
        console.error('Real-time contacts sync error:', err);
      }
    );

    // 2. Scans Analytics Listener
    const scansCol = collection(db, 'users', currentUser.uid, 'scans');
    const unsubScans = onSnapshot(
      scansCol,
      (snapshot) => {
        const list: ScanEvent[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as ScanEvent);
        });
        list.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
        setScans(list);
        saveLocalScans(list);
      },
      (err) => {
        console.error('Real-time scans sync error:', err);
      }
    );

    // 3. Custom QR Codes Listener
    const qrsCol = collection(db, 'users', currentUser.uid, 'customQRs');
    const unsubQRs = onSnapshot(
      qrsCol,
      (snapshot) => {
        const list: CustomQRCode[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as CustomQRCode);
        });
        if (list.length > 0) {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setCustomQRs(list);
          saveCustomQRs(list);
        }
      },
      (err) => {
        console.error('Real-time custom QRs sync error:', err);
      }
    );

    return () => {
      unsubContacts();
      unsubScans();
      unsubQRs();
    };
  }, [currentUser]);

  // Listen for local contact exchange and scan events (for instantaneous feedback)
  useEffect(() => {
    const handleLocalNewContact = (e: Event) => {
      const customEvent = e as CustomEvent<ScannedContact>;
      if (customEvent.detail) {
        setContacts((prev) => {
          if (prev.some((c) => c.id === customEvent.detail.id)) return prev;
          const updated = [customEvent.detail, ...prev];
          saveContacts(updated);
          return updated;
        });
      }
    };

    const handleLocalScanRecorded = (e: Event) => {
      const customEvent = e as CustomEvent<ScanEvent>;
      if (customEvent.detail) {
        setScans((prev) => {
          if (prev.some((s) => s.id === customEvent.detail.id)) return prev;
          const updated = [customEvent.detail, ...prev];
          saveLocalScans(updated);
          return updated;
        });
      }
    };

    window.addEventListener('smart_networking_new_contact', handleLocalNewContact);
    window.addEventListener('smart_networking_scan_recorded', handleLocalScanRecorded);
    return () => {
      window.removeEventListener('smart_networking_new_contact', handleLocalNewContact);
      window.removeEventListener('smart_networking_scan_recorded', handleLocalScanRecorded);
    };
  }, []);

  // Cache changes to localStorage
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // If public payload exists from a shared QR scan, render the Public Landing Page!
  if (publicPayload) {
    return (
      <PublicProfileView
        profile={publicPayload}
        onOpenAppEditor={() => {
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, '', cleanUrl);
          setPublicPayload(null);
        }}
        onContactAdded={(newContact) => {
          setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== newContact.id)]);
        }}
      />
    );
  }

  // Authentication Gating:
  // If Firebase auth state is still initializing, show a clean loading view
  if (authLoading && !publicPayload) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/20 animate-pulse flex items-center justify-center">
            <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
              <QrCode className="w-7 h-7 text-indigo-400" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-white tracking-tight">Smart Networking</h2>
            <p className="text-xs text-neutral-400">Loading your profile & cloud hub...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, require Sign In / Account creation (no guest bypass)
  if (!currentUser) {
    return (
      <WelcomeLandingPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // Handlers for Profile (Persistent in Firestore + LocalStorage)
  const handleSaveProfile = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    // If user is authenticated, save to Firestore database
    if (currentUser) {
      await saveCloudProfile(currentUser.uid, updatedProfile);
    }
  };

  // Handlers for Contacts (Persistent in Firestore + LocalStorage)
  const handleAddContact = async (newContact: ScannedContact) => {
    setContacts((prev) => [newContact, ...prev]);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

    if (currentUser) {
      await saveCloudContact(currentUser.uid, newContact);
    }
  };

  const handleDeleteContact = async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));

    if (currentUser) {
      await deleteCloudContact(currentUser.uid, id);
    }
  };

  const handleToggleStarContact = async (id: string) => {
    const updated = contacts.map((c) => (c.id === id ? { ...c, starred: !c.starred } : c));
    setContacts(updated);

    if (currentUser) {
      const target = updated.find((c) => c.id === id);
      if (target) {
        await saveCloudContact(currentUser.uid, target);
      }
    }
  };

  // Handlers for Settings
  const handleUpdateSettings = async (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    saveSettings(updatedSettings);

    if (currentUser) {
      await saveCloudSettings(currentUser.uid, updatedSettings);
    }
  };

  // Handlers for Scan Analytics
  const handleDeleteScan = async (scanId: string) => {
    const updated = scans.filter((s) => s.id !== scanId);
    setScans(updated);
    saveLocalScans(updated);

    if (currentUser) {
      await deleteCloudScan(currentUser.uid, scanId);
    }
  };

  const handleClearAllScans = async () => {
    setScans([]);
    saveLocalScans([]);

    if (currentUser) {
      await clearCloudScans(currentUser.uid);
    }
  };

  // Handlers for Custom QR Codes (links, texts, images, wifi, etc.)
  const handleSaveCustomQR = async (qr: CustomQRCode) => {
    const existingIndex = customQRs.findIndex((q) => q.id === qr.id);
    let updated: CustomQRCode[];
    if (existingIndex >= 0) {
      updated = [...customQRs];
      updated[existingIndex] = qr;
    } else {
      updated = [qr, ...customQRs];
    }
    setCustomQRs(updated);
    saveCustomQRs(updated);

    if (currentUser) {
      await saveCloudCustomQR(currentUser.uid, qr);
    }
  };

  const handleDeleteCustomQR = async (qrId: string) => {
    const updated = customQRs.filter((q) => q.id !== qrId);
    setCustomQRs(updated);
    saveCustomQRs(updated);

    if (currentUser) {
      await deleteCloudCustomQR(currentUser.uid, qrId);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white pb-16 sm:pb-8 transition-colors">
      {/* Top Header with Account Info & Scanner */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setIsViewingAuth(true)}
        onOpenScanner={() => setIsScanning(true)}
        onOpenVault={() => setIsViewingVault(true)}
        onOpenLockscreen={() => setIsViewingLockscreen(true)}
        onOpenSettings={() => setIsViewingSettings(true)}
        onOpenAnalytics={() => setIsViewingAnalytics(true)}
        onOpenQRStudio={() => setIsViewingQRStudio(true)}
        contactsCount={contacts.length}
        scansCount={scans.length}
        customQRsCount={customQRs.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Account Cloud Status Banner */}
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-500/30 flex items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-neutral-900 dark:text-white truncate">
                Logged in as <span className="text-indigo-600 dark:text-indigo-300">{currentUser.displayName || currentUser.email}</span>
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Profile changes, scan analytics & leads automatically save to Firestore database
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsViewingAnalytics(true)}
              className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-600/30 hover:bg-indigo-200 dark:hover:bg-indigo-600/50 border border-indigo-250 dark:border-indigo-500/40 transition-colors flex items-center gap-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{scans.length} Scans</span>
            </button>
            <button
              onClick={() => setIsViewingAuth(true)}
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-250 dark:border-neutral-700 transition-colors shadow-2xs"
            >
              Account
            </button>
          </div>
        </div>

        {/* ONE MASTER QR CODE: All-in-One Profile & Links Hero */}
        <MasterQRHero
          profile={profile}
          onOpenFullscreen={() => setIsFullscreen(true)}
          onPreviewPublicLanding={() => {
            setPreviewProfileTarget(profile);
            setIsPreviewingLanding(true);
          }}
          onOpenLockscreen={() => setIsViewingLockscreen(true)}
          onOpenEditProfile={() => setIsEditingProfile(true)}
          onOpenAnalytics={() => setIsViewingAnalytics(true)}
          onOpenQRStudio={() => setIsViewingQRStudio(true)}
          scansCount={scans.length}
        />

        {/* Quick Pro-Tip Banner */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 font-bold shrink-0 border border-indigo-200 dark:border-transparent">
              💡 Pro Tip
            </span>
            <p className="text-neutral-700 dark:text-neutral-300">
              Present your <strong className="text-neutral-900 dark:text-white">Master QR Code</strong> at career fairs or conferences. When recruiters point their camera, they immediately get your profile, interactive portfolios, and 1-tap contact card (.vcf) directly in their phone address book.
            </p>
          </div>
          <button
            onClick={() => {
              setPreviewProfileTarget(profile);
              setIsPreviewingLanding(true);
            }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 shrink-0 flex items-center gap-1 self-end sm:self-auto"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Test Landing Page</span>
          </button>
        </div>
      </main>

      {/* Mobile Sticky Quick Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setIsFullscreen(true)}
          className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          <Maximize2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Present</span>
        </button>

        <button
          onClick={() => setIsViewingAnalytics(true)}
          className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        >
          <BarChart3 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>Insights</span>
        </button>

        <button
          onClick={() => setIsEditingProfile(true)}
          className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        >
          <Edit3 className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>Edit</span>
        </button>

        <button
          onClick={() => {
            setPreviewProfileTarget(profile);
            setIsPreviewingLanding(true);
          }}
          className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        >
          <Eye className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>Preview</span>
        </button>

        <button
          onClick={() => setIsScanning(true)}
          className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        >
          <QrCode className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>Scan</span>
        </button>

        <button
          onClick={() => setIsViewingAuth(true)}
          className="flex flex-col items-center gap-1 py-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
        >
          <UserIcon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
          <span>{currentUser ? 'Account' : 'Login'}</span>
        </button>
      </div>

      {/* MODALS */}

      {/* 1. Fullscreen Presentation Mode */}
      {isFullscreen && (
        <FullscreenQRModal
          profile={profile}
          onClose={() => setIsFullscreen(false)}
          onPreviewLanding={() => {
            setIsFullscreen(false);
            setPreviewProfileTarget(profile);
            setIsPreviewingLanding(true);
          }}
        />
      )}

      {/* 2. Comprehensive Edit Profile Modal */}
      {isEditingProfile && (
        <EditProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setIsEditingProfile(false)}
        />
      )}

      {/* 3. Landing Page Live Preview Modal */}
      {isPreviewingLanding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col relative">
            <div className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-md px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Live Scanner Preview
                </span>
                <span className="text-xs text-neutral-400 hidden sm:inline">
                  This is what scanners see when pointing their camera
                </span>
              </div>
              <button
                onClick={() => setIsPreviewingLanding(false)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white"
              >
                Close Preview
              </button>
            </div>

            <div className="flex-1">
              <PublicProfileView
                profile={{ ...previewProfileTarget, userId: currentUser?.uid }}
                onOpenAppEditor={() => setIsPreviewingLanding(false)}
                onContactAdded={(newContact) => {
                  setContacts((prev) => [newContact, ...prev.filter((c) => c.id !== newContact.id)]);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Scanner Modal for scanning other attendees */}
      {isScanning && (
        <QRScannerModal
          onClose={() => setIsScanning(false)}
          onSaveContact={handleAddContact}
        />
      )}

      {/* 5. Contacts Vault Modal */}
      {isViewingVault && (
        <ContactsVaultModal
          contacts={contacts}
          onClose={() => setIsViewingVault(false)}
          onDeleteContact={handleDeleteContact}
          onToggleStar={handleToggleStarContact}
          onOpenScanner={() => {
            setIsViewingVault(false);
            setIsScanning(true);
          }}
        />
      )}

      {/* 6. Lockscreen Wallpaper Modal */}
      {isViewingLockscreen && (
        <LockscreenModal
          profile={profile}
          onClose={() => setIsViewingLockscreen(false)}
        />
      )}

      {/* 7. Multi-Account & Authentication Modal */}
      {isViewingAuth && (
        <AuthModal
          currentUser={currentUser}
          onClose={() => setIsViewingAuth(false)}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
          }}
        />
      )}

      {/* 8. Settings Modal */}
      {isViewingSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          profile={profile}
          contacts={contacts}
          onClose={() => setIsViewingSettings(false)}
          onResetAllData={() => {
            localStorage.clear();
            window.location.reload();
          }}
          onImportData={({ profile: impProfile, contacts: impContacts }) => {
            if (impProfile) handleSaveProfile(impProfile);
            if (impContacts) setContacts(impContacts);
          }}
        />
      )}

      {/* 9. Real-time QR Scan Telemetry & Insights Modal */}
      {isViewingAnalytics && (
        <AnalyticsModal
          scans={scans}
          userName={profile.name}
          onClose={() => setIsViewingAnalytics(false)}
          onDeleteScan={handleDeleteScan}
          onClearAllScans={handleClearAllScans}
        />
      )}

      {/* 10. Dedicated Custom QR Code Studio Modal (Links, Texts, Images, WiFi, VCards, etc.) */}
      {isViewingQRStudio && (
        <QRStudioModal
          customQRs={customQRs}
          onClose={() => setIsViewingQRStudio(false)}
          onSaveQR={handleSaveCustomQR}
          onDeleteQR={handleDeleteCustomQR}
          userName={profile.name}
        />
      )}
    </div>
  );
}
