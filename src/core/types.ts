/**
 * Types and interfaces for ScanQR application
 * High-performance cross-platform QR and barcode engine
 */

export type ScreenType = 
  | 'splash'
  | 'generator'
  | 'scanner'
  | 'favorites'
  | 'password_utility';

export type DevicePlatform = 'android' | 'ios';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface QrRecord {
  id: string;
  content: string;
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

export interface AppError {
  title: string;
  message: string;
  stack?: string;
  timestamp: number;
}
