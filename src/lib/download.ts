/**
 * Wraps engine output as a Blob.
 *
 * TypeScript 5.7 parameterises typed arrays by their backing buffer, and
 * `BlobPart` admits only ArrayBuffer-backed views. fflate always allocates a
 * fresh, non-shared buffer for its output, so narrowing the parameter here is
 * sound and avoids copying a whole book to satisfy the type.
 */
export function bytesToBlob(bytes: Uint8Array, type: string): Blob {
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type });
}

/**
 * Hands the finished book to the browser's download machinery. The object URL
 * is revoked on the next frame — long enough for the navigation to start, short
 * enough that a 40 MB book is not pinned in memory for the session.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.append(anchor);
  anchor.click();
  anchor.remove();

  requestAnimationFrame(() => {
    URL.revokeObjectURL(url);
  });
}
