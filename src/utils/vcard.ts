import { VCardData, WifiData } from '../types';

/**
 * Builds a vCard 3.0 formatted string compliant with iOS Camera and Android Lens
 */
export function generateVCardString(data: VCardData): string {
  const parts: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const fn = [data.firstName, data.lastName].filter(Boolean).join(' ').trim() || 'Contact';
  parts.push(`FN:${escapeVCardValue(fn)}`);
  parts.push(`N:${escapeVCardValue(data.lastName || '')};${escapeVCardValue(data.firstName || '')};;;`);

  if (data.organization) {
    parts.push(`ORG:${escapeVCardValue(data.organization)}`);
  }

  if (data.jobTitle) {
    parts.push(`TITLE:${escapeVCardValue(data.jobTitle)}`);
  }

  if (data.phone) {
    const cleanPhone = data.phone.trim();
    parts.push(`TEL;TYPE=CELL,VOICE:${escapeVCardValue(cleanPhone)}`);
  }

  if (data.email) {
    parts.push(`EMAIL;TYPE=WORK,INTERNET:${escapeVCardValue(data.email.trim())}`);
  }

  if (data.url) {
    let cleanUrl = data.url.trim();
    if (!/^https?:\/\//i.test(cleanUrl) && cleanUrl.length > 0) {
      cleanUrl = `https://${cleanUrl}`;
    }
    parts.push(`URL:${escapeVCardValue(cleanUrl)}`);
  }

  if (data.note) {
    parts.push(`NOTE:${escapeVCardValue(data.note)}`);
  }

  if (data.location) {
    parts.push(`ADR;TYPE=WORK:;;;${escapeVCardValue(data.location)};;;`);
  }

  parts.push('END:VCARD');
  return parts.join('\r\n');
}

/**
 * Builds standard WiFi config string (WIFI:T:WPA;S:ssid;P:password;;)
 */
export function generateWifiString(data: WifiData): string {
  const enc = data.encryption || 'WPA';
  const hidden = data.hidden ? 'true' : 'false';
  const pass = data.password ? `P:${escapeSpecial(data.password)};` : '';
  return `WIFI:T:${enc};S:${escapeSpecial(data.ssid)};${pass}H:${hidden};;`;
}

function escapeSpecial(str: string): string {
  return str.replace(/([\\;,:"])/g, '\\$1');
}

function escapeVCardValue(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/**
 * Parses raw text from a scanned QR code into structured info
 */
export function parseScannedContent(raw: string): {
  type: 'vcard' | 'linkedin' | 'url' | 'wifi' | 'email' | 'text';
  title: string;
  subtitle?: string;
  vCardData?: VCardData;
} {
  const trimmed = raw.trim();

  // 1. Check vCard
  if (trimmed.includes('BEGIN:VCARD') || trimmed.startsWith('MECARD:')) {
    const vcard = parseVCardString(trimmed);
    const name = [vcard.firstName, vcard.lastName].filter(Boolean).join(' ') || 'Scanned Contact';
    const sub = [vcard.jobTitle, vcard.organization].filter(Boolean).join(' · ') || vcard.email || vcard.phone;
    return {
      type: 'vcard',
      title: name,
      subtitle: sub,
      vCardData: vcard,
    };
  }

  // 2. Check WiFi
  if (trimmed.startsWith('WIFI:')) {
    const ssidMatch = trimmed.match(/S:([^;]+)/);
    const ssid = ssidMatch ? ssidMatch[1] : 'Wi-Fi Network';
    return {
      type: 'wifi',
      title: `Wi-Fi: ${ssid}`,
      subtitle: 'Scan to connect immediately',
    };
  }

  // 3. Check LinkedIn URL
  if (/linkedin\.com\/in\/([^/?#\s]+)/i.test(trimmed)) {
    const match = trimmed.match(/linkedin\.com\/in\/([^/?#\s]+)/i);
    const handle = match ? match[1] : 'LinkedIn Profile';
    return {
      type: 'linkedin',
      title: `LinkedIn: ${handle}`,
      subtitle: trimmed,
    };
  }

  // 4. Check Email (mailto: or raw email)
  if (trimmed.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    const email = trimmed.replace(/^mailto:/i, '');
    return {
      type: 'email',
      title: `Email: ${email}`,
      subtitle: 'Tap to compose email',
    };
  }

  // 5. Check URL
  if (/^https?:\/\//i.test(trimmed) || /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(trimmed)) {
    const cleanUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(cleanUrl);
      return {
        type: 'url',
        title: parsed.hostname.replace(/^www\./, ''),
        subtitle: cleanUrl,
      };
    } catch {
      return {
        type: 'url',
        title: trimmed,
        subtitle: 'Web Link',
      };
    }
  }

  // 6. Plain text / Pitch note
  const firstLine = trimmed.split('\n')[0].slice(0, 45);
  return {
    type: 'text',
    title: firstLine || 'Plain Text Note',
    subtitle: trimmed.length > 45 ? `${trimmed.length} characters` : undefined,
  };
}

/**
 * Basic vCard parser for scanned contacts
 */
export function parseVCardString(text: string): VCardData {
  const result: VCardData = {
    firstName: '',
    lastName: '',
  };

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const clean = line.trim();
    if (clean.startsWith('FN:')) {
      const parts = clean.substring(3).trim().split(' ');
      result.firstName = parts[0] || '';
      result.lastName = parts.slice(1).join(' ') || '';
    } else if (clean.startsWith('N:') && !result.firstName) {
      const parts = clean.substring(2).split(';');
      result.lastName = parts[0]?.replace(/\\/g, '') || '';
      result.firstName = parts[1]?.replace(/\\/g, '') || '';
    } else if (clean.startsWith('ORG:')) {
      result.organization = clean.substring(4).replace(/\\/g, '').trim();
    } else if (clean.startsWith('TITLE:')) {
      result.jobTitle = clean.substring(6).replace(/\\/g, '').trim();
    } else if (/^TEL([;:].*)?:/i.test(clean)) {
      const val = clean.substring(clean.indexOf(':') + 1).replace(/\\/g, '').trim();
      result.phone = val;
    } else if (/^EMAIL([;:].*)?:/i.test(clean)) {
      const val = clean.substring(clean.indexOf(':') + 1).replace(/\\/g, '').trim();
      result.email = val;
    } else if (/^URL([;:].*)?:/i.test(clean)) {
      const val = clean.substring(clean.indexOf(':') + 1).trim();
      result.url = val;
    } else if (clean.startsWith('NOTE:')) {
      result.note = clean.substring(5).replace(/\\n/g, '\n').replace(/\\/g, '').trim();
    }
  }

  // Fallback for MECARD format
  if (text.startsWith('MECARD:')) {
    const nMatch = text.match(/N:([^;]+)/);
    if (nMatch) {
      const parts = nMatch[1].split(',');
      result.lastName = parts[0] || '';
      result.firstName = parts[1] || '';
    }
    const telMatch = text.match(/TEL:([^;]+)/);
    if (telMatch) result.phone = telMatch[1];
    const emailMatch = text.match(/EMAIL:([^;]+)/);
    if (emailMatch) result.email = emailMatch[1];
    const urlMatch = text.match(/URL:([^;]+)/);
    if (urlMatch) result.url = urlMatch[1];
    const orgMatch = text.match(/ORG:([^;]+)/);
    if (orgMatch) result.organization = orgMatch[1];
  }

  return result;
}
