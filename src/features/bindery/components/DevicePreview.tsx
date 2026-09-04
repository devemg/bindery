import { cx } from '../../../lib/cx';
import type { Fit } from '../../../lib/epub/types';

interface DevicePreviewProps {
  readonly coverUrl: string;
  readonly fit: Fit;
}

/**
 * The Kindle in the margin: a heavier chin below the screen, a hairline edge
 * and ambient shadow. The preview uses the same `cover` / `contain` split the
 * resampler uses, so what is on screen is what gets written into the file.
 */
export function DevicePreview({ coverUrl, fit }: DevicePreviewProps) {
  return (
    <div className="device-preview flex flex-col items-center gap-12">
      <div className="device-preview-shell rounded-shell bg-shell p-16 pb-34 shadow-md">
        <div className="device-preview-screen flex h-378 w-236 items-center justify-center overflow-hidden rounded-screen-lg bg-screen">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover preview"
              className={cx('h-full w-full', fit === 'crop' ? 'object-cover' : 'object-contain')}
            />
          ) : (
            <span className="plate tracking-wide">No portrait yet</span>
          )}
        </div>
      </div>
      <span className="plate tracking-wide">Kindle preview</span>
    </div>
  );
}
