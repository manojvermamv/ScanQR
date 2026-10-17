import React from 'react';
import { Wifi, Battery, Signal, Moon, Sun, Smartphone } from 'lucide-react';
import { DevicePlatform, ThemeMode } from '../core/types.ts';

interface DeviceFrameProps {
  platform: DevicePlatform;
  theme: ThemeMode;
  onTogglePlatform: () => void;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  platform,
  theme,
  onTogglePlatform,
  onToggleTheme,
  children,
}) => {
  // Format current local device time (HH:MM)
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-0 sm:p-4 transition-colors ${
      theme === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-100 text-neutral-900'
    }`}>
      {/* Top Desktop Controls Bar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[420px] mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-neutral-400">
            ScanQR Mobile Simulator
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Platform Toggle */}
          <button
            onClick={onTogglePlatform}
            aria-label={`Switch platform frame to ${platform === 'android' ? 'iOS' : 'Android'}`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>{platform === 'ios' ? 'iPhone 16' : 'Pixel 9'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            aria-label={`Switch theme to ${theme === 'dark' ? 'light' : 'dark'}`}
            className="p-1.5 rounded-lg text-xs bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-violet-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Shell Phone Frame */}
      <div 
        className={`w-full sm:w-[390px] h-screen sm:h-[844px] flex flex-col overflow-hidden relative shadow-2xl transition-all duration-300 ${
          platform === 'ios'
            ? 'sm:rounded-[48px] sm:border-[8px] sm:border-neutral-800 sm:ring-1 sm:ring-neutral-700/50'
            : 'sm:rounded-[36px] sm:border-[6px] sm:border-neutral-800 sm:ring-1 sm:ring-neutral-700/50'
        } ${theme === 'dark' ? 'bg-neutral-900' : 'bg-neutral-900'}`}
      >
        {/* Mobile Status Bar */}
        <div className="h-10 px-6 shrink-0 flex items-center justify-between text-white text-xs select-none z-30 bg-neutral-900/95 backdrop-blur-md">
          {/* Time */}
          <span className="font-semibold text-xs tracking-tight">{timeString}</span>

          {/* Center Notch or Dynamic Island / Punch Hole */}
          {platform === 'ios' ? (
            <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-2 border border-neutral-800/80 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-neutral-900" />
              <div className="w-2 h-2 rounded-full bg-blue-950/60" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-neutral-800 shadow-inner" />
          )}

          {/* Icons: Signal, Wi-Fi, Battery */}
          <div className="flex items-center gap-1.5">
            <Signal className="w-3.5 h-3.5 text-neutral-200" />
            <Wifi className="w-3.5 h-3.5 text-neutral-200" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-neutral-300">98%</span>
              <Battery className="w-4 h-4 text-emerald-400 fill-current" />
            </div>
          </div>
        </div>

        {/* Screen Content Viewport */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-neutral-900">
          {children}
        </div>

        {/* Mobile Navigation Home Indicator */}
        <div className="h-5 shrink-0 flex items-center justify-center bg-neutral-900/95 select-none z-30">
          {platform === 'ios' ? (
            <div className="w-32 h-1 bg-white/40 rounded-full" />
          ) : (
            <div className="flex items-center justify-center gap-12 w-full px-8 text-neutral-500">
              <div className="w-3 h-3 rounded-full border border-neutral-500" />
              <div className="w-3 h-3 rounded-xs border border-neutral-500" />
              <div className="w-2.5 h-2.5 rotate-45 border-l border-b border-neutral-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
