import React, { useRef, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  theme: ThemeMode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  theme,
  children,
  footer,
}) => {
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDragY(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handlePointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startYRef.current === null) return;
    const delta = Math.max(0, e.clientY - startYRef.current);
    setDragY(delta);
  };

  const handlePointerUp = () => {
    if (startYRef.current === null) return;
    if (dragY > 72) {
      triggerHaptic('light');
      onClose();
    }
    setDragY(0);
    startYRef.current = null;
  };

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col justify-end bg-black/60"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: startYRef.current === null ? 'transform 180ms ease-out' : 'none',
        }}
        className={`w-full max-h-[88%] flex flex-col rounded-t-2xl border-t ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900'
            : 'bg-zinc-900 border-zinc-800 text-zinc-100'
        }`}
      >
        {/* Swipe-to-dismiss Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label="Swipe down to dismiss"
          className="pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className={`w-10 h-1 rounded-full ${isLight ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
        </div>

        {/* Sheet Header */}
        <div
          className={`px-4 py-2 border-b flex items-center justify-between gap-2 ${
            isLight ? 'border-zinc-200' : 'border-zinc-800'
          }`}
        >
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight truncate">{title}</h2>
            {subtitle && (
              <p className={`text-xs truncate ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            aria-label={`Close ${title}`}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl transition cursor-pointer ${
              isLight
                ? 'text-zinc-600 hover:bg-zinc-100'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Bottom Thumb-Zone Action Footer */}
        {footer && (
          <div
            className={`p-4 border-t pb-[max(16px,env(safe-area-inset-bottom))] ${
              isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
