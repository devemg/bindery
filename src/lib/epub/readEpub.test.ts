import { describe, expect, it } from 'vitest';
import { isEpubError } from './errors';
import {
  buildBrokenOpfFixture,
  buildEncryptedFixture,
  buildEpub2Fixture,
  buildEpub3Fixture,
  buildMissingContainerFixture,
  buildObfuscatedFontsFixture,
} from './__fixtures__/epubs';
import { parseOpf } from './parseOpf';
import { readEpub } from './readEpub';
import { MAX_EPUB_BYTES } from './types';

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'no-error';
  } catch (error) {
    return isEpubError(error) ? error.code : `unexpected: ${String(error)}`;
  }
}

describe('readEpub', () => {
  it('finds the OPF through META-INF/container.xml', async () => {
    const archive = await readEpub(buildEpub2Fixture());
    expect(archive.opfPath).toBe('OEBPS/content.opf');
    expect(archive.opfXml).toContain('<dc:title>Master and Commander</dc:title>');
  });

  it('keeps every entry, in the order the archive stored them', async () => {
    const archive = await readEpub(buildEpub2Fixture());
    expect([...archive.entries.keys()]).toEqual([
      'mimetype',
      'META-INF/container.xml',
      'OEBPS/content.opf',
      'OEBPS/toc.ncx',
      'OEBPS/cover.xhtml',
      'OEBPS/chapter1.xhtml',
      'OEBPS/images/cover.png',
      'OEBPS/styles/book.css',
    ]);
  });

  it('reads an EPUB 3 the same way', async () => {
    const archive = await readEpub(buildEpub3Fixture());
    expect(parseOpf(archive.opfXml).document.version).toBe('3.0');
  });

  it('reports a file that is not a zip', async () => {
    const notAZip = new TextEncoder().encode('This is a plain text file, not an EPUB.');
    expect(await codeOf(readEpub(notAZip))).toBe('unsupported-zip');
  });

  it('reports a missing container', async () => {
    expect(await codeOf(readEpub(buildMissingContainerFixture()))).toBe('missing-container');
  });

  it('reports an unparseable OPF when it is read', async () => {
    const archive = await readEpub(buildBrokenOpfFixture());
    expect(() => parseOpf(archive.opfXml)).toThrowError(/valid XML/);
  });

  it('refuses a DRM-encrypted book', async () => {
    expect(await codeOf(readEpub(buildEncryptedFixture()))).toBe('drm-protected');
  });

  it('accepts obfuscated fonts, which are not DRM', async () => {
    const archive = await readEpub(buildObfuscatedFontsFixture());
    expect(archive.opfPath).toBe('OEBPS/content.opf');
  });

  it('refuses a file over the stated ceiling before trying to unzip it', async () => {
    const oversized = new Uint8Array(MAX_EPUB_BYTES + 1);
    expect(await codeOf(readEpub(oversized))).toBe('file-too-large');
  });
});
