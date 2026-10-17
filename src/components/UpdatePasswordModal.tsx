import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X, ShieldCheck, AlertCircle } from 'lucide-react';
import { validatePassword } from '../core/qrUtils.ts';

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const UpdatePasswordModal: React.FC<UpdatePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Ported from UpdatePasswordActivity.java: CheckValidation & Utils.validatePassword
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setError(validation.error || 'Password must be valid!');
      onShowToast(validation.error || 'Password must be valid!', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Confirm password not matching!');
      onShowToast('Confirm password not matching!', 'error');
      return;
    }

    onShowToast('Password updated successfully', 'success');
    onSuccess();
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-labelledby="password-modal-title"
        className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-neutral-100"
      >
        {/* Header */}
        <div className="bg-neutral-800/80 px-5 py-4 border-b border-neutral-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="password-modal-title" className="font-semibold text-base text-neutral-100">
                Set New Password
              </h3>
              <p className="text-[11px] text-neutral-400">Security & Credential Utility</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter new password (min. 6 chars)"
                className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Re-enter new password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {/* Action Buttons (Ported from btn_submit & btn_skip in act_update_password.xml) */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={handleSkip}
              aria-label="Skip password update"
              className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Skip
            </button>
            <button
              type="submit"
              aria-label="Submit new password"
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/40 transition cursor-pointer"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
