import { describe, expect, it } from 'vitest';
import { KINDLE_COVER_HEIGHT, KINDLE_COVER_WIDTH } from '../epub/types';
import { averageEdgeColor, computeDrawRect, toCssColor } from './geometry';

const W = KINDLE_COVER_WIDTH;
const H = KINDLE_COVER_HEIGHT;
/** The Kindle canvas is 0.625:1 — taller than most photographs. */
const TARGET_RATIO = W / H;

describe('computeDrawRect — crop to fill', () => {
  it('fills the canvas exactly, whatever comes in', () => {
    for (const [sw, sh] of [
      [800, 600],
      [1600, 2560],
      [4000, 3000],
      [500, 4000],
    ] as const) {
      const rect = computeDrawRect('crop', sw, sh, W, H);
      expect([rect.dx, rect.dy, rect.dw, rect.dh]).toEqual([0, 0, W, H]);
    }
  });

  it('takes a centred slice at the target aspect ratio from a wide image', () => {
    const rect = computeDrawRect('crop', 4000, 3000, W, H);
    // Height is the binding dimension: the full 3000 is used, width is cropped.
    expect(rect.sh).toBe(3000);
    expect(rect.sw).toBe(Math.round(3000 * TARGET_RATIO));
    expect(rect.sx).toBe(Math.round((4000 - rect.sw) / 2));
    expect(rect.sy).toBe(0);
  });

  it('takes a centred slice from a tall image', () => {
    const rect = computeDrawRect('crop', 1000, 4000, W, H);
    expect(rect.sw).toBe(1000);
    expect(rect.sh).toBe(Math.round(1000 / TARGET_RATIO));
    expect(rect.sx).toBe(0);
    expect(rect.sy).toBe(Math.round((4000 - rect.sh) / 2));
  });

  it('crops nothing when the source is already the target ratio', () => {
    const rect = computeDrawRect('crop', 800, 1280, W, H);
    expect([rect.sx, rect.sy, rect.sw, rect.sh]).toEqual([0, 0, 800, 1280]);
  });

  it('never reads outside the source', () => {
    const rect = computeDrawRect('crop', 123, 457, W, H);
    expect(rect.sx + rect.sw).toBeLessThanOrEqual(123);
    expect(rect.sy + rect.sh).toBeLessThanOrEqual(457);
  });
});

describe('computeDrawRect — fit whole, pad edges', () => {
  it('draws the whole source', () => {
    const rect = computeDrawRect('pad', 4000, 3000, W, H);
    expect([rect.sx, rect.sy, rect.sw, rect.sh]).toEqual([0, 0, 4000, 3000]);
  });

  it('centres a wide image with bars above and below', () => {
    const rect = computeDrawRect('pad', 4000, 3000, W, H);
    expect(rect.dw).toBe(W);
    expect(rect.dh).toBe(Math.round((3000 / 4000) * W));
    expect(rect.dx).toBe(0);
    expect(rect.dy).toBe(Math.round((H - rect.dh) / 2));
  });

  it('centres a tall image with bars left and right', () => {
    const rect = computeDrawRect('pad', 1000, 4000, W, H);
    expect(rect.dh).toBe(H);
    expect(rect.dw).toBe(Math.round((1000 / 4000) * H));
    expect(rect.dy).toBe(0);
    expect(rect.dx).toBe(Math.round((W - rect.dw) / 2));
  });

  it('keeps the source aspect ratio', () => {
    const rect = computeDrawRect('pad', 1234, 987, W, H);
    expect(rect.dw / rect.dh).toBeCloseTo(1234 / 987, 2);
  });

  it('never draws outside the canvas', () => {
    const rect = computeDrawRect('pad', 999, 111, W, H);
    expect(rect.dx).toBeGreaterThanOrEqual(0);
    expect(rect.dx + rect.dw).toBeLessThanOrEqual(W);
    expect(rect.dy + rect.dh).toBeLessThanOrEqual(H);
  });
});

describe('computeDrawRect — upscaling and degenerate input', () => {
  it('upscales a small cover to the full canvas rather than tiling it', () => {
    const crop = computeDrawRect('crop', 400, 640, W, H);
    expect([crop.dw, crop.dh]).toEqual([W, H]);
    const pad = computeDrawRect('pad', 400, 640, W, H);
    expect([pad.dw, pad.dh]).toEqual([W, H]);
  });

  it('returns an empty rectangle for a source with no area', () => {
    expect(computeDrawRect('crop', 0, 100, W, H).dw).toBe(0);
    expect(computeDrawRect('pad', 100, 0, W, H).dh).toBe(0);
  });
});

describe('averageEdgeColor', () => {
  const solid = (r: number, g: number, b: number, size: number): Uint8ClampedArray => {
    const data = new Uint8ClampedArray(size * size * 4);
    for (let i = 0; i < size * size; i += 1) {
      data.set([r, g, b, 255], i * 4);
    }
    return data;
  };

  it('reads a solid image as its own colour', () => {
    expect(averageEdgeColor(solid(180, 85, 63, 8), 8, 8)).toEqual({ r: 180, g: 85, b: 63 });
  });

  it('ignores the interior', () => {
    const data = solid(10, 20, 30, 4);
    // Repaint the two interior pixels of each interior row bright white.
    for (const [x, y] of [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
    ] as const) {
      data.set([255, 255, 255, 255], (y * 4 + x) * 4);
    }
    expect(averageEdgeColor(data, 4, 4)).toEqual({ r: 10, g: 20, b: 30 });
  });

  it('averages a two-tone border', () => {
    const data = solid(0, 0, 0, 3);
    // Top row white, rest black: 3 of the 8 edge pixels are white.
    for (let x = 0; x < 3; x += 1) data.set([255, 255, 255, 255], x * 4);
    expect(averageEdgeColor(data, 3, 3)).toEqual({ r: 96, g: 96, b: 96 });
  });

  it('gives up rather than guess on malformed input', () => {
    expect(averageEdgeColor(new Uint8ClampedArray(4), 8, 8)).toBeUndefined();
    expect(averageEdgeColor(new Uint8ClampedArray(0), 0, 0)).toBeUndefined();
  });

  it('formats as CSS', () => {
    expect(toCssColor({ r: 13, g: 9, b: 7 })).toBe('rgb(13, 9, 7)');
  });
});
