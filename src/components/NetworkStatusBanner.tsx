import React from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

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
      className="bg-red-500/90 text-white px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-sm animate-in slide-in-from-top duration-200 border-b border-red-600 z-30"
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <WifiOff className="w-4 h-4 text-white shrink-0 animate-pulse" />
        <div className="truncate">
          <p className="font-semibold text-xs uppercase tracking-wider">No Network Connection</p>
          <p className="text-xs text-red-100 truncate">Connect to the internet and try again</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onRetry}
          aria-label="Check Again"
          className="flex items-center gap-1.5 px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-medium transition cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Check Again</span>
        </button>
        <button
          onClick={onDismiss}
          aria-label="Dismiss offline banner"
          className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
