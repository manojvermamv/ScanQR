import React, { useState } from 'react';
import { Star, Check, X, Sparkles } from 'lucide-react';

interface RateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitRating: (stars: number) => void;
}

export const RateAppModal: React.FC<RateAppModalProps> = ({
  isOpen,
  onClose,
  onSubmitRating,
}) => {
  const [rating, setRating] = useState<number>(5);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="rate-title"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100 text-center"
      >
        <div className="p-6 space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/20">
            <Sparkles className="w-7 h-7" />
          </div>

          <div>
            <h3 id="rate-title" className="text-lg font-bold text-white tracking-tight">
              Enjoying Scan QR?
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Tap a star to rate it on the App Store or Google Play
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                aria-label={`Rate ${star} stars`}
                className="p-1.5 transition hover:scale-125 cursor-pointer text-amber-400"
              >
                <Star
                  className={`w-7 h-7 ${star <= rating ? 'fill-current' : 'text-neutral-700'}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-neutral-950/80 border-t border-neutral-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            aria-label="Not now"
            className="flex-1 py-2.5 text-xs font-semibold text-neutral-400 hover:text-neutral-200 rounded-xl transition cursor-pointer"
          >
            Not Now
          </button>
          <button
            onClick={() => {
              onSubmitRating(rating);
              onClose();
            }}
            aria-label="Submit app review"
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 transition cursor-pointer"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
