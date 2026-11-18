import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MOBILE_BARCODE_FORMATS,
  getMobileBarcodeLabel,
  validateMobileBarcodeInput,
  getMobilePermissionSpec,
  formatVCard,
  exportRecordsToJson,
  exportRecordsToCsv,
  detectType,
  formatTime,
  filterRecords,
  validateHexColor,
  getContrastRatio,
  hasLowContrast,
  type MobileQrRecord,
} from './qrCore.ts';

test('MOBILE_BARCODE_FORMATS and validation cover QR and 1D/2D barcodes', () => {
  assert.ok(MOBILE_BARCODE_FORMATS.length >= 11);
  assert.equal(getMobileBarcodeLabel('EAN_13'), 'EAN-13');
  assert.equal(getMobileBarcodeLabel('PDF_417'), 'PDF417');

  assert.equal(validateMobileBarcodeInput('400638133393', 'EAN_13').normalizedValue, '4006381333931');
  assert.equal(validateMobileBarcodeInput('4006381333939', 'EAN_13').isValid, false);
  assert.equal(validateMobileBarcodeInput('PKG-2026-8492', 'CODE_128').isValid, true);
  assert.equal(validateMobileBarcodeInput('10012345678902', 'ITF').isValid, true);
  assert.equal(validateMobileBarcodeInput('A40156B', 'CODABAR').isValid, true);
});

test('getMobilePermissionSpec resolves iOS and Android API-level permissions', () => {
  assert.equal(getMobilePermissionSpec('ios', 'camera').key, 'NSCameraUsageDescription');
  assert.equal(getMobilePermissionSpec('ios', 'photoLibrary').key, 'NSPhotoLibraryUsageDescription');
  assert.equal(getMobilePermissionSpec('ios', 'storageSave').key, 'NSPhotoLibraryAddUsageDescription');
  assert.equal(getMobilePermissionSpec('android', 'photoLibrary', 34).key, 'android.permission.READ_MEDIA_IMAGES');
  assert.equal(getMobilePermissionSpec('android', 'photoLibrary', 31).key, 'android.permission.READ_EXTERNAL_STORAGE');
});

test('formatVCard formats standard vCard 3.0', () => {
  const vcard = formatVCard({
    name: 'Maya Lin',
    phone: '+15551234567',
    email: 'maya@example.com',
    company: 'Northwind Studio',
    title: 'Lead Architect',
  });

  assert.match(vcard, /^BEGIN:VCARD/);
  assert.match(vcard, /FN:Maya Lin/);
  assert.match(vcard, /TEL;TYPE=CELL:\+15551234567/);
  assert.match(vcard, /EMAIL:maya@example.com/);
  assert.match(vcard, /ORG:Northwind Studio/);
  assert.match(vcard, /TITLE:Lead Architect/);
  assert.match(vcard, /END:VCARD$/);
});

test('detectType identifies URLs, contacts, wifi, emails, phones, and text', () => {
  assert.equal(detectType('https://github.com'), 'url');
  assert.equal(detectType('www.example.com'), 'url');
  assert.equal(detectType('BEGIN:VCARD\nFN:John\nEND:VCARD'), 'contact');
  assert.equal(detectType('WIFI:S:MyNet;T:WPA;P:pass;;'), 'wifi');
  assert.equal(detectType('hello@world.com'), 'email');
  assert.equal(detectType('+1 555 123 4567'), 'phone');
  assert.equal(detectType('Plain text payload 1234'), 'text');
});

test('exportRecordsToJson correctly formats JSON array', () => {
  const records: MobileQrRecord[] = [
    {
      id: 'rec_1',
      content: 'https://expo.dev',
      format: 'QR_CODE',
      type: 'url',
      category: 'scanned',
      timestamp: 1776345600000,
      isFavorite: true,
    },
  ];
  const jsonStr = exportRecordsToJson(records);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.totalRecords, 1);
  assert.equal(parsed.records[0].format, 'QR_CODE');
});

test('exportRecordsToCsv handles commas, quotes, and Format column safely', () => {
  const records: MobileQrRecord[] = [
    {
      id: 'rec_1',
      content: 'Hello, "world" and new\nline',
      format: 'CODE_128',
      type: 'text',
      category: 'generated',
      timestamp: 1776345600000,
      isFavorite: false,
    },
  ];
  const csv = exportRecordsToCsv(records);
  assert.match(csv, /ID,Format,Type,Category/);
  assert.match(csv, /Code 128/);
  assert.match(csv, /"Hello, ""world"" and new\nline"/);
});

test('formatTime outputs formatted timestamp string', () => {
  const formatted = formatTime(1776345600000);
  assert.match(formatted, /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/);
});

test('validateHexColor checks valid hex codes in mobile core', () => {
  assert.equal(validateHexColor('#000000'), true);
  assert.equal(validateHexColor('#ffffff'), true);
  assert.equal(validateHexColor('#3b82f6'), true);
  assert.equal(validateHexColor('not-hex'), false);
});

test('filterRecords filters mobile history by content, title, or barcode format', () => {
  const records: MobileQrRecord[] = [
    {
      id: 'm1',
      content: 'https://scanqr.app',
      title: 'ScanQR Web Application',
      format: 'QR_CODE',
      type: 'url',
      category: 'generated',
      timestamp: 1776345600000,
      isFavorite: true,
    },
    {
      id: 'm2',
      content: '4006381333931',
      title: 'Retail SKU',
      format: 'EAN_13',
      type: 'text',
      category: 'scanned',
      timestamp: 1776345700000,
      isFavorite: false,
    },
  ];

  assert.equal(filterRecords(records, '').length, 2);
  assert.equal(filterRecords(records, 'ean-13').length, 1);
  assert.equal(filterRecords(records, 'scanqr.app').length, 1);
  assert.equal(filterRecords(records, 'xyz999').length, 0);
  assert.equal(filterRecords(records, 'scanqr', 'favorites').length, 1);
});

test('hasLowContrast detects unreadable QR color combinations', () => {
  assert.ok(getContrastRatio('#000000', '#ffffff') > 20);
  assert.equal(hasLowContrast('#000000', '#ffffff'), false);
  assert.equal(hasLowContrast('#111827', '#18181b'), true);
});
