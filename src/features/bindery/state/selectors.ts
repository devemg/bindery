import { formatBytes, outputFilename } from '../../../lib/format';
import { KINDLE_COVER_HEIGHT, KINDLE_COVER_WIDTH } from '../../../lib/epub/types';
import type { BinderyState } from './types';

const EMPTY = '—';

/**
 * Step 1 is the only gate: there is nothing to rebind without a book. Every
 * other hint in the design is advisory, exactly as the handoff specifies.
 */
export function canContinue(state: BinderyState): boolean {
  return state.step === 0 ? state.archive !== null : true;
}

/** The advisory note beside the Continue button, empty once it is satisfied. */
export function hintFor(state: BinderyState): string {
  switch (state.step) {
    case 0:
      return state.archive ? '' : 'Choose an .epub to begin.';
    case 1:
      return state.coverFile ? '' : 'You can keep the original cover and move on.';
    case 2:
      return state.meta.title ? '' : 'A title is the one field Kindle really needs.';
    case 3:
      return '';
  }
}

export function outputName(state: BinderyState): string {
  return outputFilename(state.meta.title);
}

/** "1.4 MB · metadata prefilled" under the chosen file. */
export function epubSummaryLine(state: BinderyState): string {
  const size = formatBytes(state.epubSize);
  if (!size) return '';
  return state.meta.title ? `${size} · metadata prefilled` : size;
}

export function coverSourceLine(state: BinderyState): string {
  if (!state.coverUrl) return 'No image chosen — the cover already inside the EPUB is kept.';
  return `${state.coverName} · ${String(state.coverW)} × ${String(state.coverH)} px`;
}

/**
 * The upscaling warning. Empty unless there is a decoded image narrower than
 * the threshold, so the live region stays silent the rest of the time.
 */
export function lowResMessage(state: BinderyState, threshold: number): string {
  if (!state.coverUrl || state.coverW === 0 || state.coverW >= threshold) return '';
  return (
    `This image is ${String(state.coverW)} px wide — under the ${String(threshold)} px Kindle ` +
    'covers want. It will be upscaled, and text on the jacket may soften.'
  );
}

export interface SummaryRow {
  readonly label: string;
  readonly value: string;
}

export function summaryRows(state: BinderyState): SummaryRow[] {
  const { meta } = state;
  const target = `${String(KINDLE_COVER_WIDTH)} × ${String(KINDLE_COVER_HEIGHT)}`;

  return [
    { label: 'Title', value: meta.title || EMPTY },
    { label: 'Author', value: meta.author || EMPTY },
    {
      label: 'Series',
      value: meta.series ? `${meta.series}${meta.seriesNo ? ` #${meta.seriesNo}` : ''}` : EMPTY,
    },
    {
      label: 'Portrait',
      value: state.coverFile
        ? `Replaced · ${state.fit === 'crop' ? 'cropped' : 'padded'} to ${target}`
        : 'Kept from source file',
    },
    {
      label: 'Language',
      value: `${meta.language || 'en'}${state.rtl ? ' · right to left' : ''}`,
    },
    { label: 'Publisher', value: meta.publisher || EMPTY },
    { label: 'Published', value: meta.pubdate || EMPTY },
    { label: 'Identifier', value: meta.ident || EMPTY },
    { label: 'Tags', value: meta.tags || EMPTY },
    { label: 'Output', value: outputName(state) },
  ];
}

/** The label on the bind button, which is also its state readout. */
export function buildLabel(state: BinderyState): string {
  switch (state.build.kind) {
    case 'idle':
      return 'Bind and download';
    case 'building':
      return 'Binding…';
    case 'done':
      return 'Downloaded ✓';
    case 'error':
      return 'Try again';
  }
}

export function buildNote(state: BinderyState): string {
  switch (state.build.kind) {
    case 'done':
      return `Saved as ${state.build.filename} — send it to your Kindle.`;
    case 'error':
      return state.build.error.message;
    case 'idle':
    case 'building':
      return 'One file, written in your browser.';
  }
}
