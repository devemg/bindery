import { useEffect, useState } from 'react';

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

export type ImageMeasurement =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; dimensions: Dimensions }
  | { status: 'failed' };

/**
 * The image's natural size, which is what decides whether the low-resolution
 * notice appears. Measured by letting the browser decode it — the same thing
 * the preview is about to do, so it is already in the cache when it renders.
 */
export function useImageDimensions(url: string | null): ImageMeasurement {
  const [measurement, setMeasurement] = useState<ImageMeasurement>({ status: 'idle' });

  useEffect(() => {
    if (!url) {
      setMeasurement({ status: 'idle' });
      return;
    }

    let live = true;
    setMeasurement({ status: 'loading' });

    const image = new Image();
    image.onload = () => {
      if (!live) return;
      setMeasurement({
        status: 'ready',
        dimensions: { width: image.naturalWidth, height: image.naturalHeight },
      });
    };
    image.onerror = () => {
      if (live) setMeasurement({ status: 'failed' });
    };
    image.src = url;

    return () => {
      live = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [url]);

  return measurement;
}
