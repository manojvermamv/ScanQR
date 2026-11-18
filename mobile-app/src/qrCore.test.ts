import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
      type: 'url',
      category: 'scanned',
      timestamp: 1776345600000,
      isFavorite: true,
    },
  ];
  const jsonStr = exportRecordsToJson(records);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.totalRecords, 1);
  assert.equal(parsed.records[0].content, 'https://expo.dev');
});

test('exportRecordsToCsv handles commas and quotes safely', () => {
  const records: MobileQrRecord[] = [
    {
      id: 'rec_1',
      content: 'Hello, "world" and new\nline',
      type: 'text',
      category: 'generated',
      timestamp: 1776345600000,
      isFavorite: false,
    },
  ];
  const csv = exportRecordsToCsv(records);
  assert.match(csv, /ID,Type,Category/);
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

test('filterRecords filters mobile history by content or title as user types', () => {
  const records: MobileQrRecord[] = [
    {
      id: 'm1',
      content: 'https://scanqr.app',
      title: 'ScanQR Web Application',
      type: 'url',
      category: 'generated',
      timestamp: 1776345600000,
      isFavorite: true,
    },
    {
      id: 'm2',
      content: 'BEGIN:VCARD\nFN:Sarah Connor\nTEL:5550199\nEND:VCARD',
      title: 'Contact: Sarah Connor',
      type: 'contact',
      category: 'scanned',
      timestamp: 1776345700000,
      isFavorite: false,
    },
  ];

  assert.equal(filterRecords(records, '').length, 2);
  assert.equal(filterRecords(records, 'sarah').length, 1);
  assert.equal(filterRecords(records, 'scanqr.app').length, 1);
  assert.equal(filterRecords(records, 'Application').length, 1);
  assert.equal(filterRecords(records, 'xyz999').length, 0);
  assert.equal(filterRecords(records, 'scanqr', 'favorites').length, 1);
  assert.equal(filterRecords(records, 'sarah', 'favorites').length, 0);
});

test('hasLowContrast detects unreadable QR color combinations', () => {
  assert.ok(getContrastRatio('#000000', '#ffffff') > 20);
  assert.equal(hasLowContrast('#000000', '#ffffff'), false);
  assert.equal(hasLowContrast('#111827', '#18181b'), true);
});
