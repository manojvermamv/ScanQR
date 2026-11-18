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
  const now = new Date();
  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const isLight = theme === 'light';

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-0 sm:p-4 transition-colors ${
        isLight ? 'bg-zinc-200 text-zinc-900' : 'bg-black text-zinc-100'
      }`}
    >
      {/* Desktop Device Preview Toolbar (hidden on mobile screens) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[390px] mb-4 gap-2">
        <span className={`text-xs font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-400'}`}>
          ScanQR Preview
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlatform}
            aria-label={`Switch platform frame to ${platform === 'android' ? 'iOS' : 'Android'}`}
            className={`min-h-[44px] px-3 flex items-center gap-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isLight
                ? 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50'
                : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-500" />
            <span>{platform === 'ios' ? 'iOS' : 'Android'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch theme to ${isLight ? 'dark' : 'light'}`}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border transition cursor-pointer ${
              isLight
                ? 'bg-white text-zinc-800 border-zinc-300 hover:bg-zinc-50'
                : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Viewport Frame */}
      <div
        className={`w-full sm:w-[390px] h-dvh sm:h-[844px] flex flex-col overflow-hidden relative ${
          platform === 'ios'
            ? 'sm:rounded-[44px] sm:border-[6px]'
            : 'sm:rounded-[32px] sm:border-[6px]'
        } ${
          isLight
            ? 'bg-zinc-100 text-zinc-900 sm:border-zinc-300'
            : 'bg-zinc-950 text-zinc-100 sm:border-zinc-800'
        }`}
      >
        {/* Top Safe Area / Status Bar */}
        <div
          className={`h-11 px-6 pt-[env(safe-area-inset-top)] shrink-0 flex items-center justify-between text-xs select-none z-30 border-b ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-900'
              : 'bg-zinc-950 border-zinc-900 text-zinc-100'
          }`}
        >
          <span className="font-semibold text-xs tabular-nums">{timeString}</span>

          {platform === 'ios' ? (
            <div className="w-24 h-5 bg-black rounded-full flex items-center justify-center gap-2 border border-zinc-800">
              <div className="w-2 h-2 rounded-full bg-zinc-900" />
              <div className="w-2 h-2 rounded-full bg-zinc-800" />
            </div>
          ) : (
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-zinc-800" />
          )}

          <div className="flex items-center gap-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-medium tabular-nums">98%</span>
              <Battery className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Screen Content Viewport */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
          {children}
        </div>

        {/* Bottom Safe Area / Home Indicator */}
        <div
          className={`h-6 pb-[env(safe-area-inset-bottom)] shrink-0 flex items-center justify-center select-none z-30 ${
            isLight ? 'bg-white' : 'bg-zinc-900'
          }`}
        >
          {platform === 'ios' ? (
            <div className={`w-32 h-1 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
          ) : (
            <div className={`flex items-center justify-center gap-12 w-full px-8 ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <div className="w-3 h-3 rounded-full border border-current" />
              <div className="w-3 h-3 rounded-xs border border-current" />
              <div className="w-2.5 h-2.5 rotate-45 border-l border-b border-current" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
