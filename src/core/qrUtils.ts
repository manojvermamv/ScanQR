/**
 * Core utility functions for ScanQR
 * Decoupled pure logic functions for QR encoding, parsing, export, and formatting.
 */

/**
 * Checks if a string is a valid web URL (ported from URLUtil.isNetworkUrl)
 */
export function isNetworkUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed) || 
         /^(www\.)[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/i.test(trimmed);
}

/**
 * Normalizes URL with scheme if missing
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Categorizes QR content type
 */
export function detectContentType(text: string): 'url' | 'wifi' | 'email' | 'phone' | 'sms' | 'text' {
  if (!text) return 'text';
  const trimmed = text.trim();

  if (/^WIFI:S:[^;]+;/i.test(trimmed)) {
    return 'wifi';
  }
  if (isNetworkUrl(trimmed)) {
    return 'url';
  }
  if (/^mailto:/i.test(trimmed) || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return 'email';
  }
  if (/^tel:[+0-9]+/i.test(trimmed) || /^\+?[0-9]{7,15}$/.test(trimmed.replace(/[\s\-()]/g, ''))) {
    return 'phone';
  }
  if (/^smsto:[+0-9]+/i.test(trimmed)) {
    return 'sms';
  }

  return 'text';
}

/**
 * Parses WIFI QR code string (WIFI:S:MySSID;T:WPA;P:MyPassword;;)
 */
export function parseWifiQr(text: string): { ssid: string; password?: string; type?: string; hidden?: boolean } | null {
  if (!text.toUpperCase().startsWith('WIFI:')) return null;

  const ssidMatch = text.match(/S:([^;]+);/i);
  const passMatch = text.match(/P:([^;]+);/i);
  const typeMatch = text.match(/T:([^;]+);/i);
  const hiddenMatch = text.match(/H:([^;]+);/i);

  if (!ssidMatch) return null;

  return {
    ssid: ssidMatch[1],
    password: passMatch ? passMatch[1] : undefined,
    type: typeMatch ? typeMatch[1] : 'WPA',
    hidden: hiddenMatch ? hiddenMatch[1].toLowerCase() === 'true' : false,
  };
}

/**
 * Ported from FileUtil.java: getSizeForFile
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1000) {
    return `${Math.round(bytes)} B`;
  } else if (bytes < 1000000) {
    return `${(bytes / 1000).toFixed(2)} KB`;
  } else if (bytes < 1000000000) {
    return `${(bytes / 1000000).toFixed(2)} MB`;
  } else {
    return `${(bytes / 1000000000).toFixed(2)} GB`;
  }
}

/**
 * Ported from FileUtil.java: getDateForFile ("dd/MM/yyyy, hh:mm:ss")
 */
export function formatDate(timestamp: number | Date): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp;
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
}

/**
 * Ported from UpdatePasswordActivity.java & Utils.java: validatePassword
 * Minimum 6 characters with at least one letter and one number
 */
export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password cannot be empty' };
  }
  if (password.length < 6) {
    return { isValid: false, error: 'Password must be at least 6 characters' };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'Password must contain at least one letter and one number' };
  }

  return { isValid: true };
}

/**
 * Validates QR input text
 */
export function validateQrInput(text: string): { isValid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Please enter a value' };
  }
  if (text.length > 2953) {
    return { isValid: false, error: 'Text exceeds maximum QR code capacity' };
  }
  return { isValid: true };
}

/**
 * Exports QR records to JSON string
 */
export function exportRecordsToJson(records: any[]): string {
  return JSON.stringify(records, null, 2);
}

/**
 * Exports QR records to CSV format with RFC 4180 escaping
 */
export function exportRecordsToCsv(records: Array<{
  id: string;
  category: string;
  type: string;
  content: string;
  isFavorite: boolean;
  createdAt: number;
}>): string {
  const headers = ['ID', 'Category', 'Type', 'Content', 'IsFavorite', 'CreatedAt', 'FormattedDate'];
  
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
    escapeCsv(r.type),
    escapeCsv(r.content),
    escapeCsv(r.isFavorite ? 'true' : 'false'),
    escapeCsv(r.createdAt),
    escapeCsv(formatDate(r.createdAt)),
  ].join(','));

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Formats a contact into standard vCard 3.0 format for QR codes
 */
export function formatVCard(contact: {
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
}): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${contact.name.trim()}`,
    `N:;${contact.name.trim()};;;`,
  ];

  if (contact.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL:${contact.phone.trim()}`);
  }
  if (contact.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${contact.email.trim()}`);
  }
  if (contact.company?.trim()) {
    lines.push(`ORG:${contact.company.trim()}`);
  }
  if (contact.title?.trim()) {
    lines.push(`TITLE:${contact.title.trim()}`);
  }

  lines.push('END:VCARD');
  return lines.join('\n');
}

/**
 * Validates a 3 or 6 digit hex color code
 */
export function validateHexColor(hex: string): boolean {
  if (!hex) return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

/**
 * Filters QR records by search query (content or title) and category filter tab
 */
export function filterRecords<T extends { content: string; title?: string; isFavorite: boolean; category: string }>(
  records: T[],
  query: string,
  filterTab: 'all' | 'favorites' | 'scanned' | 'generated' = 'all'
): T[] {
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

