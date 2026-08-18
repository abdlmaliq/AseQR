import LZString from 'lz-string';
import { UserProfile } from '../types';

export interface CompactProfilePayload {
  uid?: string; // userId for cloud contact exchange
  n: string; // name
  h: string; // headline
  c?: string; // company
  l?: string; // location
  b?: string; // bio
  s?: string; // statusBadge
  av?: string; // avatarUrl (image URL or small data url)
  p?: string; // phone
  e?: string; // email
  w?: string; // portfolioUrl (web)
  r?: string; // resumeUrl
  li?: string; // linkedinUrl (shortened username or full URL)
  gh?: string; // githubUrl (shortened username or full URL)
  tw?: string; // twitterUrl (shortened username or full URL)
  cal?: string; // calendlyUrl (shortened username or full URL)
  pi?: string; // pitch
  k?: Array<{ t: string; u: string; s?: string; b?: string }>; // customLinks
}

/**
 * Strips common prefixes to minimize string length in QR codes
 */
function cleanShortUrl(url?: string, domainPattern?: RegExp): string | undefined {
  if (!url || !url.trim()) return undefined;
  let trimmed = url.trim();
  if (domainPattern) {
    trimmed = trimmed.replace(domainPattern, '');
  }
  // Strip trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');
  return trimmed || undefined;
}

/**
 * Restores full URL from shortened username or preserved full URL
 */
function restoreUrl(val?: string, basePrefix?: string): string {
  if (!val || !val.trim()) return '';
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  if (basePrefix) {
    return `${basePrefix}${trimmed}`;
  }
  return `https://${trimmed}`;
}

/**
 * Encodes full UserProfile into an ultra-compact URL-safe hash string
 * Optimized for low-density QR codes that scan instantly in ~0.1s
 */
export function encodeProfileToHash(profile: UserProfile): string {
  // Strip common domain prefixes to save up to 60% QR matrix density
  const cleanLinkedIn = cleanShortUrl(profile.linkedinUrl, /^https?:\/\/(?:www\.)?linkedin\.com\/in\//i);
  const cleanGitHub = cleanShortUrl(profile.githubUrl, /^https?:\/\/(?:www\.)?github\.com\//i);
  const cleanTwitter = cleanShortUrl(profile.twitterUrl, /^https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\//i);
  const cleanCalendly = cleanShortUrl(profile.calendlyUrl, /^https?:\/\/(?:www\.)?calendly\.com\//i);

  // Only embed external web image URLs (http/https) in the QR string to keep the matrix ultra-light.
  // Large local data:image URLs are synced via Firestore under userId.
  const embeddableAvatar = (profile.avatarUrl && /^https?:\/\//i.test(profile.avatarUrl.trim()))
    ? profile.avatarUrl.trim()
    : undefined;

  const compact: CompactProfilePayload = {
    uid: profile.userId?.trim() || undefined,
    n: profile.name.trim(),
    h: profile.headline.trim(),
    c: profile.company?.trim() || undefined,
    l: profile.location?.trim() || undefined,
    b: profile.bio?.trim() || undefined,
    s: profile.statusBadge?.trim() || undefined,
    av: embeddableAvatar,
    p: profile.phone?.trim() || undefined,
    e: profile.email?.trim() || undefined,
    w: profile.portfolioUrl?.trim() || undefined,
    r: profile.resumeUrl?.trim() || undefined,
    li: cleanLinkedIn,
    gh: cleanGitHub,
    tw: cleanTwitter,
    cal: cleanCalendly,
    pi: profile.pitch?.trim() || undefined,
    k: profile.customLinks && profile.customLinks.length > 0
      ? profile.customLinks
          .filter((link) => link.title.trim() && link.url.trim())
          .map((link) => ({
            t: link.title.trim(),
            u: link.url.trim(),
            s: link.subtitle?.trim() || undefined,
            b: link.badgeText?.trim() || undefined,
          }))
      : undefined,
  };

  // Remove all undefined / null keys to keep payload minimal
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(compact)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanObj[key] = value;
    }
  }

  try {
    const jsonStr = JSON.stringify(cleanObj);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    return compressed;
  } catch (err) {
    console.error('Error compressing profile payload:', err);
    return encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(cleanObj)))));
  }
}

