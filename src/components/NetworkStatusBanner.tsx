import React from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';
import { triggerHaptic } from '../core/haptics.ts';

interface NetworkStatusBannerProps {
  isOffline: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

export const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  isOffline,
  onRetry,
  onDismiss,
}) => {
  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="bg-red-600 text-white px-4 py-2 flex items-center justify-between gap-2 text-xs border-b border-red-700 z-30 shrink-0"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <WifiOff className="w-4 h-4 text-white shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold truncate">Offline</p>
          <p className="text-[11px] text-red-100 truncate">Check your internet connection</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onRetry();
          }}
          aria-label="Retry connection check"
          className="min-h-[44px] px-3 bg-red-700 hover:bg-red-800 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onDismiss();
          }}
          aria-label="Dismiss offline banner"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-red-700 rounded-xl text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
