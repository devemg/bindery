/**
 * Every way rebinding can fail, named. The UI switches on `code` to decide what
 * to say, so a new failure mode is a compile error at the call site rather than
 * a string that silently reaches the user.
 */
export type EpubErrorCode =
  | 'file-too-large'
  | 'unsupported-zip'
  | 'missing-container'
  | 'missing-opf'
  | 'invalid-opf'
  | 'drm-protected'
  | 'image-decode-failed'
  | 'repack-failed';

export interface EpubErrorOptions {
  readonly cause?: unknown;
  /** Interpolated into the message — a file name, a byte count, a zip path. */
  readonly detail?: string;
}

export class EpubError extends Error {
  readonly code: EpubErrorCode;
  readonly detail: string | undefined;

  constructor(code: EpubErrorCode, options: EpubErrorOptions = {}) {
    super(MESSAGES[code], options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'EpubError';
    this.code = code;
    this.detail = options.detail;
  }
}

/**
 * Reader-facing copy, in the voice of the rest of the tool: say what happened
 * and what the reader can do, never what threw.
 */
const MESSAGES: Record<EpubErrorCode, string> = {
  'file-too-large': 'That file is over the 200 MB this tool accepts.',
  'unsupported-zip':
    'This file could not be opened as an EPUB. An EPUB is a zip archive — this one is not, or it is damaged.',
  'missing-container':
    'This EPUB has no META-INF/container.xml, so there is no way to find the book inside it.',
  'missing-opf': 'This EPUB names a package file that is not in the archive.',
  'invalid-opf': 'The package file inside this EPUB is not valid XML and cannot be rewritten.',
  'drm-protected':
    'This EPUB is encrypted with DRM. Bindery can only rebind files it is allowed to open.',
  'image-decode-failed': 'That image could not be read. Try a JPEG or PNG.',
  'repack-failed': 'The rebound file could not be written.',
};

export function isEpubError(value: unknown): value is EpubError {
  return value instanceof EpubError;
}

/**
 * Narrows anything thrown into an `EpubError`. Used at the boundaries of the
 * pipeline so nothing reaches the UI as a bare `unknown`.
 */
export function asEpubError(value: unknown, fallback: EpubErrorCode): EpubError {
  return isEpubError(value) ? value : new EpubError(fallback, { cause: value });
}
