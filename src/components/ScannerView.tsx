import React, { useState, useRef, useEffect } from 'react';
import {
  Flashlight,
  FlashlightOff,
  FlipHorizontal,
  Image as ImageIcon,
  CameraOff,
  RefreshCw,
  ScanBarcode,
} from 'lucide-react';
import { BarcodeFormat, PermissionPurpose, ThemeMode } from '../core/types.ts';
import { decodeBarcodeFromCanvas } from '../core/barcodeDecoder.ts';
import { getBarcodeFormatLabel } from '../core/qrUtils.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface ScannerViewProps {
  theme: ThemeMode;
  canAccessPhotoLibrary: boolean;
  onScanResult: (text: string, format: BarcodeFormat) => void;
  onOpenGalleryPicker: (imageSrc: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestPermission: (purpose: PermissionPurpose, onGranted: () => void) => void;
}

const SAMPLE_CODES: Array<{ label: string; format: BarcodeFormat; value: string }> = [
  { label: 'Website Link', format: 'QR_CODE', value: 'https://scanqr.app' },
  { label: 'Office Wi-Fi', format: 'QR_CODE', value: 'WIFI:S:Guest_WiFi;T:WPA;P:Welcome2026;;' },
  { label: 'Retail Product SKU', format: 'EAN_13', value: '4006381333931' },
  { label: 'Warehouse Package ID', format: 'CODE_128', value: 'PKG-2026-8492' },
  { label: 'Boarding Pass Manifest', format: 'PDF_417', value: 'BOARDING:SFO-NRT/14A/2026-11-18' },
  { label: 'Component Serial', format: 'DATA_MATRIX', value: 'SN-DM-88410293' },
  { label: 'Transit Gate Ticket', format: 'AZTEC', value: 'TKT-AZ-99201-GATE4' },
];

