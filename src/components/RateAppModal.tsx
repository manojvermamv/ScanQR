import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface RateAppModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
  onSubmitRating: (stars: number) => void;
}

export const RateAppModal: React.FC<RateAppModalProps> = ({
  isOpen,
  theme,
  onClose,
  onSubmitRating,
}) => {
  const [rating, setRating] = useState<number>(5);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const footer = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        aria-label="Not now"
        className={`flex-1 min-h-[48px] px-4 rounded-xl border text-sm font-medium transition cursor-pointer ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
        }`}
      >
        Not Now
      </button>
      <button
        type="button"
        onClick={() => {
          triggerHaptic('success');
          onSubmitRating(rating);
          onClose();
        }}
        aria-label="Submit app review"
        className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold transition cursor-pointer ${
          isLight
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
        }`}
      >
        Submit Rating
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Rate Scan QR"
      theme={theme}
      footer={footer}
    >
      <div className="space-y-4 text-center py-2">
        <p className={`text-sm ${isLight ? 'text-zinc-700' : 'text-zinc-300'}`}>
          Select a rating to share your feedback on Scan QR.
        </p>

        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setRating(star);
              }}
              aria-label={`Rate ${star} stars`}
              className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition cursor-pointer ${
                isLight ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'
              }`}
            >
              <Star
                className={`w-7 h-7 ${
                  star <= rating
                    ? 'fill-amber-400 text-amber-400'
                    : isLight
                    ? 'text-zinc-300'
                    : 'text-zinc-700'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};
