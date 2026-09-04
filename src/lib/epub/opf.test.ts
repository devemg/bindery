import { describe, expect, it } from 'vitest';
import { EPUB2_OPF, EPUB3_OPF } from './__fixtures__/epubs';
import { isEpubError } from './errors';
import { parseOpf } from './parseOpf';
import type { BookMetadata } from './types';
import { writeOpf } from './writeOpf';
import { buildXml, childrenOf, findChild, isElement, parseXml, textOf } from './xml';

/** Re-serializes a named section so two OPFs can be compared structurally. */
function section(xml: string, name: 'manifest' | 'spine' | 'guide'): string {
  const packageNode = parseXml(xml).find((node) => isElement(node, 'package'));
  const found = packageNode ? findChild(packageNode, name) : undefined;
  return found ? buildXml([found]) : '';
}

/** The `detail` an `invalid-opf` carries, which is what names the real fault. */
function detailOf(xml: string): string {
  try {
    parseOpf(xml);
    return 'no error';
  } catch (error) {
    return isEpubError(error) ? (error.detail ?? '') : String(error);
  }
}

function metadataNodes(xml: string): { tag: string; text: string; attrs: string }[] {
  const packageNode = parseXml(xml).find((node) => isElement(node, 'package'));
  const metadata = packageNode ? findChild(packageNode, 'metadata') : undefined;
  return childrenOf(metadata ?? {}).map((node) => ({
    tag: Object.keys(node).filter((key) => key !== ':@')[0] ?? '',
    text: textOf(node),
    attrs: JSON.stringify(node[':@'] ?? {}),
  }));
}

describe('parseOpf — EPUB 2', () => {
  const parsed = parseOpf(EPUB2_OPF);

  it('reads the record from the OPF, not from the file name', () => {
    expect(parsed.metadata).toEqual<BookMetadata>({
      title: 'Master and Commander',
      author: "Patrick O'Brian",
      summary: 'Jack Aubrey is made master and commander of the sloop Sophie.',
      series: 'Aubrey-Maturin',
      seriesNo: '1',
      language: 'en',
      publisher: 'Collins',
      pubdate: '1969-10-01',
      ident: '9780393037012',
      tags: 'Naval fiction, Historical',
    });
  });

  it('prefers the publication date over the creation date', () => {
    expect(parsed.metadata.pubdate).toBe('1969-10-01');
  });

  it('shows the creator as written, and leaves its opf:file-as in place', () => {
    expect(parsed.metadata.author).toBe("Patrick O'Brian");
    const rewritten = writeOpf(parsed.document, parsed.metadata, parsed.direction);
    expect(rewritten).toContain('file-as="O&apos;Brian, Patrick"');
  });

  it('defaults to left-to-right when the spine says nothing', () => {
    expect(parsed.direction).toBe('ltr');
  });

  it('recognises the package version', () => {
    expect(parsed.document.version).toBe('2.0');
    expect(parsed.document.isEpub3).toBe(false);
  });
});

describe('parseOpf — EPUB 3', () => {
  const parsed = parseOpf(EPUB3_OPF);

  it('reads belongs-to-collection and its group-position refinement', () => {
    expect(parsed.metadata.series).toBe('Aubrey-Maturin');
    expect(parsed.metadata.seriesNo).toBe('10');
  });

  it('keeps the identifier verbatim, urn scheme and all', () => {
    expect(parsed.metadata.ident).toBe('urn:uuid:7f9b2c11-4a3e-4a9d-9a1e-0e2b6d5c8f10');
  });

  it('picks the identifier the package nominates as unique', () => {
    expect(parsed.document.uniqueIdentifierId).toBe('pub-id');
  });
});

