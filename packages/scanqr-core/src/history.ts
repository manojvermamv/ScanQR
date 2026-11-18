/**
 * Portable history search, export (JSON / RFC-4180 CSV), record creation, and storage repositories
 * decoupled from Web localStorage / React Native AsyncStorage.
 */

import {
  AppSettings,
  AsyncKeyValueStorage,
  BarcodeFormat,
  QrRecord,
  SyncKeyValueStorage,
} from './types';
import { formatDate } from './parsers';
import { getBarcodeFormatLabel } from './symbologies';

export const STORAGE_KEY_RECORDS = 'scanqr_records_v2';
export const STORAGE_KEY_SETTINGS = 'scanqr_settings_v1';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  autoCopyOnScan: false,
  vibrateOnScan: true,
  beepOnScan: true,
  autoOpenUrl: false,
};

export function getDefaultSeedRecords(now = Date.now()): QrRecord[] {
  return [
    {
      id: 'seed-1',
      content: 'https://scanqr.app',
      format: 'QR_CODE',
      type: 'url',
      category: 'generated',
      createdAt: now - 3600000 * 24,
      isFavorite: true,
      title: 'ScanQR Official Website',
    },
    {
      id: 'seed-2',
      content: 'WIFI:S:Guest_WiFi;T:WPA;P:Welcome2026;;',
      format: 'QR_CODE',
      type: 'wifi',
      category: 'scanned',
      createdAt: now - 3600000 * 12,
      isFavorite: true,
      title: 'Office Guest Wi-Fi',
    },
    {
      id: 'seed-3',
      content: '4006381333931',
      format: 'EAN_13',
      type: 'text',
      category: 'scanned',
      createdAt: now - 3600000 * 5,
      isFavorite: false,
      title: 'Retail Product Barcode',
    },
    {
      id: 'seed-4',
      content: 'PKG-2026-8492',
      format: 'CODE_128',
      type: 'text',
      category: 'generated',
      createdAt: now - 3600000 * 2,
      isFavorite: false,
      title: 'Warehouse Shipping Label',
    },
  ];
}

export function createQrRecord(
  input: Omit<QrRecord, 'id' | 'createdAt'>,
  now = Date.now()
): QrRecord {
  return {
    ...input,
    format: input.format || 'QR_CODE',
    id: 'qr_' + now + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: now,
  };
}

export function normalizeRecords(parsed: QrRecord[]): QrRecord[] {
  return parsed.map((record) => ({
    ...record,
    format: record.format || 'QR_CODE',
  }));
}

/**
 * Filters records by search query (content, title, or barcode format) and category filter tab.
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

export function exportRecordsToJson(records: unknown[]): string {
  return JSON.stringify(records, null, 2);
}

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
 * Synchronous repository factory (suitable for Web localStorage or React Native MMKV).
 */
export function createSyncHistoryRepository(storage: SyncKeyValueStorage) {
  const saveRecords = (records: QrRecord[]): void => {
    try {
      storage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // Ignore storage quota errors
    }
  };

  const loadRecords = (): QrRecord[] => {
    try {
      const raw = storage.getItem(STORAGE_KEY_RECORDS);
      if (!raw) {
        const seed = getDefaultSeedRecords();
        saveRecords(seed);
        return seed;
      }
      return normalizeRecords(JSON.parse(raw) as QrRecord[]);
    } catch {
      return getDefaultSeedRecords();
    }
  };

  const addRecord = (record: Omit<QrRecord, 'id' | 'createdAt'>): QrRecord => {
    const records = loadRecords();
    const newRecord = createQrRecord(record);
    saveRecords([newRecord, ...records]);
    return newRecord;
  };

  const toggleFavorite = (id: string): QrRecord[] => {
    const updated = loadRecords().map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
    );
    saveRecords(updated);
    return updated;
  };

  const deleteRecord = (id: string): QrRecord[] => {
    const updated = loadRecords().filter((r) => r.id !== id);
    saveRecords(updated);
    return updated;
  };

  const deleteMultipleRecords = (ids: string[]): QrRecord[] => {
    const idSet = new Set(ids);
    const updated = loadRecords().filter((r) => !idSet.has(r.id));
    saveRecords(updated);
    return updated;
  };

  const clearAllRecords = (): void => {
    saveRecords([]);
  };

  const loadSettings = (): AppSettings => {
    try {
      const raw = storage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return DEFAULT_APP_SETTINGS;
      return { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  };

  const saveSettings = (settings: AppSettings): void => {
    try {
      storage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  };

  return {
    loadRecords,
    saveRecords,
    addRecord,
    toggleFavorite,
    deleteRecord,
    deleteMultipleRecords,
    clearAllRecords,
    loadSettings,
    saveSettings,
  };
}

/**
 * Asynchronous repository factory (suitable for React Native AsyncStorage).
 */
export function createAsyncHistoryRepository(storage: AsyncKeyValueStorage) {
  const saveRecords = async (records: QrRecord[]): Promise<void> => {
    try {
      await storage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
    } catch {
      // Ignore storage errors
    }
  };

  const loadRecords = async (): Promise<QrRecord[]> => {
    try {
      const raw = await storage.getItem(STORAGE_KEY_RECORDS);
      if (!raw) {
        const seed = getDefaultSeedRecords();
        await saveRecords(seed);
        return seed;
      }
      return normalizeRecords(JSON.parse(raw) as QrRecord[]);
    } catch {
      return getDefaultSeedRecords();
    }
  };

  const addRecord = async (record: Omit<QrRecord, 'id' | 'createdAt'>): Promise<QrRecord> => {
    const records = await loadRecords();
    const newRecord = createQrRecord(record);
    await saveRecords([newRecord, ...records]);
    return newRecord;
  };

  const toggleFavorite = async (id: string): Promise<QrRecord[]> => {
    const records = await loadRecords();
    const updated = records.map((r) =>
      r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
    );
    await saveRecords(updated);
    return updated;
  };

  const deleteRecord = async (id: string): Promise<QrRecord[]> => {
    const records = await loadRecords();
    const updated = records.filter((r) => r.id !== id);
    await saveRecords(updated);
    return updated;
  };

  const deleteMultipleRecords = async (ids: string[]): Promise<QrRecord[]> => {
    const idSet = new Set(ids);
    const records = await loadRecords();
    const updated = records.filter((r) => !idSet.has(r.id));
    await saveRecords(updated);
    return updated;
  };

  const clearAllRecords = async (): Promise<void> => {
    await saveRecords([]);
  };

  const loadSettings = async (): Promise<AppSettings> => {
    try {
      const raw = await storage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return DEFAULT_APP_SETTINGS;
      return { ...DEFAULT_APP_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    } catch {
      return DEFAULT_APP_SETTINGS;
    }
  };

  const saveSettings = async (settings: AppSettings): Promise<void> => {
    try {
      await storage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  };

  return {
    loadRecords,
    saveRecords,
    addRecord,
    toggleFavorite,
    deleteRecord,
    deleteMultipleRecords,
    clearAllRecords,
    loadSettings,
    saveSettings,
  };
}