export const ScannerView: React.FC<ScannerViewProps> = ({
  theme,
  canAccessPhotoLibrary,
  onScanResult,
  onOpenGalleryPicker,
  onShowToast,
  onRequestPermission,
}) => {
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStatus, setCameraStatus] = useState<'loading' | 'active' | 'error'>('loading');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSampleSheetOpen, setIsSampleSheetOpen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastScanCheckRef = useRef<number>(0);

  const isLight = theme === 'light';

  useEffect(() => {
    onRequestPermission('camera', () => {
      startCamera();
    });

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    setCameraStatus('loading');

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported in this browser.');
        setCameraStatus('error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraStatus('active');
        scanFrameLoop();
      }
    } catch {
      setCameraError(
        'Camera unavailable. Allow camera permission or choose an image from your photo library.'
      );
      setCameraStatus('error');
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanFrameLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const now = performance.now();
    if (
      video.readyState === video.HAVE_ENOUGH_DATA &&
      ctx &&
      now - lastScanCheckRef.current >= 120
    ) {
      lastScanCheckRef.current = now;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const decoded = decodeBarcodeFromCanvas(canvas, false);
      if (decoded && decoded.text) {
        triggerHaptic('success');
        stopCamera();
        onScanResult(decoded.text, decoded.format);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrameLoop);
  };

  const handleToggleTorch = async () => {
    triggerHaptic('light');
    if (!videoRef.current?.srcObject) {
      onShowToast('Torch requires an active camera stream', 'info');
      return;
    }
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      const capabilities = (track.getCapabilities && track.getCapabilities()) as Record<string, unknown>;
      if (capabilities && 'torch' in capabilities) {
        await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
      }
      setTorchOn(!torchOn);
    } catch {
      setTorchOn(!torchOn);
    }
  };

  const handleFlipCamera = () => {
    triggerHaptic('light');
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleChooseImageClick = () => {
    triggerHaptic('light');
    if (canAccessPhotoLibrary) {
      fileInputRef.current?.click();
      return;
    }
    onRequestPermission('photoLibrary', () => {
      fileInputRef.current?.click();
    });
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onOpenGalleryPicker(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 relative ${
        isLight ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Bar: strictly screen title */}
      <header
        className={`px-4 py-3 border-b shrink-0 flex items-center justify-between ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        }`}
      >
        <h1 className="text-lg font-semibold tracking-tight">Scan Code</h1>
        <span className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
          QR & 1D/2D
        </span>
      </header>

      {/* Camera Viewfinder Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-zinc-950">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            cameraStatus === 'active' ? 'opacity-100' : 'opacity-0'
          }`}
          muted
        />

        {/* Loading State */}
        {cameraStatus === 'loading' && (
          <div
            data-testid="scanner-loading-skeleton"
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-zinc-950"
          >
            <div className="w-60 h-48 rounded-2xl border border-zinc-800 bg-zinc-900 animate-pulse" />
            <p className="text-sm text-zinc-400">Initializing camera...</p>
          </div>
        )}

        {/* Error State */}
        {cameraStatus === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-zinc-950">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <CameraOff className="w-7 h-7" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-semibold text-zinc-100">Camera Unavailable</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onRequestPermission('camera', startCamera);
              }}
              aria-label="Retry Camera"
              className="min-h-[48px] px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {/* Active Viewfinder Reticle */}
        {cameraStatus === 'active' && (
          <div className="relative w-64 h-48 pointer-events-none z-10 flex items-end justify-center">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
            <div className="absolute inset-x-3 h-0.5 bg-emerald-500 animate-scan-line" />
            <span className="mb-[-26px] text-xs text-zinc-300">
              Align QR code or barcode inside frame
            </span>
          </div>
        )}

        {/* Viewfinder Controls */}
        {cameraStatus === 'active' && (
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
            <button
              type="button"
              onClick={handleToggleTorch}
              aria-label={torchOn ? 'Turn off flash' : 'Turn on flash'}
              className={`min-w-[48px] min-h-[48px] rounded-full border flex items-center justify-center transition cursor-pointer ${
                torchOn
                  ? 'bg-emerald-500 border-emerald-500 text-zinc-950'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
              }`}
            >
              {torchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={handleFlipCamera}
              aria-label="Switch camera"
              className="min-w-[48px] min-h-[48px] rounded-full border bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800 flex items-center justify-center transition cursor-pointer"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Thumb-Zone Controls */}
      <footer
        className={`p-4 border-t shrink-0 flex items-center gap-2 ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryFileSelect}
        />

        <button
          type="button"
          onClick={handleChooseImageClick}
          aria-label="Browse Image from Gallery"
          className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Choose Image</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsSampleSheetOpen(true);
          }}
          aria-label="Load Sample Code"
          className={`min-h-[48px] px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
              : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
          }`}
        >
          <ScanBarcode className="w-4 h-4" />
          <span>Samples</span>
        </button>
      </footer>

      {/* Sample Payloads Bottom Sheet */}
      <BottomSheet
        isOpen={isSampleSheetOpen}
        onClose={() => setIsSampleSheetOpen(false)}
        title="Sample QR & Barcode Payloads"
        subtitle="Decode a sample QR or 1D/2D barcode without a camera"
        theme={theme}
      >
        <div className="space-y-2">
          {SAMPLE_CODES.map((sample) => (
            <button
              key={`${sample.format}-${sample.label}`}
              type="button"
              onClick={() => {
                triggerHaptic('success');
                setIsSampleSheetOpen(false);
                onScanResult(sample.value, sample.format);
              }}
              className={`w-full min-h-[56px] px-4 py-3 rounded-xl border text-left flex flex-col justify-center gap-0.5 transition cursor-pointer ${
                isLight
                  ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-900'
                  : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800 text-zinc-100'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{sample.label}</span>
                <span className={`text-xs font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {getBarcodeFormatLabel(sample.format)}
                </span>
              </div>
              <span className={`text-xs font-mono truncate ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {sample.value}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
};
