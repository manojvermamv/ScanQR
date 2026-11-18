/**
 * Portable symbology catalog, React Native/Expo barcode type mapping, and bwip-js option builder.
 */

import { BarcodeFormat } from './types';
import { normalizeHexForBwip } from './validation';

export interface BarcodeSymbologySpec {
  id: BarcodeFormat;
  label: string;
  dimension: '1d' | '2d';
  bwipBcid: string;
  expoType: string;
  hint: string;
  sampleValue: string;
}

export interface BwipRenderOptions {
  bcid: string;
  text: string;
  scale: number;
  includetext: boolean;
  textcolor: string;
  barcolor: string;
  backgroundcolor: string;
  paddingwidth: number;
  paddingheight: number;
  height?: number;
  textxalign?: 'offleft' | 'left' | 'center' | 'right' | 'offright' | 'justify';
}

export const BARCODE_FORMATS: BarcodeSymbologySpec[] = [
  {
    id: 'QR_CODE',
    label: 'QR Code',
    dimension: '2d',
    bwipBcid: 'qrcode',
    expoType: 'qr',
    hint: 'URLs, Wi-Fi, contacts, or text up to 2,953 chars',
    sampleValue: 'https://scanqr.app',
  },
  {
    id: 'CODE_128',
    label: 'Code 128',
    dimension: '1d',
    bwipBcid: 'code128',
    expoType: 'code128',
    hint: 'ASCII letters, digits, and symbols (1-80 chars)',
    sampleValue: 'PKG-2026-8492',
  },
  {
    id: 'EAN_13',
    label: 'EAN-13',
    dimension: '1d',
    bwipBcid: 'ean13',
    expoType: 'ean13',
    hint: '12 digits (auto check digit) or valid 13 digits',
    sampleValue: '4006381333931',
  },
  {
    id: 'UPC_A',
    label: 'UPC-A',
    dimension: '1d',
    bwipBcid: 'upca',
    expoType: 'upc_a',
    hint: '11 digits (auto check digit) or valid 12 digits',
    sampleValue: '036000291452',
  },
  {
    id: 'EAN_8',
    label: 'EAN-8',
    dimension: '1d',
    bwipBcid: 'ean8',
    expoType: 'ean8',
    hint: '7 digits (auto check digit) or valid 8 digits',
    sampleValue: '96385074',
  },
  {
    id: 'CODE_39',
    label: 'Code 39',
    dimension: '1d',
    bwipBcid: 'code39',
    expoType: 'code39',
    hint: 'Uppercase A-Z, 0-9, space, and - . $ / + %',
    sampleValue: 'INV-4092',
  },
  {
    id: 'ITF',
    label: 'ITF',
    dimension: '1d',
    bwipBcid: 'interleaved2of5',
    expoType: 'itf14',
    hint: 'Even number of digits (e.g. 14-digit carton GTIN)',
    sampleValue: '10012345678902',
  },
  {
    id: 'CODABAR',
    label: 'Codabar',
    dimension: '1d',
    bwipBcid: 'rationalizedCodabar',
    expoType: 'codabar',
    hint: 'Digits and - $ : / . + wrapped in A-D start/stop',
    sampleValue: 'A40156B',
  },
  {
    id: 'PDF_417',
    label: 'PDF417',
    dimension: '2d',
    bwipBcid: 'pdf417',
    expoType: 'pdf417',
    hint: 'Stacked 2D barcode for passes, IDs, and manifests',
    sampleValue: 'BOARDING:SFO-NRT/14A/2026-11-18',
  },
  {
    id: 'DATA_MATRIX',
    label: 'Data Matrix',
    dimension: '2d',
    bwipBcid: 'datamatrix',
    expoType: 'datamatrix',
    hint: 'Compact 2D matrix for serials, parts, and labels',
    sampleValue: 'SN-DM-88410293',
  },
  {
    id: 'AZTEC',
    label: 'Aztec',
    dimension: '2d',
    bwipBcid: 'azteccode',
    expoType: 'aztec',
    hint: '2D matrix commonly used on transit and rail tickets',
    sampleValue: 'TKT-AZ-99201-GATE4',
  },
];

