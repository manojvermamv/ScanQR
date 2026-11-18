/**
 * Portable, zero-DOM URL metadata parsing and SSRF/scheme validation helpers.
 * Pure ES2022 implementation (zero dependency on browser DOM or WHATWG URL polyfills).
 * Shared by the Web server proxy (/api/link-preview) and React Native direct fetch.
 */

export interface UrlMetadataPreview {
  url: string;
  finalUrl: string;
  hostname: string;
  title: string | null;
  faviconUrl: string | null;
}

export type LinkPreviewStatus = 'idle' | 'loading' | 'success' | 'error';

interface ParsedHttpUrl {
  protocol: 'http:' | 'https:';
  hostname: string;
  hostWithPort: string;
  origin: string;
  pathname: string;
  href: string;
}

export function normalizePreviewUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function parseHttpUrlParts(rawUrl: string): ParsedHttpUrl | null {
  const candidate = normalizePreviewUrl(rawUrl);
  const match = candidate.match(/^(https?):\/\/([^/?#\s]+)([^#\s]*)(#[^\s]*)?$/i);
  if (!match) return null;

  const protocol = `${match[1].toLowerCase()}:` as 'http:' | 'https:';
  const rawAuthority = match[2];
  const rawPathAndQuery = match[3] || '';
  const fragment = match[4] || '';

  const atIndex = rawAuthority.lastIndexOf('@');
  const hostPort = atIndex >= 0 ? rawAuthority.slice(atIndex + 1) : rawAuthority;
  if (!hostPort) return null;

  let hostname = '';
  let port = '';

  if (hostPort.startsWith('[')) {
    const closeIdx = hostPort.indexOf(']');
    if (closeIdx < 2) return null;
    hostname = hostPort.slice(0, closeIdx + 1).toLowerCase();
    const rest = hostPort.slice(closeIdx + 1);
    if (rest) {
      if (!/^:\d{1,5}$/.test(rest)) return null;
      port = rest;
    }
  } else {
    const colonIdx = hostPort.indexOf(':');
    if (colonIdx >= 0) {
      hostname = hostPort.slice(0, colonIdx).toLowerCase();
      port = hostPort.slice(colonIdx);
      if (!/^:\d{1,5}$/.test(port)) return null;
    } else {
      hostname = hostPort.toLowerCase();
    }
  }

  if (!hostname || hostname.includes('..') || hostname.startsWith('.') || hostname.endsWith('.')) {
    return null;
  }

  const normalizedHostWithPort = `${hostname}${port}`;
  const origin = `${protocol}//${normalizedHostWithPort}`;
  const normalizedPathAndQuery = rawPathAndQuery
    ? rawPathAndQuery.startsWith('/')
      ? rawPathAndQuery
      : `/${rawPathAndQuery}`
    : '/';
  const qIndex = normalizedPathAndQuery.indexOf('?');
  const pathname = qIndex >= 0 ? normalizedPathAndQuery.slice(0, qIndex) : normalizedPathAndQuery;

  return {
    protocol,
    hostname,
    hostWithPort: normalizedHostWithPort,
    origin,
    pathname: pathname || '/',
    href: `${origin}${normalizedPathAndQuery}${fragment}`,
  };
}

function isPrivateOrReservedIpv4(hostname: string): boolean {
  const parts = hostname.split('.');
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) {
    return false;
  }
  const octets = parts.map((p) => Number(p));
  if (octets.some((n) => n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a >= 224) return true;
  return false;
}

function isPrivateOrReservedIpv6(hostname: string): boolean {
  if (!hostname.startsWith('[') || !hostname.endsWith(']')) {
    return false;
  }
  const inner = hostname.slice(1, -1).toLowerCase();
  if (inner === '::1' || inner === '::' || inner === '0:0:0:0:0:0:0:1') return true;
  if (inner.startsWith('fe80:') || inner.startsWith('fc') || inner.startsWith('fd')) return true;
  if (inner.includes('127.') || inner.includes('10.') || inner.includes('192.168.') || inner.includes('169.254.')) {
    return true;
  }
  return false;
}

export function isSafePublicHttpUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || !rawUrl.trim()) return false;
  const trimmed = rawUrl.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
    return false;
  }

  const parsed = parseHttpUrlParts(trimmed);
  if (!parsed) return false;

  const { hostname } = parsed;
  if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
    return false;
  }

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal'
  ) {
    return false;
  }

  if (isPrivateOrReservedIpv4(hostname) || isPrivateOrReservedIpv6(hostname)) {
    return false;
  }

  return hostname.includes('.');
}

export function parseLinkPreviewRequestUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || !rawUrl.trim()) return null;
  if (!isSafePublicHttpUrl(rawUrl)) return null;
  return parseHttpUrlParts(rawUrl)?.href ?? null;
}

export function extractHostname(pageUrl: string): string {
  return parseHttpUrlParts(pageUrl)?.hostname ?? '';
}

export function buildDefaultFaviconUrl(pageUrl: string): string | null {
  const parsed = parseHttpUrlParts(pageUrl);
  return parsed ? `${parsed.origin}/favicon.ico` : null;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  copy: '©',
  reg: '®',
  trade: '™',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
};

export function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_match, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : _match;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : _match;
    })
    .replace(/&([a-z]+);/gi, (match, name) => {
      const mapped = NAMED_ENTITIES[name.toLowerCase()];
      return mapped ?? match;
    });
}

function readTagAttribute(tag: string, attrName: string): string | null {
  const escaped = attrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + '`' + `]+))`,
    'i'
  );
  const match = tag.match(pattern);
  const rawValue = match?.[1] ?? match?.[2] ?? match?.[3];
  return rawValue ? decodeHtmlEntities(rawValue.trim()) : null;
}

function sanitizeResolvedFaviconUrl(rawHref: string, baseUrl: string): string | null {
  const trimmed = rawHref.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  if (/^data:image\/(png|jpe?g|gif|webp|x-icon|vnd\.microsoft\.icon|svg\+xml);/i.test(trimmed)) {
    return trimmed;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return parseHttpUrlParts(trimmed)?.href ?? null;
  }

  const base = parseHttpUrlParts(baseUrl);
  if (!base) return null;

  if (trimmed.startsWith('//')) {
    return parseHttpUrlParts(`${base.protocol}${trimmed}`)?.href ?? null;
  }

  if (trimmed.startsWith('/')) {
    return `${base.origin}${trimmed}`;
  }

  const baseSegments = base.pathname.split('/');
  baseSegments.pop(); // remove filename
  for (const segment of trimmed.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      if (baseSegments.length > 1) baseSegments.pop();
    } else {
      baseSegments.push(segment);
    }
  }
  const resolvedPath = baseSegments.join('/');
  return `${base.origin}${resolvedPath.startsWith('/') ? resolvedPath : `/${resolvedPath}`}`;
}

export function extractHtmlLinkMetadata(
  html: string,
  pageUrl: string,
  requestedUrl: string = pageUrl
): UrlMetadataPreview {
  const normalizedFinal = parseHttpUrlParts(pageUrl)?.href ?? normalizePreviewUrl(pageUrl);
  const normalizedRequest = parseHttpUrlParts(requestedUrl)?.href ?? normalizePreviewUrl(requestedUrl);
  const hostname = extractHostname(normalizedFinal);

  let title: string | null = null;

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) {
    const cleaned = decodeHtmlEntities(titleMatch[1].replace(/\s+/g, ' ').trim());
    if (cleaned) {
      title = cleaned;
    }
  }

  if (!title) {
    const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
    for (const tag of metaTags) {
      const prop = (readTagAttribute(tag, 'property') || readTagAttribute(tag, 'name') || '').toLowerCase();
      if (prop === 'og:title' || prop === 'twitter:title') {
        const content = readTagAttribute(tag, 'content');
        if (content) {
          title = content.replace(/\s+/g, ' ').trim();
          break;
        }
      }
    }
  }

  let bestIconUrl: string | null = null;
  let bestPriority = 99;

  const linkTags = html.match(/<link\b[^>]*>/gi) || [];
  for (const tag of linkTags) {
    const rel = (readTagAttribute(tag, 'rel') || '').toLowerCase();
    if (!rel) continue;

    const tokens = rel.split(/\s+/);
    let priority = 99;
    if (tokens.includes('icon')) {
      priority = 1;
    } else if (rel === 'shortcut icon') {
      priority = 2;
    } else if (tokens.includes('apple-touch-icon') || tokens.includes('apple-touch-icon-precomposed')) {
      priority = 3;
    }

    if (priority >= bestPriority) continue;

    const href = readTagAttribute(tag, 'href');
    if (!href) continue;

    const resolved = sanitizeResolvedFaviconUrl(href, normalizedFinal);
    if (resolved) {
      bestIconUrl = resolved;
      bestPriority = priority;
    }
  }

  return {
    url: normalizedRequest,
    finalUrl: normalizedFinal,
    hostname,
    title,
    faviconUrl: bestIconUrl ?? buildDefaultFaviconUrl(normalizedFinal),
  };
}
