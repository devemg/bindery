import type { EpubError } from '../../../lib/epub/errors';
import type { EpubArchive } from '../../../lib/epub/readEpub';
import type { BookMetadata, Fit, MetadataField, ReadingDirection } from '../../../lib/epub/types';

export type Step = 0 | 1 | 2 | 3;

export const STEP_NAMES = ['Upload', 'Portrait', 'Record', 'Bind'] as const;
export const LAST_STEP = 3 satisfies Step;

/**
 * The bind button is a four-state machine, not a boolean. `building` carries
 * its own progress and `error` carries the typed failure, so the button and
 * the note beside it can never disagree about what happened.
 */
export type BuildState =
  | { kind: 'idle' }
  | { kind: 'building'; progress: number }
  | { kind: 'done'; filename: string }
  | { kind: 'error'; error: EpubError };

export interface BinderyState {
  step: Step;

  /** The book. `archive` is null until the file has been unzipped and read. */
  epubName: string;
  epubSize: number;
  archive: EpubArchive | null;
  loadError: EpubError | null;
  isReading: boolean;

  /**
   * The portrait. `coverUrl` and the dimensions arrive together once the
   * browser has decoded the image — before that there is a file but nothing to
   * show, which is exactly what the design specifies.
   */
  coverFile: File | null;
  coverUrl: string;
  coverW: number;
  coverH: number;
  coverName: string;

  fit: Fit;
  rtl: boolean;
  showMore: boolean;
  build: BuildState;
  meta: BookMetadata;
}

export type BinderyAction =
  | { type: 'step/goto'; step: Step }
  | { type: 'step/back' }
  | { type: 'step/forward' }
  | { type: 'wizard/reset'; defaultFit: Fit }
  | { type: 'epub/reading'; name: string; size: number }
  | {
      type: 'epub/read';
      archive: EpubArchive;
      meta: BookMetadata;
      direction: ReadingDirection;
    }
  | { type: 'epub/failed'; error: EpubError }
  | { type: 'cover/selected'; file: File; name: string }
  | { type: 'cover/measured'; url: string; width: number; height: number }
  | { type: 'cover/failed'; error: EpubError }
  | { type: 'meta/changed'; field: MetadataField; value: string }
  | { type: 'fit/changed'; fit: Fit }
  | { type: 'direction/changed'; direction: ReadingDirection }
  | { type: 'disclosure/toggled' }
  | { type: 'build/started' }
  | { type: 'build/progressed'; progress: number }
  | { type: 'build/finished'; filename: string }
  | { type: 'build/failed'; error: EpubError };

/** Behaviour the handoff exposes as configurable. */
export interface BinderySettings {
  readonly showKindlePreview: boolean;
  readonly defaultFit: Fit;
  /** Natural width, in px, below which the low-resolution notice appears. */
  readonly lowResThreshold: number;
}

export const DEFAULT_SETTINGS: BinderySettings = {
  showKindlePreview: true,
  defaultFit: 'crop',
  lowResThreshold: 1600,
};
