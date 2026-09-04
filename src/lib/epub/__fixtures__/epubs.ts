import { type Zippable, zipSync } from 'fflate';

/**
 * Two books, built rather than checked in as binaries, so a reviewer can read
 * exactly what the parser is being asked to cope with.
 *
 * Between them they cover both packaging generations and the awkward parts of
 * each: EPUB 2's `opf:event` dates, `opf:file-as` creator and Calibre series
 * metas; EPUB 3's `belongs-to-collection` refinements, `cover-image` property
 * and `dcterms:modified` stamp. Both carry a vendor `<meta>` and an extra
 * manifest item that Bindery does not own, to prove they survive a round trip.
 */

const encoder = new TextEncoder();

/** A 1 x 1 PNG — the smallest thing that is honestly an image. */
const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

export const EPUB2_OPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>Master and Commander</dc:title>
    <dc:creator opf:file-as="O'Brian, Patrick" opf:role="aut">Patrick O'Brian</dc:creator>
    <dc:description>Jack Aubrey is made master and commander of the sloop Sophie.</dc:description>
    <dc:language>en</dc:language>
    <dc:publisher>Collins</dc:publisher>
    <dc:date opf:event="creation">2011-04-02</dc:date>
    <dc:date opf:event="publication">1969-10-01</dc:date>
    <dc:identifier id="BookId" opf:scheme="ISBN">9780393037012</dc:identifier>
    <dc:subject>Naval fiction</dc:subject>
    <dc:subject>Historical</dc:subject>
    <meta name="calibre:series" content="Aubrey-Maturin"/>
    <meta name="calibre:series_index" content="1"/>
    <meta name="cover" content="cover-image"/>
    <meta name="calibre:timestamp" content="2011-04-02T00:00:00+00:00"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="cover-image" href="images/cover.png" media-type="image/png"/>
    <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="styles/book.css" media-type="text/css"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="cover-page" linear="no"/>
    <itemref idref="chapter1"/>
  </spine>
  <guide>
    <reference type="cover" title="Cover" href="cover.xhtml"/>
  </guide>
</package>`;

export const EPUB3_OPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:7f9b2c11-4a3e-4a9d-9a1e-0e2b6d5c8f10</dc:identifier>
    <dc:title>The Far Side of the World</dc:title>
    <dc:creator id="creator">Patrick O'Brian</dc:creator>
    <meta refines="#creator" property="file-as">O'Brian, Patrick</meta>
    <dc:description>The Surprise is sent into the Pacific after an American frigate.</dc:description>
    <dc:language>en</dc:language>
    <dc:publisher>Collins</dc:publisher>
    <dc:date>1984-01-01</dc:date>
    <dc:subject>Naval fiction</dc:subject>
    <meta property="belongs-to-collection" id="series">Aubrey-Maturin</meta>
    <meta refines="#series" property="collection-type">series</meta>
    <meta refines="#series" property="group-position">10</meta>
    <meta property="dcterms:modified">2019-06-01T12:00:00Z</meta>
    <meta name="calibre:rating" content="8"/>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="coverimg" href="images/jacket.jpeg" media-type="image/jpeg" properties="cover-image"/>
    <item id="chapter1" href="text/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="styles/book.css" media-type="text/css"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`;

const CHAPTER = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>One</title></head>
<body><h1>Chapter One</h1><p>The Sophie put to sea.</p></body></html>`;

const NCX = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="9780393037012"/></head>
  <docTitle><text>Master and Commander</text></docTitle>
  <navMap><navPoint id="np1" playOrder="1"><navLabel><text>Chapter One</text></navLabel><content src="chapter1.xhtml"/></navPoint></navMap>
</ncx>`;

const NAV = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body><nav epub:type="toc"><ol><li><a href="text/chapter1.xhtml">Chapter One</a></li></ol></nav></body></html>`;

const COVER_PAGE = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Cover</title></head>
<body><img src="images/cover.png" alt="Cover"/></body></html>`;

/**
 * Entry order matters: `mimetype` first and stored is what makes the archive an
 * EPUB rather than a zip that happens to contain one.
 */
