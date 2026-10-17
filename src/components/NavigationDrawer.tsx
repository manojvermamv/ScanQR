import React from 'react';
import { 
  QrCode, 
  ScanLine, 
  Star, 
  Smartphone, 
  ShieldCheck, 
  Info, 
  Layers, 
  Bug, 
  Moon, 
  Sun, 
  ChevronRight, 
  X, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ScreenType, DevicePlatform, ThemeMode } from '../core/types.ts';

interface NavigationDrawerProps {
  isOpen: boolean;
  currentScreen: ScreenType;
  devicePlatform: DevicePlatform;
  theme: ThemeMode;
  onClose: () => void;
  onNavigate: (screen: ScreenType) => void;
  onTogglePlatform: () => void;
  onToggleTheme: () => void;
  onOpenAbout: () => void;
  onOpenRateApp: () => void;
  onOpenDebug: () => void;
  onOpenOtherApps: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  currentScreen,
  devicePlatform,
  theme,
  onClose,
  onNavigate,
  onTogglePlatform,
  onToggleTheme,
  onOpenAbout,
  onOpenRateApp,
  onOpenDebug,
  onOpenOtherApps,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside 
        aria-label="Navigation drawer"
        className="relative w-72 max-w-[80vw] h-full bg-neutral-900 border-r border-neutral-800 flex flex-col z-50 text-neutral-100 shadow-2xl animate-in slide-in-from-left duration-250"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-br from-emerald-950/60 via-neutral-900 to-neutral-900 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
              <QrCode className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              aria-label="Close navigation drawer"
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
            <span>Scan QR</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              v3.0.0
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Fast, Modern QR & Barcode Suite
          </p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Core Modules
          </div>

          <button
            onClick={() => {
              onNavigate('generator');
              onClose();
            }}
            aria-label="Navigate to QR Generator"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              currentScreen === 'generator'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <QrCode className="w-4 h-4" />
              <span>Generate QR</span>
            </div>
            {currentScreen === 'generator' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => {
              onNavigate('scanner');
              onClose();
            }}
            aria-label="Navigate to QR Scanner"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              currentScreen === 'scanner'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ScanLine className="w-4 h-4" />
              <span>Scan Any QR Code</span>
            </div>
            {currentScreen === 'scanner' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => {
              onNavigate('favorites');
              onClose();
            }}
            aria-label="Navigate to History & Favs"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              currentScreen === 'favorites'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Star className="w-4 h-4" />
              <span>History & Favs</span>
            </div>
            {currentScreen === 'favorites' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => {
              onNavigate('password_utility');
              onClose();
            }}
            aria-label="Navigate to Password Utility"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              currentScreen === 'password_utility'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                : 'text-neutral-300 hover:bg-neutral-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Password Utility</span>
            </div>
            {currentScreen === 'password_utility' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <div className="pt-3 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            About & Diagnostics
          </div>

          <button
            onClick={onOpenRateApp}
            aria-label="Rate this app"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800/80 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Rate this app</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          <button
            onClick={onOpenOtherApps}
            aria-label="Browse Other Apps"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800/80 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Other Apps</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          <button
            onClick={onOpenAbout}
            aria-label="About this app"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800/80 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Info className="w-4 h-4 text-emerald-400" />
              <span>About Scan QR</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>

          <button
            onClick={onOpenDebug}
            aria-label="Open Crash & Diagnostics Handler"
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800/80 hover:text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Bug className="w-4 h-4 text-rose-400" />
              <span>Crash Diagnostics</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500">Debug</span>
          </button>
        </nav>

        {/* Footer Settings */}
        <div className="p-3 bg-neutral-950/80 border-t border-neutral-800/80 space-y-2">
          {/* Platform switcher */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Preview Frame</span>
            </div>
            <button
              onClick={onTogglePlatform}
              aria-label={`Switch platform to ${devicePlatform === 'android' ? 'iOS' : 'Android'}`}
              className="text-[11px] font-mono font-semibold px-2 py-1 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition cursor-pointer"
            >
              {devicePlatform.toUpperCase()}
            </button>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-violet-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>Theme</span>
            </div>
            <button
              onClick={onToggleTheme}
              aria-label={`Switch theme to ${theme === 'dark' ? 'light' : 'dark'}`}
              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition cursor-pointer capitalize"
            >
              {theme}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
