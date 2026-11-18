/**
 * Core utility functions for ScanQR
 * Decoupled pure logic functions for QR & 1D/2D barcode validation, parsing, export, and platform permissions.
 */

import {
  BarcodeFormat,
  DevicePlatform,
  PermissionPurpose,
  PlatformPermissionSpec,
} from './types.ts';

export interface BarcodeSymbologySpec {
  id: BarcodeFormat;
  label: string;
  dimension: '1d' | '2d';
  bwipBcid: string;
  hint: string;
  sampleValue: string;
}

export const BARCODE_FORMATS: BarcodeSymbologySpec[] = [
  {
    id: 'QR_CODE',
    label: 'QR Code',
    dimension: '2d',
    bwipBcid: 'qrcode',
    hint: 'URLs, Wi-Fi, contacts, or text up to 2,953 chars',
    sampleValue: 'https://scanqr.app',
  },
  {
    id: 'CODE_128',
    label: 'Code 128',
    dimension: '1d',
    bwipBcid: 'code128',
    hint: 'ASCII letters, digits, and symbols (1-80 chars)',
    sampleValue: 'PKG-2026-8492',
  },
  {
    id: 'EAN_13',
    label: 'EAN-13',
    dimension: '1d',
    bwipBcid: 'ean13',
    hint: '12 digits (auto check digit) or valid 13 digits',
    sampleValue: '4006381333931',
  },
  {
    id: 'UPC_A',
    label: 'UPC-A',
    dimension: '1d',
    bwipBcid: 'upca',
    hint: '11 digits (auto check digit) or valid 12 digits',
    sampleValue: '036000291452',
  },
  {
    id: 'EAN_8',
    label: 'EAN-8',
    dimension: '1d',
    bwipBcid: 'ean8',
    hint: '7 digits (auto check digit) or valid 8 digits',
    sampleValue: '96385074',
  },
  {
    id: 'CODE_39',
    label: 'Code 39',
    dimension: '1d',
    bwipBcid: 'code39',
    hint: 'Uppercase A-Z, 0-9, space, and - . $ / + %',
    sampleValue: 'INV-4092',
  },
  {
    id: 'ITF',
    label: 'ITF',
    dimension: '1d',
    bwipBcid: 'interleaved2of5',
    hint: 'Even number of digits (e.g. 14-digit carton GTIN)',
    sampleValue: '10012345678902',
  },
  {
    id: 'CODABAR',
    label: 'Codabar',
    dimension: '1d',
    bwipBcid: 'rationalizedCodabar',
    hint: 'Digits and - $ : / . + wrapped in A-D start/stop',
    sampleValue: 'A40156B',
  },
  {
    id: 'PDF_417',
    label: 'PDF417',
    dimension: '2d',
    bwipBcid: 'pdf417',
    hint: 'Stacked 2D barcode for passes, IDs, and manifests',
    sampleValue: 'BOARDING:SFO-NRT/14A/2026-11-18',
  },
  {
    id: 'DATA_MATRIX',
    label: 'Data Matrix',
    dimension: '2d',
    bwipBcid: 'datamatrix',
    hint: 'Compact 2D matrix for serials, parts, and labels',
    sampleValue: 'SN-DM-88410293',
  },
  {
    id: 'AZTEC',
    label: 'Aztec',
    dimension: '2d',
    bwipBcid: 'azteccode',
    hint: '2D matrix commonly used on transit and rail tickets',
    sampleValue: 'TKT-AZ-99201-GATE4',
  },
];

export function getBarcodeFormatSpec(format?: BarcodeFormat): BarcodeSymbologySpec {
  return (
    BARCODE_FORMATS.find((item) => item.id === format) || BARCODE_FORMATS[0]
  );
}

export function getBarcodeFormatLabel(format?: BarcodeFormat): string {
  return getBarcodeFormatSpec(format).label;
}

/**
 * Computes GS1 Mod-10 check digit for EAN-13, EAN-8, and UPC-A
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
 * Checks if a string is a valid web URL (ported from URLUtil.isNetworkUrl)
 */
export function isNetworkUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed) ||
         /^(www\.)[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/i.test(trimmed);
}

/**
 * Normalizes URL with scheme if missing
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Categorizes payload content type
 */
