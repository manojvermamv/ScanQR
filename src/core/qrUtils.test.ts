import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  isNetworkUrl, 
  normalizeUrl, 
  detectContentType, 
  parseWifiQr, 
  formatFileSize, 
  formatDate, 
  validatePassword, 
  validateQrInput,
  exportRecordsToJson,
  exportRecordsToCsv,
  formatVCard,
  validateHexColor,
  filterRecords
} from './qrUtils.ts';

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

test('detectContentType categorizes varied QR payloads', () => {
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
    hidden: false
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
  const d = new Date(2026, 9, 16, 14, 30, 45); // Oct 16 2026 14:30:45
  const formatted = formatDate(d);
  assert.match(formatted, /^16\/10\/2026, 14:30:45$/);
});

test('validatePassword enforces length and complexity', () => {
  assert.equal(validatePassword('').isValid, false);
  assert.equal(validatePassword('12345').isValid, false); // < 6 chars
  assert.equal(validatePassword('abcdef').isValid, false); // no number
  assert.equal(validatePassword('123456').isValid, false); // no letter
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
    { id: '1', category: 'scanned', type: 'url', content: 'https://example.com', isFavorite: true, createdAt: 1729100000000 }
  ];
  const json = exportRecordsToJson(records);
  assert.match(json, /"id": "1"/);
  assert.match(json, /"https:\/\/example\.com"/);
});

test('exportRecordsToCsv properly escapes commas, quotes, and newlines', () => {
  const records = [
    {
      id: 'rec_1',
      category: 'scanned',
      type: 'text',
      content: 'Hello, "World"\nNext line',
      isFavorite: true,
      createdAt: 1729100000000,
    },
    {
      id: 'rec_2',
      category: 'generated',
      type: 'url',
      content: 'https://scanqr.app',
      isFavorite: false,
      createdAt: 1729100050000,
    }
  ];
  const csv = exportRecordsToCsv(records);
  assert.match(csv, /^ID,Category,Type,Content,IsFavorite,CreatedAt,FormattedDate/);
  // Checked escaped content
  assert.match(csv, /"Hello, ""World""\nNext line"/);
  assert.match(csv, /https:\/\/scanqr\.app/);
});

test('formatVCard formats standard vCard 3.0 contact payload', () => {
  const vcard = formatVCard({
    name: 'Jane Doe',
    phone: '+14155550199',
    email: 'jane@example.com',
    company: 'Acme Technologies',
    title: 'Lead Engineer',
  });
  assert.match(vcard, /BEGIN:VCARD/);
  assert.match(vcard, /VERSION:3.0/);
  assert.match(vcard, /FN:Jane Doe/);
  assert.match(vcard, /TEL;TYPE=CELL:\+14155550199/);
  assert.match(vcard, /EMAIL;TYPE=INTERNET:jane@example\.com/);
  assert.match(vcard, /ORG:Acme Technologies/);
  assert.match(vcard, /TITLE:Lead Engineer/);
  assert.match(vcard, /END:VCARD/);
});

test('validateHexColor correctly validates 3 and 6 digit hex color codes', () => {
  assert.equal(validateHexColor('#000000'), true);
  assert.equal(validateHexColor('#ffffff'), true);
  assert.equal(validateHexColor('#10b981'), true);
  assert.equal(validateHexColor('#fff'), true);
  assert.equal(validateHexColor('#ABC'), true);
  assert.equal(validateHexColor('000000'), false);
  assert.equal(validateHexColor('#12345'), false);
  assert.equal(validateHexColor('#xyz123'), false);
  assert.equal(validateHexColor(''), false);
});

test('filterRecords filters by content or title as user types', () => {
  const sampleRecords = [
    {
      id: '1',
      content: 'https://scanqr.app',
      title: 'Official ScanQR Site',
      category: 'generated',
      isFavorite: true,
    },
    {
      id: '2',
      content: 'WIFI:S:OfficeGuest;T:WPA;P:guestpass;;',
      title: 'Office WiFi Password',
      category: 'scanned',
      isFavorite: false,
    },
    {
      id: '3',
      content: 'mailto:contact@scanqr.app',
      title: 'Support Inquiry',
      category: 'generated',
      isFavorite: false,
    },
  ];

  // Empty query returns all
  assert.equal(filterRecords(sampleRecords, '').length, 3);

  // Search by content
  const wifiMatches = filterRecords(sampleRecords, 'OfficeGuest');
  assert.equal(wifiMatches.length, 1);
  assert.equal(wifiMatches[0].id, '2');

  // Search by title (case-insensitive)
  const supportMatches = filterRecords(sampleRecords, 'support');
  assert.equal(supportMatches.length, 1);
  assert.equal(supportMatches[0].id, '3');

  // Search matching multiple records
  const appMatches = filterRecords(sampleRecords, 'scanqr');
  assert.equal(appMatches.length, 2);

  // Search combined with filterTab
  const favMatches = filterRecords(sampleRecords, 'scanqr', 'favorites');
  assert.equal(favMatches.length, 1);
  assert.equal(favMatches[0].id, '1');

  // Search with no matches
  const noMatches = filterRecords(sampleRecords, 'nonexistent query 12345');
  assert.equal(noMatches.length, 0);
});

