import { parseOpf } from './parseOpf';
import type { EpubArchive } from './readEpub';
import { replaceCover } from './replaceCover';
import type { BookMetadata, ReadingDirection } from './types';
import { encodeText, writeEpub } from './writeEpub';
import { writeOpf } from './writeOpf';

/** The new cover, already resampled to the Kindle canvas. */
export interface CoverSource {
  readonly bytes: Uint8Array;
  readonly mediaType: string;
}

export interface RebindInput {
  readonly archive: EpubArchive;
  readonly metadata: BookMetadata;
  readonly direction: ReadingDirection;
  /** Omitted when the reader kept the cover already inside the book. */
  readonly cover?: CoverSource;
}

/**
 * Read record and cover in, one valid EPUB out.
 *
 * The whole pipeline is a single pass over one parsed OPF: the cover swap and
 * the record rewrite both mutate the same document, so they cannot disagree
 * about what the file now says.
 */
export async function rebindEpub(input: RebindInput): Promise<Uint8Array> {
  const { archive, metadata, direction, cover } = input;
  const { document } = parseOpf(archive.opfXml);
  const overrides = new Map<string, Uint8Array>();

  if (cover) {
    const placement = replaceCover(document, archive.opfPath, cover.mediaType);
    overrides.set(placement.zipPath, cover.bytes);
  }

  overrides.set(archive.opfPath, encodeText(writeOpf(document, metadata, direction)));
  return writeEpub(archive, overrides);
}
