import type { OpfDocument } from './parseOpf';
import type { BookMetadata, ReadingDirection } from './types';
import {
  type XmlNode,
  buildXml,
  childrenOf,
  createElement,
  getAttribute,
  isElement,
  setAttribute,
  setChildren,
  setText,
  tagOf,
} from './xml';

/**
 * Writes the record back into the OPF.
 *
 * The rule that governs this whole file: **edit only what Bindery owns.** The
 * document is the one `parseOpf` produced, in order, so every manifest item,
 * spine entry, `dcterms:modified` stamp and vendor `<meta>` that is not in the
 * owned set below is carried through by simply not being touched. An EPUB
 * whose record the reader did not edit comes back out functionally identical.
 *
 * Owned, and rewritten:
 *   dc:title, dc:creator, dc:description, dc:language, dc:publisher, dc:date,
 *   dc:identifier (the unique one), dc:subject, the series metas, and
 *   `page-progression-direction` on `<spine>`.
 */
export function writeOpf(
  document: OpfDocument,
  metadata: BookMetadata,
  direction: ReadingDirection,
): string {
  applyMetadata(document, metadata);
  applyReadingDirection(document, direction);
  return buildXml(document.nodes);
}

/**
 * `dc:title`, `dc:language` and `dc:identifier` are structurally required by
 * both EPUB versions, so clearing the field leaves the existing element alone
 * rather than producing a file no reader will open. The rest are optional and
 * are removed when the reader empties them.
 */
const REQUIRED_DC = new Set(['title', 'language', 'identifier']);

export function applyMetadata(document: OpfDocument, metadata: BookMetadata): void {
  const prefix = dublinCorePrefix(document);

  setDublinCore(document, prefix, 'title', metadata.title);
  setDublinCore(document, prefix, 'creator', metadata.author);
  setDublinCore(document, prefix, 'description', metadata.summary);
  setDublinCore(document, prefix, 'language', metadata.language);
  setDublinCore(document, prefix, 'publisher', metadata.publisher);
  setPublicationDate(document, prefix, metadata.pubdate);
  setIdentifier(document, prefix, metadata.ident);
  setSubjects(document, prefix, metadata.tags);
  setSeries(document, metadata.series, metadata.seriesNo);
}

function applyReadingDirection(document: OpfDocument, direction: ReadingDirection): void {
  const spine = document.spineNode;
  if (!spine) return;

  const existing = getAttribute(spine, 'page-progression-direction');
  if (direction === 'rtl') {
    setAttribute(spine, 'page-progression-direction', 'rtl');
  } else if (existing !== undefined) {
    // Only touch a left-to-right spine that already declared a direction —
    // otherwise an untouched book would gain an attribute it never had.
    setAttribute(spine, 'page-progression-direction', 'ltr');
  }
}

/* ── Dublin Core ──────────────────────────────────────────────────────────── */

/** Reuse whatever prefix the file already binds Dublin Core to. */
function dublinCorePrefix(document: OpfDocument): string {
  for (const child of childrenOf(document.metadataNode)) {
    const tag = tagOf(child);
    const colon = tag.lastIndexOf(':');
    if (colon > 0 && DC_NAMES.has(tag.slice(colon + 1).toLowerCase())) {
      return `${tag.slice(0, colon)}:`;
    }
  }
  return 'dc:';
}

const DC_NAMES = new Set([
  'title',
  'creator',
  'description',
  'language',
  'publisher',
  'date',
  'identifier',
  'subject',
  'contributor',
  'rights',
  'type',
  'format',
  'source',
  'relation',
  'coverage',
]);

function metadataChildren(document: OpfDocument): XmlNode[] {
  return childrenOf(document.metadataNode);
}

function findDublinCore(document: OpfDocument, name: string): XmlNode[] {
  return metadataChildren(document).filter((node) => isElement(node, name));
}

function appendToMetadata(document: OpfDocument, node: XmlNode): void {
  setChildren(document.metadataNode, [...metadataChildren(document), node]);
}

function removeFromMetadata(document: OpfDocument, doomed: ReadonlySet<XmlNode>): void {
  spliceMetadata(document, doomed, []);
}

/**
 * Swaps one set of metadata children for another *where the old set was*.
 * Subjects and series metas are rewritten wholesale rather than edited, and
 * appending them would shuffle the file every time it passed through — this
 * keeps an unedited book coming back out in the order it went in.
 */
function spliceMetadata(
  document: OpfDocument,
  doomed: ReadonlySet<XmlNode>,
  insert: readonly XmlNode[],
): void {
  const children = metadataChildren(document);
  const anchor = children.findIndex((node) => doomed.has(node));
  const kept = children.filter((node) => !doomed.has(node));
  const at =
    anchor === -1
      ? kept.length
      : children.slice(0, anchor).filter((node) => !doomed.has(node)).length;

  setChildren(document.metadataNode, [...kept.slice(0, at), ...insert, ...kept.slice(at)]);
}

function setDublinCore(
  document: OpfDocument,
  prefix: string,
  name: string,
  value: string,
): XmlNode | undefined {
  const existing = findDublinCore(document, name);
  const trimmed = value.trim();

  if (!trimmed) {
    if (!REQUIRED_DC.has(name)) removeFromMetadata(document, new Set(existing));
    return undefined;
  }

  const first = existing[0];
  if (first) {
    setText(first, trimmed);
    return first;
  }

  const created = createElement(`${prefix}${name}`, {}, trimmed);
  appendToMetadata(document, created);
  return created;
}

