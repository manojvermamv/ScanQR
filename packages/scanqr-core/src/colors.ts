/**
 * Portable color presets and WCAG contrast helpers for QR & barcode scannability.
 */

import { validateHexColor } from './validation';

export interface ColorPreset {
  label: string;
  hex: string;
}

export const FG_COLOR_PRESETS: ColorPreset[] = [
  { label: 'Black', hex: '#000000' },
  { label: 'Emerald', hex: '#059669' },
  { label: 'Slate', hex: '#1e293b' },
  { label: 'Navy', hex: '#1d4ed8' },
];

export const BG_COLOR_PRESETS: ColorPreset[] = [
  { label: 'White', hex: '#ffffff' },
  { label: 'Stone', hex: '#f5f5f4' },
  { label: 'Mint', hex: '#ecfdf5' },
  { label: 'Charcoal', hex: '#18181b' },
];

function parseHexToRgb(hex: string): [number, number, number] | null {
  if (!validateHexColor(hex)) return null;
  let clean = hex.trim().slice(1);
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG contrast ratio between two hex colors.
 */
export function getContrastRatio(hexA: string, hexB: string): number {
  const rgbA = parseHexToRgb(hexA);
  const rgbB = parseHexToRgb(hexB);
  if (!rgbA || !rgbB) return 1;
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true if foreground and background contrast is too low for reliable scanning (< 3:1).
 */
export function hasLowContrast(fgHex: string, bgHex: string): boolean {
  return getContrastRatio(fgHex, bgHex) < 3.0;
}
