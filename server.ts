import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import {
  buildDefaultFaviconUrl,
  extractHostname,
  extractHtmlLinkMetadata,
  isSafePublicHttpUrl,
  parseLinkPreviewRequestUrl,
} from './packages/scanqr-core/src/linkPreview.ts';

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 262144; // 256 KB head scan cap

async function readHeadLimitedHtml(response: globalThis.Response): Promise<string> {
  if (!response.body) {
    return '';
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  let totalBytes = 0;
  let html = '';

  try {
    while (totalBytes < MAX_HTML_BYTES) {
      const { value, done } = await reader.read();
      if (done || !value) break;

      const remaining = MAX_HTML_BYTES - totalBytes;
      const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
      totalBytes += chunk.byteLength;
      html += decoder.decode(chunk, { stream: true });

      if (/<\/head>/i.test(html)) {
        break;
      }
    }
    html += decoder.decode();
  } finally {
    await reader.cancel().catch(() => {});
  }

  return html;
}

export function createApp() {
  const app = express();

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.get('/api/link-preview', async (req: Request, res: Response) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    const targetUrl = parseLinkPreviewRequestUrl(rawUrl);

    if (!targetUrl) {
      res.status(400).json({
        error: 'Preview unavailable for local, private, or invalid URLs.',
      });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const upstream = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ScanQR-LinkPreview/1.0 (+https://scanqr.app)',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const finalUrl = upstream.url || targetUrl;
      if (!isSafePublicHttpUrl(finalUrl)) {
        res.status(400).json({
          error: 'Redirect target is not a public web URL.',
        });
        return;
      }

      if (!upstream.ok) {
        res.status(502).json({
          error: `Site responded with status ${upstream.status}.`,
        });
        return;
      }

      const contentType = (upstream.headers.get('content-type') || '').toLowerCase();
      if (
        contentType &&
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml')
      ) {
        res.json({
          url: targetUrl,
          finalUrl,
          hostname: extractHostname(finalUrl),
          title: null,
          faviconUrl: buildDefaultFaviconUrl(finalUrl),
        });
        return;
      }

      const html = await readHeadLimitedHtml(upstream);
      const metadata = extractHtmlLinkMetadata(html, finalUrl, targetUrl);
      res.json(metadata);
    } catch (err: unknown) {
      const isAbort = err instanceof Error && err.name === 'AbortError';
      res.status(502).json({
        error: isAbort
          ? 'Timed out while loading page preview.'
          : 'Could not reach destination site for preview.',
      });
    } finally {
      clearTimeout(timeoutId);
    }
  });

  return app;
}

async function startServer() {
  const app = createApp();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`ScanQR server listening on http://${HOST}:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ScanQR server:', err);
  process.exit(1);
});
