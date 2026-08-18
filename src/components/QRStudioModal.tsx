import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CustomQRCode, VCardData } from '../types';
import { buildQrPayload, renderCustomQRCanvas, renderCustomQRSVG } from '../utils/customQrGenerator';
import { downloadDataUrl } from '../utils/qrHelper';
import { 
  QrCode, 
  X, 
  Link as LinkIcon, 
  FileText, 
  Image as ImageIcon, 
  Wifi, 
  Mail, 
  MessageSquare, 
  Contact, 
  Calendar, 
  Download, 
  Copy, 
  Check, 
  Save, 
  Trash2, 
  Sparkles, 
  Palette, 
  Layers, 
  Plus, 
  FolderHeart, 
  Maximize2, 
  ExternalLink,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Share2,
  Upload,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRStudioModalProps {
  customQRs: CustomQRCode[];
  onSaveQR: (qr: CustomQRCode) => Promise<void>;
  onDeleteQR: (qrId: string) => Promise<void>;
  onClose: () => void;
  userId?: string;
  userName?: string;
}

type QrType = CustomQRCode['type'];

const COLOR_PRESETS = [
  { name: 'Obsidian Black', fg: '#09090b', bg: '#ffffff' },
  { name: 'Electric Indigo', fg: '#4f46e5', bg: '#ffffff' },
  { name: 'Emerald Forest', fg: '#059669', bg: '#ffffff' },
  { name: 'Royal Purple', fg: '#7c3aed', bg: '#ffffff' },
  { name: 'Crimson Red', fg: '#dc2626', bg: '#ffffff' },
  { name: 'Midnight Blue', fg: '#0284c7', bg: '#ffffff' },
  { name: 'Sunset Amber', fg: '#d97706', bg: '#ffffff' },
  { name: 'Cyber Neon Dark', fg: '#22d3ee', bg: '#09090b' },
  { name: 'Dark Emerald', fg: '#34d399', bg: '#09090b' },
  { name: 'Dark Indigo', fg: '#818cf8', bg: '#09090b' },
];

const PRESET_CENTER_ICONS = [
  { id: 'link', label: 'Link', icon: '🔗' },
  { id: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { id: 'image', label: 'Image', icon: '🖼️' },
  { id: 'text', label: 'Note', icon: '📝' },
  { id: 'email', label: 'Mail', icon: '✉️' },
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'user', label: 'Contact', icon: '👤' },
  { id: 'star', label: 'Star', icon: '⭐' },
  { id: 'event', label: 'Event', icon: '📅' },
  { id: 'github', label: 'GitHub', icon: '💻' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'portfolio', label: 'Portfolio', icon: '🎨' },
];

export function QRStudioModal({
  customQRs,
  onSaveQR,
  onDeleteQR,
  onClose,
  userId,
  userName,
}: QRStudioModalProps) {
  // Navigation tabs in Studio: 'generator' | 'library'
  const [activeTab, setActiveTab] = useState<'generator' | 'library'>('generator');
  const [selectedQRId, setSelectedQRId] = useState<string | null>(null);

  // Form State for Active QR Being Created/Edited
  const [title, setTitle] = useState('My Custom QR Code');
  const [qrType, setQrType] = useState<QrType>('link');

  // Payload Details State
  const [url, setUrl] = useState('https://');
  const [plainText, setPlainText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [phone, setPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [vcardData, setVcardData] = useState<VCardData>({
    firstName: '',
    lastName: '',
    organization: '',
    jobTitle: '',
    phone: '',
    email: '',
    url: '',
    note: '',
  });
  const [eventTitle, setEventTitle] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  // Styling State
  const [fgColor, setFgColor] = useState('#4f46e5');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [margin, setMargin] = useState(2);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [hasFrame, setHasFrame] = useState(true);
  const [frameCtaText, setFrameCtaText] = useState('SCAN ME');
  const [centerIconImage, setCenterIconImage] = useState<string | undefined>(undefined);

  // Preview & Rendered Output State
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportSize, setExportSize] = useState<number>(1000);
  const [libraryFilter, setLibraryFilter] = useState<string>('all');
  const [librarySearch, setLibrarySearch] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute Raw Encoded Content
  const computedPayloadDetails = useMemo(() => {
    return {
      url,
      plainText,
      imageUrl,
      wifiSsid,
      wifiPassword,
      wifiEncryption,
      wifiHidden,
      emailTo,
      emailSubject,
      emailBody,
      phone,
      smsMessage,
      vcardData,
      eventTitle,
      eventLocation,
      eventStart,
      eventEnd,
      eventDescription,
    };
  }, [
    url,
    plainText,
    imageUrl,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    wifiHidden,
    emailTo,
    emailSubject,
    emailBody,
    phone,
    smsMessage,
    vcardData,
    eventTitle,
    eventLocation,
    eventStart,
    eventEnd,
    eventDescription,
  ]);

  const rawContent = useMemo(() => {
    return buildQrPayload(qrType, computedPayloadDetails);
  }, [qrType, computedPayloadDetails]);

  // Re-render Preview Canvas when parameters change
  useEffect(() => {
    let isCancelled = false;

    async function updatePreview() {
      setIsRendering(true);
      try {
        const dataUrl = await renderCustomQRCanvas(rawContent, {
          size: 600,
          includeFrame: hasFrame,
          frameText: frameCtaText,
          fgColor,
          bgColor,
          margin,
          errorCorrectionLevel: centerIconImage ? 'H' : errorCorrectionLevel,
          centerIconImage,
        });

        if (!isCancelled) {
          setPreviewDataUrl(dataUrl);
        }
      } catch (err) {
        console.error('Error rendering QR preview:', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    }

    const timer = setTimeout(updatePreview, 60);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    rawContent,
    hasFrame,
    frameCtaText,
    fgColor,
    bgColor,
    margin,
    errorCorrectionLevel,
    centerIconImage,
  ]);

  // Handler to load a saved QR from library into editor
  const handleLoadFromLibrary = (qr: CustomQRCode) => {
    setSelectedQRId(qr.id);
    setTitle(qr.title);
    setQrType(qr.type);

    if (qr.payloadDetails) {
      if (qr.payloadDetails.url) setUrl(qr.payloadDetails.url);
      if (qr.payloadDetails.plainText) setPlainText(qr.payloadDetails.plainText);
      if (qr.payloadDetails.imageUrl) setImageUrl(qr.payloadDetails.imageUrl);
      if (qr.payloadDetails.wifiSsid) setWifiSsid(qr.payloadDetails.wifiSsid);
      if (qr.payloadDetails.wifiPassword) setWifiPassword(qr.payloadDetails.wifiPassword);
      if (qr.payloadDetails.wifiEncryption) setWifiEncryption(qr.payloadDetails.wifiEncryption);
      if (qr.payloadDetails.wifiHidden !== undefined) setWifiHidden(qr.payloadDetails.wifiHidden);
      if (qr.payloadDetails.emailTo) setEmailTo(qr.payloadDetails.emailTo);
      if (qr.payloadDetails.emailSubject) setEmailSubject(qr.payloadDetails.emailSubject);
      if (qr.payloadDetails.emailBody) setEmailBody(qr.payloadDetails.emailBody);
      if (qr.payloadDetails.phone) setPhone(qr.payloadDetails.phone);
      if (qr.payloadDetails.smsMessage) setSmsMessage(qr.payloadDetails.smsMessage);
      if (qr.payloadDetails.vcardData) setVcardData(qr.payloadDetails.vcardData);
      if (qr.payloadDetails.eventTitle) setEventTitle(qr.payloadDetails.eventTitle);
      if (qr.payloadDetails.eventLocation) setEventLocation(qr.payloadDetails.eventLocation);
      if (qr.payloadDetails.eventStart) setEventStart(qr.payloadDetails.eventStart);
      if (qr.payloadDetails.eventEnd) setEventEnd(qr.payloadDetails.eventEnd);
      if (qr.payloadDetails.eventDescription) setEventDescription(qr.payloadDetails.eventDescription);
    }

    if (qr.styling) {
      setFgColor(qr.styling.fgColor || '#4f46e5');
      setBgColor(qr.styling.bgColor || '#ffffff');
      setMargin(qr.styling.margin ?? 2);
      setErrorCorrectionLevel(qr.styling.errorCorrectionLevel || 'M');
      setHasFrame(Boolean(qr.styling.frameCtaText));
      setFrameCtaText(qr.styling.frameCtaText || 'SCAN ME');
      setCenterIconImage(qr.styling.centerIcon);
    }

    setActiveTab('generator');
  };

  // Reset form to brand new QR
  const handleCreateNew = (newType: QrType = 'link') => {
    setSelectedQRId(null);
    setQrType(newType);
    setTitle(`New ${newType.toUpperCase()} QR Code`);

    if (newType === 'link') {
      setUrl('https://');
      setFrameCtaText('VISIT LINK');
    } else if (newType === 'text') {
      setPlainText('');
      setFrameCtaText('READ NOTE');
    } else if (newType === 'image') {
      setImageUrl('https://images.unsplash.com/photo-1579546929518-9e396f3cc809');
      setFrameCtaText('VIEW IMAGE');
    } else if (newType === 'wifi') {
      setWifiSsid('');
      setWifiPassword('');
      setFrameCtaText('CONNECT WI-FI');
    } else if (newType === 'email') {
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
      setFrameCtaText('SEND EMAIL');
    } else if (newType === 'sms' || newType === 'whatsapp') {
      setPhone('');
      setSmsMessage('');
      setFrameCtaText(newType === 'whatsapp' ? 'CHAT ON WHATSAPP' : 'SEND SMS');
    } else if (newType === 'vcard') {
      setVcardData({ firstName: userName || 'Alex', lastName: '', phone: '', email: '' });
      setFrameCtaText('SAVE CONTACT');
    } else if (newType === 'event') {
      setEventTitle('Meetup & Networking');
      setFrameCtaText('ADD EVENT');
    }

    setActiveTab('generator');
  };

  // Save to Library
  const handleSaveToLibrary = async () => {
    setIsSaving(true);
    try {
      const qrId = selectedQRId || `custom_qr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newQR: CustomQRCode = {
        id: qrId,
        userId,
        title: title.trim() || `My ${qrType.toUpperCase()} QR`,
        type: qrType,
        content: rawContent,
        createdAt: selectedQRId ? (customQRs.find(q => q.id === selectedQRId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        payloadDetails: computedPayloadDetails,
        styling: {
          fgColor,
          bgColor,
          margin,
          errorCorrectionLevel,
          frameCtaText: hasFrame ? frameCtaText : undefined,
          centerIcon: centerIconImage,
          centerIconType: centerIconImage ? 'image' : 'none',
        },
      };

      await onSaveQR(newQR);
      setSelectedQRId(qrId);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Error saving custom QR:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Download High-Res PNG
  const handleDownloadPNG = async () => {
    try {
      const highResDataUrl = await renderCustomQRCanvas(rawContent, {
        size: exportSize,
        includeFrame: hasFrame,
        frameText: frameCtaText,
        fgColor,
        bgColor,
        margin,
        errorCorrectionLevel: centerIconImage ? 'H' : errorCorrectionLevel,
        centerIconImage,
      });

      const cleanTitle = (title || 'qr-code').toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadDataUrl(highResDataUrl, `${cleanTitle}_${exportSize}px.png`);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Download SVG Vector
  const handleDownloadSVG = async () => {
    try {
      const svgString = await renderCustomQRSVG(rawContent, {
        fgColor,
        bgColor,
        margin,
        errorCorrectionLevel: centerIconImage ? 'H' : errorCorrectionLevel,
      });

      if (!svgString) return;
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(title || 'qr-code').toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('SVG download error:', err);
    }
  };

  // Copy encoded content
  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(rawContent);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const res = await fetch(previewDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
    } catch (err) {
      console.error('Copy image error:', err);
      // Fallback copy content
      handleCopyContent();
    }
  };

  // Center logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCenterIconImage(reader.result as string);
      setErrorCorrectionLevel('H'); // Boost error correction for center logo safety
    };
    reader.readAsDataURL(file);
  };

  // Filtered Library Items
  const filteredLibrary = useMemo(() => {
    return customQRs.filter((item) => {
      if (libraryFilter !== 'all' && item.type !== libraryFilter) return false;
      if (librarySearch.trim()) {
        const q = librarySearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.content.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [customQRs, libraryFilter, librarySearch]);

  const getTypeIcon = (type: QrType) => {
    switch (type) {
      case 'link': return <LinkIcon className="w-4 h-4 text-indigo-400" />;
      case 'text': return <FileText className="w-4 h-4 text-purple-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-pink-400" />;
      case 'wifi': return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'email': return <Mail className="w-4 h-4 text-sky-400" />;
      case 'sms':
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-teal-400" />;
      case 'vcard': return <Contact className="w-4 h-4 text-amber-400" />;
      case 'event': return <Calendar className="w-4 h-4 text-orange-400" />;
      default: return <QrCode className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Studio Top Navigation Bar */}
        <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-950">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  QR Studio & Generator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                  Universal Suite
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Generate high-definition QR codes for links, text, images, Wi-Fi & contacts
              </p>
            </div>
          </div>

          {/* Tab Switcher & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-800/80 p-1 rounded-xl border border-neutral-700">
              <button
                id="studio-tab-generator"
                onClick={() => setActiveTab('generator')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'generator'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Designer</span>
              </button>

              <button
                id="studio-tab-library"
                onClick={() => setActiveTab('library')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'library'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                <FolderHeart className="w-3.5 h-3.5" />
                <span>My Library ({customQRs.length})</span>
              </button>
            </div>

            <button
              id="studio-close-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Studio Content Area */}
        {activeTab === 'generator' ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-neutral-800">
            
            {/* LEFT COLUMN: Input Forms & Styling Controls (7 cols) */}
            <div className="lg:col-span-7 p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(94vh-120px)]">
              
              {/* QR Title & Quick Type Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    QR Code Label & Purpose
                  </label>
                  {selectedQRId && (
                    <span className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Editing saved QR
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Portfolio Website, Guest Wi-Fi, Demo Image, Event RSVP"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-semibold text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* QR Content Type Grid Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Select Content Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'link', label: 'Website / Link', icon: LinkIcon, desc: 'Any web address' },
                    { id: 'text', label: 'Text / Note', icon: FileText, desc: 'Plain text or notes' },
                    { id: 'image', label: 'Image / Photo', icon: ImageIcon, desc: 'Direct image link' },
                    { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi, desc: 'Instant 1-tap join' },
                    { id: 'email', label: 'Email Draft', icon: Mail, desc: 'Pre-filled mailto' },
                    { id: 'whatsapp', label: 'WhatsApp / SMS', icon: MessageSquare, desc: 'Direct message' },
                    { id: 'vcard', label: 'Contact Card', icon: Contact, desc: '.vcf contact info' },
                    { id: 'event', label: 'Calendar Event', icon: Calendar, desc: 'Add to calendar' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = qrType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setQrType(item.id as QrType);
                          if (!selectedQRId) {
                            if (item.id === 'wifi') setFrameCtaText('CONNECT WI-FI');
                            else if (item.id === 'image') setFrameCtaText('VIEW IMAGE');
                            else if (item.id === 'link') setFrameCtaText('VISIT LINK');
                            else if (item.id === 'text') setFrameCtaText('READ NOTE');
                            else if (item.id === 'event') setFrameCtaText('ADD EVENT');
                            else if (item.id === 'vcard') setFrameCtaText('SAVE CONTACT');
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-600/15 border-indigo-500/80 shadow-sm text-white'
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-neutral-400'}`} />
                          <span className="text-xs font-bold leading-tight truncate">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 mt-1 truncate">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC FORM PER TYPE */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4">
                
                {/* 1. LINK / URL */}
                {qrType === 'link' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                        Target Web URL
                      </label>
                      <div className="flex items-center gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setUrl('https://linkedin.com/in/')}
                          className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                          LinkedIn
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrl('https://github.com/')}
                          className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 hover:text-white"
                        >
                          GitHub
                        </button>
                      </div>
                    </div>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://yourportfolio.com/project"
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                )}

                {/* 2. PLAIN TEXT / NOTES */}
                {qrType === 'text' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      Plain Text Payload / Notes
                    </label>
                    <textarea
                      rows={4}
                      value={plainText}
                      onChange={(e) => setPlainText(e.target.value)}
                      placeholder="Enter conference notes, directions, secret message, or credentials..."
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 leading-relaxed font-mono"
                    />
                  </div>
                )}

                {/* 3. IMAGE / MEDIA SHOWCASE */}
                {qrType === 'image' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                      Image / Media Web Link
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or Google Drive public image link"
                      className="w-full px-3.5 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />

                    {imageUrl && (
                      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-900 border border-neutral-800">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-lg object-cover bg-neutral-950 border border-neutral-700"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-white">Live Image Link Validated</p>
                          <p className="text-[11px] text-neutral-400">Attendees will immediately open this image upon scanning.</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. WI-FI HOTSPOT */}
                {qrType === 'wifi' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                          Network SSID (Name)
                        </label>
                        <input
                          type="text"
                          value={wifiSsid}
                          onChange={(e) => setWifiSsid(e.target.value)}
                          placeholder="e.g. Hotel_Guest_5G"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                          Wi-Fi Password
                        </label>
                        <input
                          type="text"
                          value={wifiPassword}
                          onChange={(e) => setWifiPassword(e.target.value)}
                          placeholder="Password (or leave blank if open)"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-400 text-xs">Security:</span>
                        {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                          <button
                            key={enc}
                            type="button"
                            onClick={() => setWifiEncryption(enc)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              wifiEncryption === enc
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                            }`}
                          >
                            {enc === 'nopass' ? 'Open' : enc}
                          </button>
                        ))}
                      </div>

                      <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wifiHidden}
                          onChange={(e) => setWifiHidden(e.target.checked)}
                          className="rounded text-emerald-500 focus:ring-emerald-500 bg-neutral-900"
                        />
                        <span>Hidden Network</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* 5. EMAIL DRAFT */}
                {qrType === 'email' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Recipient Email</label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        placeholder="hello@example.com"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Pre-filled Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="e.g. Great meeting you at the conference!"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Default Body Text</label>
                      <textarea
                        rows={2}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        placeholder="Hi there, let's connect and schedule a follow-up chat..."
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* 6. WHATSAPP / SMS */}
                {(qrType === 'whatsapp' || qrType === 'sms') && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">
                        Phone Number (with Country Code)
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Pre-composed Message</label>
                      <textarea
                        rows={2}
                        value={smsMessage}
                        onChange={(e) => setSmsMessage(e.target.value)}
                        placeholder="Hey Alex, let's stay in touch!"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                {/* 7. VCARD CONTACT */}
                {qrType === 'vcard' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">First Name</label>
                        <input
                          type="text"
                          value={vcardData.firstName}
                          onChange={(e) => setVcardData({ ...vcardData, firstName: e.target.value })}
                          placeholder="First Name"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Last Name</label>
                        <input
                          type="text"
                          value={vcardData.lastName}
                          onChange={(e) => setVcardData({ ...vcardData, lastName: e.target.value })}
                          placeholder="Last Name"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Company / Org</label>
                        <input
                          type="text"
                          value={vcardData.organization || ''}
                          onChange={(e) => setVcardData({ ...vcardData, organization: e.target.value })}
                          placeholder="Tech Corp"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Phone</label>
                        <input
                          type="tel"
                          value={vcardData.phone || ''}
                          onChange={(e) => setVcardData({ ...vcardData, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. CALENDAR EVENT */}
                {qrType === 'event' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Event Title</label>
                      <input
                        type="text"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="Developer Summit 2026 Keynote"
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Location</label>
                        <input
                          type="text"
                          value={eventLocation}
                          onChange={(e) => setEventLocation(e.target.value)}
                          placeholder="Moscone Center, SF"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 block mb-1">Start Date/Time</label>
                        <input
                          type="text"
                          value={eventStart}
                          onChange={(e) => setEventStart(e.target.value)}
                          placeholder="2026-08-20 18:00"
                          className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* CUSTOM VISUAL STYLING & BRANDING */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-400" />
                    Color Presets & Styling
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-neutral-400">Margin:</span>
                    <select
                      value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-0.5 text-xs text-neutral-200"
                    >
                      <option value={1}>Compact (1)</option>
                      <option value={2}>Standard (2)</option>
                      <option value={4}>Spacious (4)</option>
                    </select>
                  </div>
                </div>

                {/* Color Palette Swatches */}
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setFgColor(preset.fg);
                        setBgColor(preset.bg);
                      }}
                      className={`h-8 rounded-xl border flex items-center justify-center transition-all ${
                        fgColor === preset.fg && bgColor === preset.bg
                          ? 'ring-2 ring-indigo-500 scale-105 border-white'
                          : 'border-neutral-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.bg }}
                      title={preset.name}
                    >
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.fg }} />
                    </button>
                  ))}
                </div>

                {/* Custom Color Pickers */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <div className="text-xs">
                      <p className="text-neutral-400 text-[10px]">QR Code Fill</p>
                      <p className="font-mono font-semibold text-neutral-200">{fgColor}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <div className="text-xs">
                      <p className="text-neutral-400 text-[10px]">Background</p>
                      <p className="font-mono font-semibold text-neutral-200">{bgColor}</p>
                    </div>
                  </div>
                </div>

                {/* Call-to-Action Frame Banner */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasFrame}
                        onChange={(e) => setHasFrame(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 bg-neutral-900"
                      />
                      <span>Include Call-to-Action Bottom Banner</span>
                    </label>

                    {hasFrame && (
                      <div className="flex items-center gap-1">
                        {['SCAN ME', 'VISIT LINK', 'CONNECT', 'GRAB OFFER'].map((txt) => (
                          <button
                            key={txt}
                            type="button"
                            onClick={() => setFrameCtaText(txt)}
                            className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
                          >
                            {txt}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {hasFrame && (
                    <input
                      type="text"
                      value={frameCtaText}
                      onChange={(e) => setFrameCtaText(e.target.value)}
                      placeholder="e.g. SCAN ME, VIEW RESUME, JOIN WI-FI"
                      className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-bold text-white uppercase tracking-wider focus:outline-none focus:border-indigo-500"
                    />
                  )}
                </div>

                {/* Center Logo / Avatar Upload */}
                <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      Center Logo / Avatar (Optional)
                    </label>
                    {centerIconImage && (
                      <button
                        type="button"
                        onClick={() => setCenterIconImage(undefined)}
                        className="text-[10px] text-rose-400 hover:underline"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-200 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{centerIconImage ? 'Replace Logo Image' : 'Upload Center Logo PNG/JPG'}</span>
                    </button>

                    {centerIconImage && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-neutral-700 bg-white p-0.5">
                        <img src={centerIconImage} alt="Logo" className="w-full h-full object-contain rounded" />
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT COLUMN: Live Interactive QR Preview & Export Suite (5 cols) */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-neutral-950/50 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    Live Canvas Preview
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fullscreen</span>
                  </button>
                </div>

                {/* QR Display Card with Shadow & Border */}
                <div className="relative p-6 sm:p-8 rounded-3xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center shadow-2xl group">
                  <div className="relative rounded-2xl overflow-hidden shadow-md max-w-[280px] sm:max-w-[320px]">
                    {previewDataUrl ? (
                      <img
                        src={previewDataUrl}
                        alt="Generated Custom QR Code"
                        className="w-full h-auto object-contain select-none"
                      />
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-neutral-950 text-neutral-500 text-xs">
                        Rendering QR...
                      </div>
                    )}

                    {isRendering && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* QR Encoded Info */}
                  <div className="mt-4 text-center max-w-xs space-y-1">
                    <p className="text-sm font-bold text-white truncate">{title || 'Custom QR'}</p>
                    <p className="text-[11px] text-neutral-400 font-mono truncate px-2">
                      {rawContent}
                    </p>
                  </div>
                </div>

                {/* Quick Copy Action Badges */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 transition-colors"
                  >
                    {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyContent}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold text-neutral-200 transition-colors"
                  >
                    {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <LinkIcon className="w-3.5 h-3.5" />}
                    <span>{copiedContent ? 'Payload Copied!' : 'Copy String'}</span>
                  </button>
                </div>
              </div>

              {/* High-Res Export & Save to Library Footers */}
              <div className="space-y-3 pt-4 border-t border-neutral-800">
                
                {/* Resolution Selector for PNG */}
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Export Resolution:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { label: '600px', val: 600 },
                      { label: '1200px HD', val: 1200 },
                      { label: '2400px Print', val: 2400 },
                    ].map((sz) => (
                      <button
                        key={sz.val}
                        type="button"
                        onClick={() => setExportSize(sz.val)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          exportSize === sz.val
                            ? 'bg-indigo-600 text-white'
                            : 'bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    id="studio-download-png-btn"
                    type="button"
                    onClick={handleDownloadPNG}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 font-bold text-xs transition-colors shadow-sm active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download PNG</span>
                  </button>

                  <button
                    id="studio-download-svg-btn"
                    type="button"
                    onClick={handleDownloadSVG}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 font-bold text-xs transition-colors shadow-sm active:scale-[0.98]"
                  >
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Download SVG</span>
                  </button>
                </div>

                {/* Save to Cloud / Local Library */}
                <button
                  id="studio-save-library-btn"
                  type="button"
                  onClick={handleSaveToLibrary}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs tracking-wide transition-all shadow-lg shadow-indigo-950 active:scale-[0.99] disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving to Your QR Library...' : selectedQRId ? 'Update Saved QR Code' : 'Save to My QR Library'}</span>
                </button>
              </div>

            </div>

          </div>
        ) : (
          /* MY QR LIBRARY VIEW */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 max-h-[calc(94vh-120px)]">
            
            {/* Library Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-950/70 p-3 rounded-2xl border border-neutral-800">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Your Saved QR Codes ({customQRs.length})</h3>
                  <p className="text-xs text-neutral-400">Manage, present, or re-customize your saved QR codes</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCreateNew('link')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New QR</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'link', 'text', 'image', 'wifi', 'email', 'sms', 'vcard', 'event'].map((t) => (
                <button
                  key={t}
                  onClick={() => setLibraryFilter(t)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    libraryFilter === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {t === 'all' ? 'All Codes' : t.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Library Grid */}
            {filteredLibrary.length === 0 ? (
              <div className="py-16 text-center rounded-2xl bg-neutral-950/60 border border-neutral-800">
                <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 mx-auto mb-3">
                  <QrCode className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No QR codes found</h4>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                  Create custom QR codes for your portfolio, booth Wi-Fi, secret notes, or events and save them to your library.
                </p>
                <button
                  onClick={() => handleCreateNew('link')}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
                >
                  Create Your First QR
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLibrary.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                            {item.type}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteQR(item.id)}
                        className="opacity-60 hover:opacity-100 p-1 rounded-lg hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors"
                        title="Delete QR code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Content preview string */}
                    <div className="p-2 rounded-xl bg-neutral-900/80 border border-neutral-800/80 text-[11px] font-mono text-neutral-400 truncate">
                      {item.content}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80">
                      <button
                        onClick={() => handleLoadFromLibrary(item)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit / Customize</span>
                      </button>

                      <button
                        onClick={async () => {
                          const dataUrl = await renderCustomQRCanvas(item.content, {
                            size: 800,
                            includeFrame: Boolean(item.styling?.frameCtaText),
                            frameText: item.styling?.frameCtaText,
                            fgColor: item.styling?.fgColor,
                            bgColor: item.styling?.bgColor,
                            margin: item.styling?.margin,
                            errorCorrectionLevel: item.styling?.errorCorrectionLevel,
                            centerIconImage: item.styling?.centerIcon,
                          });
                          downloadDataUrl(dataUrl, `${item.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`);
                        }}
                        className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                        title="Quick Download PNG"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* FULLSCREEN PRESENTER OVERLAY */}
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 p-3 rounded-2xl bg-neutral-900 text-white hover:bg-neutral-800 border border-neutral-700"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="max-w-md w-full text-center space-y-4">
              <div className="p-6 rounded-3xl bg-white shadow-2xl flex flex-col items-center">
                <img src={previewDataUrl} alt="Fullscreen QR" className="w-full h-auto object-contain" />
              </div>
              <h3 className="text-xl font-extrabold text-white">{title}</h3>
              <p className="text-xs text-neutral-400 font-mono">{rawContent}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
