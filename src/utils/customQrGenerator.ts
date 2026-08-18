import QRCode from 'qrcode';
import { CustomQRCode, VCardData } from '../types';
import { generateVCardString } from './vcard';

export interface RenderCustomQROptions {
  size?: number;
  includeFrame?: boolean;
  frameText?: string;
  fgColor?: string;
  bgColor?: string;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  centerIconName?: string;
  centerIconImage?: string;
}

/**
 * Builds the canonical QR text payload according to standard protocols
 */
export function buildQrPayload(
  type: CustomQRCode['type'],
  details: NonNullable<CustomQRCode['payloadDetails']>
): string {
  switch (type) {
    case 'link':
    case 'image': {
      let url = (details.url || details.imageUrl || '').trim();
      if (url && !/^https?:\/\//i.test(url)) {
        url = `https://${url}`;
      }
      return url || 'https://example.com';
    }

    case 'text': {
      return (details.plainText || '').trim() || 'Hello World';
    }

    case 'wifi': {
      const ssid = (details.wifiSsid || '').replace(/([\\;,:"])/g, '\\$1');
      const pass = (details.wifiPassword || '').replace(/([\\;,:"])/g, '\\$1');
      const enc = details.wifiEncryption || 'WPA';
      const hidden = details.wifiHidden ? 'H:true;' : '';
      return `WIFI:T:${enc};S:${ssid};P:${pass};${hidden};`;
    }

    case 'email': {
      const to = (details.emailTo || '').trim();
      const subject = details.emailSubject ? `subject=${encodeURIComponent(details.emailSubject)}` : '';
      const body = details.emailBody ? `body=${encodeURIComponent(details.emailBody)}` : '';
      const params = [subject, body].filter(Boolean).join('&');
      return `mailto:${to}${params ? `?${params}` : ''}`;
    }

    case 'sms': {
      const phone = (details.phone || '').trim();
      const msg = details.smsMessage || '';
      return `SMSTO:${phone}:${msg}`;
    }

    case 'whatsapp': {
      const phone = (details.phone || '').replace(/[^\d]/g, '');
      const msg = details.smsMessage ? encodeURIComponent(details.smsMessage) : '';
      return `https://wa.me/${phone}${msg ? `?text=${msg}` : ''}`;
    }

    case 'vcard': {
      if (details.vcardData) {
        return generateVCardString(details.vcardData);
      }
      return generateVCardString({ firstName: 'Contact', lastName: '' });
    }

    case 'event': {
      const title = details.eventTitle || 'Networking Event';
      const loc = details.eventLocation || '';
      const desc = details.eventDescription || '';
      const start = details.eventStart ? details.eventStart.replace(/[-:]/g, '') : '20260817T180000Z';
      const end = details.eventEnd ? details.eventEnd.replace(/[-:]/g, '') : '20260817T200000Z';

      return `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nLOCATION:${loc}\nDESCRIPTION:${desc}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT\nEND:VCALENDAR`;
    }

    default:
      return 'https://example.com';
  }
}

/**
 * Renders a full branded QR Code canvas with optional frame banner & center badge
 */
export async function renderCustomQRCanvas(
  content: string,
  options: RenderCustomQROptions = {}
): Promise<string> {
  const qrSize = options.size || 600;
  const fgColor = options.fgColor || '#000000';
  const bgColor = options.bgColor || '#ffffff';
  const margin = options.margin ?? 2;
  const ecLevel = options.errorCorrectionLevel || (options.centerIconName || options.centerIconImage ? 'H' : 'M');

  // Step 1: Generate base QR code
  const baseQrDataUrl = await QRCode.toDataURL(content || 'https://example.com', {
    width: qrSize,
    margin,
    color: {
      dark: fgColor,
      light: bgColor,
    },
    errorCorrectionLevel: ecLevel,
  });

  const qrImg = new Image();
  await new Promise((resolve) => {
    qrImg.onload = resolve;
    qrImg.onerror = resolve;
    qrImg.src = baseQrDataUrl;
  });

  // Step 2: Create target canvas with frame or simple square
  const includeFrame = Boolean(options.includeFrame && options.frameText);
  const frameHeight = includeFrame ? Math.round(qrSize * 0.18) : 0;
  const totalWidth = qrSize;
  const totalHeight = qrSize + frameHeight;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return baseQrDataUrl;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw QR Image
  ctx.drawImage(qrImg, 0, 0, qrSize, qrSize);

  // Step 3: Draw Center Badge if requested
  if (options.centerIconImage) {
    try {
      const centerImg = new Image();
      await new Promise((resolve) => {
        centerImg.onload = resolve;
        centerImg.onerror = resolve;
        centerImg.src = options.centerIconImage!;
      });

      const iconSize = Math.round(qrSize * 0.22);
      const iconX = (qrSize - iconSize) / 2;
      const iconY = (qrSize - iconSize) / 2;
      const badgePadding = 6;

      // Draw background shield for center icon
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(iconX - badgePadding, iconY - badgePadding, iconSize + badgePadding * 2, iconSize + badgePadding * 2, 14);
      ctx.fill();

      // Border around shield
      ctx.strokeStyle = fgColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Clip & Draw image
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(iconX, iconY, iconSize, iconSize, 10);
      ctx.clip();
      ctx.drawImage(centerImg, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    } catch {
      // ignore center icon failure
    }
  }

  // Step 4: Draw Frame Bottom Banner
  if (includeFrame && options.frameText) {
    const bannerY = qrSize;
    const bannerH = frameHeight;

    // Fill banner with foreground accent
    ctx.fillStyle = fgColor;
    ctx.beginPath();
    ctx.roundRect(margin * 4, bannerY - 4, totalWidth - margin * 8, bannerH - margin * 4, 12);
    ctx.fill();

    // Banner Text
    ctx.fillStyle = bgColor === '#ffffff' ? '#ffffff' : '#000000';
    ctx.font = `800 ${Math.round(frameHeight * 0.38)}px "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.frameText.toUpperCase(), totalWidth / 2, bannerY + bannerH / 2 - 2);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generates an SVG vector representation of the QR code
 */
export async function renderCustomQRSVG(
  content: string,
  options: RenderCustomQROptions = {}
): Promise<string> {
  const fgColor = options.fgColor || '#000000';
  const bgColor = options.bgColor || '#ffffff';
  const margin = options.margin ?? 2;
  const ecLevel = options.errorCorrectionLevel || (options.centerIconName || options.centerIconImage ? 'H' : 'M');

  try {
    return await QRCode.toString(content || 'https://example.com', {
      type: 'svg',
      margin,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: ecLevel,
    });
  } catch (err) {
    console.error('Error generating custom QR SVG:', err);
    return '';
  }
}
