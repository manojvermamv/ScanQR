/**
 * QR & Barcode Business Logic and Data Utilities for Mobile React Native App
 * Pure functions for export, parsing, validation, vCard generation, formatting, and permissions.
 */

export type MobileBarcodeFormat =
  | 'QR_CODE'
  | 'CODE_128'
  | 'CODE_39'
  | 'EAN_13'
  | 'EAN_8'
  | 'UPC_A'
  | 'ITF'
  | 'CODABAR'
  | 'PDF_417'
  | 'DATA_MATRIX'
  | 'AZTEC';

export interface MobileBarcodeSymbologySpec {
  id: MobileBarcodeFormat;
  label: string;
  dimension: '1d' | '2d';
  expoType: string;
  hint: string;
  sampleValue: string;
}

export const MOBILE_BARCODE_FORMATS: MobileBarcodeSymbologySpec[] = [
  {
    id: 'QR_CODE',
    label: 'QR Code',
    dimension: '2d',
    expoType: 'qr',
    hint: 'URLs, contacts, Wi-Fi, or text',
    sampleValue: 'https://scanqr.app',
  },
  {
    id: 'CODE_128',
    label: 'Code 128',
    dimension: '1d',
    expoType: 'code128',
    hint: 'ASCII letters, digits, and symbols',
    sampleValue: 'PKG-2026-8492',
  },
  {
    id: 'EAN_13',
    label: 'EAN-13',
    dimension: '1d',
    expoType: 'ean13',
    hint: '12 digits (auto check) or 13 digits',
    sampleValue: '4006381333931',
  },
  {
    id: 'UPC_A',
    label: 'UPC-A',
    dimension: '1d',
    expoType: 'upc_a',
    hint: '11 digits (auto check) or 12 digits',
    sampleValue: '036000291452',
  },
  {
    id: 'EAN_8',
    label: 'EAN-8',
    dimension: '1d',
    expoType: 'ean8',
    hint: '7 digits (auto check) or 8 digits',
    sampleValue: '96385074',
  },
  {
    id: 'CODE_39',
    label: 'Code 39',
    dimension: '1d',
    expoType: 'code39',
    hint: 'Uppercase A-Z, 0-9, space, and - . $ / + %',
    sampleValue: 'INV-4092',
  },
  {
    id: 'ITF',
    label: 'ITF',
    dimension: '1d',
    expoType: 'itf14',
    hint: 'Even number of digits (2-40)',
    sampleValue: '10012345678902',
  },
  {
    id: 'CODABAR',
    label: 'Codabar',
    dimension: '1d',
    expoType: 'codabar',
    hint: 'A-D start/stop around digits or - $ : / . +',
    sampleValue: 'A40156B',
  },
  {
    id: 'PDF_417',
    label: 'PDF417',
    dimension: '2d',
    expoType: 'pdf417',
    hint: 'Stacked 2D barcode for passes and manifests',
    sampleValue: 'BOARDING:SFO-NRT/14A/2026-11-18',
  },
  {
    id: 'DATA_MATRIX',
    label: 'Data Matrix',
    dimension: '2d',
    expoType: 'datamatrix',
    hint: 'Compact 2D matrix for serials and labels',
    sampleValue: 'SN-DM-88410293',
  },
  {
    id: 'AZTEC',
    label: 'Aztec',
    dimension: '2d',
    expoType: 'aztec',
    hint: '2D matrix for transit and rail tickets',
    sampleValue: 'TKT-AZ-99201-GATE4',
  },
];

export function getMobileBarcodeLabel(format?: MobileBarcodeFormat): string {
  return MOBILE_BARCODE_FORMATS.find((item) => item.id === format)?.label || 'QR Code';
}

export function computeGs1CheckDigit(digitsWithoutCheck: string): number {
  let sum = 0;
  const len = digitsWithoutCheck.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(digitsWithoutCheck[len - 1 - i], 10);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  return (10 - (sum % 10)) % 10;
}

