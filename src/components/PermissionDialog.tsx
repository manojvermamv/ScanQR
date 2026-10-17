import React from 'react';
import { ShieldAlert, Check, X, Settings } from 'lucide-react';

interface PermissionDialogProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  permissionName: string;
  isPermanentlyDenied?: boolean;
  onConfirm: () => void;
  onDecline: () => void;
  onOpenSettings?: () => void;
}

export const PermissionDialog: React.FC<PermissionDialogProps> = ({
  isOpen,
  title = 'Permission needed',
  message = 'This app needs permission to work properly.',
  permissionName,
  isPermanentlyDenied = false,
  onConfirm,
  onDecline,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="perm-dialog-title"
        aria-describedby="perm-dialog-desc"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-100"
      >
        <div className="bg-neutral-800/80 px-5 py-4 border-b border-neutral-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 id="perm-dialog-title" className="font-semibold text-base text-neutral-100">
              {title}
            </h3>
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-mono">
              {permissionName}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <p id="perm-dialog-desc" className="text-sm text-neutral-300 leading-relaxed">
            {message}
          </p>
          {isPermanentlyDenied && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs leading-relaxed">
              Required permission has been previously denied or blocked. Please enable it in App Settings.
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-neutral-950/60 border-t border-neutral-800/80 flex items-center justify-end gap-2.5">
          <button
            onClick={onDecline}
            aria-label="Decline permission"
            className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-200 transition rounded-lg hover:bg-neutral-800/60 cursor-pointer"
          >
            Decline
          </button>
          
          {isPermanentlyDenied ? (
            <button
              onClick={onOpenSettings}
              aria-label="Open App Settings"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Open Settings</span>
            </button>
          ) : (
            <button
              onClick={onConfirm}
              aria-label="Confirm and grant permission"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Allow Access</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
