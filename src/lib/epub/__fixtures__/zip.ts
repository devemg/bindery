/** Just enough zip format to assert the things Kindle actually cares about. */

const LOCAL_FILE_HEADER = 0x04034b50;

export interface FirstEntry {
  readonly name: string;
  /** 0 is STORED, 8 is DEFLATE. */
  readonly compressionMethod: number;
  readonly extraFieldLength: number;
}

export function readFirstEntry(zip: Uint8Array): FirstEntry {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  if (view.getUint32(0, true) !== LOCAL_FILE_HEADER) {
    throw new Error('not a zip: no local file header at offset 0');
  }

  const compressionMethod = view.getUint16(8, true);
  const nameLength = view.getUint16(26, true);
  const extraFieldLength = view.getUint16(28, true);
  const name = new TextDecoder().decode(zip.subarray(30, 30 + nameLength));

  return { name, compressionMethod, extraFieldLength };
}
