import QRCode from 'qrcode';
import { UserProfile } from '../types';
import { getMasterProfileURL } from './shareHelper';

export interface QROptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generates a crisp Data URL PNG of the QR code with automatic fallback for dense strings
 */
export async function generateQRDataURL(text: string, options?: QROptions): Promise<string> {
  const content = text || 'https://linkedin.com';
  const width = options?.width || 400;
  const margin = options?.margin ?? 2;
  const dark = options?.color?.dark || '#000000';
  const light = options?.color?.light || '#ffffff';

  // 1. Try requested or default 'M' error correction
  try {
    return await QRCode.toDataURL(content, {
      width,
      margin,
      color: { dark, light },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    });
  } catch (err1) {
    console.warn('QR Code generation with level M failed, falling back to level L for maximum density:', err1);
    // 2. Fallback to 'L' (Low - 7% error correction) which maximizes data payload size up to ~2,953 bytes
    try {
      return await QRCode.toDataURL(content, {
        width,
        margin,
        color: { dark, light },
        errorCorrectionLevel: 'L',
      });
    } catch (err2) {
      console.error('Fatal QR Code generation error:', err2);
      // 3. Fallback to basic URL
      try {
        return await QRCode.toDataURL(window.location.origin, {
          width,
          margin,
          color: { dark, light },
          errorCorrectionLevel: 'L',
        });
      } catch (err3) {
        return '';
      }
    }
  }
}

/**
 * Generates a clean SVG string of the QR code
 */
export async function generateQRSVG(text: string, options?: QROptions): Promise<string> {
  const content = text || 'https://linkedin.com';
  const width = options?.width || 320;
  const margin = options?.margin ?? 2;
  const dark = options?.color?.dark || '#000000';
  const light = options?.color?.light || '#ffffff';

  try {
    return await QRCode.toString(content, {
      type: 'svg',
      width,
      margin,
      color: { dark, light },
      errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    });
  } catch (err) {
    try {
      return await QRCode.toString(content, {
        type: 'svg',
        width,
        margin,
        color: { dark, light },
        errorCorrectionLevel: 'L',
      });
    } catch (err2) {
      console.error('Error generating QR SVG:', err2);
      return '';
    }
  }
}

/**
 * Downloads a generated image to the user's phone or desktop
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a Lock Screen Wallpaper (9:16 mobile ratio) containing the Master QR code + Name + Role
 */
export async function generateLockscreenWallpaper(profile: UserProfile): Promise<string> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background Dark / Deep Charcoal with subtle warm tone
  const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#0a0f1d');
  bgGrad.addColorStop(0.5, '#070b14');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative ambient glow at center top
  const glowGrad = ctx.createRadialGradient(width / 2, 850, 50, width / 2, 850, 600);
  glowGrad.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
  glowGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.12)');
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 300, width, 1100);

  // Header Title
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ASEQR LOCKSCREEN', width / 2, 210);

  // User Name
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 52px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(profile.name || 'Alex Morgan', width / 2, 310);

  // Headline
  ctx.fillStyle = '#93c5fd';
  ctx.font = '500 30px "Plus Jakarta Sans", sans-serif';
  const subtitle = [profile.headline, profile.company].filter(Boolean).join(' · ');
  ctx.fillText(subtitle || 'Scan to connect instantly', width / 2, 365);

  // White Card Container for QR Code with rounded corners
  const cardW = 680;
  const cardH = 760;
  const cardX = (width - cardW) / 2;
  const cardY = 480;
  const radius = 36;

  // Outer shadow for card
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 24;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Generate QR Code image for the master profile URL
  const profileUrl = getMasterProfileURL(profile);
  const qrDataUrl = await generateQRDataURL(profileUrl, {
    width: 520,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'L',
  });

  if (qrDataUrl) {
    const qrImg = new Image();
    await new Promise((resolve) => {
      qrImg.onload = resolve;
      qrImg.onerror = resolve;
      qrImg.src = qrDataUrl;
    });

    const qrSize = 520;
    const qrX = (width - qrSize) / 2;
    const qrY = cardY + 45;
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
  }

  // Card Footer Label
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ALL-IN-ONE DIGITAL CARD', width / 2, cardY + 625);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Point phone camera to view full profile & contact', width / 2, cardY + 675);

  // Bottom Footer helper on wallpaper
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('⚡ 1-Tap Save to Phone Contacts (.vcf) • Works Offline', width / 2, 1400);

  return canvas.toDataURL('image/png');
}
