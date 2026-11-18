import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BARCODE_FORMATS,
  getBarcodeFormatLabel,
  computeGs1CheckDigit,
  isNetworkUrl,
  normalizeUrl,
  detectContentType,
  parseWifiQr,
  formatFileSize,
  formatDate,
  validatePassword,
  validateQrInput,
  validateBarcodeInput,
  getPlatformPermissionSpec,
  exportRecordsToJson,
  exportRecordsToCsv,
  formatVCard,
  validateHexColor,
  normalizeHexForBwip,
  filterRecords,
  getContrastRatio,
  hasLowContrast,
} from './qrUtils.ts';

test('BARCODE_FORMATS includes QR code and common 1D/2D barcode symbologies', () => {
  const ids = BARCODE_FORMATS.map((f) => f.id);
  assert.ok(ids.includes('QR_CODE'));
  assert.ok(ids.includes('CODE_128'));
  assert.ok(ids.includes('CODE_39'));
  assert.ok(ids.includes('EAN_13'));
  assert.ok(ids.includes('EAN_8'));
  assert.ok(ids.includes('UPC_A'));
  assert.ok(ids.includes('ITF'));
  assert.ok(ids.includes('CODABAR'));
  assert.ok(ids.includes('PDF_417'));
  assert.ok(ids.includes('DATA_MATRIX'));
  assert.ok(ids.includes('AZTEC'));
  assert.equal(getBarcodeFormatLabel('EAN_13'), 'EAN-13');
  assert.equal(getBarcodeFormatLabel(undefined), 'QR Code');
});

test('computeGs1CheckDigit and validateBarcodeInput verify 1D/2D symbology rules', () => {
  assert.equal(computeGs1CheckDigit('400638133393'), 1);
  assert.equal(computeGs1CheckDigit('03600029145'), 2);
  assert.equal(computeGs1CheckDigit('9638507'), 4);

  // EAN-13 auto-appends check digit for 12 digits and validates 13 digits
  const ean12 = validateBarcodeInput('400638133393', 'EAN_13');
  assert.equal(ean12.isValid, true);
  assert.equal(ean12.normalizedValue, '4006381333931');
  assert.equal(validateBarcodeInput('4006381333931', 'EAN_13').isValid, true);
  assert.equal(validateBarcodeInput('4006381333939', 'EAN_13').isValid, false);
  assert.equal(validateBarcodeInput('12345', 'EAN_13').isValid, false);

  // EAN-8 & UPC-A
  assert.equal(validateBarcodeInput('9638507', 'EAN_8').normalizedValue, '96385074');
  assert.equal(validateBarcodeInput('03600029145', 'UPC_A').normalizedValue, '036000291452');
  assert.equal(validateBarcodeInput('036000291450', 'UPC_A').isValid, false);

  // Code 128 & Code 39
  assert.equal(validateBarcodeInput('PKG-2026-8492', 'CODE_128').isValid, true);
  assert.equal(validateBarcodeInput('inv-4092', 'CODE_39').normalizedValue, 'INV-4092');
  assert.equal(validateBarcodeInput('invalid@char', 'CODE_39').isValid, false);

  // ITF & Codabar
  assert.equal(validateBarcodeInput('10012345678902', 'ITF').isValid, true);
  assert.equal(validateBarcodeInput('12345', 'ITF').isValid, false);
  assert.equal(validateBarcodeInput('A40156B', 'CODABAR').isValid, true);
  assert.equal(validateBarcodeInput('40156', 'CODABAR').isValid, false);

  // 2D Barcodes
  assert.equal(validateBarcodeInput('BOARDING:SFO-NRT/14A', 'PDF_417').isValid, true);
  assert.equal(validateBarcodeInput('SN-DM-88410293', 'DATA_MATRIX').isValid, true);
  assert.equal(validateBarcodeInput('TKT-AZ-99201', 'AZTEC').isValid, true);
});

