import React from 'react';
import {
  Moon,
  Sun,
  Smartphone,
  ShieldCheck,
  Info,
  Star,
  ChevronRight,
  Camera,
  HardDrive,
} from 'lucide-react';
import { DevicePlatform, PermissionState, ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';

interface SettingsViewProps {
  theme: ThemeMode;
  devicePlatform: DevicePlatform;
  permissions: PermissionState;
  onToggleTheme: () => void;
  onTogglePlatform: () => void;
  onOpenPasswordSheet: () => void;
  onOpenAboutSheet: () => void;
  onOpenRateSheet: () => void;
  onRequestPermission: (permissionName: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  devicePlatform,
  permissions,
  onToggleTheme,
  onTogglePlatform,
  onOpenPasswordSheet,
  onOpenAboutSheet,
  onOpenRateSheet,
  onRequestPermission,
}) => {
  const isLight = theme === 'light';

  const rowClass = `w-full min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 text-left transition cursor-pointer ${
    isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-800/60'
  }`;

  const sectionClass = `rounded-2xl border divide-y overflow-hidden ${
    isLight
      ? 'bg-white border-zinc-200 divide-zinc-200'
      : 'bg-zinc-900 border-zinc-800 divide-zinc-800'
  }`;

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 ${
        isLight ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-950 text-zinc-100'
      }`}
    >
      {/* Top Bar: strictly screen title */}
      <header
        className={`px-4 py-3 border-b shrink-0 flex items-center justify-between ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        }`}
      >
        <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Appearance & Device */}
        <section className="space-y-2">
          <h2 className={`px-1 text-xs font-semibold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Appearance
          </h2>
          <div className={sectionClass}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onToggleTheme();
              }}
              aria-label={`Switch theme to ${isLight ? 'dark' : 'light'}`}
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                {isLight ? (
                  <Sun className="w-5 h-5 text-zinc-600" />
                ) : (
                  <Moon className="w-5 h-5 text-zinc-400" />
                )}
                <span className="text-sm font-medium">Theme</span>
              </div>
              <span className="text-sm font-medium text-emerald-500 capitalize">
                {theme}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onTogglePlatform();
              }}
              aria-label={`Switch platform frame to ${devicePlatform === 'android' ? 'iOS' : 'Android'}`}
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                <Smartphone className={`w-5 h-5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="text-sm font-medium">Device Frame</span>
              </div>
              <span className="text-sm font-medium text-emerald-500">
                {devicePlatform === 'ios' ? 'iOS' : 'Android'}
              </span>
            </button>
          </div>
        </section>

        {/* Security & Permissions */}
        <section className="space-y-2">
          <h2 className={`px-1 text-xs font-semibold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Security & Permissions
          </h2>
          <div className={sectionClass}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenPasswordSheet();
              }}
              aria-label="Open password security settings"
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="text-sm font-medium">App Password</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onRequestPermission('android.permission.CAMERA');
              }}
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                <Camera className={`w-5 h-5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="text-sm font-medium">Camera Access</span>
              </div>
              <span
                className={`text-xs font-medium capitalize ${
                  permissions.camera === 'granted' ? 'text-emerald-500' : 'text-zinc-500'
                }`}
              >
                {permissions.camera}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onRequestPermission('android.permission.WRITE_EXTERNAL_STORAGE');
              }}
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                <HardDrive className={`w-5 h-5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="text-sm font-medium">Storage Access</span>
              </div>
              <span
                className={`text-xs font-medium capitalize ${
                  permissions.storageWrite === 'granted' ? 'text-emerald-500' : 'text-zinc-500'
                }`}
              >
                {permissions.storageWrite}
              </span>
            </button>
          </div>
        </section>

        {/* Application Info */}
        <section className="space-y-2">
          <h2 className={`px-1 text-xs font-semibold ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Application
          </h2>
          <div className={sectionClass}>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenRateSheet();
              }}
              aria-label="Rate this app"
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                <Star className={`w-5 h-5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="text-sm font-medium">Rate Scan QR</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onOpenAboutSheet();
              }}
              aria-label="About this app"
              className={rowClass}
            >
              <div className="flex items-center gap-3">
                <Info className={`w-5 h-5 ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`} />
                <span className="text-sm font-medium">About Scan QR</span>
              </div>
              <ChevronRight className={`w-4 h-4 ${isLight ? 'text-zinc-400' : 'text-zinc-500'}`} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
