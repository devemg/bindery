import { type AsyncZippable, zip } from 'fflate';
import { EpubError } from './errors';
import { MIMETYPE_PATH, type EpubArchive } from './readEpub';

const MIMETYPE = 'application/epub+zip';

/**
 * Repacks the archive with the given entries replaced or added.
 *
 * The one non-negotiable detail: `mimetype` is the first entry and is *stored*,
 * not deflated. Readers — Kindle's converter among them — sniff those bytes at
 * a fixed offset, and a compressed mimetype makes the file unopenable even
 * though every other byte is correct.
 * @see https://www.w3.org/TR/epub-33/#sec-zip-container-mime
 */
export async function writeEpub(
  archive: EpubArchive,
  overrides: ReadonlyMap<string, Uint8Array> = new Map(),
): Promise<Uint8Array> {
  const zippable: AsyncZippable = {
    [MIMETYPE_PATH]: [encoder.encode(MIMETYPE), { level: 0 }],
  };

  for (const [path, data] of archive.entries) {
    if (path === MIMETYPE_PATH) continue;
    zippable[path] = overrides.get(path) ?? data;
  }
  for (const [path, data] of overrides) {
    if (path === MIMETYPE_PATH) continue;
    zippable[path] ??= data;
  }

  return deflate(zippable);
}

function deflate(zippable: AsyncZippable): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    // Async, so the deflate runs in a worker rather than on the step that
    // triggered it. Level 6 is the usual size/time compromise.
    zip(zippable, { level: 6 }, (error, output) => {
      if (error) reject(new EpubError('repack-failed', { cause: error }));
      else resolve(output);
    });
  });
}

const encoder = new TextEncoder();

export function encodeText(text: string): Uint8Array {
  return encoder.encode(text);
}
