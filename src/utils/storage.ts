import { UserProfile, ScannedContact, AppSettings, CustomQRCode } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'smart_net_master_profile_v2',
  CONTACTS: 'smart_net_contacts_v1',
  SETTINGS: 'smart_net_settings_v1',
  CUSTOM_QRS: 'smart_net_custom_qrs_v1',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Morgan',
  headline: 'Software Engineer · Product & Systems Developer',
  company: 'Tech Innovations Inc.',
  location: 'San Francisco, CA',
  bio: 'Passionate software engineer building resilient web and cloud applications. Open to exciting engineering roles, technical projects, and professional networking.',
  statusBadge: '🟢 Open to Opportunities',
  phone: '+1 (555) 234-5678',
  email: 'alex.morgan@example.com',
  portfolioUrl: 'https://example.com/portfolio',
  resumeUrl: 'https://example.com/resume.pdf',
  linkedinUrl: 'https://linkedin.com/in/alex-morgan-dev',
  githubUrl: 'https://github.com/alexmorgan-dev',
  twitterUrl: 'https://x.com/alexmorgan_tech',
  calendlyUrl: 'https://calendly.com/alexmorgan/30min',
  pitch: 'Hello! I am a software engineer focused on building clean, high-performance web applications and scalable services. Excited to connect and discuss potential collaborations.',
  customLinks: [],
};

export const INITIAL_CONTACTS: ScannedContact[] = [
  {
    id: 'contact_demo_1',
    rawText: 'BEGIN:VCARD\r\nVERSION:3.0\r\nFN:Sarah Jenkins\r\nORG:Apex Tech\r\nTITLE:Lead Technical Recruiter\r\nEMAIL:sarah.jenkins@apextech.example\r\nTEL:+1 (555) 890-2341\r\nNOTE:Met at Tech Career Expo - interested in discussing engineer openings\r\nEND:VCARD',
    type: 'vcard',
    parsedTitle: 'Sarah Jenkins',
    parsedSubtitle: 'Lead Technical Recruiter · Apex Tech',
    eventTag: 'Tech Expo 2026',
    notes: 'Discussed software openings. Follow up regarding interview scheduling.',
    scannedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    starred: true,
    vCardData: {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      organization: 'Apex Tech',
      jobTitle: 'Lead Technical Recruiter',
      email: 'sarah.jenkins@apextech.example',
      phone: '+1 (555) 890-2341',
      note: 'Met at Tech Career Expo - interested in discussing engineer openings',
    },
  },
  {
    id: 'contact_demo_2',
    rawText: 'https://linkedin.com/in/david-park-eng',
    type: 'linkedin',
    parsedTitle: 'David Park',
    parsedSubtitle: 'Engineering Director · CloudScale',
    eventTag: 'Tech Meetup',
    notes: 'Met at the networking mixer. Shared insights on modern web infrastructure.',
    scannedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    starred: false,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoWakeLock: true,
  soundFeedback: true,
  qrErrorCorrectionLevel: 'M',
  highContrastWhiteMode: false,
  hapticFeedback: true,
};

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }
}

export function loadContacts(): ScannedContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!raw) return INITIAL_CONTACTS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_CONTACTS;
  }
}

export function saveContacts(contacts: ScannedContact[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  } catch (err) {
    console.error('Failed to save contacts to localStorage:', err);
  }
}

export const DEFAULT_CUSTOM_QRS: CustomQRCode[] = [
  {
    id: 'qr_demo_link',
    title: 'Featured Project Showcase',
    type: 'link',
    content: 'https://github.com/alexmorgan-dev',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    payloadDetails: {
      url: 'https://github.com/alexmorgan-dev',
      description: 'Open-source distributed systems and web projects',
    },
    styling: {
      fgColor: '#4f46e5',
      bgColor: '#ffffff',
      margin: 2,
      errorCorrectionLevel: 'M',
      centerIcon: 'github',
      centerIconType: 'preset',
      frameCtaText: 'VIEW PROJECTS',
    },
  },
  {
    id: 'qr_demo_wifi',
    title: 'Guest High-Speed Wi-Fi',
    type: 'wifi',
    content: 'WIFI:T:WPA;S:Event_Guest_5G;P:Connect2026!;;',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    payloadDetails: {
      wifiSsid: 'Event_Guest_5G',
      wifiPassword: 'Connect2026!',
      wifiEncryption: 'WPA',
      wifiHidden: false,
    },
    styling: {
      fgColor: '#059669',
      bgColor: '#ffffff',
      margin: 2,
      errorCorrectionLevel: 'M',
      centerIcon: 'wifi',
      centerIconType: 'preset',
      frameCtaText: 'CONNECT WI-FI',
    },
  },
  {
    id: 'qr_demo_text',
    title: 'Keynote Talk Summary & Links',
    type: 'text',
    content: 'Thanks for attending my session! Slides and architecture notes are available at https://example.com/talks/2026. Keep in touch via LinkedIn!',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    payloadDetails: {
      plainText: 'Thanks for attending my session! Slides and architecture notes are available at https://example.com/talks/2026. Keep in touch via LinkedIn!',
    },
    styling: {
      fgColor: '#7c3aed',
      bgColor: '#ffffff',
      margin: 2,
      errorCorrectionLevel: 'M',
      centerIcon: 'text',
      centerIconType: 'preset',
      frameCtaText: 'READ NOTES',
    },
  },
];

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function loadCustomQRs(): CustomQRCode[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_QRS);
    if (!raw) return DEFAULT_CUSTOM_QRS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CUSTOM_QRS;
  }
}

export function saveCustomQRs(qrs: CustomQRCode[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_QRS, JSON.stringify(qrs));
  } catch (err) {
    console.error('Failed to save custom QRs to localStorage:', err);
  }
}