export function validateMobileBarcodeInput(
  text: string,
  format: MobileBarcodeFormat
): { isValid: boolean; normalizedValue: string; error?: string } {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return { isValid: false, normalizedValue: '', error: 'Please enter a value.' };
  }

  switch (format) {
    case 'QR_CODE':
      return trimmed.length > 2953
        ? { isValid: false, normalizedValue: trimmed, error: 'Text exceeds QR capacity.' }
        : { isValid: true, normalizedValue: trimmed };
    case 'CODE_128':
      if (!/^[\x20-\x7E]{1,80}$/.test(trimmed)) {
        return { isValid: false, normalizedValue: trimmed, error: 'Code 128 supports 1-80 ASCII chars.' };
      }
      return { isValid: true, normalizedValue: trimmed };
    case 'CODE_39': {
      const upper = trimmed.toUpperCase();
      if (!/^[A-Z0-9\-. $/+%]{1,43}$/.test(upper)) {
        return { isValid: false, normalizedValue: upper, error: 'Code 39 allows A-Z, 0-9, space, - . $ / + %.' };
      }
      return { isValid: true, normalizedValue: upper };
    }
    case 'EAN_13': {
      if (!/^\d{12,13}$/.test(trimmed)) {
        return { isValid: false, normalizedValue: trimmed, error: 'EAN-13 requires 12 or 13 digits.' };
      }
      const expected = computeGs1CheckDigit(trimmed.slice(0, 12));
      if (trimmed.length === 12) return { isValid: true, normalizedValue: `${trimmed}${expected}` };
      if (parseInt(trimmed[12], 10) !== expected) {
        return { isValid: false, normalizedValue: trimmed, error: `Invalid EAN-13 check digit (expected ${expected}).` };
      }
      return { isValid: true, normalizedValue: trimmed };
    }
    case 'EAN_8': {
      if (!/^\d{7,8}$/.test(trimmed)) {
        return { isValid: false, normalizedValue: trimmed, error: 'EAN-8 requires 7 or 8 digits.' };
      }
      const expected = computeGs1CheckDigit(trimmed.slice(0, 7));
      if (trimmed.length === 7) return { isValid: true, normalizedValue: `${trimmed}${expected}` };
      if (parseInt(trimmed[7], 10) !== expected) {
        return { isValid: false, normalizedValue: trimmed, error: `Invalid EAN-8 check digit (expected ${expected}).` };
      }
      return { isValid: true, normalizedValue: trimmed };
    }
    case 'UPC_A': {
      if (!/^\d{11,12}$/.test(trimmed)) {
        return { isValid: false, normalizedValue: trimmed, error: 'UPC-A requires 11 or 12 digits.' };
      }
      const expected = computeGs1CheckDigit(trimmed.slice(0, 11));
      if (trimmed.length === 11) return { isValid: true, normalizedValue: `${trimmed}${expected}` };
      if (parseInt(trimmed[11], 10) !== expected) {
        return { isValid: false, normalizedValue: trimmed, error: `Invalid UPC-A check digit (expected ${expected}).` };
      }
      return { isValid: true, normalizedValue: trimmed };
    }
    case 'ITF':
      if (!/^\d{2,40}$/.test(trimmed) || trimmed.length % 2 !== 0) {
        return { isValid: false, normalizedValue: trimmed, error: 'ITF requires an even number of digits (2-40).' };
      }
      return { isValid: true, normalizedValue: trimmed };
    case 'CODABAR': {
      const upper = trimmed.toUpperCase();
      if (!/^[A-D][0-9\-$:/.+]+[A-D]$/.test(upper)) {
        return { isValid: false, normalizedValue: upper, error: 'Codabar needs A-D start/stop letters.' };
      }
      return { isValid: true, normalizedValue: upper };
    }
    case 'PDF_417':
    case 'DATA_MATRIX':
    case 'AZTEC':
      if (trimmed.length > 1500) {
        return { isValid: false, normalizedValue: trimmed, error: 'Input exceeds 1,500 character limit.' };
      }
      return { isValid: true, normalizedValue: trimmed };
  }
}