describe('writeOpf — round trip', () => {
  it('leaves an unedited EPUB 2 functionally identical', () => {
    const { document, metadata, direction } = parseOpf(EPUB2_OPF);
    const rewritten = writeOpf(document, metadata, direction);

    expect(parseOpf(rewritten).metadata).toEqual(metadata);
    expect(metadataNodes(rewritten)).toEqual(metadataNodes(EPUB2_OPF));
    expect(section(rewritten, 'manifest')).toBe(section(EPUB2_OPF, 'manifest'));
    expect(section(rewritten, 'spine')).toBe(section(EPUB2_OPF, 'spine'));
    expect(section(rewritten, 'guide')).toBe(section(EPUB2_OPF, 'guide'));
  });

  it('leaves an unedited EPUB 3 functionally identical, bar the compatibility metas', () => {
    const { document, metadata, direction } = parseOpf(EPUB3_OPF);
    const rewritten = writeOpf(document, metadata, direction);

    expect(parseOpf(rewritten).metadata).toEqual(metadata);
    expect(section(rewritten, 'manifest')).toBe(section(EPUB3_OPF, 'manifest'));
    expect(section(rewritten, 'spine')).toBe(section(EPUB3_OPF, 'spine'));

    // Series is normalised to both conventions on purpose; nothing else moves.
    const added = metadataNodes(rewritten).filter(
      (node) =>
        !metadataNodes(EPUB3_OPF).some(
          (original) => JSON.stringify(original) === JSON.stringify(node),
        ),
    );
    expect(added.map((node) => node.attrs)).toEqual([
      JSON.stringify({ '@_name': 'calibre:series', '@_content': 'Aubrey-Maturin' }),
      JSON.stringify({ '@_name': 'calibre:series_index', '@_content': '10' }),
    ]);
  });

  it('carries unknown vendor metadata through untouched', () => {
    const { document, metadata, direction } = parseOpf(EPUB2_OPF);
    const rewritten = writeOpf(document, { ...metadata, title: 'Something else' }, direction);
    expect(rewritten).toContain('name="calibre:timestamp"');
    expect(rewritten).toContain('content="2011-04-02T00:00:00+00:00"');
  });
});

describe('writeOpf — edits', () => {
  const rewrite = (xml: string, changes: Partial<BookMetadata>, rtl = false): string => {
    const { document, metadata, direction } = parseOpf(xml);
    return writeOpf(document, { ...metadata, ...changes }, rtl ? 'rtl' : direction);
  };

  it('rewrites the core record', () => {
    const out = rewrite(EPUB2_OPF, {
      title: 'The Mauritius Command',
      author: "O'Brian, Patrick",
      summary: 'Jack Aubrey is sent to the Indian Ocean.',
    });
    const parsed = parseOpf(out).metadata;
    expect(parsed.title).toBe('The Mauritius Command');
    expect(parsed.author).toBe("O'Brian, Patrick");
    expect(parsed.summary).toBe('Jack Aubrey is sent to the Indian Ocean.');
  });

  it('replaces the whole subject set from the comma-separated field', () => {
    const out = rewrite(EPUB2_OPF, { tags: 'Sea stories,  Napoleonic Wars ,' });
    expect(parseOpf(out).metadata.tags).toBe('Sea stories, Napoleonic Wars');
    expect(out).not.toContain('Historical');
  });

  it('drops an optional field the reader cleared', () => {
    const out = rewrite(EPUB2_OPF, { publisher: '', summary: '', tags: '' });
    expect(out).not.toContain('dc:publisher');
    expect(out).not.toContain('dc:description');
    expect(out).not.toContain('dc:subject');
  });

  it('keeps a structurally required field even when the reader clears it', () => {
    const out = rewrite(EPUB2_OPF, { title: '', language: '', ident: '' });
    const parsed = parseOpf(out).metadata;
    expect(parsed.title).toBe('Master and Commander');
    expect(parsed.language).toBe('en');
    expect(parsed.ident).toBe('9780393037012');
  });

  it('writes series in both conventions for an EPUB 3', () => {
    const out = rewrite(EPUB3_OPF, { series: 'Hornblower', seriesNo: '4' });
    expect(out).toContain('property="belongs-to-collection"');
    expect(out).toContain('property="group-position"');
    expect(out).toContain('name="calibre:series"');
    expect(parseOpf(out).metadata).toMatchObject({ series: 'Hornblower', seriesNo: '4' });
  });

  it('writes only the legacy series metas for an EPUB 2', () => {
    const out = rewrite(EPUB2_OPF, { series: 'Hornblower', seriesNo: '4' });
    expect(out).not.toContain('belongs-to-collection');
    expect(out).toContain('content="Hornblower"');
    expect(parseOpf(out).metadata).toMatchObject({ series: 'Hornblower', seriesNo: '4' });
  });

  it('removes every trace of a series the reader cleared', () => {
    const out = rewrite(EPUB3_OPF, { series: '', seriesNo: '' });
    expect(out).not.toContain('belongs-to-collection');
    expect(out).not.toContain('collection-type');
    expect(out).not.toContain('calibre:series');
    expect(parseOpf(out).metadata.series).toBe('');
  });

  it('sets page-progression-direction for a right-to-left book', () => {
    const out = rewrite(EPUB3_OPF, {}, true);
    expect(parseOpf(out).direction).toBe('rtl');
    expect(out).toContain('page-progression-direction="rtl"');
  });

  it('does not add a direction to a left-to-right spine that never had one', () => {
    const out = rewrite(EPUB3_OPF, {});
    expect(out).not.toContain('page-progression-direction');
  });

  it('creates a missing element rather than losing the value', () => {
    const stripped = EPUB3_OPF.replace(/<dc:publisher>.*<\/dc:publisher>\n\s*/, '');
    const out = rewrite(stripped, { publisher: 'Norton' });
    expect(parseOpf(out).metadata.publisher).toBe('Norton');
  });

  it('nominates a created identifier as the package unique-identifier', () => {
    const stripped = EPUB2_OPF.replace(
      /<dc:identifier[^>]*>[^<]*<\/dc:identifier>\n\s*/,
      '',
    ).replace(' unique-identifier="BookId"', '');
    const out = rewrite(stripped, { ident: 'B000FC0SIM' });
    const parsed = parseOpf(out);
    expect(parsed.metadata.ident).toBe('B000FC0SIM');
    expect(parsed.document.uniqueIdentifierId).toBe('bindery-identifier');
  });

  it('escapes characters that would otherwise break the XML', () => {
    const out = rewrite(EPUB2_OPF, { title: 'Tom & Jerry <or> "Both"' });
    expect(out).toContain('&amp;');
    expect(parseOpf(out).metadata.title).toBe('Tom & Jerry <or> "Both"');
  });

  it('keeps the XML declaration', () => {
    const out = rewrite(EPUB2_OPF, { title: 'Anything' });
    expect(out.trimStart().startsWith('<?xml')).toBe(true);
  });

  it('rejects a package with no metadata element', () => {
    expect(detailOf('<?xml version="1.0"?><package version="3.0"><manifest/></package>')).toBe(
      'no <metadata> element',
    );
  });

  it('rejects XML that is not a package at all', () => {
    expect(detailOf('<?xml version="1.0"?><html><body/></html>')).toBe('no <package> element');
  });
});

