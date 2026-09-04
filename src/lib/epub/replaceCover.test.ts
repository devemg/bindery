import { describe, expect, it } from 'vitest';
import { EPUB2_OPF, EPUB3_OPF } from './__fixtures__/epubs';
import { parseOpf } from './parseOpf';
import { findCoverItem, manifestItems, replaceCover } from './replaceCover';
import { buildXml, getAttribute } from './xml';

const OPF_PATH = 'OEBPS/content.opf';

describe('replaceCover — a book that already has a cover', () => {
  it('keeps the href and id, so every reference to the cover still resolves', () => {
    const { document } = parseOpf(EPUB2_OPF);
    const placement = replaceCover(document, OPF_PATH);

    expect(placement.created).toBe(false);
    expect(placement.itemId).toBe('cover-image');
    expect(placement.zipPath).toBe('OEBPS/images/cover.png');

    const item = manifestItems(document).find((node) => getAttribute(node, 'id') === 'cover-image');
    expect(getAttribute(item ?? {}, 'href')).toBe('images/cover.png');
  });

  it('corrects the media type, which is what EPUB actually reads', () => {
    const { document } = parseOpf(EPUB2_OPF);
    replaceCover(document, OPF_PATH);

    const item = manifestItems(document).find((node) => getAttribute(node, 'id') === 'cover-image');
    expect(getAttribute(item ?? {}, 'media-type')).toBe('image/jpeg');
  });

  it('follows the EPUB 3 cover-image property', () => {
    const { document } = parseOpf(EPUB3_OPF);
    const placement = replaceCover(document, OPF_PATH);

    expect(placement.itemId).toBe('coverimg');
    expect(placement.zipPath).toBe('OEBPS/images/jacket.jpeg');
  });

  it('adds the legacy meta an older Kindle needs', () => {
    const { document } = parseOpf(EPUB3_OPF);
    replaceCover(document, OPF_PATH);
    expect(document.nodes.length).toBeGreaterThan(0);

    const reparsed = parseOpf(rewrite(document));
    const cover = findCoverItem(reparsed.document, manifestItems(reparsed.document));
    expect(getAttribute(cover ?? {}, 'id')).toBe('coverimg');
    expect(rewrite(document)).toContain('name="cover"');
  });

  it('leaves the rest of the manifest alone', () => {
    const { document } = parseOpf(EPUB3_OPF);
    const before = manifestItems(document).map((node) => getAttribute(node, 'href'));
    replaceCover(document, OPF_PATH);
    expect(manifestItems(document).map((node) => getAttribute(node, 'href'))).toEqual(before);
  });

  it('does not leave two items claiming to be the cover', () => {
    const twoClaims = EPUB3_OPF.replace(
      '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
      '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav cover-image"/>',
    );
    const { document } = parseOpf(twoClaims);
    replaceCover(document, OPF_PATH);

    const claimants = manifestItems(document).filter((node) =>
      (getAttribute(node, 'properties') ?? '').split(/\s+/).includes('cover-image'),
    );
    expect(claimants).toHaveLength(1);
    // The unrelated `nav` property survives the surgery.
    const nav = manifestItems(document).find((node) => getAttribute(node, 'id') === 'nav');
    expect(getAttribute(nav ?? {}, 'properties')).toBe('nav');
  });
});

describe('replaceCover — a book with no cover', () => {
  const coverless = EPUB3_OPF.replace(
    '<item id="coverimg" href="images/jacket.jpeg" media-type="image/jpeg" properties="cover-image"/>\n    ',
    '',
  );

  it('adds a manifest item beside the OPF', () => {
    const { document } = parseOpf(coverless);
    const placement = replaceCover(document, OPF_PATH);

    expect(placement.created).toBe(true);
    expect(placement.zipPath).toBe('OEBPS/bindery-cover.jpg');
  });

  it('declares the new cover both ways', () => {
    const { document } = parseOpf(coverless);
    replaceCover(document, OPF_PATH);
    const out = rewrite(document);

    expect(out).toContain('properties="cover-image"');
    expect(out).toContain('<meta name="cover" content="bindery-cover-image"/>');
  });

  it('omits the EPUB 3 property on an EPUB 2 package, where it is not legal', () => {
    const epub2Coverless = EPUB2_OPF.replace(
      '<item id="cover-image" href="images/cover.png" media-type="image/png"/>\n    ',
      '',
    ).replace('<meta name="cover" content="cover-image"/>\n    ', '');

    const { document } = parseOpf(epub2Coverless);
    replaceCover(document, OPF_PATH);
    const out = rewrite(document);

    expect(out).not.toContain('properties="cover-image"');
    expect(out).toContain('<meta name="cover" content="bindery-cover-image"/>');
  });

  it('does not collide with an existing item of the same name', () => {
    const taken = coverless.replace(
      '<item id="nav"',
      '<item id="bindery-cover-image" href="bindery-cover.jpg" media-type="text/plain"/>\n    <item id="nav"',
    );
    const { document } = parseOpf(taken);
    const placement = replaceCover(document, OPF_PATH);

    expect(placement.itemId).toBe('bindery-cover-image-2');
    expect(placement.zipPath).toBe('OEBPS/bindery-cover-2.jpg');
  });
});

describe('findCoverItem', () => {
  it('ignores a legacy meta that points at something which is not an image', () => {
    const misdirected = EPUB2_OPF.replace(
      '<meta name="cover" content="cover-image"/>',
      '<meta name="cover" content="chapter1"/>',
    );
    const { document } = parseOpf(misdirected);
    const cover = findCoverItem(document, manifestItems(document));
    // Falls through to the item that names itself a cover.
    expect(getAttribute(cover ?? {}, 'id')).toBe('cover-image');
  });

  it('finds an image that merely calls itself a cover', () => {
    const noPointers = EPUB2_OPF.replace('<meta name="cover" content="cover-image"/>\n    ', '');
    const { document } = parseOpf(noPointers);
    expect(getAttribute(findCoverItem(document, manifestItems(document)) ?? {}, 'href')).toBe(
      'images/cover.png',
    );
  });
});

/** Serialises the mutated document without touching the record. */
function rewrite(document: ReturnType<typeof parseOpf>['document']): string {
  return buildXml(document.nodes);
}
