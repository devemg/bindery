import type { Fit } from '../epub/types';

/** A `drawImage` call, split into its source rectangle and its destination. */
export interface DrawRect {
  readonly sx: number;
  readonly sy: number;
  readonly sw: number;
  readonly sh: number;
  readonly dx: number;
  readonly dy: number;
  readonly dw: number;
  readonly dh: number;
}

/**
 * Where the source image lands on the Kindle canvas.
 *
 * `crop` scales to cover and takes a centred slice of the source, so the canvas
 * is filled edge to edge and the overflow is discarded. `pad` scales to fit and
 * centres the whole image, leaving bars the caller fills. Both are centred, and
 * both return integers — a fractional source rectangle makes the browser
 * resample against a half-pixel grid and softens the result.
 */
export function computeDrawRect(
  fit: Fit,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): DrawRect {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return { sx: 0, sy: 0, sw: 0, sh: 0, dx: 0, dy: 0, dw: 0, dh: 0 };
  }

  if (fit === 'crop') {
    const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const sw = Math.min(sourceWidth, Math.round(targetWidth / scale));
    const sh = Math.min(sourceHeight, Math.round(targetHeight / scale));
    return {
      sx: Math.round((sourceWidth - sw) / 2),
      sy: Math.round((sourceHeight - sh) / 2),
      sw,
      sh,
      dx: 0,
      dy: 0,
      dw: targetWidth,
      dh: targetHeight,
    };
  }

  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const dw = Math.round(sourceWidth * scale);
  const dh = Math.round(sourceHeight * scale);
  return {
    sx: 0,
    sy: 0,
    sw: sourceWidth,
    sh: sourceHeight,
    dx: Math.round((targetWidth - dw) / 2),
    dy: Math.round((targetHeight - dh) / 2),
    dw,
    dh,
  };
}

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * The average colour of a bitmap's outermost ring of pixels, used to pad a
 * letterboxed cover with something drawn from the jacket rather than a black
 * bar. `pixels` is RGBA, row-major — an `ImageData.data`.
 */
export function averageEdgeColor(
  pixels: ArrayLike<number>,
  width: number,
  height: number,
): Rgb | undefined {
  if (width <= 0 || height <= 0 || pixels.length < width * height * 4) return undefined;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const onEdge = x === 0 || y === 0 || x === width - 1 || y === height - 1;
      if (!onEdge) continue;
      const offset = (y * width + x) * 4;
      r += pixels[offset] ?? 0;
      g += pixels[offset + 1] ?? 0;
      b += pixels[offset + 2] ?? 0;
      count += 1;
    }
  }

  if (count === 0) return undefined;
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

export function toCssColor({ r, g, b }: Rgb): string {
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}