test('getPlatformPermissionSpec returns distinct Android and iOS permission specs', () => {
  const iosCam = getPlatformPermissionSpec('ios', 'camera');
  const androidCam = getPlatformPermissionSpec('android', 'camera');
  assert.equal(iosCam.key, 'NSCameraUsageDescription');
  assert.equal(androidCam.key, 'android.permission.CAMERA');

  const iosPhoto = getPlatformPermissionSpec('ios', 'photoLibrary');
  const androidPhoto = getPlatformPermissionSpec('android', 'photoLibrary');
  assert.equal(iosPhoto.key, 'NSPhotoLibraryUsageDescription');
  assert.equal(androidPhoto.key, 'android.permission.READ_MEDIA_IMAGES');

  const iosSave = getPlatformPermissionSpec('ios', 'storageSave');
  const androidSave = getPlatformPermissionSpec('android', 'storageSave');
  assert.equal(iosSave.key, 'NSPhotoLibraryAddUsageDescription');
  assert.equal(androidSave.key, 'android.permission.WRITE_EXTERNAL_STORAGE');
});

test('isNetworkUrl correctly identifies web URLs', () => {
  assert.equal(isNetworkUrl('https://google.com'), true);
  assert.equal(isNetworkUrl('https://example.com/qr-demo'), true);
  assert.equal(isNetworkUrl('www.example.com'), true);
  assert.equal(isNetworkUrl('plain text not url'), false);
  assert.equal(isNetworkUrl(''), false);
  assert.equal(isNetworkUrl(null), false);
});

test('normalizeUrl prepends https:// when missing scheme', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com');
  assert.equal(normalizeUrl('https://example.com'), 'https://example.com');
  assert.equal(normalizeUrl('http://test.org'), 'http://test.org');
});

test('detectContentType categorizes varied payloads', () => {
  assert.equal(detectContentType('https://scanqr.app'), 'url');
  assert.equal(detectContentType('WIFI:S:HomeNet;T:WPA;P:Secret123;;'), 'wifi');
  assert.equal(detectContentType('mailto:hello@example.com'), 'email');
  assert.equal(detectContentType('user@example.com'), 'email');
  assert.equal(detectContentType('tel:+1234567890'), 'phone');
  assert.equal(detectContentType('+1 (555) 019-2834'), 'phone');
  assert.equal(detectContentType('smsto:12345678'), 'sms');
  assert.equal(detectContentType('Meeting notes room 4B'), 'text');
});

test('parseWifiQr correctly decodes Wi-Fi payloads', () => {
  const result = parseWifiQr('WIFI:S:MyWiFi;T:WPA;P:password123;H:false;;');
  assert.deepEqual(result, {
    ssid: 'MyWiFi',
    password: 'password123',
    type: 'WPA',
    hidden: false,
  });

  assert.equal(parseWifiQr('not wifi'), null);
});

test('formatFileSize correctly formats bytes matching FileUtil.java', () => {
  assert.equal(formatFileSize(450), '450 B');
  assert.equal(formatFileSize(2500), '2.50 KB');
  assert.equal(formatFileSize(3500000), '3.50 MB');
  assert.equal(formatFileSize(4500000000), '4.50 GB');
});

test('formatDate formats timestamps matching dd/MM/yyyy, hh:mm:ss', () => {
  const d = new Date(2026, 9, 16, 14, 30, 45);
  const formatted = formatDate(d);
  assert.match(formatted, /^16\/10\/2026, 14:30:45$/);
});

test('validatePassword enforces length and complexity', () => {
  assert.equal(validatePassword('').isValid, false);
  assert.equal(validatePassword('12345').isValid, false);
  assert.equal(validatePassword('abcdef').isValid, false);
  assert.equal(validatePassword('123456').isValid, false);
  assert.equal(validatePassword('pass123').isValid, true);
});

test('validateQrInput handles empty strings and length limits', () => {
  assert.equal(validateQrInput('').isValid, false);
  assert.equal(validateQrInput('   ').isValid, false);
  assert.equal(validateQrInput('Valid QR Payload').isValid, true);
  assert.equal(validateQrInput('A'.repeat(3000)).isValid, false);
});

test('exportRecordsToJson serializes history records', () => {
  const records = [
    {
      id: '1',
      category: 'scanned',
      format: 'EAN_13',
      type: 'text',
      content: '4006381333931',
      isFavorite: true,
      createdAt: 1729100000000,
    },
  ];
  const json = exportRecordsToJson(records);
  assert.match(json, /"id": "1"/);
  assert.match(json, /"format": "EAN_13"/);
});

