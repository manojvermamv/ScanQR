/**
 * Pure React Native / Hermes barcode & QR SVG generator powered by @scanqr/core + bwip-js.
 * Produces scannable vector XML ready for react-native-svg <SvgXml /> without any HTML Canvas or DOM.
 */

import bwipjs from 'bwip-js';
import {
  buildBwipRenderOptions,
  type BarcodeFormat,
} from '../../packages/scanqr-core/src/index';

export interface GeneratedSvgBarcode {
  svgXml: string;
  width: number;
  height: number;
}

export function generateBarcodeSvg(params: {
  payload: string;
  format: BarcodeFormat;
  fgColor: string;
  bgColor: string;
}): GeneratedSvgBarcode {
  const options = buildBwipRenderOptions(params);
  const svgXml = bwipjs.toSVG(options as bwipjs.RenderOptions).trim();

  const viewBoxMatch = svgXml.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/i);
  const width = viewBoxMatch ? parseFloat(viewBoxMatch[1]) : 200;
  const height = viewBoxMatch ? parseFloat(viewBoxMatch[2]) : 200;

  return { svgXml, width, height };
}