describe('parseOpf — unusual but legal files', () => {
  it('reads Dublin Core bound to a prefix other than dc', () => {
    const odd = `<?xml version="1.0"?>
<package version="3.0" unique-identifier="id" xmlns:dcterms="http://purl.org/dc/elements/1.1/">
  <metadata><dcterms:title>Odd Prefix</dcterms:title><dcterms:language>fr</dcterms:language></metadata>
  <manifest><item id="a" href="a.xhtml" media-type="application/xhtml+xml"/></manifest>
  <spine><itemref idref="a"/></spine>
</package>`;
    const parsed = parseOpf(odd);
    expect(parsed.metadata.title).toBe('Odd Prefix');
    expect(parsed.metadata.language).toBe('fr');
  });

  it('reuses whichever Dublin Core prefix the file already binds when adding an element', () => {
    const odd = `<?xml version="1.0"?>
<package version="3.0" unique-identifier="id" xmlns:dcterms="http://purl.org/dc/elements/1.1/">
  <metadata><dcterms:title>Odd Prefix</dcterms:title></metadata>
  <manifest><item id="a" href="a.xhtml" media-type="application/xhtml+xml"/></manifest>
</package>`;
    const { document, metadata, direction } = parseOpf(odd);
    const out = writeOpf(document, { ...metadata, publisher: 'Gallimard' }, direction);
    expect(out).toContain('<dcterms:publisher>Gallimard</dcterms:publisher>');
  });

  it('reads a description that contains markup as plain text', () => {
    const withMarkup = EPUB3_OPF.replace(
      '<dc:description>The Surprise is sent into the Pacific after an American frigate.</dc:description>',
      '<dc:description>The <em>Surprise</em> sails.</dc:description>',
    );
    expect(parseOpf(withMarkup).metadata.summary).toBe('The Surprise sails.');
  });
});
