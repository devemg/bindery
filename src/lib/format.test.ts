import { describe, expect, it } from 'vitest';
import { formatBytes, outputFilename, slugify } from './format';

describe('formatBytes', () => {
  it('shows one decimal of MB above a mebibyte', () => {
    expect(formatBytes(1_500_000)).toBe('1.4 MB');
    expect(formatBytes(42 * 1024 * 1024)).toBe('42.0 MB');
  });

  it('rounds to whole KB at or below a mebibyte', () => {
    expect(formatBytes(1024 * 1024)).toBe('1024 KB');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1600)).toBe('2 KB');
  });

  it('never reports a file as zero KB', () => {
    expect(formatBytes(1)).toBe('1 KB');
    expect(formatBytes(400)).toBe('1 KB');
  });

  it('reports nothing for a size that is not one', () => {
    expect(formatBytes(0)).toBe('');
    expect(formatBytes(-10)).toBe('');
    expect(formatBytes(Number.NaN)).toBe('');
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Master and Commander')).toBe('master-and-commander');
  });

  it('drops punctuation but keeps existing hyphens', () => {
    expect(slugify('H.M.S. Surprise — Book 3!')).toBe('hms-surprise-book-3');
    expect(slugify('Aubrey-Maturin')).toBe('aubrey-maturin');
  });

  it('collapses runs of whitespace', () => {
    expect(slugify('  The   Far  Side ')).toBe('the-far-side');
  });

  it('falls back to "book" when nothing survives', () => {
    expect(slugify('')).toBe('book');
    expect(slugify('!!! ??? ...')).toBe('book');
    expect(outputFilename('')).toBe('book.epub');
  });

  it('names the download after the title', () => {
    expect(outputFilename('The Far Side of the World')).toBe('the-far-side-of-the-world.epub');
  });
});
