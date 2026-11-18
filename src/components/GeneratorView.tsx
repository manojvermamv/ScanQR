import React, { useState, useEffect, useRef } from 'react';
import bwipjs from 'bwip-js/browser';
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
  BARCODE_FORMATS,
  BG_COLOR_PRESETS,
  FG_COLOR_PRESETS,
  buildBwipRenderOptions,
  getBarcodeFormatSpec,
  validateBarcodeInput,
  detectContentType,
  hasLowContrast,
} from '../core/qrUtils.ts';
import {
  BarcodeFormat,
  PermissionPurpose,
  QrRecord,
  ThemeMode,
} from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';

interface GeneratorViewProps {
  theme: ThemeMode;
  onSaveRecord: (record: Omit<QrRecord, 'id' | 'createdAt'>) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestPermission: (purpose: PermissionPurpose, onGranted: () => void) => void;
}

const FG_PRESETS = FG_COLOR_PRESETS;
const BG_PRESETS = BG_COLOR_PRESETS;

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  theme,
  onSaveRecord,
  onShowToast,
  onRequestPermission,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<BarcodeFormat>('QR_CODE');
  const [inputText, setInputText] = useState<string>('https://scanqr.app');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [codeDataUrl, setCodeDataUrl] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string>('url');
  const [isGenerating, setIsGenerating] = useState<boolean>(true);

  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isLight = theme === 'light';
  const lowContrast = hasLowContrast(fgColor, bgColor);
  const formatSpec = getBarcodeFormatSpec(selectedFormat);

  useEffect(() => {
    if (inputText.trim()) {
      const check = validateBarcodeInput(inputText, selectedFormat);
      if (check.isValid) {
        generateCode(inputText, selectedFormat, false, fgColor, bgColor);
      } else {
        setIsGenerating(false);
      }
    } else {
      setIsGenerating(false);
    }
  }, [fgColor, bgColor, selectedFormat]);

  const renderBarcodeDataUrl = (
    payload: string,
    format: BarcodeFormat,
    customFg: string,
    customBg: string
  ): string => {
    const spec = getBarcodeFormatSpec(format);
    const canvas = offscreenCanvasRef.current || document.createElement('canvas');
    offscreenCanvasRef.current = canvas;

    const renderOpts = buildBwipRenderOptions({
      payload,
      format,
      fgColor: customFg,
      bgColor: customBg,
    }) as bwipjs.RenderOptions;

    bwipjs.toCanvas(canvas, renderOpts);

    return canvas.toDataURL('image/png');
  };

  const generateCode = (
    text: string,
    format: BarcodeFormat = selectedFormat,
    notify = true,
    customFg = fgColor,
    customBg = bgColor
  ) => {
    const validation = validateBarcodeInput(text, format);
    if (!validation.isValid) {
      setErrorMessage(validation.error || 'Please enter a valid value');
      setIsGenerating(false);
      return;
    }

    setErrorMessage(null);
    setRenderError(null);
    setIsGenerating(true);

    try {
      const dataUrl = renderBarcodeDataUrl(
        validation.normalizedValue,
        format,
        customFg,
        customBg
      );

      setCodeDataUrl(dataUrl);
      setIsGenerating(false);

      if (notify) {
        triggerHaptic('success');
        const label = getBarcodeFormatSpec(format).label;
        onSaveRecord({
          content: validation.normalizedValue,
          format,
          type: format === 'QR_CODE' ? detectContentType(validation.normalizedValue) : 'text',
          category: 'generated',
          isFavorite: false,
          title: `${label}: ${validation.normalizedValue.slice(0, 24)}`,
        });
        onShowToast(`${label} saved to history`, 'success');
      }
    } catch {
      setIsGenerating(false);
      setRenderError(`Unable to encode this payload as ${getBarcodeFormatSpec(format).label}.`);
      triggerHaptic('error');
    }
  };

  const handleSelectFormat = (nextFormat: BarcodeFormat) => {
    if (nextFormat === selectedFormat) return;
    triggerHaptic('light');
    setSelectedFormat(nextFormat);
    setErrorMessage(null);
    setRenderError(null);

    const nextSpec = getBarcodeFormatSpec(nextFormat);
    const currentCheck = validateBarcodeInput(inputText, nextFormat);
    const isExistingDefault = BARCODE_FORMATS.some((f) => f.sampleValue === inputText.trim());

    const nextText =
      !currentCheck.isValid || isExistingDefault ? nextSpec.sampleValue : inputText;

    setInputText(nextText);
    generateCode(nextText, nextFormat, false, fgColor, bgColor);
  };

  const handleGenerateClick = () => {
    triggerHaptic('medium');
    onRequestPermission('storageSave', () => {
      generateCode(inputText, selectedFormat, true);
    });
  };

  const handleClear = () => {
    triggerHaptic('light');
    setCodeDataUrl(null);
    setRenderError(null);
    setErrorMessage(null);
  };

  const handleRestoreDefault = () => {
    triggerHaptic('light');
    const defaultVal = formatSpec.sampleValue;
    if (selectedFormat === 'QR_CODE') {
      setActiveTemplate('url');
    }
    setInputText(defaultVal);
    generateCode(defaultVal, selectedFormat, false);
  };

  const downloadCodeImage = () => {
    if (!codeDataUrl) return;
    const a = document.createElement('a');
    a.href = codeDataUrl;
    a.download = `ScanQR_${selectedFormat}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    triggerHaptic('success');
    onShowToast(`${formatSpec.label} image downloaded`, 'success');
  };

  const handleShare = async () => {
    if (!codeDataUrl) {
      onShowToast(`Generate a ${formatSpec.label} first`, 'error');
      return;
    }

    triggerHaptic('light');
    onRequestPermission('storageSave', async () => {
      try {
        if (navigator.share) {
          const res = await fetch(codeDataUrl);
          const blob = await res.blob();
          const file = new File([blob], `ScanQR_${selectedFormat}.png`, { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: formatSpec.label,
              text: inputText,
            });
            onShowToast(`${formatSpec.label} shared`, 'success');
            return;
          }
        }

        downloadCodeImage();
        await navigator.clipboard.writeText(inputText);
        onShowToast('Image saved and content copied', 'success');
      } catch {
        downloadCodeImage();
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
    setSelectedFormat('QR_CODE');
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
    generateCode(nextVal, 'QR_CODE', false);
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
        <h1 className="text-lg font-semibold tracking-tight">Generate Code</h1>
        <span className={`text-xs font-medium ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {formatSpec.label}
        </span>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Preview Area (4 explicit states) */}
        <section aria-label="Code Preview" className="flex flex-col items-center">
          <div
            className={`w-full max-w-[300px] h-44 rounded-2xl border p-2.5 flex flex-col items-center justify-center relative ${
              isLight ? 'bg-white border-zinc-200' : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            {isGenerating ? (
              <div
                data-testid="generator-loading-skeleton"
                className="w-full h-full flex flex-col items-center justify-center gap-2 animate-pulse"
              >
                <div
                  className={`w-36 h-28 rounded-xl ${
                    isLight ? 'bg-zinc-200' : 'bg-zinc-800'
                  }`}
                />
                <span className="sr-only">Generating barcode</span>
              </div>
            ) : renderError ? (
              <div className="text-center space-y-2 p-2">
                <AlertCircle className="w-6 h-6 text-red-500 mx-auto" />
                <p className="text-xs font-medium text-red-500">{renderError}</p>
                <button
                  type="button"
                  onClick={() => generateCode(inputText, selectedFormat, false)}
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
            ) : codeDataUrl ? (
              <div
                className="w-full h-full rounded-xl flex items-center justify-center p-2 overflow-hidden"
                style={{ backgroundColor: bgColor }}
              >
                <img
                  src={codeDataUrl}
                  alt={`Generated ${formatSpec.label}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
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
                  Restore Sample
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

        {/* Symbology / Format Selector (QR + 1D/2D Barcodes) */}
        <section aria-label="Barcode format selector" className="space-y-1.5">
          <span className={`text-xs font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
            Format
          </span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {BARCODE_FORMATS.map((fmt) => {
              const selected = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleSelectFormat(fmt.id)}
                  aria-label={`Select ${fmt.label} format`}
                  aria-pressed={selected}
                  className={`min-h-[44px] px-3.5 rounded-xl text-xs font-medium whitespace-nowrap border transition cursor-pointer shrink-0 ${
                    selected
                      ? isLight
                        ? 'bg-emerald-600 border-emerald-600 text-white font-semibold'
                        : 'bg-emerald-500 border-emerald-500 text-zinc-950 font-semibold'
                      : isLight
                      ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {fmt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* QR Payload Type Presets (shown when QR Code is active) */}
        {selectedFormat === 'QR_CODE' && (
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
                        ? 'bg-zinc-900 border-zinc-900 text-white font-semibold'
                        : 'bg-zinc-800 border-zinc-600 text-zinc-100 font-semibold'
                      : isLight
                      ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </section>
        )}

        {/* Input Field (>= 16px font size, 48px height, 44x44 clear button) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="qr-input-field"
              className={`text-xs font-semibold ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}
            >
              Content
            </label>
            {codeDataUrl && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear code preview"
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
                const nextVal = e.target.value;
                setInputText(nextVal);
                if (errorMessage) setErrorMessage(null);
                if (nextVal.trim() && validateBarcodeInput(nextVal, selectedFormat).isValid) {
                  generateCode(nextVal, selectedFormat, false, fgColor, bgColor);
                }
              }}
              placeholder={formatSpec.sampleValue}
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
                  setErrorMessage(null);
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

          <p className={`text-xs ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
            {formatSpec.hint}
          </p>

          {errorMessage && (
            <p role="alert" className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}
        </section>

        {/* Flat Hairline-Separated Color Pickers (No nested cards) */}
        <section
          aria-label="Code Color Styling"
          className={`rounded-2xl border divide-y ${
            isLight
              ? 'bg-white border-zinc-200 divide-zinc-200'
              : 'bg-zinc-900 border-zinc-800 divide-zinc-800'
          }`}
        >
          {/* Header Row */}
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold">Code Colors</span>
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
                  aria-label="Pick code foreground color"
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
                  aria-label="Pick code background color"
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
          aria-label="Generate Code"
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
          disabled={!codeDataUrl}
          aria-label="Share Code"
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
          onClick={downloadCodeImage}
          disabled={!codeDataUrl}
          aria-label="Download Code Image"
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