export function detectContentType(text: string): 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'text' {
  if (!text) return 'text';
  const trimmed = text.trim();

  if (/^WIFI:S:[^;]+;/i.test(trimmed)) {
    return 'wifi';
  }
  if (isNetworkUrl(trimmed)) {
    return 'url';
  }
  if (/^mailto:/i.test(trimmed) || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return 'email';
  }
  if (/^tel:[+0-9]+/i.test(trimmed) || /^\+?[0-9]{7,15}$/.test(trimmed.replace(/[\s\-()]/g, ''))) {
    return 'phone';
  }
  if (/^smsto:[+0-9]+/i.test(trimmed)) {
    return 'sms';
  }

  return 'text';
}

/**
 * Parses WIFI QR code string (WIFI:S:MySSID;T:WPA;P:MyPassword;;)
 */
export function parseWifiQr(text: string): { ssid: string; password?: string; type?: string; hidden?: boolean } | null {
  if (!text.toUpperCase().startsWith('WIFI:')) return null;

  const ssidMatch = text.match(/S:([^;]+);/i);
  const passMatch = text.match(/P:([^;]+);/i);
  const typeMatch = text.match(/T:([^;]+);/i);
  const hiddenMatch = text.match(/H:([^;]+);/i);

  if (!ssidMatch) return null;

  return {
    ssid: ssidMatch[1],
    password: passMatch ? passMatch[1] : undefined,
    type: typeMatch ? typeMatch[1] : 'WPA',
    hidden: hiddenMatch ? hiddenMatch[1].toLowerCase() === 'true' : false,
  };
}

/**
 * Ported from FileUtil.java: getSizeForFile
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1000) {
    return `${Math.round(bytes)} B`;
  } else if (bytes < 1000000) {
    return `${(bytes / 1000).toFixed(2)} KB`;
  } else if (bytes < 1000000000) {
    return `${(bytes / 1000000).toFixed(2)} MB`;
  } else {
    return `${(bytes / 1000000000).toFixed(2)} GB`;
  }
}

/**
 * Ported from FileUtil.java: getDateForFile ("dd/MM/yyyy, hh:mm:ss")
 */
export function formatDate(timestamp: number | Date): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const pad = (n: number) => n.toString().padStart(2, '0');

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();

  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Ported from UpdatePasswordActivity.java & Utils.java: validatePassword
 * Minimum 6 characters with at least one letter and one number
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
 * Validates QR input text
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
 * Validates input payload against a specific QR or 1D/2D barcode symbology
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
          error: `${getBarcodeFormatLabel(format)} input exceeds 1,500 characters`,
        };
      }
      return { isValid: true, normalizedValue: trimmed };
    }
  }
}

/**
 * Returns authentic platform-specific permission metadata for iOS and Android
 */
export function getPlatformPermissionSpec(
  platform: DevicePlatform,
  purpose: PermissionPurpose
): PlatformPermissionSpec {
  if (platform === 'ios') {
    switch (purpose) {
      case 'camera':
        return {
          purpose,
          platform,
          key: 'NSCameraUsageDescription',
          title: 'Camera Access',
          rationale: 'ScanQR needs iPhone camera access to scan QR codes and 1D/2D barcodes in real time.',
          settingsPath: 'Settings > Privacy & Security > Camera > ScanQR',
        };
      case 'photoLibrary':
        return {
          purpose,
          platform,
          key: 'NSPhotoLibraryUsageDescription',
          title: 'Photo Library Access',
          rationale: 'ScanQR needs Photo Library access to select and decode QR codes or barcodes from images.',
          settingsPath: 'Settings > Privacy & Security > Photos > ScanQR',
        };
      case 'storageSave':
        return {
          purpose,
          platform,
          key: 'NSPhotoLibraryAddUsageDescription',
          title: 'Save to Photos',
          rationale: 'ScanQR needs Add Photos access to save generated QR codes and barcodes to your Photo Library.',
          settingsPath: 'Settings > Privacy & Security > Photos > Add Photos Only',
        };
    }
  }

  switch (purpose) {
    case 'camera':
      return {
        purpose,
        platform,
        key: 'android.permission.CAMERA',
        title: 'Camera Permission',
        rationale: 'Camera access lets ScanQR scan QR codes and 1D/2D barcodes through the live viewfinder.',
        settingsPath: 'App Info > Permissions > Camera',
      };
    case 'photoLibrary':
      return {
        purpose,
        platform,
        key: 'android.permission.READ_MEDIA_IMAGES',
        title: 'Photos & Media Access',
        rationale: 'Media access lets ScanQR read gallery images to crop and decode QR codes or barcodes (READ_MEDIA_IMAGES on Android 13+, READ_EXTERNAL_STORAGE on Android 12 and below).',
        settingsPath: 'App Info > Permissions > Photos and videos',
      };
    case 'storageSave':
      return {
        purpose,
        platform,
        key: 'android.permission.WRITE_EXTERNAL_STORAGE',
        title: 'Storage & Export Access',
        rationale: 'Storage access lets ScanQR save generated code PNGs and export history files (scoped MediaStore on Android 10+, WRITE_EXTERNAL_STORAGE on Android 9 and below).',
        settingsPath: 'App Info > Permissions > Files and media',
      };
  }
}

