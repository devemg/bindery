import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { EpubError } from './errors';

/**
 * A thin, typed layer over fast-xml-parser's `preserveOrder` representation.
 *
 * Order preservation is what makes a safe round trip possible: the document
 * comes back as an ordered list of nodes, unknown elements and all, so the
 * writer can edit the handful of nodes Bindery owns and leave every other
 * manifest item, spine entry and vendor metadata node exactly where it was.
 *
 * A node is an object with exactly one content key — the tag name, whose value
 * is the child list — plus an optional `:@` key holding its attributes. A text
 * node is `{ '#text': 'value' }`.
 */

export const ATTR_KEY = ':@';
export const TEXT_KEY = '#text';
const ATTR_PREFIX = '@_';

export type XmlAttributes = Record<string, string>;
export type XmlValue = XmlNode[] | string | XmlAttributes | undefined;
export interface XmlNode {
  [key: string]: XmlValue;
}

const parser = new XMLParser({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: ATTR_PREFIX,
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  ignorePiTags: false,
});

const builder = new XMLBuilder({
  preserveOrder: true,
  ignoreAttributes: false,
  attributeNamePrefix: ATTR_PREFIX,
  suppressEmptyNode: true,
  processEntities: true,
  format: true,
  indentBy: '  ',
});

export function parseXml(xml: string): XmlNode[] {
  const validity = XMLValidator.validate(xml, { allowBooleanAttributes: true });
  if (validity !== true) {
    throw new EpubError('invalid-opf', { detail: validity.err.msg, cause: validity.err });
  }
  return parser.parse(xml) as XmlNode[];
}

export function buildXml(nodes: readonly XmlNode[]): string {
  const body = builder.build(nodes);
  return body.endsWith('\n') ? body : `${body}\n`;
}

/* ── Reading ──────────────────────────────────────────────────────────────── */

/** The node's tag name, or `#text` for a text node. */
export function tagOf(node: XmlNode): string {
  for (const key of Object.keys(node)) {
    if (key !== ATTR_KEY) return key;
  }
  return '';
}

/** `dc:title` -> `title`. EPUB files are not consistent about prefixes. */
export function localName(tag: string): string {
  const colon = tag.lastIndexOf(':');
  return colon === -1 ? tag : tag.slice(colon + 1);
}

export function isElement(node: XmlNode, name: string): boolean {
  const tag = tagOf(node);
  return tag !== TEXT_KEY && localName(tag).toLowerCase() === name.toLowerCase();
}

export function childrenOf(node: XmlNode): XmlNode[] {
  const value = node[tagOf(node)];
  return Array.isArray(value) ? value : [];
}

function isAttributeBag(value: XmlValue): value is XmlAttributes {
  return typeof value === 'object' && !Array.isArray(value);
}

export function attributesOf(node: XmlNode): XmlAttributes {
  const attrs = node[ATTR_KEY];
  return isAttributeBag(attrs) ? attrs : {};
}

export function getAttribute(node: XmlNode, name: string): string | undefined {
  return attributesOf(node)[ATTR_PREFIX + name];
}

/** Matches `name` against the attribute's local name, ignoring any prefix. */
export function getAttributeByLocalName(node: XmlNode, name: string): string | undefined {
  const wanted = name.toLowerCase();
  for (const [key, value] of Object.entries(attributesOf(node))) {
    if (localName(key.slice(ATTR_PREFIX.length)).toLowerCase() === wanted) return value;
  }
  return undefined;
}

/**
 * All text under `node`. A `dc:description` sometimes carries inline markup,
 * and since the parser trims each text node, the pieces of mixed content are
 * rejoined with a space rather than butted together — `The <em>Surprise</em>
 * sails.` must not come back as `TheSurprisesails.`
 */
export function textOf(node: XmlNode): string {
  if (tagOf(node) === TEXT_KEY) {
    const value = node[TEXT_KEY];
    return typeof value === 'string' ? value : '';
  }
  const parts = childrenOf(node);
  if (parts.length <= 1) return parts[0] ? textOf(parts[0]) : '';
  return parts.map(textOf).join(' ').replace(/\s+/g, ' ').trim();
}

export function findChild(node: XmlNode, name: string): XmlNode | undefined {
  return childrenOf(node).find((child) => isElement(child, name));
}

export function findChildren(node: XmlNode, name: string): XmlNode[] {
  return childrenOf(node).filter((child) => isElement(child, name));
}

/* ── Writing ──────────────────────────────────────────────────────────────── */

export function setAttribute(node: XmlNode, name: string, value: string): void {
  const attrs = node[ATTR_KEY];
  if (isAttributeBag(attrs)) {
    attrs[ATTR_PREFIX + name] = value;
  } else {
    node[ATTR_KEY] = { [ATTR_PREFIX + name]: value };
  }
}

export function removeAttribute(node: XmlNode, name: string): void {
  const attrs = node[ATTR_KEY];
  if (!isAttributeBag(attrs)) return;
  const doomed = ATTR_PREFIX + name;
  node[ATTR_KEY] = Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== doomed),
  ) satisfies XmlAttributes;
}

/** Replaces the node's children with a single text node. */
export function setText(node: XmlNode, text: string): void {
  node[tagOf(node)] = [{ [TEXT_KEY]: text }];
}

export function createElement(
  tag: string,
  attributes: Readonly<Record<string, string>> = {},
  text?: string,
): XmlNode {
  const node: XmlNode = { [tag]: text === undefined ? [] : [{ [TEXT_KEY]: text }] };
  for (const [name, value] of Object.entries(attributes)) setAttribute(node, name, value);
  return node;
}

/** Replaces `node`'s child list in place, keeping the same node identity. */
export function setChildren(node: XmlNode, children: XmlNode[]): void {
  node[tagOf(node)] = children;
}