/**
 * Generates the full absolute URL for the master profile landing page.
 * If the user has a registered Cloud userId (from Firebase Auth / Database),
 * it produces an ultra-short, simple URL (?u=USER_ID) that generates an
 * ultra-low density, instant-scanning QR code (< 40 bytes!).
 * If offline/no userId, it falls back to the compressed payload (?p=...).
 */
export function getMasterProfileURL(profile: UserProfile): string {
  const origin = window.location.origin;
  const pathname = window.location.pathname.endsWith('/') 
    ? window.location.pathname 
    : window.location.pathname;

  if (profile.userId && profile.userId.trim()) {
    return `${origin}${pathname}?u=${encodeURIComponent(profile.userId.trim())}`;
  }

  const hashToken = encodeProfileToHash(profile);
  return `${origin}${pathname}?p=${hashToken}`;
}

/**
 * Decodes profile from URL query parameters (?u=userId, ?p=token, #profile=token, etc.)
 */
export function decodeProfileFromHash(hashOrUrl: string): UserProfile | null {
  if (!hashOrUrl || typeof hashOrUrl !== 'string') return null;

  try {
    const raw = hashOrUrl.trim();
    if (!raw || raw === '#' || raw === '?') return null;

    // 1. First check for Ultra-Simple Cloud User Link (?u=USER_ID or ?user=USER_ID or #u=USER_ID)
    let directUserId = '';
    if (raw.includes('?')) {
      const queryString = raw.split('?')[1]?.split('#')[0] || '';
      const uMatch = queryString.match(/(?:^|&)(?:u|user|uid)=([^&]+)/i);
      if (uMatch && uMatch[1]) {
        directUserId = decodeURIComponent(uMatch[1].trim());
      }
    }
    if (!directUserId && raw.includes('#')) {
      const hashString = raw.split('#')[1]?.split('?')[0] || '';
      const uMatch = hashString.match(/(?:^|&)(?:u|user|uid)=([^&]+)/i);
      if (uMatch && uMatch[1]) {
        directUserId = decodeURIComponent(uMatch[1].trim());
      }
    }

    if (directUserId && directUserId.length >= 3) {
      // Return a minimal profile stub with userId so PublicProfileView fetches full real-time profile from Firestore
      return {
        userId: directUserId,
        name: 'Loading Profile...',
        headline: 'Fetching digital networking card...',
        company: '',
        location: '',
        bio: '',
        statusBadge: '',
        phone: '',
        email: '',
        portfolioUrl: '',
        resumeUrl: '',
        linkedinUrl: '',
        githubUrl: '',
        twitterUrl: '',
        calendlyUrl: '',
        pitch: '',
        customLinks: [],
      };
    }

    let candidateToken = '';

    // 2. Check query parameter (?p=... or ?profile=... or ?data=...)
    if (raw.includes('?')) {
      const queryString = raw.split('?')[1]?.split('#')[0] || '';
      const paramMatch = queryString.match(/(?:^|&)(?:p|profile|data)=([^&]+)/);
      if (paramMatch && paramMatch[1]) {
        candidateToken = paramMatch[1];
      }
    }

    // 3. Check hash (#profile=... or #p=... or direct hash)
    if (!candidateToken && raw.includes('#')) {
      const hashString = raw.split('#')[1]?.split('?')[0] || '';
      const hashMatch = hashString.match(/(?:^|&)(?:profile|p|data)=([^&]+)/);
      if (hashMatch && hashMatch[1]) {
        candidateToken = hashMatch[1];
      } else if (hashString && !hashString.includes('=')) {
        candidateToken = hashString;
      }
    }

    // 4. Fallback direct regex match
    if (!candidateToken) {
      const directMatch = raw.match(/(?:profile|p|data)=([^&#]+)/);
      if (directMatch && directMatch[1]) {
        candidateToken = directMatch[1];
      } else {
        candidateToken = raw.replace(/^[#?](?:profile=|p=|data=)?/, '');
      }
    }

    if (!candidateToken || candidateToken.length < 3) return null;

    // Build list of decoded token variations to test
    const tokensToTry = new Set<string>();
    tokensToTry.add(candidateToken);

    try {
      tokensToTry.add(decodeURIComponent(candidateToken));
    } catch {}

    // If query string converted '+' to space ' ', restore '+'
    if (candidateToken.includes(' ')) {
      const restoredPlus = candidateToken.replace(/ /g, '+');
      tokensToTry.add(restoredPlus);
      try {
        tokensToTry.add(decodeURIComponent(restoredPlus));
      } catch {}
    }

    for (const token of tokensToTry) {
      if (!token) continue;

      // A. LZString decompression
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(token);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          const normalized = normalizeDecodedProfile(parsed);
          if (normalized) return normalized;
        }
      } catch {}

      // B. Direct JSON string
      try {
        const parsed = JSON.parse(token);
        const normalized = normalizeDecodedProfile(parsed);
        if (normalized) return normalized;
      } catch {}

      // C. Base64
      try {
        let b64Candidate = token.replace(/-/g, '+').replace(/_/g, '/');
        while (b64Candidate.length % 4) {
          b64Candidate += '=';
        }
        if (/^[A-Za-z0-9+/=]+$/.test(b64Candidate)) {
          const binary = atob(b64Candidate);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const text = new TextDecoder().decode(bytes);
          const parsed = JSON.parse(text);
          const normalized = normalizeDecodedProfile(parsed);
          if (normalized) return normalized;
        }
      } catch {}
    }

    return null;
  } catch (e) {
    console.error('Error decoding profile from hash/url:', e);
    return null;
  }
}

function normalizeDecodedProfile(raw: any): UserProfile | null {
  if (!raw) return null;

  // Handle Compact schema (n, h, c, ...)
  if (raw.n) {
    return {
      userId: raw.uid || raw.userId || undefined,
      name: raw.n || '',
      headline: raw.h || '',
      company: raw.c || '',
      location: raw.l || '',
      bio: raw.b || '',
      statusBadge: raw.s || '',
      avatarUrl: raw.av || raw.avatarUrl || undefined,
      phone: raw.p || '',
      email: raw.e || '',
      portfolioUrl: raw.w ? restoreUrl(raw.w) : '',
      resumeUrl: raw.r ? restoreUrl(raw.r) : '',
      linkedinUrl: raw.li ? restoreUrl(raw.li, 'https://linkedin.com/in/') : '',
      githubUrl: raw.gh ? restoreUrl(raw.gh, 'https://github.com/') : '',
      twitterUrl: raw.tw ? restoreUrl(raw.tw, 'https://x.com/') : '',
      calendlyUrl: raw.cal ? restoreUrl(raw.cal, 'https://calendly.com/') : '',
      pitch: raw.pi || '',
      customLinks: Array.isArray(raw.k)
        ? raw.k.map((item: any, idx: number) => ({
            id: `link_${idx}_${Date.now()}`,
            title: item.t || 'Link',
            url: item.u ? restoreUrl(item.u) : '',
            subtitle: item.s,
            badgeText: item.b,
          }))
        : [],
    };
  }

  // Handle legacy payload schema ({ identity, contact, links, pitch })
  if (raw.identity) {
    const id = raw.identity;
    const contact = raw.contact || {};
    const links = Array.isArray(raw.links) ? raw.links : [];

    const getLinkUrl = (type: string) => {
      const found = links.find((l: any) => l.type === type);
      return found?.url || '';
    };

    const customLinks = links
      .filter((l: any) => !['portfolio', 'resume', 'linkedin', 'github', 'twitter', 'calendly', 'email', 'phone'].includes(l.type))
      .map((l: any, idx: number) => ({
        id: l.id || `custom_${idx}`,
        title: l.title || 'Link',
        url: l.url || '',
        subtitle: l.subtitle,
        badgeText: l.badgeText,
      }));

    return {
      userId: raw.userId || raw.uid || undefined,
      name: id.name || '',
      headline: id.headline || '',
      company: id.company || contact.organization || '',
      location: id.location || contact.location || '',
      bio: id.bio || '',
      statusBadge: id.statusBadge || '',
      phone: contact.phone || '',
      email: contact.email || '',
      portfolioUrl: getLinkUrl('portfolio') || contact.url || '',
      resumeUrl: getLinkUrl('resume') || '',
      linkedinUrl: getLinkUrl('linkedin') || '',
      githubUrl: getLinkUrl('github') || '',
      twitterUrl: getLinkUrl('x_twitter') || '',
      calendlyUrl: getLinkUrl('calendly') || '',
      pitch: raw.pitch || '',
      customLinks,
    };
  }

  return null;
}
