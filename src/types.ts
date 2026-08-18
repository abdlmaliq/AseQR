export interface CustomLink {
  id: string;
  title: string;
  url: string;
  subtitle?: string;
  badgeText?: string;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  organization?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  url?: string;
  note?: string;
  location?: string;
}

export interface WifiData {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}

export interface UserProfile {
  // Personal & Identity
  userId?: string;
  name: string;
  headline: string;
  company: string;
  location: string;
  bio: string;
  statusBadge: string;
  avatarUrl?: string;
  themeGradient?: string;

  // Direct Contact for 1-Tap Address Book (.vcf export)
  phone: string;
  email: string;

  // Primary Professional Links & Touchpoints
  portfolioUrl: string;
  resumeUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  twitterUrl: string;
  calendlyUrl: string;

  // Custom Links
  customLinks: CustomLink[];

  // Elevator Pitch & Background
  pitch: string;
}

export interface ScannedContact {
  id: string;
  rawText: string;
  type: 'vcard' | 'url' | 'linkedin' | 'text' | 'wifi' | 'email';
  parsedTitle: string;
  parsedSubtitle?: string;
  vCardData?: VCardData;
  eventTag: string;
  notes: string;
  scannedAt: string; // ISO date string
  starred?: boolean;
}

export interface ScanEvent {
  id: string;
  userId: string;
  scannedAt: string; // ISO date string
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string; // e.g. "iOS", "Android", "macOS", "Windows", "Linux"
  browser: string; // e.g. "Safari", "Chrome", "Firefox", "In-App Camera / Browser", "Edge"
  language: string; // e.g. "en-US"
  timezone: string; // e.g. "America/New_York"
  screenResolution: string; // e.g. "393x852"
  referrer?: string;
  actionsTaken: string[]; // e.g. ["viewed_profile", "downloaded_vcard", "clicked_linkedin", "exchanged_contact"]
  lastActiveAt?: string;
}

export interface CustomQRCode {
  id: string;
  userId?: string;
  title: string;
  type: 'link' | 'text' | 'image' | 'wifi' | 'email' | 'sms' | 'whatsapp' | 'vcard' | 'event';
  content: string; // The formatted string encoded in QR
  createdAt: string; // ISO date string
  updatedAt?: string;

  // Type-specific payload details
  payloadDetails?: {
    // For link / image
    url?: string;
    description?: string;
    imageUrl?: string;

    // For plain text
    plainText?: string;

    // For wifi
    wifiSsid?: string;
    wifiPassword?: string;
    wifiEncryption?: 'WPA' | 'WEP' | 'nopass';
    wifiHidden?: boolean;

    // For email
    emailTo?: string;
    emailSubject?: string;
    emailBody?: string;

    // For sms / whatsapp
    phone?: string;
    smsMessage?: string;

    // For vcard
    vcardData?: VCardData;

    // For event
    eventTitle?: string;
    eventLocation?: string;
    eventStart?: string;
    eventEnd?: string;
    eventDescription?: string;
  };

  // Custom Styling
  styling: {
    fgColor: string;
    bgColor: string;
    margin: number;
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    centerIcon?: string; // preset icon name or custom image data url
    centerIconType?: 'preset' | 'image' | 'none';
    frameCtaText?: string;
  };
}

export interface AppSettings {
  theme?: 'light' | 'dark' | 'system';
  autoWakeLock: boolean;
  soundFeedback: boolean;
  qrErrorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  highContrastWhiteMode: boolean;
  hapticFeedback: boolean;
}
