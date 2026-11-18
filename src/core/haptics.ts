/**
 * Lightweight native haptic feedback utility
 * Uses Vibration API on supported mobile browsers without failing in desktop/headless environments.
 */

export type HapticStyle = 'light' | 'medium' | 'success' | 'error';

export function triggerHaptic(style: HapticStyle = 'light'): void {
  try {
    const userActivation =
      typeof navigator !== 'undefined'
        ? (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation
        : undefined;
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.vibrate === 'function' &&
      (!userActivation || userActivation.hasBeenActive)
    ) {
      switch (style) {
        case 'light':
          navigator.vibrate(8);
          break;
        case 'medium':
          navigator.vibrate(16);
          break;
        case 'success':
          navigator.vibrate([10, 30, 14]);
          break;
        case 'error':
          navigator.vibrate([24, 40, 24]);
          break;
      }
    }
  } catch {
    // Ignore vibration errors in restricted environments
  }
}
