import React, { useEffect, useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Share2,
  Star,
  Trash2,
  Globe,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import {
  isNetworkUrl,
  normalizeUrl,
  detectContentType,
  parseWifiQr,
  getBarcodeFormatLabel,
  extractHostname,
  isSafePublicHttpUrl,
  type LinkPreviewStatus,
  type UrlMetadataPreview,
} from '../core/qrUtils.ts';
import { BarcodeFormat, ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface ScanResultModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  content: string;
  format?: BarcodeFormat;
  isFavorite?: boolean;
  onClose: () => void;
  onCopy: (text: string) => void;
  onShare: (text: string) => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
  onOpenUrl: (url: string) => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  isOpen,
  theme,
  content,
  format = 'QR_CODE',
  isFavorite = false,
  onClose,
  onCopy,
  onShare,
  onToggleFavorite,
  onDelete,
  onOpenUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<LinkPreviewStatus>('idle');
  const [previewData, setPreviewData] = useState<UrlMetadataPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [faviconFailed, setFaviconFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const isUrl = Boolean(content) && isNetworkUrl(content);
  const normalizedTargetUrl = isUrl ? normalizeUrl(content) : '';
  const fallbackHostname = normalizedTargetUrl ? extractHostname(normalizedTargetUrl) : '';

  useEffect(() => {
    if (!isOpen || !isUrl || !normalizedTargetUrl) {
      setPreviewStatus('idle');
      setPreviewData(null);
      setPreviewError('');
      setFaviconFailed(false);
      return;
    }

    if (!isSafePublicHttpUrl(normalizedTargetUrl)) {
      setPreviewStatus('error');
      setPreviewData(null);
      setPreviewError('Preview unavailable for local or private URLs.');
      setFaviconFailed(false);
      return;
    }

    const controller = new AbortController();
    setPreviewStatus('loading');
    setPreviewData(null);
    setPreviewError('');
    setFaviconFailed(false);

    (async () => {
      try {
        const res = await fetch(
          `/api/link-preview?url=${encodeURIComponent(normalizedTargetUrl)}`,
          { signal: controller.signal }
        );
        const data = await res.json().catch(() => null);

        if (controller.signal.aborted) return;

        if (!res.ok) {
          setPreviewStatus('error');
          setPreviewError(
            data && typeof data.error === 'string'
              ? data.error
              : 'Could not load page preview.'
          );
          return;
        }

        setPreviewData(data as UrlMetadataPreview);
        setPreviewStatus('success');
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        setPreviewStatus('error');
        setPreviewError('Could not load page preview.');
      }
    })();

    return () => {
      controller.abort();
    };
  }, [isOpen, isUrl, normalizedTargetUrl, retryCount]);

  if (!isOpen || !content) return null;

  const isLight = theme === 'light';
  const contentType = detectContentType(content);
  const wifiDetails = contentType === 'wifi' ? parseWifiQr(content) : null;
  const formatLabel = getBarcodeFormatLabel(format);

  const typeLabelMap: Record<string, string> = {
    url: 'Web Link',
    wifi: 'Wi-Fi Network',
    email: 'Email Address',
    phone: 'Phone Number',
    sms: 'SMS Message',
    text: format === 'QR_CODE' ? 'Plain Text' : 'Barcode Payload',
  };

  const handleCopy = () => {
    triggerHaptic('success');
    onCopy(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const footer = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onShare(content);
          }}
          aria-label="Share decoded payload"
          className={`min-w-[48px] min-h-[48px] px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100'
              : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy text to clipboard"
          className={`min-h-[48px] px-4 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100'
              : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
          }`}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        {isUrl ? (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onOpenUrl(normalizedTargetUrl);
            }}
            aria-label="Go to website"
            className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
            }`}
          >
            <span>Open Link</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label="Dismiss scan dialog"
            className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold transition cursor-pointer ${
              isLight
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
            }`}
          >
            Done
          </button>
        )}
      </div>

      {onDelete && (
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            onDelete();
          }}
          aria-label="Delete record"
          className={`w-full min-h-[44px] rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
            isLight
              ? 'text-red-600 hover:bg-red-50'
              : 'text-red-400 hover:bg-red-950/40'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete from History</span>
        </button>
      )}
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={format === 'QR_CODE' ? 'QR Code Details' : 'Barcode Details'}
      subtitle={`${formatLabel} · ${typeLabelMap[contentType] || 'Payload'}`}
      theme={theme}
      footer={footer}
    >
      <div id="scan-result-body" className="space-y-4">
        {onToggleFavorite && (
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Favorite Status
            </span>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                onToggleFavorite();
              }}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`min-h-[44px] px-3 rounded-xl border text-xs font-medium flex items-center gap-2 transition cursor-pointer ${
                isFavorite
                  ? isLight
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-zinc-800 border-zinc-700 text-amber-400'
                  : isLight
                  ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
            </button>
          </div>
        )}

        {isUrl && (
          <div
            data-testid="link-preview-card"
            className={`rounded-xl border p-3.5 ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            {previewStatus === 'loading' || previewStatus === 'idle' ? (
              <div
                role="status"
                aria-label="Loading page preview"
                className="flex items-center gap-3"
              >
                <div
                  className={`w-9 h-9 rounded-lg shrink-0 animate-pulse ${
                    isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                  }`}
                />
                <div className="flex-1 min-w-0 space-y-2">
                  <div
                    className={`h-3.5 w-3/4 rounded animate-pulse ${
                      isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                    }`}
                  />
                  <div
                    className={`h-3 w-1/2 rounded animate-pulse ${
                      isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                    }`}
                  />
                </div>
              </div>
            ) : previewStatus === 'error' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                      isLight
                        ? 'bg-white border-zinc-200 text-zinc-500'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium leading-snug line-clamp-2 ${
                        isLight ? 'text-zinc-800' : 'text-zinc-200'
                      }`}
                    >
                      {previewError || 'Could not load page preview.'}
                    </p>
                    {fallbackHostname && (
                      <p
                        className={`text-xs truncate mt-0.5 ${
                          isLight ? 'text-zinc-500' : 'text-zinc-400'
                        }`}
                      >
                        {fallbackHostname}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setRetryCount((c) => c + 1);
                  }}
                  aria-label="Retry link preview"
                  className={`min-h-[44px] px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                    isLight
                      ? 'bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-100'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden ${
                    isLight
                      ? 'bg-white border-zinc-200 text-emerald-600'
                      : 'bg-zinc-900 border-zinc-800 text-emerald-400'
                  }`}
                >
                  {previewData?.faviconUrl && !faviconFailed ? (
                    <img
                      src={previewData.faviconUrl}
                      alt={`${previewData.hostname || 'Site'} favicon`}
                      referrerPolicy="no-referrer"
                      onError={() => setFaviconFailed(true)}
                      className="w-5 h-5 object-contain"
                    />
                  ) : (
                    <Globe className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold leading-snug line-clamp-2 ${
                      isLight ? 'text-zinc-900' : 'text-zinc-100'
                    }`}
                  >
                    {previewData?.title || previewData?.hostname || fallbackHostname}
                  </p>
                  <p
                    className={`text-xs truncate mt-0.5 ${
                      isLight ? 'text-zinc-500' : 'text-zinc-400'
                    }`}
                  >
                    {previewData?.hostname || fallbackHostname}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {wifiDetails && (
          <div
            className={`rounded-xl border divide-y text-xs ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 divide-zinc-200'
                : 'bg-zinc-950 border-zinc-800 divide-zinc-800'
            }`}
          >
            <div className="px-3 py-2.5 flex justify-between gap-4">
              <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>Network</span>
              <span className="font-mono font-medium truncate">{wifiDetails.ssid}</span>
            </div>
            {wifiDetails.password && (
              <div className="px-3 py-2.5 flex justify-between gap-4">
                <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>Password</span>
                <span className="font-mono font-medium truncate">{wifiDetails.password}</span>
              </div>
            )}
            <div className="px-3 py-2.5 flex justify-between gap-4">
              <span className={isLight ? 'text-zinc-500' : 'text-zinc-400'}>Security</span>
              <span className="font-mono">{wifiDetails.type}</span>
            </div>
          </div>
        )}

        <div
          className={`rounded-xl border p-4 ${
            isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
          }`}
        >
          <p className="text-sm font-mono break-all select-text whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </div>
      </div>
    </BottomSheet>
  );
};
