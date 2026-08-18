import { useEffect, useRef, useState, ChangeEvent } from 'react';
import jsQR from 'jsqr';
import { ScannedContact } from '../types';
import { parseScannedContent } from '../utils/vcard';
import { 
  X, 
  Camera, 
  Upload, 
  Check, 
  ExternalLink, 
  UserCheck, 
  Copy, 
  Bookmark, 
  Tag, 
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface QRScannerModalProps {
  onSaveContact: (contact: ScannedContact) => void;
  onClose: () => void;
}

export function QRScannerModal({
  onSaveContact,
  onClose,
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedRaw, setDetectedRaw] = useState<string | null>(null);

  // Scanned item form state
  const [parsed, setParsed] = useState<ReturnType<typeof parseScannedContent> | null>(null);
  const [eventTag, setEventTag] = useState<string>('Tech Career Fair 2026');
  const [notes, setNotes] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCameraPermission(true);
        requestAnimationFrame(tickScan);
      }
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow camera permissions or upload an image file instead.'
          : 'Could not initialize camera. You can still scan by uploading an image below.'
      );
    }
  };

  const tickScan = () => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(tickScan);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data.trim()) {
      handleCodeDetected(code.data);
      return;
    }

    animationFrameRef.current = requestAnimationFrame(tickScan);
  };

  const handleCodeDetected = (raw: string) => {
    setDetectedRaw(raw);
    const parsedData = parseScannedContent(raw);
    setParsed(parsedData);
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.6 } });
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (code && code.data) {
          handleCodeDetected(code.data);
        } else {
          alert('Could not find a valid QR code in this image. Please try another photo.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleSaveToVault = () => {
    if (!detectedRaw || !parsed) return;

    const contact: ScannedContact = {
      id: `scanned_${Date.now()}`,
      rawText: detectedRaw,
      type: parsed.type,
      parsedTitle: parsed.title,
      parsedSubtitle: parsed.subtitle,
      vCardData: parsed.vCardData,
      eventTag: eventTag.trim() || 'General Event',
      notes: notes.trim(),
      scannedAt: new Date().toISOString(),
      starred: true,
    };

    onSaveContact(contact);
    setSavedSuccess(true);
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleResetScan = () => {
    setDetectedRaw(null);
    setParsed(null);
    setSavedSuccess(false);
    setNotes('');
    requestAnimationFrame(tickScan);
  };

  return (
    <div
      id="qr-scanner-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl p-5 sm:p-6 my-auto text-neutral-100 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Scan Networking QR Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Result Screen */}
        <div className="my-4">
          {!detectedRaw ? (
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-neutral-950 border-2 border-neutral-800 flex items-center justify-center">
              {/* Video Feed */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Guides */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-52 border-2 border-indigo-400/80 rounded-2xl relative">
                  <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse" />
                </div>
              </div>

              {cameraError && (
                <div className="absolute inset-0 bg-neutral-950/95 p-5 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
                  <p className="text-xs text-neutral-300 mb-3">{cameraError}</p>
                  <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow">
                    <Upload className="w-4 h-4" />
                    Upload QR Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            /* Scanned Item Result Box */
            <div className="bg-neutral-800/80 border border-neutral-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  QR Code Detected
                </span>
                <button
                  onClick={handleResetScan}
                  className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Scan Another
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">
                  {parsed?.title}
                </h4>
                {parsed?.subtitle && (
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {parsed.subtitle}
                  </p>
                )}
              </div>

              {/* Event Tag */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  Event Tag
                </label>
                <input
                  type="text"
                  value={eventTag}
                  onChange={(e) => setEventTag(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white"
                  placeholder="e.g. Google I/O 2026, Tech Job Fair"
                />
              </div>

              {/* Context Note */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                  Quick Memory Note
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Discussed Staff Engineer role, follow up on Monday"
                />
              </div>

              {/* Direct Open / Action link if URL */}
              {detectedRaw.startsWith('http') && (
                <a
                  href={detectedRaw}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-neutral-700/60 hover:bg-neutral-700 rounded-xl text-xs font-semibold text-neutral-200 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Link in Browser
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!detectedRaw ? (
          <div className="flex items-center justify-between pt-2">
            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Upload Image
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={handleResetScan}
              className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveToVault}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all active:scale-95"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to Vault!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4" />
                  <span>Save to Event Contacts</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
