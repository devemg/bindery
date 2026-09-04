import { EpubError } from '../epub/errors';
import { type Fit, KINDLE_COVER_HEIGHT, KINDLE_COVER_WIDTH } from '../epub/types';
import { averageEdgeColor, computeDrawRect, toCssColor } from './geometry';

/**
 * The ground behind a letterboxed cover when the image's own edges cannot be
 * sampled. Same value as the device screen in the design — a near-black that
 * reads as the frame rather than as part of the jacket.
 */
const PAD_FALLBACK = '#0d0907';

const JPEG_QUALITY = 0.9;
const EDGE_SAMPLE = 8;

export interface ResampledCover {
  readonly blob: Blob;
  readonly mediaType: 'image/jpeg';
  readonly width: number;
  readonly height: number;
}

/**
 * Redraws a cover at Kindle's 1600 x 2560 and encodes it as JPEG.
 *
 * Always exactly that size, whatever came in: Kindle wants a predictable
 * canvas, and an image smaller than the target is upscaled rather than
 * letterboxed by accident — the UI warns about that separately.
 */
export async function resampleCover(
  source: Blob,
  fit: Fit,
  width = KINDLE_COVER_WIDTH,
  height = KINDLE_COVER_HEIGHT,
): Promise<ResampledCover> {
  const bitmap = await decode(source);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new EpubError('image-decode-failed', { detail: 'no 2d context' });

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    if (fit === 'pad') {
      context.fillStyle = samplePadColor(bitmap) ?? PAD_FALLBACK;
      context.fillRect(0, 0, width, height);
    }

    const rect = computeDrawRect(fit, bitmap.width, bitmap.height, width, height);
    context.drawImage(
      bitmap,
      rect.sx,
      rect.sy,
      rect.sw,
      rect.sh,
      rect.dx,
      rect.dy,
      rect.dw,
      rect.dh,
    );

    const blob = await toJpeg(canvas);
    return { blob, mediaType: 'image/jpeg', width, height };
  } finally {
    bitmap.close();
  }
}

async function decode(source: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source);
  } catch (cause) {
    throw new EpubError('image-decode-failed', { cause });
  }
}

/**
 * Averages the outermost ring of an 8 x 8 render of the cover. Most jackets
 * have a consistent border, so the bars read as part of the artwork.
 */
function samplePadColor(bitmap: ImageBitmap): string | undefined {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = EDGE_SAMPLE;
    canvas.height = EDGE_SAMPLE;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return undefined;

    context.drawImage(bitmap, 0, 0, EDGE_SAMPLE, EDGE_SAMPLE);
    const { data } = context.getImageData(0, 0, EDGE_SAMPLE, EDGE_SAMPLE);
    const colour = averageEdgeColor(data, EDGE_SAMPLE, EDGE_SAMPLE);
    return colour ? toCssColor(colour) : undefined;
  } catch {
    // Sampling is a nicety; the fallback ground is always available.
    return undefined;
  }
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new EpubError('image-decode-failed', { detail: 'canvas produced no blob' }));
      },
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}
