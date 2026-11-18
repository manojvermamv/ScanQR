/**
 * Portable iOS & Android permission specs (API-level aware for Android 9/12/13+).
 */

import { DevicePlatform, PermissionPurpose, PlatformPermissionSpec } from './types';

export function getPlatformPermissionSpec(
  platform: DevicePlatform,
  purpose: PermissionPurpose,
  androidApiLevel = 34
): PlatformPermissionSpec {
  if (platform === 'ios') {
    switch (purpose) {
      case 'camera':
        return {
          purpose,
          platform,
          key: 'NSCameraUsageDescription',
          title: 'Camera Access',
          rationale: 'ScanQR needs iPhone camera access to scan QR codes and 1D/2D barcodes in real time.',
          settingsPath: 'Settings > Privacy & Security > Camera > ScanQR',
        };
      case 'photoLibrary':
        return {
          purpose,
          platform,
          key: 'NSPhotoLibraryUsageDescription',
          title: 'Photo Library Access',
          rationale: 'ScanQR needs Photo Library access to select and decode QR codes or barcodes from images.',
          settingsPath: 'Settings > Privacy & Security > Photos > ScanQR',
        };
      case 'storageSave':
        return {
          purpose,
          platform,
          key: 'NSPhotoLibraryAddUsageDescription',
          title: 'Save to Photos',
          rationale: 'ScanQR needs Add Photos access to save generated QR codes and barcodes to your Photo Library.',
          settingsPath: 'Settings > Privacy & Security > Photos > Add Photos Only',
        };
    }
  }

  switch (purpose) {
    case 'camera':
      return {
        purpose,
        platform,
        key: 'android.permission.CAMERA',
        title: 'Camera Permission',
        rationale: 'Camera access lets ScanQR scan QR codes and 1D/2D barcodes through the live viewfinder.',
        settingsPath: 'App Info > Permissions > Camera',
      };
    case 'photoLibrary':
      return {
        purpose,
        platform,
        key:
          androidApiLevel >= 33
            ? 'android.permission.READ_MEDIA_IMAGES'
            : 'android.permission.READ_EXTERNAL_STORAGE',
        title: 'Photos & Media Access',
        rationale:
          'Media access lets ScanQR read gallery images to crop and decode QR codes or barcodes (READ_MEDIA_IMAGES on Android 13+, READ_EXTERNAL_STORAGE on Android 12 and below).',
        settingsPath: 'App Info > Permissions > Photos and videos',
      };
    case 'storageSave':
      return {
        purpose,
        platform,
        key:
          androidApiLevel >= 29
            ? 'android.permission.WRITE_EXTERNAL_STORAGE'
            : 'android.permission.WRITE_EXTERNAL_STORAGE',
        title: 'Storage & Export Access',
        rationale:
          'Storage access lets ScanQR save generated code PNGs and export history files (scoped MediaStore on Android 10+, WRITE_EXTERNAL_STORAGE on Android 9 and below).',
        settingsPath: 'App Info > Permissions > Files and media',
      };
  }
}

export function getAndroidPermissionKey(
  purpose: PermissionPurpose,
  androidApiLevel = 34
): string | null {
  if (purpose === 'camera') {
    return 'android.permission.CAMERA';
  }
  if (purpose === 'photoLibrary') {
    return androidApiLevel >= 33
      ? 'android.permission.READ_MEDIA_IMAGES'
      : 'android.permission.READ_EXTERNAL_STORAGE';
  }
  return androidApiLevel >= 29 ? null : 'android.permission.WRITE_EXTERNAL_STORAGE';
}
