import React from 'react';
import { QrCode } from 'lucide-react';
import { ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface AboutModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  theme,
  onClose,
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';

  const footer = (
    <button
      type="button"
      onClick={() => {
        triggerHaptic('light');
        onClose();
      }}
      aria-label="Close about dialog"
      className={`w-full min-h-[48px] rounded-xl border text-sm font-semibold transition cursor-pointer ${
        isLight
          ? 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100'
          : 'bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800'
      }`}
    >
      Close
    </button>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="About Scan QR"
      theme={theme}
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-emerald-600'
                : 'bg-zinc-950 border-zinc-800 text-emerald-400'
            }`}
          >
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold tracking-tight">Scan QR</h3>
            <p className={`text-xs font-mono tabular-nums ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Version 3.0.0
            </p>
          </div>
        </div>

        <p className={`text-sm leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
          Generate custom-colored QR codes, scan barcodes from your camera or photo library, search saved records, and export history as JSON or CSV.
        </p>
      </div>
    </BottomSheet>
  );
};
