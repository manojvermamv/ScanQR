/**
 * React Native AsyncStorage persistence adapter wired into portable @scanqr/core repository.
 * Includes an automatic in-memory fallback for non-native test runners.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createAsyncHistoryRepository,
  type AsyncKeyValueStorage,
} from '../../packages/scanqr-core/src/history';

const memoryStore = new Map<string, string>();

const rnStorageAdapter: AsyncKeyValueStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        return await AsyncStorage.getItem(key);
      }
    } catch {
      // Fallback to in-memory store when native storage bridge is unavailable
    }
    return memoryStore.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // Fallback safely retained in memoryStore
    }
  },
  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // Fallback safely retained
    }
  },
};

export const mobileHistoryRepository = createAsyncHistoryRepository(rnStorageAdapter);