export function getBarcodeFormatSpec(format?: BarcodeFormat): BarcodeSymbologySpec {
  return BARCODE_FORMATS.find((item) => item.id === format) || BARCODE_FORMATS[0];
}

export function getBarcodeFormatLabel(format?: BarcodeFormat): string {
  return getBarcodeFormatSpec(format).label;
}

/**
 * Returns the full list of expo-camera / react-native-camera barcode type identifiers.
 */
export function getExpoBarcodeTypes(): string[] {
  const types = BARCODE_FORMATS.map((f) => f.expoType);
  if (!types.includes('upc_e')) {
    types.push('upc_e');
  }
  return types;
}

/**
 * Maps an expo-camera / native barcode scanner type string to canonical BarcodeFormat.
 */
export function mapExpoBarcodeType(expoType: string | undefined | null): BarcodeFormat {
  const normalized = (expoType || '').trim().toLowerCase();
  if (!normalized) return 'QR_CODE';

  if (normalized === 'upc_e' || normalized === 'upce') {
    return 'UPC_A';
  }
  if (normalized === 'itf' || normalized === 'interleaved2of5' || normalized === 'itf14') {
    return 'ITF';
  }
  if (normalized === 'qr_code' || normalized === 'org.iso.qrcode') {
    return 'QR_CODE';
  }
  if (normalized === 'code_128' || normalized === 'org.iso.code128') {
    return 'CODE_128';
  }
  if (normalized === 'code_39' || normalized === 'org.iso.code39') {
    return 'CODE_39';
  }
  if (normalized === 'ean_13' || normalized === 'org.gs1.ean-13') {
    return 'EAN_13';
  }
  if (normalized === 'ean_8' || normalized === 'org.gs1.ean-8') {
    return 'EAN_8';
  }
  if (normalized === 'upc_a' || normalized === 'org.gs1.upc-a') {
    return 'UPC_A';
  }
  if (normalized === 'pdf_417' || normalized === 'org.iso.pdf417') {
    return 'PDF_417';
  }
  if (normalized === 'data_matrix' || normalized === 'org.iso.datamatrix') {
    return 'DATA_MATRIX';
  }
  if (normalized === 'aztec' || normalized === 'org.iso.aztec') {
    return 'AZTEC';
  }

  const matched = BARCODE_FORMATS.find(
    (f) => f.expoType.toLowerCase() === normalized || f.id.toLowerCase() === normalized
  );
  return matched ? matched.id : 'QR_CODE';
}

/**
 * Builds canonical bwip-js render options shared between Web HTMLCanvas and React Native SVG.
 * Intentionally omits `height` unless required so bwip-js never sees `height: undefined`.
 */
export function buildBwipRenderOptions(params: {
  payload: string;
  format: BarcodeFormat;
  fgColor: string;
  bgColor: string;
}): BwipRenderOptions {
  const { payload, format, fgColor, bgColor } = params;
  const spec = getBarcodeFormatSpec(format);
  const barcolor = normalizeHexForBwip(fgColor, '000000');
  const backgroundcolor = normalizeHexForBwip(bgColor, 'ffffff');
  const is1D = spec.dimension === '1d';
  const isGs1 = format === 'EAN_13' || format === 'EAN_8' || format === 'UPC_A';

  const opts: BwipRenderOptions = {
    bcid: spec.bwipBcid,
    text: payload,
    scale: format === 'QR_CODE' ? 5 : is1D ? 3 : 4,
    includetext: is1D,
    textcolor: barcolor,
    barcolor,
    backgroundcolor,
    paddingwidth: 8,
    paddingheight: 8,
  };

  if (is1D) {
    opts.height = 14;
    if (!isGs1) {
      opts.textxalign = 'center';
    }
  } else if (format === 'PDF_417') {
    opts.height = 12;
  }

  return opts;
}
