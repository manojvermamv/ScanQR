/**
 * React Native Core Adapter backed directly by @scanqr/core.
 * Zero duplicated business rules — all validation, formatting, export, and permission logic
 * comes from ../../packages/scanqr-core.
 */

export * from '../../packages/scanqr-core/src/index';

import {
  BARCODE_FORMATS,
  detectContentType,
  exportRecordsToCsv as coreExportRecordsToCsv,
  exportRecordsToJson as coreExportRecordsToJson,
  filterRecords as coreFilterRecords,
  formatDate,
  formatVCard as coreFormatVCard,
  getBarcodeFormatLabel,
  getPlatformPermissionSpec,
  validateBarcodeInput,
  type BarcodeFormat,
  type ContactPayload,
  type DevicePlatform,
  type PermissionPurpose,
  type QrRecord,
} from '../../packages/scanqr-core/src/index';

export type MobileBarcodeFormat = BarcodeFormat;
export const MOBILE_BARCODE_FORMATS = BARCODE_FORMATS;
export const getMobileBarcodeLabel = getBarcodeFormatLabel;
export const validateMobileBarcodeInput = validateBarcodeInput;

export interface MobileQrRecord {
  id: string;
  content: string;
  title?: string;
  format?: MobileBarcodeFormat;
  type: 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'contact';
  category: 'scanned' | 'generated';
  timestamp: number;
  isFavorite: boolean;
}

export interface ContactData extends ContactPayload {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
}

export function toCoreRecord(record: MobileQrRecord): QrRecord {
  return {
    id: record.id,
    content: record.content,
    title: record.title,
    format: record.format || 'QR_CODE',
    type: record.type === 'contact' ? 'text' : record.type,
    category: record.category,
    createdAt: record.timestamp,
    isFavorite: record.isFavorite,
  };
}

export function fromCoreRecord(record: QrRecord): MobileQrRecord {
  const isContact = /^BEGIN:VCARD/i.test(record.content.trim());
  return {
    id: record.id,
    content: record.content,
    title: record.title,
    format: record.format || 'QR_CODE',
    type: isContact ? 'contact' : record.type === 'sms' ? 'text' : record.type,
    category: record.category,
    timestamp: record.createdAt,
    isFavorite: record.isFavorite,
  };
}

export function getMobilePermissionSpec(
  os: DevicePlatform,
  purpose: PermissionPurpose,
  androidApiLevel = 34
): { key: string; title: string; rationale: string } {
  const spec = getPlatformPermissionSpec(os, purpose, androidApiLevel);
  return {
    key:
      os === 'android' && purpose === 'storageSave' && androidApiLevel >= 29
        ? 'MediaStore (Scoped Storage)'
        : spec.key,
    title: spec.title,
    rationale: spec.rationale,
  };
}

export function formatVCard(contact: ContactPayload): string {
  return coreFormatVCard(contact);
}

export function exportRecordsToJson(records: MobileQrRecord[]): string {
  return JSON.stringify(
    {
      app: 'ScanQR React Native',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      totalRecords: records.length,
      records,
    },
    null,
    2
  );
}

export function exportRecordsToCsv(records: MobileQrRecord[]): string {
  return coreExportRecordsToCsv(records.map(toCoreRecord));
}

export function detectType(content: string): 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'contact' {
  const trimmed = content.trim();
  if (/^BEGIN:VCARD/i.test(trimmed)) return 'contact';
  const detected = detectContentType(trimmed);
  if (detected === 'sms') return 'text';
  if (detected === 'text' && /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(trimmed)) {
    return 'url';
  }
  return detected;
}

export function formatTime(ts: number): string {
  return formatDate(ts).replace(', ', ' ');
}

export function filterRecords(
  records: MobileQrRecord[],
  query: string,
  filterTab: 'all' | 'favorites' | 'scanned' | 'generated' = 'all'
): MobileQrRecord[] {
  return coreFilterRecords(records, query, filterTab);
}

export { coreExportRecordsToJson };
