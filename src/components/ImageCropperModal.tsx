import React, { useState, useRef, useEffect } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Check, X, Crop, Image as ImageIcon } from 'lucide-react';
import jsQR from 'jsqr';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onCropAndDecode: (resultText: string | null) => void;
  onShowToast: (msg: string, type: 'error' | 'success' | 'info') => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropAndDecode,
  onShowToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9' | 'free'>('1:1');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && imageSrc) {
      setRotation(0);
      setZoom(1);
      drawImage();
    }
  }, [isOpen, imageSrc, rotation, zoom]);

  const drawImage = () => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Fit aspect ratio
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
    };
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 0.2, 0.5));
  };

  const handleProcessCrop = () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      setIsProcessing(false);
      if (code && code.data) {
        onCropAndDecode(code.data);
      } else {
        onShowToast('QR not found in image!', 'error');
        onCropAndDecode(null);
      }
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      onShowToast('Cannot retrieve cropped image', 'error');
    }
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="cropper-title"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100"
      >
        {/* Header */}
        <div className="bg-neutral-800/90 px-5 py-4 border-b border-neutral-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 id="cropper-title" className="font-semibold text-base text-neutral-100">
                Crop & Enhance QR
              </h3>
              <p className="text-[11px] text-neutral-400">UCrop Image Inspector</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cancel crop"
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport Canvas */}
        <div className="p-4 flex flex-col items-center justify-center bg-neutral-950">
          <div className="relative w-[320px] h-[320px] rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/50 bg-black flex items-center justify-center shadow-inner">
            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-r border-b border-white/10" />
              <div className="border-b border-white/10" />
              <div className="border-r border-white/10" />
              <div className="border-r border-white/10" />
              <div />
            </div>
          </div>

          {/* Transform Controls */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleRotate}
              aria-label="Rotate image 90 degrees"
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5 text-neutral-300" />
              <span>Rotate 90°</span>
            </button>
            <button
              onClick={handleZoomIn}
              aria-label="Zoom in"
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 text-neutral-300" />
            </button>
            <button
              onClick={handleZoomOut}
              aria-label="Zoom out"
              className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 text-neutral-300" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between">
          <button
            onClick={onClose}
            aria-label="Cancel crop"
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessCrop}
            disabled={isProcessing}
            aria-label="Crop and scan barcode"
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'Analyzing...' : 'Scan QR Code'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