/**
 * Exports records to JSON string
 */
export function exportRecordsToJson(records: any[]): string {
  return JSON.stringify(records, null, 2);
}

/**
 * Exports QR & barcode records to CSV format with RFC 4180 escaping
 */
export function exportRecordsToCsv(records: Array<{
  id: string;
  category: string;
  format?: BarcodeFormat;
  type: string;
  content: string;
  isFavorite: boolean;
  createdAt: number;
}>): string {
  const headers = ['ID', 'Category', 'Format', 'Type', 'Content', 'IsFavorite', 'CreatedAt', 'FormattedDate'];

  const escapeCsv = (val: string | number | boolean): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = records.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.category),
    escapeCsv(getBarcodeFormatLabel(r.format)),
    escapeCsv(r.type),
    escapeCsv(r.content),
    escapeCsv(r.isFavorite ? 'true' : 'false'),
    escapeCsv(r.createdAt),
    escapeCsv(formatDate(r.createdAt)),
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Formats a contact into standard vCard 3.0 format for QR codes
 */
export function formatVCard(contact: {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
}): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name.trim()}`,
    `N:;${contact.name.trim()};;;`,
  ];

  if (contact.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL:${contact.phone.trim()}`);
  }
  if (contact.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${contact.email.trim()}`);
  }
  if (contact.company?.trim()) {
    lines.push(`ORG:${contact.company.trim()}`);
  }
  if (contact.title?.trim()) {
    lines.push(`TITLE:${contact.title.trim()}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Validates a 3 or 6 digit hex color code
 */
export function validateHexColor(hex: string): boolean {
  if (!hex) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Normalizes #RGB or #RRGGBB into uppercase 6-digit hex without leading # for bwip-js
 */
export function normalizeHexForBwip(hex: string, fallback = '000000'): string {
  if (!validateHexColor(hex)) return fallback;
  let clean = hex.trim().slice(1);
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  return clean.toLowerCase();
}

/**
 * Filters records by search query (content, title, or barcode format) and category filter tab
 */
export function filterRecords<T extends {
  content: string;
  title?: string;
  format?: BarcodeFormat;
  isFavorite: boolean;
  category: string;
}>(
  records: T[],
  query: string,
  filterTab: 'all' | 'favorites' | 'scanned' | 'generated' = 'all'
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  return records.filter((r) => {
    const formatLabel = getBarcodeFormatLabel(r.format).toLowerCase();
    const formatId = (r.format || 'QR_CODE').toLowerCase();

    const matchesSearch =
      normalizedQuery === '' ||
      r.content.toLowerCase().includes(normalizedQuery) ||
      (r.title ? r.title.toLowerCase().includes(normalizedQuery) : false) ||
      formatLabel.includes(normalizedQuery) ||
      formatId.includes(normalizedQuery);

    if (!matchesSearch) return false;

    if (filterTab === 'favorites') return r.isFavorite;
    if (filterTab === 'scanned') return r.category === 'scanned';
    if (filterTab === 'generated') return r.category === 'generated';
    return true;
  });
}

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
 * Calculates WCAG contrast ratio between two hex colors
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
 * Returns true if foreground and background contrast is too low for reliable scanning (< 3:1)
 */
export function hasLowContrast(fgHex: string, bgHex: string): boolean {
  return getContrastRatio(fgHex, bgHex) < 3.0;
}
