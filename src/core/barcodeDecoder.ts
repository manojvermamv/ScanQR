/**
 * Multi-format barcode & QR decoder for live video frames and cropped gallery images.
 * Uses @zxing/library MultiFormatReader with jsQR fallback.
 */

import {
  BarcodeFormat as ZXingFormat,
  BinaryBitmap,
  DecodeHintType,
  HTMLCanvasElementLuminanceSource,
  HybridBinarizer,
  MultiFormatReader,
} from '@zxing/library';
import jsQR from 'jsqr';
import { BarcodeFormat } from './types.ts';

export interface DecodedBarcodeResult {
  text: string;
  format: BarcodeFormat;
}

const SUPPORTED_ZXING_FORMATS = [
  ZXingFormat.QR_CODE,
  ZXingFormat.CODE_128,
  ZXingFormat.CODE_39,
  ZXingFormat.EAN_13,
  ZXingFormat.EAN_8,
  ZXingFormat.UPC_A,
  ZXingFormat.UPC_E,
  ZXingFormat.ITF,
  ZXingFormat.CODABAR,
  ZXingFormat.PDF_417,
  ZXingFormat.DATA_MATRIX,
  ZXingFormat.AZTEC,
];

function createReader(): MultiFormatReader {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, SUPPORTED_ZXING_FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);

  const reader = new MultiFormatReader();
  reader.setHints(hints);
  return reader;
}

export function mapZxingFormat(format: ZXingFormat): BarcodeFormat {
  switch (format) {
    case ZXingFormat.QR_CODE:
      return 'QR_CODE';
    case ZXingFormat.CODE_128:
      return 'CODE_128';
    case ZXingFormat.CODE_39:
      return 'CODE_39';
    case ZXingFormat.EAN_13:
      return 'EAN_13';
    case ZXingFormat.EAN_8:
      return 'EAN_8';
    case ZXingFormat.UPC_A:
    case ZXingFormat.UPC_E:
      return 'UPC_A';
    case ZXingFormat.ITF:
      return 'ITF';
    case ZXingFormat.CODABAR:
      return 'CODABAR';
    case ZXingFormat.PDF_417:
      return 'PDF_417';
    case ZXingFormat.DATA_MATRIX:
      return 'DATA_MATRIX';
    case ZXingFormat.AZTEC:
      return 'AZTEC';
    default:
      return 'QR_CODE';
  }
}

/**
 * Decodes QR codes and 1D/2D barcodes from a canvas element.
 * Tries normal polarity, inverted polarity, and jsQR fallback.
 */
export function decodeBarcodeFromCanvas(
  canvas: HTMLCanvasElement,
  tryInverted = true
): DecodedBarcodeResult | null {
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    return null;
  }

  const reader = createReader();

  try {
    const source = new HTMLCanvasElementLuminanceSource(canvas);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const result = reader.decodeWithState(bitmap);
    const text = result.getText();
    if (text) {
      return {
        text,
        format: mapZxingFormat(result.getBarcodeFormat()),
      };
    }
  } catch {
    // Continue to inverted / fallback checks
  } finally {
    reader.reset();
  }

  if (tryInverted) {
    try {
      const invertedSource = new HTMLCanvasElementLuminanceSource(canvas).invert();
      const bitmap = new BinaryBitmap(new HybridBinarizer(invertedSource));
      const result = reader.decodeWithState(bitmap);
      const text = result.getText();
      if (text) {
        return {
          text,
          format: mapZxingFormat(result.getBarcodeFormat()),
        };
      }
    } catch {
      // Continue to jsQR fallback
    } finally {
      reader.reset();
    }
  }

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });
      if (qr && qr.data) {
        return {
          text: qr.data,
          format: 'QR_CODE',
        };
      }
    }
  } catch {
    // No code detected
  }

  return null;
}
