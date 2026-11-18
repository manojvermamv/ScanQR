import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { validatePassword } from '../core/qrUtils.ts';
import { ThemeMode } from '../core/types.ts';
import { triggerHaptic } from '../core/haptics.ts';
import { BottomSheet } from './BottomSheet.tsx';

interface UpdatePasswordModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  isOpen,
  theme,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      triggerHaptic('error');
      const msg = validation.error || 'Password must contain at least 6 characters, including a letter and a number.';
      setError(msg);
      onShowToast(msg, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerHaptic('error');
      setError('Passwords do not match.');
      onShowToast('Passwords do not match', 'error');
      return;
    }

    triggerHaptic('success');
    setNewPassword('');
    setConfirmPassword('');
    onShowToast('Password updated', 'success');
    onSuccess();
    onClose();
  };

  const footer = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          onClose();
        }}
        aria-label="Cancel password update"
        className={`flex-1 min-h-[48px] px-4 rounded-xl border text-sm font-medium transition cursor-pointer ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-100'
            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
        }`}
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={() => handleSubmit()}
        aria-label="Save new password"
        className={`flex-1 min-h-[48px] px-4 rounded-xl text-sm font-semibold transition cursor-pointer ${
          isLight
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
            : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
        }`}
      >
        Save Password
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="App Password"
      subtitle="Protect saved QR history"
      theme={theme}
      footer={footer}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="new-password-input"
            className={`block text-xs font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}
          >
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              id="new-password-input"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Minimum 6 chars, letter & number"
              className={`w-full min-h-[48px] pl-3.5 pr-12 rounded-xl border text-base focus:outline-none focus:border-emerald-500 transition ${
                isLight
                  ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className={`absolute right-1 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg cursor-pointer ${
                isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirm-password-input"
            className={`block text-xs font-medium ${isLight ? 'text-zinc-600' : 'text-zinc-400'}`}
          >
            Confirm Password
          </label>
          <input
            id="confirm-password-input"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Re-enter new password"
            className={`w-full min-h-[48px] px-3.5 rounded-xl border text-base focus:outline-none focus:border-emerald-500 transition ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-500'
            }`}
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </form>
    </BottomSheet>
  );
};
