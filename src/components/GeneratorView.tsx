import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Trash2,
  Share2,
  Download,
  Globe,
  Wifi,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  ArrowLeftRight,
  RotateCcw,
  RefreshCw,
  Pipette,
} from 'lucide-react';
import {
  validateQrInput,
  detectContentType,
  hasLowContrast,
} from '../core/qrUtils.ts';
import { QrRecord, ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';

interface GeneratorViewProps {
  theme: ThemeMode;
  onSaveRecord: (record: Omit<QrRecord, 'id' | 'createdAt'>) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestPermission: (permissionName: string, onGranted: () => void) => void;
}

const FG_PRESETS = [
  { label: 'Black', hex: '#000000' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Slate', hex: '#1e293b' },
  { label: 'Navy', hex: '#1d4ed8' },
];

const BG_PRESETS = [
  { label: 'White', hex: '#ffffff' },
  { label: 'Stone', hex: '#f5f5f4' },
  { label: 'Mint', hex: '#ecfdf5' },
  { label: 'Charcoal', hex: '#18181b' },
];

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  theme,
  onSaveRecord,
  onShowToast,
  onRequestPermission,
}) => {
  const [inputText, setInputText] = useState<string>('https://scanqr.app');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string>('url');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');

  const isLight = theme === 'light';
  const lowContrast = hasLowContrast(fgColor, bgColor);

  useEffect(() => {
    if (inputText.trim()) {
      generateQr(inputText, false, fgColor, bgColor);
    } else {
      setIsGenerating(false);
    }
  }, [fgColor, bgColor]);

  const generateQr = async (
    text: string,
    notify = true,
    customFg = fgColor,
    customBg = bgColor
  ) => {
    const validation = validateQrInput(text);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Please enter a value');
      setIsGenerating(false);
      return;
    }

    setErrorMessage(null);
    setRenderError(null);
    setIsGenerating(true);

    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 320,
        margin: 2,
        color: {
          dark: customFg,
          light: customBg,
        },
        errorCorrectionLevel: 'M',
      });

      setQrDataUrl(dataUrl);
      setIsGenerating(false);

      if (notify) {
        triggerHaptic('success');
        onSaveRecord({
          content: text,
          type: detectContentType(text),
          category: 'generated',
          isFavorite: false,
          title: `Generated: ${text.slice(0, 24)}`,
        });
        onShowToast('QR code saved to history', 'success');
      }
    } catch {
      setIsGenerating(false);
      setRenderError('Unable to encode this payload into a QR code.');
      triggerHaptic('error');
    }
  };

  const handleGenerateClick = () => {
    triggerHaptic('medium');
    onRequestPermission('android.permission.WRITE_EXTERNAL_STORAGE', () => {
      generateQr(inputText, true);
    });
  };

  const handleClear = () => {
    triggerHaptic('light');
    setQrDataUrl(null);
    setRenderError(null);
    setErrorMessage(null);
  };

  const handleRestoreDefault = () => {
    triggerHaptic('light');
    const defaultVal = 'https://scanqr.app';
    setActiveTemplate('url');
    setInputText(defaultVal);
    generateQr(defaultVal, false);
  };

  const downloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `ScanQR_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerHaptic('success');
    onShowToast('QR image downloaded', 'success');
  };

  const handleShare = async () => {
    if (!qrDataUrl) {
      onShowToast('Generate a QR code first', 'error');
      return;
    }

    triggerHaptic('light');
    onRequestPermission('android.permission.WRITE_EXTERNAL_STORAGE', async () => {
      try {
        if (navigator.share) {
          const res = await fetch(qrDataUrl);
          const blob = await res.blob();
          const file = new File([blob], 'ScanQR_Code.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'QR Code',
              text: inputText,
            });
            onShowToast('QR code shared', 'success');
            return;
          }
        }

        downloadQrImage();
        await navigator.clipboard.writeText(inputText);
        onShowToast('Image saved and content copied', 'success');
      } catch {
        downloadQrImage();
      }
    });
  };

  const handleSwapColors = () => {
    triggerHaptic('light');
    const prevFg = fgColor;
    setFgColor(bgColor);
    setBgColor(prevFg);
  };

  const handleResetColors = () => {
    triggerHaptic('light');
    setFgColor('#000000');
    setBgColor('#ffffff');
  };

  const applyTemplate = (type: string) => {
    triggerHaptic('light');
    setActiveTemplate(type);
    let nextVal = inputText;
    switch (type) {
      case 'url':
        nextVal = 'https://scanqr.app';
        break;
      case 'wifi':
        nextVal = 'WIFI:S:OfficeGuest;T:WPA;P:GuestPass2026;;';
        break;
      case 'email':
        nextVal = 'mailto:support@scanqr.app?subject=Inquiry';
        break;
      case 'phone':
        nextVal = 'tel:+14155552671';
        break;
      case 'text':
        nextVal = 'Meeting notes: Room 4B at 10:00';
        break;
    }
    setInputText(nextVal);
    setErrorMessage(null);
    generateQr(nextVal, false);
  };

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
        <h1 className="text-lg font-semibold tracking-tight">Generate QR</h1>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* QR Preview Area (Flat single-surface container, 4 explicit states) */}
        <section aria-label="QR Code Preview" className="flex flex-col items-center">
          <div
            className={`w-44 h-44 rounded-2xl border p-2.5 flex flex-col items-center justify-center relative ${
              isLight
                ? 'bg-white border-zinc-200'
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            {isGenerating ? (
              /* Loading State: Layout-matched skeleton */
              <div
                data-testid="generator-loading-skeleton"
                className="w-full h-full flex flex-col items-center justify-center gap-2 animate-pulse"
              >
                <div
                  className={`w-32 h-32 rounded-xl ${
                    isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                  }`}
                />
                <span className="sr-only">Generating QR code</span>
              </div>
            ) : renderError ? (
              /* Error State: Human-readable reason + retry action */
              <div className="text-center space-y-2 p-2">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="text-xs font-medium text-red-500">{renderError}</p>
                <button
                  type="button"
                  onClick={() => generateQr(inputText, false)}
                  className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 border cursor-pointer ${
                    isLight
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-900'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-100'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              </div>
            ) : qrDataUrl ? (
              /* Populated State */
              <div
                className="w-full h-full rounded-xl flex items-center justify-center p-2"
                style={{ backgroundColor: bgColor }}
              >
                <img
                  src={qrDataUrl}
                  alt="Generated QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              /* Empty State: Clear explanation + single CTA */
              <div className="text-center space-y-3 p-2">
                <p className={`text-xs ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Preview cleared. Enter text below or restore sample.
                </p>
                <button
                  type="button"
                  onClick={handleRestoreDefault}
                  className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold border cursor-pointer ${
                    isLight
                      ? 'bg-zinc-100 border-zinc-300 text-zinc-900 hover:bg-zinc-200'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-100 hover:bg-zinc-700'
                  }`}
                >
                  Restore URL
                </button>
              </div>
            )}
          </div>

          {lowContrast && (
            <div
              role="status"
              className={`mt-2 w-full px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                isLight
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-200'
              }`}
            >
              <span>Low color contrast may prevent scanning.</span>
              <button
                type="button"
                onClick={handleResetColors}
                className="min-h-[44px] px-3 text-xs font-semibold text-emerald-500 cursor-pointer shrink-0"
              >
                Fix
              </button>
            </div>
          )}
        </section>

        {/* Payload Type Presets (8pt grid, >= 44px height) */}
        <section
          aria-label="Payload type presets"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar"
        >
          {[
            { id: 'url', label: 'URL', icon: Globe },
            { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
            { id: 'text', label: 'Text', icon: FileText },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'phone', label: 'Phone', icon: Phone },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTemplate === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => applyTemplate(item.id)}
                aria-label={`Select ${item.label} template`}
                className={`min-h-[44px] px-3.5 rounded-xl text-xs font-medium flex items-center gap-2 whitespace-nowrap border transition cursor-pointer shrink-0 ${
                  isSelected
                    ? isLight
                      ? 'bg-emerald-600 border-emerald-600 text-white font-semibold'
                      : 'bg-emerald-500 border-emerald-500 text-zinc-950 font-semibold'
                    : isLight
                    ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </section>

        {/* Input Field (>= 16px font size, 48px height, 44x44 clear button) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="qr-input-field"
              className={`text-xs font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}
            >
              Content
            </label>
            {qrDataUrl && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear QR preview"
                className={`min-h-[44px] px-2 text-xs font-medium inline-flex items-center gap-1 cursor-pointer ${
                  isLight ? 'text-zinc-600 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Preview</span>
              </button>
            )}
          </div>

          <div className="relative flex items-center">
            <input
              id="qr-input-field"
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Enter URL, Wi-Fi, or text"
              className={`w-full min-h-[48px] pl-4 pr-12 rounded-xl border text-base focus:outline-none focus:ring-2 transition ${
                errorMessage
                  ? 'border-red-500 focus:ring-red-500/20'
                  : isLight
                  ? 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-emerald-600 focus:ring-emerald-600/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setInputText('');
                }}
                aria-label="Clear input text"
                className={`absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg cursor-pointer ${
                  isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {errorMessage && (
            <p role="alert" className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}
        </section>

        {/* Flat Hairline-Separated Color Pickers (No nested cards) */}
        <section
          aria-label="QR Color Styling"
          className={`rounded-2xl border divide-y ${
            isLight
              ? 'bg-white border-zinc-200 divide-zinc-200'
              : 'bg-zinc-900 border-zinc-800 divide-zinc-800'
          }`}
        >
          {/* Header Row */}
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold">QR Colors</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSwapColors}
                aria-label="Swap foreground and background colors"
                title="Swap Colors"
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
                  isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetColors}
                aria-label="Reset colors to default black and white"
                title="Reset Colors"
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
                  isLight ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Foreground Row */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="qr-fg-color" className="text-xs font-medium">
                Foreground
              </label>
              <span className={`text-xs font-mono tabular-nums uppercase ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {fgColor}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <label
                title="Custom Foreground Color"
                className={`relative w-[44px] h-[44px] rounded-xl border cursor-pointer shrink-0 flex items-center justify-center ${
                  isLight ? 'border-zinc-300 bg-zinc-50 hover:border-zinc-400' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                }`}
              >
                <input
                  id="qr-fg-color"
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  aria-label="Pick QR foreground color"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <span
                  className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center"
                  style={{ backgroundColor: fgColor }}
                >
                  <Pipette className="w-3 h-3 text-white mix-blend-difference" />
                </span>
              </label>

              {FG_PRESETS.map((c) => {
                const selected = fgColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setFgColor(c.hex);
                    }}
                    aria-label={`Select foreground color ${c.label}`}
                    title={c.label}
                    className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border cursor-pointer shrink-0 ${
                      selected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : isLight
                        ? 'border-zinc-200 hover:border-zinc-400'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/15"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Row */}
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="qr-bg-color" className="text-xs font-medium">
                Background
              </label>
              <span className={`text-xs font-mono tabular-nums uppercase ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {bgColor}
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <label
                title="Custom Background Color"
                className={`relative w-[44px] h-[44px] rounded-xl border cursor-pointer shrink-0 flex items-center justify-center ${
                  isLight ? 'border-zinc-300 bg-zinc-50 hover:border-zinc-400' : 'border-zinc-700 bg-zinc-950 hover:border-zinc-500'
                }`}
              >
                <input
                  id="qr-bg-color"
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  aria-label="Pick QR background color"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
                <span
                  className="w-6 h-6 rounded-full border border-black/20 flex items-center justify-center"
                  style={{ backgroundColor: bgColor }}
                >
                  <Pipette className="w-3 h-3 text-white mix-blend-difference" />
                </span>
              </label>

              {BG_PRESETS.map((c) => {
                const selected = bgColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setBgColor(c.hex);
                    }}
                    aria-label={`Select background color ${c.label}`}
                    title={c.label}
                    className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border cursor-pointer shrink-0 ${
                      selected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : isLight
                        ? 'border-zinc-200 hover:border-zinc-400'
                        : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/15"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Thumb-Zone Primary CTAs */}
      <footer
        className={`px-4 py-3 border-t shrink-0 flex items-center gap-2 ${
          isLight ? 'bg-white border-zinc-200' : 'bg-zinc-950 border-zinc-800'
        }`}
      >
        <button
          type="button"
          onClick={handleGenerateClick}
          disabled={isGenerating}
          aria-label="Generate QR Code"
          className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${
            isLight
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
          }`}
        >
          <span>{isGenerating ? 'Generating...' : 'Generate & Save'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          disabled={!qrDataUrl}
          aria-label="Share QR Code"
          className={`min-h-[48px] px-4 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 ${
            isLight
              ? 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
              : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={downloadQrImage}
          disabled={!qrDataUrl}
          aria-label="Download QR Image"
          title="Download PNG"
          className={`min-w-[48px] min-h-[48px] rounded-xl border flex items-center justify-center transition cursor-pointer disabled:opacity-40 ${
            isLight
              ? 'bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50'
              : 'bg-zinc-900 border-zinc-700 text-zinc-100 hover:bg-zinc-800'
          }`}
        >
          <Download className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
