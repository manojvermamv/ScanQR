import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  BARCODE_FORMATS,
  buildBwipRenderOptions,
  computeGs1CheckDigit,
  createAsyncHistoryRepository,
  createSyncHistoryRepository,
  detectContentType,
  exportRecordsToCsv,
  exportRecordsToJson,
  filterRecords,
  formatVCard,
  getAndroidPermissionKey,
  getBarcodeFormatLabel,
  getContrastRatio,
  getExpoBarcodeTypes,
  getPlatformPermissionSpec,
  hasLowContrast,
  buildDefaultFaviconUrl,
  decodeHtmlEntities,
  extractHtmlLinkMetadata,
  isSafePublicHttpUrl,
  mapExpoBarcodeType,
  normalizeHexForBwip,
  parseLinkPreviewRequestUrl,
  parseWifiQr,
  validateBarcodeInput,
  validatePassword,
  type AsyncKeyValueStorage,
  type SyncKeyValueStorage,
} from './index';

test('@scanqr/core modules contain zero DOM or Web-only globals', () => {
  const coreFiles = [
    'types.ts',
    'symbologies.ts',
    'validation.ts',
    'parsers.ts',
    'colors.ts',
    'permissions.ts',
    'history.ts',
    'linkPreview.ts',
    'index.ts',
  ];

  const forbiddenGlobals = /\b(window|document|localStorage|sessionStorage|navigator|HTMLCanvasElement)\b/;

  for (const file of coreFiles) {
    const raw = fs.readFileSync(path.join(process.cwd(), 'packages/scanqr-core/src', file), 'utf8');
    const codeOnly = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    assert.equal(
      forbiddenGlobals.test(codeOnly),
      false,
      `Found Web/DOM global reference in portable core file ${file}`
    );
  }
});

test('symbology catalog, Expo barcode mapping, and bwip option builder work cleanly', () => {
  assert.equal(BARCODE_FORMATS.length, 11);
  assert.equal(getBarcodeFormatLabel('CODE_128'), 'Code 128');

  const expoTypes = getExpoBarcodeTypes();
  assert.ok(expoTypes.includes('qr'));
  assert.ok(expoTypes.includes('ean13'));
  assert.ok(expoTypes.includes('upc_e'));
  assert.ok(expoTypes.includes('pdf417'));

  assert.equal(mapExpoBarcodeType('qr'), 'QR_CODE');
  assert.equal(mapExpoBarcodeType('org.gs1.EAN-13'), 'EAN_13');
  assert.equal(mapExpoBarcodeType('upc_e'), 'UPC_A');
  assert.equal(mapExpoBarcodeType('code128'), 'CODE_128');
  assert.equal(mapExpoBarcodeType('datamatrix'), 'DATA_MATRIX');
  assert.equal(mapExpoBarcodeType('aztec'), 'AZTEC');

  // GS1 formats preserve native digit grouping (no textxalign override)
  const eanOpts = buildBwipRenderOptions({
    payload: '4006381333931',
    format: 'EAN_13',
    fgColor: '#000',
    bgColor: '#fff',
  });
  assert.equal(eanOpts.bcid, 'ean13');
  assert.equal(eanOpts.height, 14);
  assert.equal(eanOpts.includetext, true);
  assert.equal(eanOpts.textxalign, undefined);
  assert.equal(eanOpts.barcolor, '000000');
  assert.equal(eanOpts.backgroundcolor, 'ffffff');

  // Non-GS1 1D barcodes center their human-readable label
  const c128Opts = buildBwipRenderOptions({
    payload: 'PKG-2026-8492',
    format: 'CODE_128',
    fgColor: '#059669',
    bgColor: '#ffffff',
  });
  assert.equal(c128Opts.textxalign, 'center');
  assert.equal(c128Opts.height, 14);

  // QR Code omits `height` so bwip-js never receives `height: undefined`
  const qrOpts = buildBwipRenderOptions({
    payload: 'https://scanqr.app',
    format: 'QR_CODE',
    fgColor: '#000000',
    bgColor: '#ffffff',
  });
  assert.equal('height' in qrOpts, false);
});

test('sync and async history repositories manage seed, records, favorites, and settings', async () => {
  const syncStore = new Map<string, string>();
  const syncAdapter: SyncKeyValueStorage = {
    getItem: (k) => syncStore.get(k) ?? null,
    setItem: (k, v) => {
      syncStore.set(k, v);
    },
    removeItem: (k) => {
      syncStore.delete(k);
    },
  };

  const syncRepo = createSyncHistoryRepository(syncAdapter);
  const initialSync = syncRepo.loadRecords();
  assert.equal(initialSync.length, 4);

  const addedSync = syncRepo.addRecord({
    content: 'A40156B',
    format: 'CODABAR',
    type: 'text',
    category: 'generated',
    isFavorite: false,
    title: 'Codabar Sample',
  });
  assert.equal(syncRepo.loadRecords().length, 5);
  syncRepo.toggleFavorite(addedSync.id);
  assert.equal(syncRepo.loadRecords().find((r) => r.id === addedSync.id)?.isFavorite, true);
  syncRepo.deleteRecord(addedSync.id);
  assert.equal(syncRepo.loadRecords().length, 4);

  // Async adapter (React Native AsyncStorage style)
  const asyncStore = new Map<string, string>();
  const asyncAdapter: AsyncKeyValueStorage = {
    getItem: async (k) => asyncStore.get(k) ?? null,
    setItem: async (k, v) => {
      asyncStore.set(k, v);
    },
    removeItem: async (k) => {
      asyncStore.delete(k);
    },
  };

  const asyncRepo = createAsyncHistoryRepository(asyncAdapter);
  const initialAsync = await asyncRepo.loadRecords();
  assert.equal(initialAsync.length, 4);

  const addedAsync = await asyncRepo.addRecord({
    content: 'TKT-AZ-99201-GATE4',
    format: 'AZTEC',
    type: 'text',
    category: 'scanned',
    isFavorite: false,
    title: 'Rail Pass',
  });
  assert.equal((await asyncRepo.loadRecords()).length, 5);
  await asyncRepo.toggleFavorite(addedAsync.id);
  assert.equal((await asyncRepo.loadRecords())[0].isFavorite, true);

  await asyncRepo.saveSettings({
    theme: 'light',
    autoCopyOnScan: true,
    vibrateOnScan: false,
    beepOnScan: false,
    autoOpenUrl: true,
  });
  const loadedSettings = await asyncRepo.loadSettings();
  assert.equal(loadedSettings.theme, 'light');
  assert.equal(loadedSettings.autoCopyOnScan, true);
});

