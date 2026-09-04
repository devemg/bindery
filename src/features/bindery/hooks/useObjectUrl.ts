import { useEffect, useState } from 'react';

/**
 * One live object URL per blob. The previous URL is revoked when the blob
 * changes and again on unmount, so choosing five covers in a row does not pin
 * five images in memory for the rest of the session.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const created = URL.createObjectURL(blob);
    setUrl(created);
    return () => {
      URL.revokeObjectURL(created);
    };
  }, [blob]);

  return url;
}
