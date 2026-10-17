import React, { useEffect } from 'react';
import { QrCode, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Ported from SplashActivity.java (Handler delay transition)
    const timer = setTimeout(() => {
      onFinish();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      onClick={onFinish}
      role="button"
      tabIndex={0}
      aria-label="Skip splash screen"
      className="flex-1 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-950 text-neutral-100 select-none cursor-pointer"
    >
      <div className="w-full" />

      {/* Center Brand */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-2xl shadow-emerald-500/20">
            <div className="w-full h-full bg-neutral-950 rounded-[22px] flex items-center justify-center text-emerald-400">
              <QrCode className="w-12 h-12 animate-pulse" />
            </div>
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-spin" />
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight">
            Scan QR
          </h1>
          <p className="text-xs text-neutral-400 font-medium">
            Fast, Secure QR Generator & Barcode Scanner
          </p>
        </div>

        {/* Loading Spinner */}
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mt-4" />
      </div>

      {/* Footer Tagline */}
      <div className="text-center space-y-1">
        <p className="text-[11px] text-neutral-500 tracking-wider uppercase font-medium">
          Modern QR Suite
        </p>
        <p className="text-xs font-semibold text-neutral-300">
          Fast • Secure • Offline Ready
        </p>
      </div>
    </div>
  );
};
