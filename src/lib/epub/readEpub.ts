import { type Unzipped, unzip } from 'fflate';
import { EpubError } from './errors';
import { MAX_EPUB_BYTES } from './types';
import {
  type XmlNode,
  attributesOf,
  childrenOf,
  findChild,
  getAttribute,
  isElement,
  parseXml,
} from './xml';

export const CONTAINER_PATH = 'META-INF/container.xml';
export const ENCRYPTION_PATH = 'META-INF/encryption.xml';
export const MIMETYPE_PATH = 'mimetype';
export const OPF_MEDIA_TYPE = 'application/oebps-package+xml';

/**
 * The two `EncryptionMethod` algorithms an unencrypted EPUB is allowed to use:
 * both are font obfuscation, not DRM, and the content is still readable.
 * @see https://www.w3.org/TR/epub-33/#sec-font-obfuscation
 */
const FONT_OBFUSCATION_ALGORITHMS = new Set([
  'http://www.idpf.org/2008/embedding',
  'http://ns.adobe.com/pdf/enc#RC',
]);

/** An EPUB opened but not yet understood: every entry, plus where the OPF is. */
export interface EpubArchive {
  /** Zip path -> bytes, in the archive's own entry order. */
  readonly entries: ReadonlyMap<string, Uint8Array>;
  readonly opfPath: string;
  readonly opfXml: string;
}

export async function readEpub(bytes: Uint8Array): Promise<EpubArchive> {
  if (bytes.byteLength > MAX_EPUB_BYTES) {
    throw new EpubError('file-too-large', { detail: String(bytes.byteLength) });
  }

  const unzipped = await inflate(bytes);
  const entries = new Map<string, Uint8Array>();
  for (const [path, data] of Object.entries(unzipped)) {
    // Zip directory entries carry no content and must not be repacked.
    if (path.endsWith('/')) continue;
    entries.set(path, data);
  }

  assertNotEncrypted(entries);

  const opfPath = findOpfPath(entries);
  const opfBytes = entries.get(opfPath);
  if (!opfBytes) throw new EpubError('missing-opf', { detail: opfPath });

  return { entries, opfPath, opfXml: decodeText(opfBytes) };
}

/**
 * fflate's async API hands the inflate to a worker, which keeps a mid-size book
 * from blocking the step transition that started it.
 */
function inflate(bytes: Uint8Array): Promise<Unzipped> {
  return new Promise((resolve, reject) => {
    unzip(bytes, (error, output) => {
      if (error) reject(new EpubError('unsupported-zip', { cause: error }));
      else resolve(output);
    });
  });
}

function assertNotEncrypted(entries: ReadonlyMap<string, Uint8Array>): void {
  const encryption = entries.get(ENCRYPTION_PATH);
  if (!encryption) return;

  let algorithms: string[];
  try {
    algorithms = collectEncryptionAlgorithms(parseXml(decodeText(encryption)));
  } catch (cause) {
    // An encryption declaration we cannot even read is not one to guess at.
    throw new EpubError('drm-protected', { cause });
  }

  const protectedBy = algorithms.find((algorithm) => !FONT_OBFUSCATION_ALGORITHMS.has(algorithm));
  if (protectedBy) throw new EpubError('drm-protected', { detail: protectedBy });
}

function collectEncryptionAlgorithms(nodes: readonly XmlNode[]): string[] {
  const found: string[] = [];
  const walk = (list: readonly XmlNode[]): void => {
    for (const node of list) {
      if (isElement(node, 'EncryptionMethod')) {
        found.push(getAttribute(node, 'Algorithm') ?? '');
      }
      walk(childrenOf(node));
    }
  };
  walk(nodes);
  // An encryption.xml that declares nothing still means something is encrypted.
  return found.length > 0 ? found : [''];
}

function findOpfPath(entries: ReadonlyMap<string, Uint8Array>): string {
  const container = entries.get(CONTAINER_PATH);
  if (!container) throw new EpubError('missing-container');

  const root = parseXml(decodeText(container));
  const containerElement = root.find((node) => isElement(node, 'container'));
  const rootfiles = containerElement && findChild(containerElement, 'rootfiles');
  const candidates = rootfiles ? childrenOf(rootfiles).filter((n) => isElement(n, 'rootfile')) : [];

  const preferred =
    candidates.find((node) => getAttribute(node, 'media-type') === OPF_MEDIA_TYPE) ?? candidates[0];
  const fullPath = preferred && attributesOf(preferred)['@_full-path'];

  if (!fullPath) throw new EpubError('missing-container', { detail: 'no rootfile' });
  return fullPath;
}

const decoder = new TextDecoder('utf-8');

/** Decodes as UTF-8 and drops a byte-order mark, which XML parsers choke on. */
export function decodeText(bytes: Uint8Array): string {
  const text = decoder.decode(bytes);
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
