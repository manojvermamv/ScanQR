import React, { useState } from 'react';
import { 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  Star, 
  X, 
  Globe, 
  Wifi, 
  Mail, 
  Phone, 
  MessageSquare, 
  FileText 
} from 'lucide-react';
import { isNetworkUrl, normalizeUrl, detectContentType, parseWifiQr } from '../core/qrUtils.ts';

interface ScanResultModalProps {
  isOpen: boolean;
  content: string;
  isFavorite?: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  onToggleFavorite?: () => void;
  onOpenUrl: (url: string) => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  isOpen,
  content,
  isFavorite = false,
  onClose,
  onCopy,
  onShare,
  onToggleFavorite,
  onOpenUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !content) return null;

  const isUrl = isNetworkUrl(content);
  const contentType = detectContentType(content);
  const wifiDetails = contentType === 'wifi' ? parseWifiQr(content) : null;

  const handleCopy = () => {
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = () => {
    switch (contentType) {
      case 'url':
        return <Globe className="w-4 h-4 text-sky-400" />;
      case 'wifi':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'email':
        return <Mail className="w-4 h-4 text-violet-400" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-amber-400" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-pink-400" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="scan-result-title"
        aria-describedby="scan-result-body"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100"
      >
        {/* Header */}
        <div className="bg-neutral-800/80 px-5 py-4 border-b border-neutral-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-700/50 flex items-center justify-center">
              {getTypeIcon()}
            </div>
            <div>
              <h3 id="scan-result-title" className="font-semibold text-base text-neutral-100">
                QR Code Details
              </h3>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">
                {contentType.toUpperCase()} PAYLOAD
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  isFavorite 
                    ? 'text-amber-400 bg-amber-400/10' 
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto" id="scan-result-body">
          {wifiDetails && (
            <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-3.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-400">Network Name:</span>
                <span className="font-mono font-semibold text-neutral-200">{wifiDetails.ssid}</span>
              </div>
              {wifiDetails.password && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Password:</span>
                  <span className="font-mono font-semibold text-emerald-300">{wifiDetails.password}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-400">Security:</span>
                <span className="font-mono text-neutral-300">{wifiDetails.type}</span>
              </div>
            </div>
          )}

          <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-4">
            <p className="text-sm font-mono text-neutral-200 break-all select-text whitespace-pre-wrap leading-relaxed">
              {content}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-5 py-3.5 bg-neutral-950/80 border-t border-neutral-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onShare(content)}
              aria-label="Share QR payload"
              className="p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopy}
              aria-label="Copy text to clipboard"
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isUrl ? (
              <button
                onClick={() => onOpenUrl(normalizeUrl(content))}
                aria-label="Go to website"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition cursor-pointer"
              >
                <span>Go to website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onClose}
                aria-label="Dismiss scan dialog"
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