test('portable validators, parsers, permissions, colors, filter, and CSV export match expected behavior', () => {
  assert.equal(computeGs1CheckDigit('400638133393'), 1);
  assert.equal(validateBarcodeInput('400638133393', 'EAN_13').normalizedValue, '4006381333931');
  assert.equal(validatePassword('pass123').isValid, true);
  assert.equal(detectContentType('WIFI:S:Home;T:WPA;P:pass;;'), 'wifi');
  assert.equal(parseWifiQr('WIFI:S:Home;T:WPA;P:pass;;')?.ssid, 'Home');
  assert.match(formatVCard({ name: 'Maya Lin' }), /BEGIN:VCARD/);
  assert.equal(normalizeHexForBwip('#fff'), 'ffffff');
  assert.ok(getContrastRatio('#000000', '#ffffff') > 20);
  assert.equal(hasLowContrast('#ffffff', '#ffffff'), true);

  assert.equal(getPlatformPermissionSpec('ios', 'camera').key, 'NSCameraUsageDescription');
  assert.equal(getAndroidPermissionKey('photoLibrary', 34), 'android.permission.READ_MEDIA_IMAGES');
  assert.equal(getAndroidPermissionKey('photoLibrary', 31), 'android.permission.READ_EXTERNAL_STORAGE');
  assert.equal(getAndroidPermissionKey('storageSave', 33), null);
  assert.equal(getAndroidPermissionKey('storageSave', 28), 'android.permission.WRITE_EXTERNAL_STORAGE');

  const records = getSeedForTest();
  assert.equal(filterRecords(records, 'ean-13').length, 1);
  const csv = exportRecordsToCsv(records);
  assert.match(csv, /EAN-13/);
  const json = exportRecordsToJson(records);
  assert.match(json, /"EAN_13"/);
});

test('portable HTML link metadata extractor and public URL safety checks work cleanly', () => {
  assert.equal(isSafePublicHttpUrl('https://scanqr.app/docs'), true);
  assert.equal(isSafePublicHttpUrl('scanqr.app'), true);
  assert.equal(isSafePublicHttpUrl('http://localhost:3000'), false);
  assert.equal(isSafePublicHttpUrl('http://127.0.0.1:8080'), false);
  assert.equal(isSafePublicHttpUrl('http://192.168.1.1'), false);
  assert.equal(isSafePublicHttpUrl('http://169.254.169.254/latest/meta-data'), false);
  assert.equal(isSafePublicHttpUrl('http://[::1]:3000'), false);
  assert.equal(isSafePublicHttpUrl('javascript:alert(1)'), false);
  assert.equal(parseLinkPreviewRequestUrl('example.com/path'), 'https://example.com/path');
  assert.equal(buildDefaultFaviconUrl('https://example.com/a/b'), 'https://example.com/favicon.ico');
  assert.equal(decodeHtmlEntities('Docs &amp; Guides &#8212; ScanQR &#x27;26'), 'Docs & Guides — ScanQR \'26');

  const htmlWithTitleAndIcon = `
    <!doctype html>
    <html>
      <head>
        <title>  Example   &amp;  Portal  </title>
        <link href="/assets/brand-icon.png" rel="icon" type="image/png" />
      </head>
    </html>
  `;
  const parsed = extractHtmlLinkMetadata(htmlWithTitleAndIcon, 'https://docs.example.com/guide/1');
  assert.equal(parsed.title, 'Example & Portal');
  assert.equal(parsed.hostname, 'docs.example.com');
  assert.equal(parsed.faviconUrl, 'https://docs.example.com/assets/brand-icon.png');

  const htmlFallbackOgAndDefaultIcon = `
    <html>
      <head>
        <meta content="ScanQR Live Scanner" property="og:title" />
      </head>
    </html>
  `;
  const fallbackParsed = extractHtmlLinkMetadata(htmlFallbackOgAndDefaultIcon, 'https://scanqr.app/hello');
  assert.equal(fallbackParsed.title, 'ScanQR Live Scanner');
  assert.equal(fallbackParsed.faviconUrl, 'https://scanqr.app/favicon.ico');
});

function getSeedForTest() {
  return [
    {
      id: '1',
      category: 'scanned',
      format: 'EAN_13' as const,
      type: 'text',
      content: '4006381333931',
      title: 'SKU',
      isFavorite: false,
      createdAt: 1729100000000,
    },
  ];
}
