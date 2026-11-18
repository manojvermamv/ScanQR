/**
 * Storage and state persistence service for ScanQR
 */

import { QrRecord, ThemeMode } from './types.ts';

const STORAGE_KEY_RECORDS = 'scanqr_records_v2';
const STORAGE_KEY_SETTINGS = 'scanqr_settings_v1';

export interface AppSettings {
  theme: ThemeMode;
  autoCopyOnScan: boolean;
  vibrateOnScan: boolean;
  beepOnScan: boolean;
  autoOpenUrl: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoCopyOnScan: false,
  vibrateOnScan: true,
  beepOnScan: true,
  autoOpenUrl: false,
};

const SEED_RECORDS: QrRecord[] = [
  {
    id: 'seed-1',
    content: 'https://scanqr.app',
    format: 'QR_CODE',
    type: 'url',
    category: 'generated',
    createdAt: Date.now() - 3600000 * 24,
    isFavorite: true,
    title: 'ScanQR Official Website',
  },
  {
    id: 'seed-2',
    content: 'WIFI:S:Guest_WiFi;T:WPA;P:Welcome2026;;',
    format: 'QR_CODE',
    type: 'wifi',
    category: 'scanned',
    createdAt: Date.now() - 3600000 * 12,
    isFavorite: true,
    title: 'Office Guest Wi-Fi',
  },
  {
    id: 'seed-3',
    content: '4006381333931',
    format: 'EAN_13',
    type: 'text',
    category: 'scanned',
    createdAt: Date.now() - 3600000 * 5,
    isFavorite: false,
    title: 'Retail Product Barcode',
  },
  {
    id: 'seed-4',
    content: 'PKG-2026-8492',
    format: 'CODE_128',
    type: 'text',
    category: 'generated',
    createdAt: Date.now() - 3600000 * 2,
    isFavorite: false,
    title: 'Warehouse Shipping Label',
  },
];

export function loadRecords(): QrRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) {
      saveRecords(SEED_RECORDS);
      return SEED_RECORDS;
    }
    const parsed = JSON.parse(raw) as QrRecord[];
    return parsed.map((record) => ({
      ...record,
      format: record.format || 'QR_CODE',
    }));
  } catch {
    return SEED_RECORDS;
  }
}

export function saveRecords(records: QrRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records', e);
  }
}

export function addRecord(record: Omit<QrRecord, 'id' | 'createdAt'>): QrRecord {
  const records = loadRecords();
  const newRecord: QrRecord = {
    ...record,
    format: record.format || 'QR_CODE',
    id: 'qr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: Date.now(),
  };
  const updated = [newRecord, ...records];
  saveRecords(updated);
  return newRecord;
}

export function toggleFavorite(id: string): QrRecord[] {
  const records = loadRecords();
  const updated = records.map((r) => (r.id === id ? { ...r, isFavorite: !r.isFavorite } : r));
  saveRecords(updated);
  return updated;
}

export function deleteRecord(id: string): QrRecord[] {
  const records = loadRecords();
  const updated = records.filter((r) => r.id !== id);
  saveRecords(updated);
  return updated;
}

export function deleteMultipleRecords(ids: string[]): QrRecord[] {
  const set = new Set(ids);
  const records = loadRecords();
  const updated = records.filter((r) => !set.has(r.id));
  saveRecords(updated);
  return updated;
}

export function clearAllRecords(): void {
  saveRecords([]);
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}
