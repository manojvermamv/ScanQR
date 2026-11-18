/**
 * Portable payload validation & GS1 check-digit helpers for QR codes and 1D/2D barcodes.
 */

import { BarcodeFormat } from './types';

const FORMAT_LABELS: Record<BarcodeFormat, string> = {
  QR_CODE: 'QR Code',
  CODE_128: 'Code 128',
  CODE_39: 'Code 39',
  EAN_13: 'EAN-13',
  EAN_8: 'EAN-8',
  UPC_A: 'UPC-A',
  ITF: 'ITF',
  CODABAR: 'Codabar',
  PDF_417: 'PDF417',
  DATA_MATRIX: 'Data Matrix',
  AZTEC: 'Aztec',
};

/**
 * Computes GS1 Mod-10 check digit for EAN-13, EAN-8, and UPC-A.
 */
export function computeGs1CheckDigit(digitsWithoutCheck: string): number {
  let sum = 0;
  const len = digitsWithoutCheck.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(digitsWithoutCheck[len - 1 - i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Validates app lock password (minimum 6 chars, at least one letter and one number).
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password cannot be empty' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Password must contain at least one letter and one number' };
  }

  return { isValid: true };
}

/**
 * Validates QR input text.
 */
export function validateQrInput(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Please enter a value' };
  }
  if (text.length > 2953) {
    return { isValid: false, error: 'Text exceeds maximum QR code capacity' };
  }
  return { isValid: true };
}

/**
 * Validates input payload against a specific QR or 1D/2D barcode symbology.
 */
export function validateBarcodeInput(
  text: string,
  format: BarcodeFormat
): { isValid: boolean; normalizedValue: string; error?: string } {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { isValid: false, normalizedValue: '', error: 'Please enter a value' };
  }

  switch (format) {
    case 'QR_CODE': {
      const qrCheck = validateQrInput(trimmed);
      return {
        isValid: qrCheck.isValid,
        normalizedValue: trimmed,
        error: qrCheck.error,
      };
    }

    case 'CODE_128': {
      if (trimmed.length > 80) {
        return { isValid: false, normalizedValue: trimmed, error: 'Code 128 supports up to 80 characters' };
      }
      if (!/^[\x20-\x7E]+$/.test(trimmed)) {
        return {
          isValid: false,
          normalizedValue: trimmed,
          error: 'Code 128 supports printable ASCII characters only',
        };
      }
      return { isValid: true, normalizedValue: trimmed };
    }

    case 'CODE_39': {
      const upper = trimmed.toUpperCase();
      if (upper.length > 43) {
        return { isValid: false, normalizedValue: upper, error: 'Code 39 supports up to 43 characters' };
      }
      if (!/^[A-Z0-9\-. $/+%]+$/.test(upper)) {
        return {
          isValid: false,
          normalizedValue: upper,
          error: 'Code 39 supports A-Z, 0-9, space, and - . $ / + %',
        };
      }
      return { isValid: true, normalizedValue: upper };
    }

    case 'EAN_13': {
      if (!/^\d{12,13}$/.test(trimmed)) {
        return { isValid: false, normalizedValue: trimmed, error: 'EAN-13 requires 12 or 13 digits' };
      }
      const expected = computeGs1CheckDigit(trimmed.slice(0, 12));
      if (trimmed.length === 12) {
        return { isValid: true, normalizedValue: `${trimmed}${expected}` };
      }
      if (parseInt(trimmed[12], 10) !== expected) {
        return {
          isValid: false,
          normalizedValue: trimmed,
          error: `Invalid EAN-13 check digit (expected ${expected})`,
        };
      }
      return { isValid: true, normalizedValue: trimmed };
    }

    case 'EAN_8': {
      if (!/^\d{7,8}$/.test(trimmed)) {
        return { isValid: false, normalizedValue: trimmed, error: 'EAN-8 requires 7 or 8 digits' };
      }
      const expected = computeGs1CheckDigit(trimmed.slice(0, 7));
      if (trimmed.length === 7) {
        return { isValid: true, normalizedValue: `${trimmed}${expected}` };
      }
      if (parseInt(trimmed[7], 10) !== expected) {
        return {
          isValid: false,
          normalizedValue: trimmed,
          error: `Invalid EAN-8 check digit (expected ${expected})`,
        };
      }
      return { isValid: true, normalizedValue: trimmed };
    }

    case 'UPC_A': {
      if (!/^\d{11,12}$/.test(trimmed)) {
        return { isValid: false, normalizedValue: trimmed, error: 'UPC-A requires 11 or 12 digits' };
      }
      const expected = computeGs1CheckDigit(trimmed.slice(0, 11));
      if (trimmed.length === 11) {
        return { isValid: true, normalizedValue: `${trimmed}${expected}` };
      }
      if (parseInt(trimmed[11], 10) !== expected) {
        return {
          isValid: false,
          normalizedValue: trimmed,
          error: `Invalid UPC-A check digit (expected ${expected})`,
        };
      }
      return { isValid: true, normalizedValue: trimmed };
    }

    case 'ITF': {
      if (!/^\d{2,40}$/.test(trimmed) || trimmed.length % 2 !== 0) {
        return {
          isValid: false,
          normalizedValue: trimmed,
          error: 'ITF requires an even number of digits (2-40)',
        };
      }
      return { isValid: true, normalizedValue: trimmed };
    }

    case 'CODABAR': {
      const normalized = trimmed.toUpperCase();
      if (!/^[A-D][0-9\-$:/.+]+[A-D]$/.test(normalized)) {
        return {
          isValid: false,
          normalizedValue: normalized,
          error: 'Codabar requires A-D start/stop letters around digits or - $ : / . +',
        };
      }
      return { isValid: true, normalizedValue: normalized };
    }

    case 'PDF_417':
    case 'DATA_MATRIX':
    case 'AZTEC': {
      if (trimmed.length > 1500) {
        return {
          isValid: false,
          normalizedValue: trimmed,
          error: `${FORMAT_LABELS[format]} input exceeds 1,500 characters`,
        };
      }
      return { isValid: true, normalizedValue: trimmed };
    }
  }
}

/**
 * Validates a 3 or 6 digit hex color code.
 */
export function validateHexColor(hex: string): boolean {
  if (!hex) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Normalizes #RGB or #RRGGBB into lowercase 6-digit hex without leading # for bwip-js.
 */
export function normalizeHexForBwip(hex: string, fallback = '000000'): string {
  if (!validateHexColor(hex)) return fallback;
  let clean = hex.trim().slice(1);
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return clean.toLowerCase();
}
