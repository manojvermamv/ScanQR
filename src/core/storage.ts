/**
 * Web localStorage adapter backed by portable @scanqr/core repository logic.
 */

import {
  createSyncHistoryRepository,
  DEFAULT_APP_SETTINGS,
  getDefaultSeedRecords,
} from '../../packages/scanqr-core/src/history';
import { AppSettings, QrRecord, SyncKeyValueStorage } from './types.ts';

export type { AppSettings };

const memoryFallback = new Map<string, string>();

const webStorageAdapter: SyncKeyValueStorage = {
  getItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // Fallback when storage is restricted
    }
    return memoryFallback.get(key) ?? null;
  },
  setItem: (key, value) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback when storage is restricted
    }
    memoryFallback.set(key, value);
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback
    }
    memoryFallback.delete(key);
  },
};

const repository = createSyncHistoryRepository(webStorageAdapter);

export function loadRecords(): QrRecord[] {
  return repository.loadRecords();
}

export function saveRecords(records: QrRecord[]): void {
  repository.saveRecords(records);
}

export function addRecord(record: Omit<QrRecord, 'id' | 'createdAt'>): QrRecord {
  return repository.addRecord(record);
}

export function toggleFavorite(id: string): QrRecord[] {
  return repository.toggleFavorite(id);
}

export function deleteRecord(id: string): QrRecord[] {
  return repository.deleteRecord(id);
}

export function deleteMultipleRecords(ids: string[]): QrRecord[] {
  return repository.deleteMultipleRecords(ids);
}

export function clearAllRecords(): void {
  repository.clearAllRecords();
}

export function loadSettings(): AppSettings {
  try {
    return repository.loadSettings();
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  repository.saveSettings(settings);
}

export { getDefaultSeedRecords };