export function getMobilePermissionSpec(
  os: 'ios' | 'android',
  purpose: 'camera' | 'photoLibrary' | 'storageSave',
  androidApiLevel = 34
): { key: string; title: string; rationale: string } {
  if (os === 'ios') {
    if (purpose === 'camera') {
      return {
        key: 'NSCameraUsageDescription',
        title: 'Camera Access',
        rationale: 'Allow camera access to scan QR codes and 1D/2D barcodes in real time.',
      };
    }
    if (purpose === 'photoLibrary') {
      return {
        key: 'NSPhotoLibraryUsageDescription',
        title: 'Photo Library Access',
        rationale: 'Allow Photo Library access to decode QR codes and barcodes from images.',
      };
    }
    return {
      key: 'NSPhotoLibraryAddUsageDescription',
      title: 'Save to Photos',
      rationale: 'Allow Add Photos access to save generated QR codes and barcodes.',
    };
  }

  if (purpose === 'camera') {
    return {
      key: 'android.permission.CAMERA',
      title: 'Camera Permission',
      rationale: 'Allow camera permission to scan QR codes and 1D/2D barcodes.',
    };
  }
  if (purpose === 'photoLibrary') {
    const key =
      androidApiLevel >= 33
        ? 'android.permission.READ_MEDIA_IMAGES'
        : 'android.permission.READ_EXTERNAL_STORAGE';
    return {
      key,
      title: 'Photos & Media Permission',
      rationale: 'Allow media access to open gallery images for QR and barcode decoding.',
    };
  }
  return {
    key:
      androidApiLevel >= 29
        ? 'MediaStore (Scoped Storage)'
        : 'android.permission.WRITE_EXTERNAL_STORAGE',
    title: 'Storage Permission',
    rationale: 'Allow storage access to save generated images and export history files.',
  };
}

export interface MobileQrRecord {
  id: string;
  content: string;
  title?: string;
  format?: MobileBarcodeFormat;
  type: 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'contact';
  category: 'scanned' | 'generated';
  timestamp: number;
  isFavorite: boolean;
}

export interface ContactData {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
}

/**
 * Format Contact info as vCard 3.0 standard payload
 */
export function formatVCard(contact: ContactData): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (contact.name.trim()) {
    lines.push(`FN:${contact.name.trim()}`);
    lines.push(`N:${contact.name.trim()};;;;`);
  }
  if (contact.phone.trim()) {
    lines.push(`TEL;TYPE=CELL:${contact.phone.trim()}`);
  }
  if (contact.email.trim()) {
    lines.push(`EMAIL:${contact.email.trim()}`);
  }
  if (contact.company.trim()) {
    lines.push(`ORG:${contact.company.trim()}`);
  }
  if (contact.title.trim()) {
    lines.push(`TITLE:${contact.title.trim()}`);
  }
  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Exports records to formatted JSON string
 */
export function exportRecordsToJson(records: MobileQrRecord[]): string {
  return JSON.stringify(
    {
      app: 'ScanQR React Native',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      totalRecords: records.length,
      records,
    },
    null,
    2
  );
}

/**
 * Exports records to RFC 4180 compliant CSV string
 */
export function exportRecordsToCsv(records: MobileQrRecord[]): string {
  const headers = ['ID', 'Format', 'Type', 'Category', 'IsFavorite', 'Timestamp', 'FormattedDate', 'Content'];
  const escapeCsv = (val: string | number | boolean) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = records.map((r) => [
    escapeCsv(r.id),
    escapeCsv(getMobileBarcodeLabel(r.format)),
    escapeCsv(r.type),
    escapeCsv(r.category),
    escapeCsv(r.isFavorite),
    escapeCsv(r.timestamp),
    escapeCsv(new Date(r.timestamp).toISOString()),
    escapeCsv(r.content),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Detect content type from QR string
 */
export function detectType(content: string): 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'contact' {
  const trimmed = content.trim();
  if (/^BEGIN:VCARD/i.test(trimmed)) return 'contact';
  if (/^https?:\/\//i.test(trimmed) || /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(trimmed)) return 'url';
  if (/^WIFI:/i.test(trimmed)) return 'wifi';
  if (/^mailto:/i.test(trimmed) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed)) return 'email';
  if (/^tel:[+0-9]+/i.test(trimmed) || /^\+?[0-9]{7,15}$/.test(trimmed.replace(/[\s\-()]/g, ''))) return 'phone';
  return 'text';
}

/**
 * Format timestamp into readable date
 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Validates a 3 or 6 digit hex color code
 */
export function validateHexColor(hex: string): boolean {
  if (!hex) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Filter records by search query (content, title, or format) and category
 */
export function filterRecords(
  records: MobileQrRecord[],
  query: string,
  filterTab: 'all' | 'favorites' | 'scanned' | 'generated' = 'all'
): MobileQrRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return records.filter((r) => {
    const formatLabel = getMobileBarcodeLabel(r.format).toLowerCase();
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

export function hasLowContrast(fgHex: string, bgHex: string): boolean {
  return getContrastRatio(fgHex, bgHex) < 3.0;
}
