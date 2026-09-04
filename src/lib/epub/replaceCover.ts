import type { OpfDocument } from './parseOpf';
import { dirnameOf, resolveHref } from './paths';
import { setLegacyCoverMeta } from './writeOpf';
import {
  type XmlNode,
  childrenOf,
  createElement,
  getAttribute,
  isElement,
  removeAttribute,
  setAttribute,
  setChildren,
} from './xml';

const IMAGE_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]);

const NEW_ITEM_ID = 'bindery-cover-image';
const NEW_ITEM_HREF = 'bindery-cover.jpg';

export interface CoverReplacement {
  /** The manifest id the cover is published under. */
  readonly itemId: string;
  /** Where in the archive the new image bytes belong. */
  readonly zipPath: string;
  /** True when the book had no cover and one was added. */
  readonly created: boolean;
}

/**
 * Points the book's cover at a new image, in place wherever possible.
 *
 * The existing item's `href` and `id` are deliberately kept even though the
 * bytes become JPEG: a cover XHTML page referencing `images/cover.png`, a
 * `<meta name="cover">` and an EPUB 3 `cover-image` property all resolve
 * through those two strings, and rewriting the href would break every one of
 * them. The media type is authoritative in EPUB, not the file extension, so it
 * is the media type that is corrected.
 */
export function replaceCover(
  document: OpfDocument,
  opfPath: string,
  mediaType = 'image/jpeg',
): CoverReplacement {
  const opfDir = dirnameOf(opfPath);
  const items = manifestItems(document);
  const existing = findCoverItem(document, items);

  if (existing) {
    const href = getAttribute(existing, 'href') ?? '';
    setAttribute(existing, 'media-type', mediaType);
    const itemId = getAttribute(existing, 'id') ?? ensureId(existing, items, NEW_ITEM_ID);
    publishAsCover(document, items, existing, itemId);
    return { itemId, zipPath: resolveHref(opfDir, href), created: false };
  }

  const href = uniqueHref(items, NEW_ITEM_HREF);
  const itemId = uniqueId(items, NEW_ITEM_ID);
  const item = createElement('item', { id: itemId, href, 'media-type': mediaType });
  setChildren(document.manifestNode, [...items, item]);

  publishAsCover(document, [...items, item], item, itemId);
  return { itemId, zipPath: resolveHref(opfDir, href), created: true };
}

/**
 * Declares `item` the cover both ways — the EPUB 3 manifest property and the
 * legacy `<meta name="cover">` older Kindles read — and makes sure no other
 * item still claims the property.
 */
function publishAsCover(
  document: OpfDocument,
  items: readonly XmlNode[],
  item: XmlNode,
  itemId: string,
): void {
  if (document.isEpub3) {
    for (const other of items) {
      if (other === item) continue;
      const properties = withoutCoverImage(getAttribute(other, 'properties'));
      if (properties === undefined) continue;
      if (properties === '') removeAttribute(other, 'properties');
      else setAttribute(other, 'properties', properties);
    }
    setAttribute(item, 'properties', withCoverImage(getAttribute(item, 'properties')));
  }
  setLegacyCoverMeta(document, itemId);
}

function withCoverImage(properties: string | undefined): string {
  const tokens = (properties ?? '').split(/\s+/).filter(Boolean);
  if (!tokens.includes('cover-image')) tokens.push('cover-image');
  return tokens.join(' ');
}

/** Returns `undefined` when the attribute did not mention `cover-image`. */
function withoutCoverImage(properties: string | undefined): string | undefined {
  if (properties === undefined) return undefined;
  const tokens = properties.split(/\s+/).filter(Boolean);
  if (!tokens.includes('cover-image')) return undefined;
  return tokens.filter((token) => token !== 'cover-image').join(' ');
}

/* ── Finding the incumbent ────────────────────────────────────────────────── */

export function manifestItems(document: OpfDocument): XmlNode[] {
  return childrenOf(document.manifestNode).filter((node) => isElement(node, 'item'));
}

/**
 * Three conventions, in descending order of how explicitly they say "cover":
 * the legacy `<meta name="cover">` pointer, the EPUB 3 `cover-image` property,
 * and finally an image item that simply calls itself a cover.
 */
export function findCoverItem(
  document: OpfDocument,
  items: readonly XmlNode[],
): XmlNode | undefined {
  const pointedAt = childrenOf(document.metadataNode).find(
    (node) => isElement(node, 'meta') && getAttribute(node, 'name') === 'cover',
  );
  const pointedId = pointedAt ? getAttribute(pointedAt, 'content') : undefined;
  const byMeta = pointedId
    ? items.find((item) => getAttribute(item, 'id') === pointedId && isImage(item))
    : undefined;
  if (byMeta) return byMeta;

  // `cover-image` on something that is not an image is malformed; a nav
  // document carrying the property must not win over the actual jacket.
  const byProperty = items.find(
    (item) =>
      isImage(item) &&
      (getAttribute(item, 'properties') ?? '').split(/\s+/).includes('cover-image'),
  );
  if (byProperty) return byProperty;

  return items.find(
    (item) =>
      isImage(item) &&
      (/cover/i.test(getAttribute(item, 'id') ?? '') ||
        /cover/i.test(getAttribute(item, 'href') ?? '')),
  );
}

function isImage(item: XmlNode): boolean {
  return IMAGE_MEDIA_TYPES.has((getAttribute(item, 'media-type') ?? '').toLowerCase());
}

/* ── Name allocation ──────────────────────────────────────────────────────── */

function ensureId(item: XmlNode, items: readonly XmlNode[], preferred: string): string {
  const id = uniqueId(items, preferred);
  setAttribute(item, 'id', id);
  return id;
}

function uniqueId(items: readonly XmlNode[], preferred: string): string {
  const taken = new Set(items.map((item) => getAttribute(item, 'id')));
  return firstFree(preferred, (candidate) => !taken.has(candidate));
}

function uniqueHref(items: readonly XmlNode[], preferred: string): string {
  const taken = new Set(items.map((item) => getAttribute(item, 'href')));
  return firstFree(preferred, (candidate) => !taken.has(candidate), '.jpg');
}

function firstFree(preferred: string, isFree: (value: string) => boolean, suffix = ''): string {
  if (isFree(preferred)) return preferred;
  const stem = suffix ? preferred.slice(0, -suffix.length) : preferred;
  for (let n = 2; n < 1000; n += 1) {
    const candidate = `${stem}-${n}${suffix}`;
    if (isFree(candidate)) return candidate;
  }
  /* c8 ignore next -- a manifest with 1000 colliding names is not a real book */
  return `${stem}-${Date.now()}${suffix}`;
}
