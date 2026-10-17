import React from 'react';
import { QrCode, X } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRepo?: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="about-title"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100"
      >
        <div className="bg-neutral-800/80 px-5 py-4 border-b border-neutral-700/60 flex items-center justify-between">
          <h3 id="about-title" className="font-semibold text-base text-neutral-100">
            About Scan QR
          </h3>
          <button
            onClick={onClose}
            aria-label="Close about dialog"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950/40">
            <QrCode className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white tracking-tight">Scan QR</h4>
            <p className="text-xs text-emerald-400 font-mono font-medium">Version 3.0.0 (Native React Port)</p>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed text-left bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800/80">
            Scan QR is a complete, modern cross-platform QR generator and barcode scanner. Featuring real-time camera viewfinder scanning, gallery barcode extraction, precision cropping, offline resilience, batch history management, and secure export.
          </p>

          <div className="text-xs text-neutral-500 space-y-1">
            <p className="text-neutral-300 font-semibold">ScanQR Suite</p>
            <p className="text-[11px]">Modern Cross-Platform QR Engine</p>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-center">
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