test('exportRecordsToCsv includes Format column and escapes commas, quotes, and newlines', () => {
  const records = [
    {
      id: 'rec_1',
      category: 'scanned',
      format: 'QR_CODE' as const,
      type: 'text',
      content: 'Hello, "World"\nNext line',
      isFavorite: true,
      createdAt: 1729100000000,
    },
    {
      id: 'rec_2',
      category: 'generated',
      format: 'EAN_13' as const,
      type: 'text',
      content: '4006381333931',
      isFavorite: false,
      createdAt: 1729100050000,
    },
  ];
  const csv = exportRecordsToCsv(records);
  assert.match(csv, /^ID,Category,Format,Type,Content,IsFavorite,CreatedAt,FormattedDate/);
  assert.match(csv, /"Hello, ""World""\nNext line"/);
  assert.match(csv, /EAN-13/);
});

test('formatVCard formats standard vCard 3.0 contact payload', () => {
  const vcard = formatVCard({
    name: 'Maya Lin',
    phone: '+14155550199',
    email: 'maya@example.com',
    company: 'Northwind Studio',
    title: 'Lead Engineer',
  });
  assert.match(vcard, /BEGIN:VCARD/);
  assert.match(vcard, /VERSION:3\.0/);
  assert.match(vcard, /FN:Maya Lin/);
  assert.match(vcard, /TEL;TYPE=CELL:\+14155550199/);
  assert.match(vcard, /EMAIL;TYPE=INTERNET:maya@example\.com/);
  assert.match(vcard, /ORG:Northwind Studio/);
  assert.match(vcard, /TITLE:Lead Engineer/);
  assert.match(vcard, /END:VCARD/);
});

test('validateHexColor and normalizeHexForBwip handle 3 and 6 digit hex codes', () => {
  assert.equal(validateHexColor('#000000'), true);
  assert.equal(validateHexColor('#ffffff'), true);
  assert.equal(validateHexColor('#10b981'), true);
  assert.equal(validateHexColor('#fff'), true);
  assert.equal(validateHexColor('000000'), false);
  assert.equal(normalizeHexForBwip('#fff'), 'ffffff');
  assert.equal(normalizeHexForBwip('#059669'), '059669');
  assert.equal(normalizeHexForBwip('bad', '111111'), '111111');
});

test('filterRecords filters by content, title, or barcode format as user types', () => {
  const sampleRecords = [
    {
      id: '1',
      content: 'https://scanqr.app',
      title: 'Official ScanQR Site',
      format: 'QR_CODE' as const,
      category: 'generated',
      isFavorite: true,
    },
    {
      id: '2',
      content: '4006381333931',
      title: 'Product SKU',
      format: 'EAN_13' as const,
      category: 'scanned',
      isFavorite: false,
    },
    {
      id: '3',
      content: 'PKG-2026-8492',
      title: 'Shipping Label',
      format: 'CODE_128' as const,
      category: 'generated',
      isFavorite: false,
    },
  ];

  assert.equal(filterRecords(sampleRecords, '').length, 3);
  assert.equal(filterRecords(sampleRecords, '400638').length, 1);
  assert.equal(filterRecords(sampleRecords, 'Shipping').length, 1);
  assert.equal(filterRecords(sampleRecords, 'ean-13').length, 1);
  assert.equal(filterRecords(sampleRecords, 'code 128').length, 1);
  assert.equal(filterRecords(sampleRecords, 'scanqr', 'favorites').length, 1);
  assert.equal(filterRecords(sampleRecords, 'nonexistent').length, 0);
});

test('hasLowContrast and getContrastRatio validate scannable contrast', () => {
  assert.ok(getContrastRatio('#000000', '#ffffff') > 20);
  assert.equal(hasLowContrast('#000000', '#ffffff'), false);
  assert.equal(hasLowContrast('#059669', '#fef3c7'), false);
  assert.equal(hasLowContrast('#ffffff', '#ffffff'), true);
  assert.equal(hasLowContrast('#000000', '#0f172a'), true);
});
