import type { BookMetadata } from './types';

/**
 * The handoff's filename heuristic, kept as a *fallback only*: it runs when the
 * OPF inside the book yields no title at all. A real record always wins over a
 * guess made from `Author - Title 3.epub`.
 */
export function metadataFromFilename(filename: string, base: BookMetadata): BookMetadata {
  const stem = filename.replace(/\.epub$/i, '').replace(/_/g, ' ');

  const parts = stem.split(/\s+-\s+/);
  const hasAuthor = parts.length > 1;
  const author = hasAuthor ? (parts[0] ?? '').trim() : '';
  const title = (hasAuthor ? parts.slice(1).join(' - ') : stem).trim();

  const next: BookMetadata = {
    ...base,
    title: title || stem,
    author: base.author || author || 'Unknown author',
    language: base.language || 'en',
  };

  // A trailing small number reads as a position in a series, not part of the
  // title — "Aubrey-Maturin 3", but never "1984".
  const numbered = /^(.*?)\s+(\d+)$/.exec(next.title);
  if (numbered && !base.series && Number(numbered[2]) < 40) {
    return { ...next, series: (numbered[1] ?? '').trim(), seriesNo: numbered[2] ?? '' };
  }
  return next;
}
