/**
 * Portable domain types for ScanQR (Web & React Native)
 * Zero DOM or platform UI dependencies.
 */

export type ScreenType =
  | 'splash'
  | 'generator'
  | 'scanner'
  | 'favorites'
  | 'settings';

export type DevicePlatform = 'android' | 'ios';

export type ThemeMode = 'light' | 'dark';

export type BarcodeFormat =
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

export type QrContentType = 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'text';

export type QrRecordCategory = 'generated' | 'scanned';

export type PermissionPurpose = 'camera' | 'photoLibrary' | 'storageSave';

export type PermissionStatus = 'granted' | 'denied' | 'prompt';

export interface PlatformPermissionSpec {
  purpose: PermissionPurpose;
  platform: DevicePlatform;
  key: string;
  title: string;
  rationale: string;
  settingsPath: string;
}

export interface QrRecord {
  id: string;
  content: string;
  format?: BarcodeFormat;
  type: QrContentType;
  category: QrRecordCategory;
  createdAt: number;
  isFavorite: boolean;
  title?: string;
  meta?: Record<string, string>;
}

export interface PermissionState {
  camera: PermissionStatus;
  storageRead: PermissionStatus;
  storageWrite: PermissionStatus;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AppSettings {
  theme: ThemeMode;
  autoCopyOnScan: boolean;
  vibrateOnScan: boolean;
  beepOnScan: boolean;
  autoOpenUrl: boolean;
}

export interface ContactPayload {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
}

export interface SyncKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface AsyncKeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
