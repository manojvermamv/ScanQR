import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Flashlight, 
  FlashlightOff, 
  FlipHorizontal, 
  Image as ImageIcon, 
  ScanLine, 
  Camera, 
  CameraOff, 
  Upload, 
  Sparkles 
} from 'lucide-react';
import jsQR from 'jsqr';

interface ScannerViewProps {
  onClose: () => void;
  onScanResult: (text: string) => void;
  onOpenGalleryPicker: (imageSrc: string) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestPermission: (permissionName: string, onGranted: () => void) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onClose,
  onScanResult,
  onOpenGalleryPicker,
  onShowToast,
  onRequestPermission,
}) => {
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraStream, setHasCameraStream] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Request Camera permission first (matching QrScanActivity.java checkPermissions)
    onRequestPermission('android.permission.CAMERA', () => {
      startCamera();
    });

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setHasCameraStream(true);
        scanFrameLoop();
      }
    } catch (err: any) {
      console.warn('Camera stream could not be started:', err.message);
      setCameraError('Camera access unavailable. You can browse images from your gallery below.');
      setHasCameraStream(false);
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
    setHasCameraStream(false);
  };

  const scanFrameLoop = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        stopCamera();
        onScanResult(code.data);
        return;
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrameLoop);
  };

  const handleToggleTorch = async () => {
    if (!videoRef.current?.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
      if (capabilities && 'torch' in capabilities) {
        await (track as any).applyConstraints({
          advanced: [{ torch: !torchOn }],
        });
        setTorchOn(!torchOn);
      } else {
        setTorchOn(!torchOn);
        onShowToast(torchOn ? 'Flash turned off' : 'Flash turned on (simulated)', 'info');
      }
    } catch {
      setTorchOn(!torchOn);
      onShowToast(torchOn ? 'Flash turned off' : 'Flash turned on (simulated)', 'info');
    }
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onOpenGalleryPicker(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Preset sample QR codes for immediate verification in headless or virtual test environments
  const testSampleQrs = [
    { label: 'Website URL', value: 'https://scanqr.app' },
    { label: 'Wi-Fi Credentials', value: 'WIFI:S:Guest_WiFi;T:WPA;P:SuperSecretPass;;' },
    { label: 'Contact Phone', value: 'tel:+18005550199' },
    { label: 'Plain Note', value: 'ScanQR Fast Scanner Verified!' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-black text-neutral-100 overflow-hidden relative">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header (Ported from tv_title & img_close in act_qr_scan.xml) */}
      <header className="px-5 py-4 flex items-center justify-between z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Scan Any QR Code
          </h2>
          <p className="text-xs text-neutral-400">Align code within frame</p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close QR Scanner"
          className="p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Viewfinder Main Surface (Ported from CodeScannerView) */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Real HTML5 Camera Stream */}
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            hasCameraStream ? 'opacity-100' : 'opacity-0'
          }`}
          muted
        />

        {/* Fallback Viewport if camera not supported or active */}
        {!hasCameraStream && (
          <div className="absolute inset-0 bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 shadow-xl">
              <Camera className="w-8 h-8 animate-pulse text-emerald-500/70" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-semibold text-neutral-200">
                Camera Viewfinder Ready
              </p>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {cameraError || 'Position QR code in view, or select an image from your gallery below.'}
              </p>
            </div>
          </div>
        )}

        {/* Viewfinder Reticle and Target Frame (Matching app:frameSize="0.75" and corner brackets) */}
        <div className="relative w-64 h-64 pointer-events-none z-10 flex items-center justify-center">
          {/* Corner Guides */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

          {/* Animated Scanning Line */}
          <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[bounce_2s_infinite]" />
        </div>

        {/* In-viewfinder Flash & Flip Camera Floating Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4 z-20">
          <button
            onClick={handleToggleTorch}
            aria-label={torchOn ? 'Turn off flash' : 'Turn on flash'}
            className={`p-3 rounded-full backdrop-blur-md border transition cursor-pointer ${
              torchOn
                ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-lg shadow-amber-400/30'
                : 'bg-black/40 text-white/90 border-white/20 hover:bg-black/60'
            }`}
          >
            {torchOn ? <Flashlight className="w-5 h-5" /> : <FlashlightOff className="w-5 h-5" />}
          </button>

          <button
            onClick={handleFlipCamera}
            aria-label="Switch camera"
            className="p-3 rounded-full backdrop-blur-md bg-black/40 text-white/90 border border-white/20 hover:bg-black/60 transition cursor-pointer"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Actions Area (Ported from browse_qrcode & image_scan in act_qr_scan.xml) */}
      <footer className="p-4 bg-neutral-900 border-t border-neutral-800 z-20 space-y-3">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleGalleryFileSelect}
        />

        {/* Gallery Browse Button (Matching browse_qrcode layout) */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Browse Image from Gallery"
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Browse Image from Gallery</span>
        </button>

        {/* Quick Simulation Bar for Testing Environments */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5 px-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Simulate QR Scan (Test Mode):</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {testSampleQrs.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => onScanResult(sample.value)}
                aria-label={`Simulate scanning ${sample.label}`}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-[11px] whitespace-nowrap transition cursor-pointer border border-neutral-700/60"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
