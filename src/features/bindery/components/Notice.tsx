import { WarningCircleIcon } from './icons';

interface NoticeProps {
  readonly children: string;
  /**
   * Announce the notice as it appears. On for the things that arrive without
   * the reader asking — the low-resolution warning, a failed read.
   */
  readonly live?: boolean;
}

/**
 * The design's one alert treatment: the deepest accent as a ground, a solid
 * accent edge on the leading side, and a warning glyph. Used for the
 * low-resolution notice and for every typed failure the engine reports.
 */
export function Notice({ children, live = true }: NoticeProps) {
  return (
    <div
      role={live ? 'status' : undefined}
      aria-live={live ? 'polite' : undefined}
      className="flex gap-11 rounded-md border-l-2 border-accent bg-accent-900 px-15 py-13"
    >
      <WarningCircleIcon size={18} className="mt-px flex-none text-accent-400" />
      <span className="text-pretty text-prose text-accent-300">{children}</span>
    </div>
  );
}
