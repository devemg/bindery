/**
 * Zip paths inside an EPUB are always `/`-separated and relative to the
 * archive root; manifest hrefs are URI references relative to the OPF's own
 * directory. These four functions are the whole translation between them.
 */

/** `OEBPS/content.opf` -> `OEBPS`; a root-level file -> `''`. */
export function dirnameOf(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? '' : path.slice(0, slash);
}

export function basenameOf(path: string): string {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? path : path.slice(slash + 1);
}

export function extensionOf(path: string): string {
  const name = basenameOf(path);
  const dot = name.lastIndexOf('.');
  return dot <= 0 ? '' : name.slice(dot + 1).toLowerCase();
}

function normalizeSegments(segments: readonly string[]): string[] {
  const out: string[] = [];
  for (const segment of segments) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') out.pop();
    else out.push(segment);
  }
  return out;
}

/**
 * Resolves a manifest href against the OPF's directory, giving the zip path.
 * Hrefs are URI references, so percent escapes are decoded — a manifest saying
 * `images/cover%20art.jpg` addresses the zip entry `images/cover art.jpg`.
 */
export function resolveHref(opfDir: string, href: string): string {
  const withoutFragment = href.split('#')[0] ?? '';
  const decoded = safeDecode(withoutFragment);
  return normalizeSegments([...opfDir.split('/'), ...decoded.split('/')]).join('/');
}

/** The inverse: a zip path expressed as an href relative to the OPF. */
export function hrefFor(opfDir: string, zipPath: string): string {
  const base = normalizeSegments(opfDir.split('/'));
  const target = normalizeSegments(zipPath.split('/'));

  let shared = 0;
  while (shared < base.length && shared < target.length && base[shared] === target[shared]) {
    shared += 1;
  }
  const up = Array.from({ length: base.length - shared }, () => '..');
  return [...up, ...target.slice(shared)].map(encodeURIComponent).join('/');
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // A literal `%` that is not an escape. Take the href at face value.
    return value;
  }
}
