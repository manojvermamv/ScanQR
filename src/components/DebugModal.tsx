import React, { useState } from 'react';
import { Bug, Copy, Check, RotateCcw, X } from 'lucide-react';
import { AppError } from '../core/types.ts';

interface DebugModalProps {
  isOpen: boolean;
  error: AppError | null;
  onClose: () => void;
  onRestart: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DebugModal: React.FC<DebugModalProps> = ({
  isOpen,
  error,
  onClose,
  onRestart,
  onShowToast,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const errorTitle = error?.title || 'An error occured';
  const errorMessage = error?.message || 'Unexpected application runtime event.';
  const stackTrace = error?.stack || `com.scanqr.app.DebugActivity: Runtime diagnostic trace
  at MainActivity.onCreate(MainActivity.java:79)
  at QrScanActivity.onResume(QrScanActivity.java:88)
  at CodeScanner.startPreview(CodeScanner.java:210)
  at android.os.Handler.handleCallback(Handler.java:938)
  at android.app.ActivityThread.main(ActivityThread.java:7844)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${errorTitle}\n${errorMessage}\n\nStack:\n${stackTrace}`);
    setCopied(true);
    onShowToast('Error Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="debug-title"
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100"
      >
        {/* Header */}
        <div className="bg-neutral-800/80 px-5 py-4 border-b border-neutral-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h3 id="debug-title" className="font-semibold text-base text-neutral-100">
                {errorTitle}
              </h3>
              <p className="text-[11px] text-neutral-400">Uncaught Exception Handler</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close error dialog"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trace body */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-neutral-300 font-medium">{errorMessage}</p>
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800/80 font-mono text-[11px] text-neutral-400 max-h-52 overflow-y-auto select-all leading-relaxed whitespace-pre-wrap">
            {stackTrace}
          </div>
        </div>

        {/* Action Buttons (Ported from DebugActivity.java: Restart, Copy Error, Close) */}
        <div className="px-5 py-3.5 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between gap-2">
          <button
            onClick={handleCopy}
            aria-label="Copy Error to clipboard"
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Error'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close error modal"
              className="px-3.5 py-2 text-neutral-400 hover:text-neutral-200 text-xs font-semibold transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={onRestart}
              aria-label="Restart app"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
