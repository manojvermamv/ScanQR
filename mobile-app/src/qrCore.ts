/**
 * QR Code Business Logic and Data Utilities for Mobile React Native App
 * Fully tested pure functions for export, parsing, vCard generation, and formatting.
 */

export interface MobileQrRecord {
  id: string;
  content: string;
  title?: string;
  type: 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'contact';
  category: 'scanned' | 'generated';
  timestamp: number;
  isFavorite: boolean;
}

export interface ContactData {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
}

/**
 * Format Contact info as vCard 3.0 standard payload
 */
export function formatVCard(contact: ContactData): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  if (contact.name.trim()) {
    lines.push(`FN:${contact.name.trim()}`);
    lines.push(`N:${contact.name.trim()};;;;`);
  }
  if (contact.phone.trim()) {
    lines.push(`TEL;TYPE=CELL:${contact.phone.trim()}`);
  }
  if (contact.email.trim()) {
    lines.push(`EMAIL:${contact.email.trim()}`);
  }
  if (contact.company.trim()) {
    lines.push(`ORG:${contact.company.trim()}`);
  }
  if (contact.title.trim()) {
    lines.push(`TITLE:${contact.title.trim()}`);
  }
  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Exports records to formatted JSON string
 */
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

/**
 * Exports records to RFC 4180 compliant CSV string
 */
export function exportRecordsToCsv(records: MobileQrRecord[]): string {
  const headers = ['ID', 'Type', 'Category', 'IsFavorite', 'Timestamp', 'FormattedDate', 'Content'];
  const escapeCsv = (val: string | number | boolean) => {
    const s = String(val ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = records.map((r) => [
    escapeCsv(r.id),
    escapeCsv(r.type),
    escapeCsv(r.category),
    escapeCsv(r.isFavorite),
    escapeCsv(r.timestamp),
    escapeCsv(new Date(r.timestamp).toISOString()),
    escapeCsv(r.content),
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Detect content type from QR string
 */
export function detectType(content: string): 'url' | 'wifi' | 'email' | 'phone' | 'text' | 'contact' {
  const trimmed = content.trim();
  if (/^BEGIN:VCARD/i.test(trimmed)) return 'contact';
  if (/^https?:\/\//i.test(trimmed) || /^(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(trimmed)) return 'url';
  if (/^WIFI:/i.test(trimmed)) return 'wifi';
  if (/^mailto:/i.test(trimmed) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed)) return 'email';
  if (/^tel:[+0-9]+/i.test(trimmed) || /^\+?[0-9]{7,15}$/.test(trimmed.replace(/[\s\-()]/g, ''))) return 'phone';
  return 'text';
}

/**
 * Format timestamp into readable date
 */
export function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Validates a 3 or 6 digit hex color code
 */
export function validateHexColor(hex: string): boolean {
  if (!hex) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Filter records by search query and category
 */
export function filterRecords(
  records: MobileQrRecord[],
  query: string,
  filterTab: 'all' | 'favorites' | 'scanned' | 'generated' = 'all'
): MobileQrRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  return records.filter((r) => {
    const matchesSearch =
      normalizedQuery === '' ||
      r.content.toLowerCase().includes(normalizedQuery) ||
      (r.title ? r.title.toLowerCase().includes(normalizedQuery) : false);

    if (!matchesSearch) return false;

    if (filterTab === 'favorites') return r.isFavorite;
    if (filterTab === 'scanned') return r.category === 'scanned';
    if (filterTab === 'generated') return r.category === 'generated';
    return true;
  });
}
