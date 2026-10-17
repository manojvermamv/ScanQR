import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Menu, 
  ScanLine, 
  Trash2, 
  Share2, 
  Download, 
  Sparkles, 
  Globe, 
  Wifi, 
  Mail, 
  Phone, 
  FileText,
  AlertCircle,
  Copy,
  Check,
  Palette,
  ArrowLeftRight,
  RotateCcw
} from 'lucide-react';
import { validateQrInput, detectContentType, validateHexColor } from '../core/qrUtils.ts';
import { QrRecord, ThemeMode } from '../core/types.ts';

interface GeneratorViewProps {
  theme?: ThemeMode;
  onOpenDrawer: () => void;
  onOpenScanner: () => void;
  onSaveRecord: (record: Omit<QrRecord, 'id' | 'createdAt'>) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onRequestPermission: (permissionName: string, onGranted: () => void) => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({
  theme = 'dark',
  onOpenDrawer,
  onOpenScanner,
  onSaveRecord,
  onShowToast,
  onRequestPermission,
}) => {
  const [inputText, setInputText] = useState<string>('https://scanqr.app');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string>('url');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Custom QR styling colors (Foreground & Background)
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [isColorCustomizerOpen, setIsColorCustomizerOpen] = useState<boolean>(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate QR code whenever text or colors change
  useEffect(() => {
    if (inputText.trim()) {
      generateQr(inputText, false, fgColor, bgColor);
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
      return;
    }
    setErrorMessage(null);
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
        onSaveRecord({
          content: text,
          type: detectContentType(text),
          category: 'generated',
          isFavorite: false,
          title: `Generated: ${text.slice(0, 24)}`,
        });
        onShowToast('QR Code generated successfully', 'success');
      }
    } catch (e) {
      console.error(e);
      setIsGenerating(false);
      onShowToast('Failed to generate QR Code', 'error');
    }
  };

  const handleFgColorChange = (newColor: string) => {
    setFgColor(newColor);
  };

  const handleBgColorChange = (newColor: string) => {
    setBgColor(newColor);
  };

  const handleSwapColors = () => {
    const temp = fgColor;
    setFgColor(bgColor);
    setBgColor(temp);
    onShowToast('Colors inverted', 'info');
  };

  const handleResetColors = () => {
    setFgColor('#000000');
    setBgColor('#ffffff');
    onShowToast('Colors reset to default', 'info');
  };

  const handleGenerateClick = () => {
    // Ported from MainActivity.java: check storage permission before generating/saving
    onRequestPermission('android.permission.WRITE_EXTERNAL_STORAGE', () => {
      generateQr(inputText, true);
    });
  };

  const handleClear = () => {
    setQrDataUrl(null);
    setInputText('');
    setErrorMessage(null);
    onShowToast('QR Code cleared', 'info');
  };

  const handleShare = async () => {
    if (!qrDataUrl) {
      onShowToast('Generate QR for sharing', 'error');
      return;
    }

    // Ported from MainActivity.java: ShareQrProcess -> saveBitmapToFile & shareImage
    onRequestPermission('android.permission.WRITE_EXTERNAL_STORAGE', async () => {
      try {
        if (navigator.share) {
          // Convert dataURL to blob for sharing
          const res = await fetch(qrDataUrl);
          const blob = await res.blob();
          const file = new File([blob], 'ScanQR_Code.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Scan QR Code',
              text: inputText,
            });
            onShowToast('QR Code shared successfully', 'success');
            return;
          }
        }

        // Fallback: download image and copy text
        downloadQrImage();
        navigator.clipboard.writeText(inputText);
        onShowToast('QR successfully saved. Content copied to clipboard', 'success');
      } catch (err) {
        // If aborted or error, fallback to download
        downloadQrImage();
      }
    });
  };

  const downloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `ScanQR_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast('QR Code image saved to Downloads', 'success');
  };

  const applyTemplate = (type: string) => {
    setActiveTemplate(type);
    switch (type) {
      case 'url':
        setInputText('https://scanqr.app');
        break;
      case 'wifi':
        setInputText('WIFI:S:MyHomeWiFi;T:WPA;P:SecretKey2026;;');
        break;
      case 'email':
        setInputText('mailto:support@scanqr.app?subject=Inquiry');
        break;
      case 'phone':
        setInputText('tel:+14155552671');
        break;
      case 'text':
        setInputText('ScanQR: Modern cross-platform QR code generator and scanner');
        break;
    }
    setErrorMessage(null);
  };

  return (
    <div className={`flex-1 flex flex-col h-full overflow-y-auto ${
      theme === 'light' ? 'bg-neutral-50 text-neutral-900' : 'bg-neutral-900 text-neutral-100'
    }`}>
      {/* Top App Bar (Ported from include_actionbar_main.xml) */}
      <header className={`px-4 py-3 backdrop-blur-md border-b flex items-center justify-between sticky top-0 z-20 ${
        theme === 'light' 
          ? 'bg-white/90 border-neutral-200 text-neutral-900' 
          : 'bg-neutral-900/90 border-neutral-800/80 text-neutral-100'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDrawer}
            aria-label="Open menu drawer"
            className={`p-2 -ml-1 rounded-xl transition cursor-pointer ${
              theme === 'light' ? 'text-neutral-700 hover:bg-neutral-100' : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className={`text-base font-bold tracking-tight flex items-center gap-2 ${
            theme === 'light' ? 'text-neutral-900' : 'text-white'
          }`}>
            <span>Scan QR</span>
          </h1>
        </div>

        <button
          onClick={onOpenScanner}
          aria-label="Open QR Scanner"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 transition cursor-pointer"
        >
          <ScanLine className="w-4 h-4" />
          <span>Scanner</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col justify-between gap-5">
        {/* Quick Payload Preset Chips */}
        <section aria-label="Payload type presets" className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'url', label: 'Website URL', icon: Globe },
            { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
            { id: 'text', label: 'Plain Text', icon: FileText },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'phone', label: 'Phone', icon: Phone },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTemplate === item.id;
            return (
              <button
                key={item.id}
                onClick={() => applyTemplate(item.id)}
                aria-label={`Select ${item.label} template`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-neutral-950 font-semibold shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700/80 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </section>

        {/* Generated QR Viewport (Ported from lay_generated_qr & qrImage) */}
        <div className="flex-1 flex flex-col items-center justify-center my-2">
          <div className="relative w-64 h-64 rounded-3xl p-4 bg-neutral-950 border-2 border-neutral-800 shadow-xl flex items-center justify-center transition-all duration-300 group">
            {qrDataUrl ? (
              <div 
                className="relative w-full h-full flex items-center justify-center p-2 rounded-2xl shadow-inner animate-in zoom-in-95 duration-200 transition-colors"
                style={{ backgroundColor: bgColor }}
              >
                <img
                  src={qrDataUrl}
                  alt="Generated QR Code"
                  className="w-full h-full object-contain"
                />
                
                {/* Clear Button (Ported from btn_clearqr) */}
                <button
                  onClick={handleClear}
                  aria-label="Clear QR code"
                  title="Clear QR Code"
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg border-2 border-neutral-900 transition hover:scale-105 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Placeholder Text (Ported from qrText: "Your QR Code will appear here") */
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-500">
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-neutral-400">
                  Your QR Code will appear here
                </p>
                <p className="text-xs text-neutral-500">
                  Enter text or a link below and press Generate
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Color Styling & Personalization Controls */}
        <section aria-label="QR Color Styling" className="p-3 bg-neutral-950/80 rounded-2xl border border-neutral-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-neutral-200 tracking-wide">
                QR Styling & Colors
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleSwapColors}
                aria-label="Swap foreground and background colors"
                title="Swap Colors"
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetColors}
                aria-label="Reset colors to default black and white"
                title="Reset to Default"
                className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Foreground Color Picker */}
            <div className="space-y-1.5 p-2 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <div className="flex items-center justify-between">
                <label htmlFor="qr-fg-color" className="text-[11px] font-semibold text-neutral-300">
                  Foreground
                </label>
                <span className="text-[10px] font-mono text-neutral-400 uppercase">
                  {fgColor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-700 shadow-sm cursor-pointer shrink-0 block">
                  <input
                    id="qr-fg-color"
                    type="color"
                    value={fgColor}
                    onChange={(e) => handleFgColorChange(e.target.value)}
                    aria-label="Pick QR foreground color"
                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                  />
                  <span className="w-full h-full block" style={{ backgroundColor: fgColor }} />
                </label>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { label: 'Black', hex: '#000000' },
                    { label: 'Emerald', hex: '#059669' },
                    { label: 'Blue', hex: '#2563eb' },
                    { label: 'Purple', hex: '#7c3aed' },
                    { label: 'Red', hex: '#dc2626' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleFgColorChange(c.hex)}
                      aria-label={`Select foreground color ${c.label}`}
                      title={c.label}
                      className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                        fgColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-white scale-110 ring-1 ring-emerald-500'
                          : 'border-neutral-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="space-y-1.5 p-2 rounded-xl bg-neutral-900 border border-neutral-800/80">
              <div className="flex items-center justify-between">
                <label htmlFor="qr-bg-color" className="text-[11px] font-semibold text-neutral-300">
                  Background
                </label>
                <span className="text-[10px] font-mono text-neutral-400 uppercase">
                  {bgColor}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="relative w-8 h-8 rounded-lg overflow-hidden border border-neutral-700 shadow-sm cursor-pointer shrink-0 block">
                  <input
                    id="qr-bg-color"
                    type="color"
                    value={bgColor}
                    onChange={(e) => handleBgColorChange(e.target.value)}
                    aria-label="Pick QR background color"
                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                  />
                  <span className="w-full h-full block" style={{ backgroundColor: bgColor }} />
                </label>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  {[
                    { label: 'White', hex: '#ffffff' },
                    { label: 'Cream', hex: '#fef3c7' },
                    { label: 'Mint', hex: '#ecfdf5' },
                    { label: 'Sky', hex: '#eff6ff' },
                    { label: 'Slate', hex: '#0f172a' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleBgColorChange(c.hex)}
                      aria-label={`Select background color ${c.label}`}
                      title={c.label}
                      className={`w-5 h-5 rounded-full border transition cursor-pointer ${
                        bgColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'border-white scale-110 ring-1 ring-emerald-500'
                          : 'border-neutral-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Input & Action Form (Ported from til_edtext, edtext, lay_buttons) */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="qr-input-field" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Message or Link
            </label>
            <div className="relative">
              <input
                id="qr-input-field"
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Message or link"
                className={`w-full px-4 py-3 bg-neutral-950 border rounded-2xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 transition ${
                  errorMessage
                    ? 'border-red-500 focus:ring-red-500/30'
                    : 'border-neutral-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                }`}
              />
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  aria-label="Clear input text"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white rounded-md cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {errorMessage && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          {/* Action Buttons (Ported from btn_generate & btn_share) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              aria-label="Generate QR Code"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
            </button>

            <button
              onClick={handleShare}
              disabled={!qrDataUrl}
              aria-label="Share QR Code"
              className="w-full py-3.5 px-4 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-800 text-neutral-200 rounded-2xl text-xs font-bold uppercase tracking-wider border border-neutral-700/60 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
