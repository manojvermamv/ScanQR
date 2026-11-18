import React, { useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { ThemeMode } from '../core/types.ts';

interface SplashScreenProps {
  theme: ThemeMode;
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ theme, onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 900);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={onFinish}
      aria-label="Continue to app"
      className={`flex-1 w-full flex flex-col items-center justify-between p-8 select-none cursor-pointer text-center ${
        isLight ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      <div className="w-full" />

      <div className="flex flex-col items-center space-y-4">
        <div
          className={`w-20 h-20 rounded-2xl border flex items-center justify-center ${
            isLight
              ? 'bg-white border-zinc-200 text-emerald-700'
              : 'bg-zinc-900 border-zinc-800 text-emerald-400'
          }`}
        >
          <QrCode className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Scan QR</h1>
          <p className={`text-sm ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            QR generator and barcode scanner
          </p>
        </div>
      </div>

      <p className={`text-xs font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
        Offline ready
      </p>
    </button>
  );
};
