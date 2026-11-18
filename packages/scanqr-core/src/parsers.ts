/**
 * Portable content detection, Wi-Fi/vCard parsers, URL normalization, and formatting helpers.
 */

import { ContactPayload, QrContentType } from './types';

export function isNetworkUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(trimmed) ||
    /^(www\.)[a-z0-9-]+(\.[a-z0-9-]+)+([/?].*)?$/i.test(trimmed)
  );
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function detectContentType(text: string): QrContentType {
  if (!text) return 'text';
  const trimmed = text.trim();

  if (/^WIFI:S:[^;]+;/i.test(trimmed)) {
    return 'wifi';
  }
  if (isNetworkUrl(trimmed)) {
    return 'url';
  }
  if (
    /^mailto:/i.test(trimmed) ||
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)
  ) {
    return 'email';
  }
  if (
    /^tel:[+0-9]+/i.test(trimmed) ||
    /^\+?[0-9]{7,15}$/.test(trimmed.replace(/[\s\-()]/g, ''))
  ) {
    return 'phone';
  }
  if (/^smsto:[+0-9]+/i.test(trimmed)) {
    return 'sms';
  }

  return 'text';
}

export function parseWifiQr(
  text: string
): { ssid: string; password?: string; type?: string; hidden?: boolean } | null {
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

export function formatVCard(contact: ContactPayload): string {
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
