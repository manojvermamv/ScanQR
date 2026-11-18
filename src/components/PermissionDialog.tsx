import React from 'react';
import { Check, Settings } from 'lucide-react';
import { DevicePlatform, PermissionPurpose, ThemeMode } from '../core/types.ts';
import { getPlatformPermissionSpec } from '../core/qrUtils.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface PermissionDialogProps {
  isOpen: boolean;
  theme: ThemeMode;
  platform: DevicePlatform;
  purpose: PermissionPurpose;
  isPermanentlyDenied?: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  onOpenSettings?: () => void;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  isOpen,
  theme,
  platform,
  purpose,
  isPermanentlyDenied = false,
  onConfirm,
  onDecline,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  const isLight = theme === 'light';
  const spec = getPlatformPermissionSpec(platform, purpose);

  const footer = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onDecline();
        }}
        aria-label="Decline permission"
        className={`flex-1 min-h-[48px] px-4 rounded-xl border text-sm font-medium transition cursor-pointer ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
        }`}
      >
        Decline
      </button>

      {isPermanentlyDenied ? (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onOpenSettings?.();
          }}
          aria-label="Open App Settings"
          className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Open Settings</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('success');
            onConfirm();
          }}
          aria-label="Confirm and grant permission"
          className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Allow Access</span>
        </button>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onDecline}
      title={platform === 'ios' ? 'iOS Permission' : 'Android Permission'}
      subtitle={spec.title}
      theme={theme}
      footer={footer}
    >
      <div id="perm-dialog-desc" className="space-y-3">
        <p className={`text-sm leading-relaxed ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
          {spec.rationale}
        </p>

        <div
          className={`rounded-xl border px-3 py-2.5 text-xs space-y-1 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
          }`}
        >
          <p className={`font-mono break-all ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
            {spec.key}
          </p>
          <p className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>
            {spec.settingsPath}
          </p>
        </div>

        {isPermanentlyDenied && (
          <p className="text-xs text-red-500 leading-relaxed">
            Access was previously declined. Open {platform === 'ios' ? 'iOS Settings' : 'Android App Info'} to enable this permission.
          </p>
        )}
      </div>
    </BottomSheet>
  );
};
