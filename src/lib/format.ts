const MIB = 1024 * 1024;

/**
 * The handoff's rule, exactly: over one mebibyte reads as one decimal place of
 * "MB", anything smaller rounds to whole "KB" and never shows zero.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes > MIB) return `${(bytes / MIB).toFixed(1)} MB`;
  return `${String(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

/**
 * Turns a title into the download's file name. Punctuation is dropped, runs of
 * whitespace become single hyphens, and a title made entirely of punctuation
 * falls back to `book`.
 */
export function slugify(title: string): string {
  const slug = title
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
  return slug || 'book';
}

export function outputFilename(title: string): string {
  return `${slugify(title)}.epub`;
}
