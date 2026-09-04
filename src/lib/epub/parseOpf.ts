import { EpubError } from './errors';
import { type BookMetadata, EMPTY_METADATA, type ReadingDirection } from './types';
import {
  type XmlNode,
  childrenOf,
  findChild,
  getAttribute,
  getAttributeByLocalName,
  isElement,
  parseXml,
  textOf,
} from './xml';

/**
 * The OPF as an editable document. `nodes` is the whole parsed file in order;
 * the named handles point into it, so mutating a handle mutates the document
 * that `writeOpf` will serialize.
 */
export interface OpfDocument {
  readonly nodes: XmlNode[];
  readonly packageNode: XmlNode;
  readonly metadataNode: XmlNode;
  readonly manifestNode: XmlNode;
  readonly spineNode: XmlNode | undefined;
  readonly version: string;
  readonly isEpub3: boolean;
  readonly uniqueIdentifierId: string | undefined;
}

export interface ParsedOpf {
  readonly document: OpfDocument;
  readonly metadata: BookMetadata;
  readonly direction: ReadingDirection;
}

export function parseOpf(xml: string): ParsedOpf {
  const document = readStructure(xml);
  return {
    document,
    metadata: readMetadata(document),
    direction:
      getAttribute(document.spineNode ?? {}, 'page-progression-direction') === 'rtl'
        ? 'rtl'
        : 'ltr',
  };
}

function readStructure(xml: string): OpfDocument {
  const nodes = parseXml(xml);
  const packageNode = nodes.find((node) => isElement(node, 'package'));
  if (!packageNode) throw new EpubError('invalid-opf', { detail: 'no <package> element' });

  const metadataNode = findChild(packageNode, 'metadata');
  const manifestNode = findChild(packageNode, 'manifest');
  if (!metadataNode) throw new EpubError('invalid-opf', { detail: 'no <metadata> element' });
  if (!manifestNode) throw new EpubError('invalid-opf', { detail: 'no <manifest> element' });

  const version = getAttribute(packageNode, 'version') ?? '2.0';
  return {
    nodes,
    packageNode,
    metadataNode,
    manifestNode,
    spineNode: findChild(packageNode, 'spine'),
    version,
    isEpub3: Number.parseFloat(version) >= 3,
    uniqueIdentifierId: getAttribute(packageNode, 'unique-identifier'),
  };
}

/* ── Reading the record ───────────────────────────────────────────────────── */

function readMetadata(document: OpfDocument): BookMetadata {
  const children = childrenOf(document.metadataNode);
  /*
   * `dc:title` in nearly every file, but the prefix is only a convention —
   * match on the local name so an OPF that binds Dublin Core to some other
   * prefix still reads.
   */
  const dc = (name: string): XmlNode[] => children.filter((node) => isElement(node, name));
  const firstText = (name: string): string => {
    const node = dc(name)[0];
    return node ? textOf(node).trim() : '';
  };

  const series = readSeries(children);

  return {
    ...EMPTY_METADATA,
    title: firstText('title'),
    author: firstText('creator'),
    summary: firstText('description'),
    language: firstText('language') || EMPTY_METADATA.language,
    publisher: firstText('publisher'),
    pubdate: readPublicationDate(dc('date')),
    ident: readIdentifier(document, dc('identifier')),
    tags: dc('subject')
      .map((node) => textOf(node).trim())
      .filter(Boolean)
      .join(', '),
    series: series.name,
    seriesNo: series.position,
  };
}

/**
 * EPUB 2 allows several `dc:date` elements distinguished by `opf:event`;
 * EPUB 3 allows exactly one, and it means publication.
 */
function readPublicationDate(dates: readonly XmlNode[]): string {
  const published = dates.find(
    (node) => getAttributeByLocalName(node, 'event')?.toLowerCase() === 'publication',
  );
  const node = published ?? dates[0];
  return node ? textOf(node).trim() : '';
}

/**
 * The identifier is shown and written back verbatim, `urn:uuid:` scheme and
 * all: it is the book's identity, and a file the reader did not touch must
 * come back out with the same one.
 */
function readIdentifier(document: OpfDocument, identifiers: readonly XmlNode[]): string {
  const unique = document.uniqueIdentifierId;
  const primary =
    (unique ? identifiers.find((node) => getAttribute(node, 'id') === unique) : undefined) ??
    identifiers[0];
  return primary ? textOf(primary).trim() : '';
}

interface Series {
  readonly name: string;
  readonly position: string;
}

/**
 * Two conventions in the wild, checked in that order: EPUB 3's
 * `belongs-to-collection` with a `group-position` refinement, and Calibre's
 * `calibre:series` / `calibre:series_index` legacy metas.
 */
function readSeries(children: readonly XmlNode[]): Series {
  const metas = children.filter((node) => isElement(node, 'meta'));

  const collection = metas.find(
    (node) => getAttribute(node, 'property') === 'belongs-to-collection',
  );
  const collectionName = collection ? textOf(collection).trim() : '';
  if (collection && collectionName) {
    const id = getAttribute(collection, 'id');
    return {
      name: collectionName,
      position: id ? findRefinement(metas, id, 'group-position') : '',
    };
  }

  return {
    name: findLegacyMeta(metas, 'calibre:series'),
    position: findLegacyMeta(metas, 'calibre:series_index'),
  };
}

/** Calibre's convention: `<meta name="calibre:series" content="…"/>`. */
function findLegacyMeta(metas: readonly XmlNode[], name: string): string {
  const meta = metas.find((node) => getAttribute(node, 'name') === name);
  return meta ? (getAttribute(meta, 'content') ?? '').trim() : '';
}

function findRefinement(metas: readonly XmlNode[], id: string, property: string): string {
  const refinement = metas.find(
    (node) =>
      getAttribute(node, 'refines') === `#${id}` && getAttribute(node, 'property') === property,
  );
  return refinement ? textOf(refinement).trim() : '';
}