/**
 * EPUB 2 files may carry several `dc:date` elements keyed by `opf:event`; the
 * publication one is ours and the rest (creation, modification) are not.
 */
function setPublicationDate(document: OpfDocument, prefix: string, value: string): void {
  const dates = findDublinCore(document, 'date');
  const publication = dates.find((node) => eventOf(node) === 'publication');
  const target = publication ?? dates.find((node) => eventOf(node) === undefined);
  const trimmed = value.trim();

  if (!trimmed) {
    if (target) removeFromMetadata(document, new Set([target]));
    return;
  }
  if (target) setText(target, trimmed);
  else appendToMetadata(document, createElement(`${prefix}date`, {}, trimmed));
}

function eventOf(node: XmlNode): string | undefined {
  for (const [key, value] of Object.entries(node[':@'] ?? {})) {
    if (typeof value === 'string' && key.toLowerCase().endsWith('event'))
      return value.toLowerCase();
  }
  return undefined;
}

/**
 * A created identifier also has to become the package's `unique-identifier`,
 * or the package element points at nothing.
 */
function setIdentifier(document: OpfDocument, prefix: string, value: string): void {
  const identifiers = findDublinCore(document, 'identifier');
  const unique = document.uniqueIdentifierId;
  const primary =
    (unique ? identifiers.find((node) => getAttribute(node, 'id') === unique) : undefined) ??
    identifiers[0];
  const trimmed = value.trim();

  if (!trimmed) return;

  if (primary) {
    setText(primary, trimmed);
    return;
  }

  const id = unique ?? 'bindery-identifier';
  appendToMetadata(document, createElement(`${prefix}identifier`, { id }, trimmed));
  if (!unique) setAttribute(document.packageNode, 'unique-identifier', id);
}

/** Subjects are wholly ours: the comma-separated field replaces the set. */
function setSubjects(document: OpfDocument, prefix: string, tags: string): void {
  const values = tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  spliceMetadata(
    document,
    new Set(findDublinCore(document, 'subject')),
    values.map((value) => createElement(`${prefix}subject`, {}, value)),
  );
}

/* ── Series ───────────────────────────────────────────────────────────────── */

const COLLECTION_ID = 'bindery-collection';

/**
 * Written twice on purpose: EPUB 3's `belongs-to-collection` with its
 * `collection-type` and `group-position` refinements, and Calibre's legacy
 * `calibre:series` metas, which is what most tooling (and Kindle's own
 * conversion) actually reads.
 */
function setSeries(document: OpfDocument, series: string, position: string): void {
  const name = series.trim();
  const index = position.trim();
  const doomed = existingSeriesMetas(document);

  if (!name) {
    spliceMetadata(document, doomed, []);
    return;
  }

  // Reuse the collection's own id where the file already had one, so any
  // refinement Bindery did not write still points somewhere real.
  const collectionId =
    [...doomed]
      .filter((node) => getAttribute(node, 'property') === 'belongs-to-collection')
      .map((node) => getAttribute(node, 'id'))
      .find((id): id is string => id !== undefined) ?? COLLECTION_ID;

  const replacement: XmlNode[] = [];
  if (document.isEpub3) {
    replacement.push(
      createElement('meta', { property: 'belongs-to-collection', id: collectionId }, name),
      createElement('meta', { refines: `#${collectionId}`, property: 'collection-type' }, 'series'),
    );
    if (index) {
      replacement.push(
        createElement('meta', { refines: `#${collectionId}`, property: 'group-position' }, index),
      );
    }
  }

  replacement.push(createElement('meta', { name: 'calibre:series', content: name }));
  if (index) {
    replacement.push(createElement('meta', { name: 'calibre:series_index', content: index }));
  }

  spliceMetadata(document, doomed, replacement);
}

function existingSeriesMetas(document: OpfDocument): ReadonlySet<XmlNode> {
  const metas = metadataChildren(document).filter((node) => isElement(node, 'meta'));
  const collectionIds = new Set(
    metas
      .filter((node) => getAttribute(node, 'property') === 'belongs-to-collection')
      .map((node) => getAttribute(node, 'id'))
      .filter((id): id is string => id !== undefined),
  );

  const doomed = new Set(
    metas.filter((node) => {
      const property = getAttribute(node, 'property');
      const name = getAttribute(node, 'name');
      if (property === 'belongs-to-collection') return true;
      if (name === 'calibre:series' || name === 'calibre:series_index') return true;

      const refines = getAttribute(node, 'refines');
      if (
        refines?.startsWith('#') &&
        collectionIds.has(refines.slice(1)) &&
        (property === 'group-position' || property === 'collection-type')
      ) {
        return true;
      }
      return false;
    }),
  );

  return doomed;
}

/* ── Cover bookkeeping helpers, shared with replaceCover ──────────────────── */

/** The legacy `<meta name="cover" content="…"/>` older Kindles still read. */
export function setLegacyCoverMeta(document: OpfDocument, itemId: string): void {
  const existing = metadataChildren(document).find(
    (node) => isElement(node, 'meta') && getAttribute(node, 'name') === 'cover',
  );
  if (existing) setAttribute(existing, 'content', itemId);
  else appendToMetadata(document, createElement('meta', { name: 'cover', content: itemId }));
}