function pack(entries: Zippable): Uint8Array {
  return zipSync(entries, { level: 6 });
}

export function buildEpub2Fixture(): Uint8Array {
  return pack({
    mimetype: [encoder.encode('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': encoder.encode(CONTAINER_XML),
    'OEBPS/content.opf': encoder.encode(EPUB2_OPF),
    'OEBPS/toc.ncx': encoder.encode(NCX),
    'OEBPS/cover.xhtml': encoder.encode(COVER_PAGE),
    'OEBPS/chapter1.xhtml': encoder.encode(CHAPTER),
    'OEBPS/images/cover.png': decodeBase64(PNG_1X1),
    'OEBPS/styles/book.css': encoder.encode('body { margin: 0; }'),
  });
}

export function buildEpub3Fixture(): Uint8Array {
  return pack({
    mimetype: [encoder.encode('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': encoder.encode(CONTAINER_XML),
    'OEBPS/content.opf': encoder.encode(EPUB3_OPF),
    'OEBPS/nav.xhtml': encoder.encode(NAV),
    'OEBPS/text/chapter1.xhtml': encoder.encode(CHAPTER),
    'OEBPS/images/jacket.jpeg': decodeBase64(PNG_1X1),
    'OEBPS/styles/book.css': encoder.encode('body { margin: 0; }'),
  });
}

/** An EPUB 3 with no cover anywhere — neither property nor legacy meta. */
export function buildCoverlessFixture(): Uint8Array {
  const opf = EPUB3_OPF.replace(
    '<item id="coverimg" href="images/jacket.jpeg" media-type="image/jpeg" properties="cover-image"/>\n    ',
    '',
  );
  return pack({
    mimetype: [encoder.encode('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': encoder.encode(CONTAINER_XML),
    'OEBPS/content.opf': encoder.encode(opf),
    'OEBPS/nav.xhtml': encoder.encode(NAV),
    'OEBPS/text/chapter1.xhtml': encoder.encode(CHAPTER),
  });
}

export function buildEncryptedFixture(): Uint8Array {
  return pack({
    mimetype: [encoder.encode('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': encoder.encode(CONTAINER_XML),
    'META-INF/encryption.xml': encoder.encode(
      `<?xml version="1.0"?>
<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <EncryptedData xmlns="http://www.w3.org/2001/04/xmlenc#">
    <EncryptionMethod Algorithm="http://www.w3.org/2001/04/xmlenc#aes256-cbc"/>
  </EncryptedData>
</encryption>`,
    ),
    'OEBPS/content.opf': encoder.encode(EPUB3_OPF),
  });
}

/** Font obfuscation is declared the same way as DRM but is not DRM. */
export function buildObfuscatedFontsFixture(): Uint8Array {
  return pack({
    mimetype: [encoder.encode('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': encoder.encode(CONTAINER_XML),
    'META-INF/encryption.xml': encoder.encode(
      `<?xml version="1.0"?>
<encryption xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <EncryptedData xmlns="http://www.w3.org/2001/04/xmlenc#">
    <EncryptionMethod Algorithm="http://www.idpf.org/2008/embedding"/>
  </EncryptedData>
</encryption>`,
    ),
    'OEBPS/content.opf': encoder.encode(EPUB3_OPF),
    'OEBPS/nav.xhtml': encoder.encode(NAV),
    'OEBPS/text/chapter1.xhtml': encoder.encode(CHAPTER),
    'OEBPS/images/jacket.jpeg': decodeBase64(PNG_1X1),
    'OEBPS/styles/book.css': encoder.encode('body { margin: 0; }'),
  });
}

export function buildMissingContainerFixture(): Uint8Array {
  return pack({
    mimetype: [encoder.encode('application/epub+zip'), { level: 0 }],
    'OEBPS/content.opf': encoder.encode(EPUB3_OPF),
  });
}

export function buildBrokenOpfFixture(): Uint8Array {
  return pack({
    mimetype: [encoder.encode('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': encoder.encode(CONTAINER_XML),
    'OEBPS/content.opf': encoder.encode('<package><metadata><dc:title>Unclosed</metadata>'),
  });
}
