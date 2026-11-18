/**
 * Types and interfaces for ScanQR application
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

export type PermissionPurpose = 'camera' | 'photoLibrary' | 'storageSave';

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
  type: 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'text';
  category: 'generated' | 'scanned';
  createdAt: number;
  isFavorite: boolean;
  title?: string;
  meta?: Record<string, string>;
}

export interface PermissionState {
  camera: 'granted' | 'denied' | 'prompt';
  storageRead: 'granted' | 'denied' | 'prompt';
  storageWrite: 'granted' | 'denied' | 'prompt';
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
