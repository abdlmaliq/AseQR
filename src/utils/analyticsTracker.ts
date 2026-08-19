import { ScanEvent } from '../types';
import { saveCloudScan, logScanActionCloud } from '../lib/firebase';

const LOCAL_SCANS_KEY = 'smart_networking_scans_v1';
export const SCAN_RETENTION_DAYS = 90;
export const SCAN_RETENTION_MS = SCAN_RETENTION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Filters out scan events older than the 90-day retention window
 */
export function filter90DayScans(scans: ScanEvent[]): ScanEvent[] {
  const cutoffTime = Date.now() - SCAN_RETENTION_MS;
  return (scans || []).filter((scan) => {
    try {
      const scanTimestamp = new Date(scan.scannedAt).getTime();
      return !isNaN(scanTimestamp) && scanTimestamp >= cutoffTime;
    } catch {
      return true;
    }
  });
}

export function getLocalScans(): ScanEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_SCANS_KEY);
    if (!raw) return [];
    const parsed: ScanEvent[] = JSON.parse(raw);
    return filter90DayScans(parsed);
  } catch {
    return [];
  }
}

export function saveLocalScans(scans: ScanEvent[]): void {
  try {
    const pruned = filter90DayScans(scans);
    localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify(pruned));
  } catch {
    // ignore
  }
}

/**
 * Detect client device, operating system, and browser safely
 */
export function detectDeviceInfo(): {
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os: string;
  browser: string;
  language: string;
  timezone: string;
  screenResolution: string;
} {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const language = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';
  
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    timezone = 'UTC';
  }

  let screenResolution = 'Unknown';
  if (typeof window !== 'undefined' && window.screen) {
    screenResolution = `${window.screen.width}x${window.screen.height}`;
  }

  // Device Type Detection
  let deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = 'mobile';
  }

  // OS Detection
  let os = 'Unknown OS';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS (\d+[._]\d+)/);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Windows NT/i.test(ua)) {
    os = 'Windows';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser / Scanner App Detection
  let browser = 'Web Browser';
  if (/Instagram/i.test(ua)) {
    browser = 'Instagram In-App';
  } else if (/LinkedInApp/i.test(ua)) {
    browser = 'LinkedIn In-App';
  } else if (/FBAN|FBAV/i.test(ua)) {
    browser = 'Facebook In-App';
  } else if (/Twitter|TwitterAndroid|TwitteriPhone/i.test(ua)) {
    browser = 'X (Twitter) In-App';
  } else if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\/|CriOS\//i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
    browser = 'Apple Safari / Camera';
  } else if (/Firefox|FxiOS/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  }

  return {
    deviceType,
    os,
    browser,
    language,
    timezone,
    screenResolution,
  };
}

/**
 * Automatically records a scan when an attendee opens the user's public profile
 */
export async function trackProfileScan(userId?: string): Promise<string | null> {
  if (!userId) return null;

  try {
    // Deduplicate within the same browser session (1 scan per visit session)
    const sessionKey = `sn_scan_session_${userId}`;
    const existingScanId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
    
    if (existingScanId) {
      return existingScanId;
    }

    const scanId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const info = detectDeviceInfo();

    const scanEvent: ScanEvent = {
      id: scanId,
      userId,
      scannedAt: new Date().toISOString(),
      deviceType: info.deviceType,
      os: info.os,
      browser: info.browser,
      language: info.language,
      timezone: info.timezone,
      screenResolution: info.screenResolution,
      referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : 'Direct QR Scan',
      actionsTaken: ['viewed_profile'],
      lastActiveAt: new Date().toISOString(),
    };

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(sessionKey, scanId);
    }

    // 1. Save to local storage for instant sync
    const currentLocal = getLocalScans();
    saveLocalScans([scanEvent, ...currentLocal]);

    // 2. Save to Firestore
    await saveCloudScan(userId, scanEvent);

    // 3. Dispatch local event for any listening UI tabs
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smart_networking_scan_recorded', { detail: scanEvent }));
    }

    return scanId;
  } catch (err) {
    console.error('Error tracking profile scan:', err);
    return null;
  }
}

/**
 * Tracks an engagement action (e.g. clicked LinkedIn, downloaded vCard, submitted contact card)
 */
export async function trackEngagementAction(userId: string | undefined, action: string): Promise<void> {
  if (!userId) return;

  try {
    const sessionKey = `sn_scan_session_${userId}`;
    const scanId = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(sessionKey) : null;
    
    if (!scanId) return;

    // Update local scans cache
    const currentLocal = getLocalScans();
    const updated = currentLocal.map((s) => {
      if (s.id === scanId) {
        const acts = Array.isArray(s.actionsTaken) ? s.actionsTaken : [];
        if (!acts.includes(action)) {
          return {
            ...s,
            actionsTaken: [...acts, action],
            lastActiveAt: new Date().toISOString(),
          };
        }
      }
      return s;
    });
    saveLocalScans(updated);

    // Update in Firestore
    await logScanActionCloud(userId, scanId, action);
  } catch (err) {
    console.error('Error recording engagement action:', err);
  }
}
