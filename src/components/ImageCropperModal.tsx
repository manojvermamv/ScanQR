import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Check, AlertCircle } from 'lucide-react';
import { BarcodeFormat, ThemeMode } from '../core/types.ts';
import { decodeBarcodeFromCanvas } from '../core/barcodeDecoder.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface ImageCropperModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  imageSrc: string | null;
  onClose: () => void;
  onCropAndDecode: (result: { text: string; format: BarcodeFormat } | null) => void;
  onShowToast: (msg: string, type: 'error' | 'success' | 'info') => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  theme,
  imageSrc,
  onClose,
  onCropAndDecode,
  onShowToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen && imageSrc) {
      setImageError(null);
      drawImage();
    }
  }, [isOpen, imageSrc, rotation, zoom]);

  useEffect(() => {
    if (isOpen) {
      setRotation(0);
      setZoom(1);
    }
  }, [isOpen, imageSrc]);

  const drawImage = () => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = 480;
      canvas.height = 480;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    };
    img.onerror = () => {
      setImageError('Could not load the selected image.');
    };
  };

  const handleProcessCrop = () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);

    try {
      const decoded = decodeBarcodeFromCanvas(canvasRef.current, true);
      setIsProcessing(false);
      if (decoded && decoded.text) {
        triggerHaptic('success');
        onCropAndDecode(decoded);
      } else {
        triggerHaptic('error');
        onShowToast('No QR code or barcode detected in image', 'error');
        onCropAndDecode(null);
      }
    } catch {
      setIsProcessing(false);
      triggerHaptic('error');
      onShowToast('Failed to process image', 'error');
    }
  };

  if (!isOpen || !imageSrc) return null;

  const footer = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        aria-label="Cancel crop"
        className={`min-h-[48px] px-4 rounded-xl border text-sm font-medium transition cursor-pointer ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
        }`}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleProcessCrop}
        disabled={isProcessing || !!imageError}
        aria-label="Crop and scan barcode"
        className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer ${
          isLight
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
        }`}
      >
        <Check className="w-4 h-4" />
        <span>{isProcessing ? 'Scanning...' : 'Scan Image'}</span>
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Image"
      subtitle="Rotate or zoom to align the QR code or barcode"
      theme={theme}
      footer={footer}
    >
      <div className="flex flex-col items-center space-y-4">
        {imageError ? (
          <div className="w-full py-12 flex flex-col items-center gap-2 text-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-sm font-medium">{imageError}</p>
          </div>
        ) : (
          <div
            className={`relative w-64 h-64 rounded-xl overflow-hidden border flex items-center justify-center ${
              isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-emerald-500/30">
              <div className="border-r border-b border-emerald-500/15" />
              <div className="border-r border-b border-emerald-500/15" />
              <div className="border-b border-emerald-500/15" />
              <div className="border-r border-b border-emerald-500/15" />
              <div className="border-r border-b border-emerald-500/15" />
              <div className="border-b border-emerald-500/15" />
              <div className="border-r border-emerald-500/15" />
              <div className="border-r border-emerald-500/15" />
              <div />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setRotation((r) => (r + 90) % 360);
            }}
            aria-label="Rotate image 90 degrees"
            className={`min-h-[44px] px-4 rounded-xl border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span>Rotate 90°</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setZoom((z) => Math.min(z + 0.2, 3));
            }}
            aria-label="Zoom in"
            className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition cursor-pointer ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setZoom((z) => Math.max(z - 0.2, 0.5));
            }}
            aria-label="Zoom out"
            className={`min-w-[44px] min-h-[44px] rounded-xl border flex items-center justify-center transition cursor-pointer ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
