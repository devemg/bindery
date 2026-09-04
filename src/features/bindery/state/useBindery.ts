import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { EpubError, asEpubError } from '../../../lib/epub/errors';
import { metadataFromFilename } from '../../../lib/epub/filenameFallback';
import { parseOpf } from '../../../lib/epub/parseOpf';
import { readEpub } from '../../../lib/epub/readEpub';
import { rebindEpub, type CoverSource } from '../../../lib/epub/rebind';
import type { Fit, MetadataField, ReadingDirection } from '../../../lib/epub/types';
import { bytesToBlob, downloadBlob } from '../../../lib/download';
import { outputFilename } from '../../../lib/format';
import { resampleCover } from '../../../lib/image/resampleCover';
import { useImageDimensions } from '../hooks/useImageDimensions';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { binderyReducer, initialState } from './binderyReducer';
import type { BinderySettings, BinderyState, Step } from './types';

export interface BinderyActions {
  goToStep: (step: Step) => void;
  back: () => void;
  forward: () => void;
  selectEpub: (file: File) => void;
  selectCover: (file: File) => void;
  setField: (field: MetadataField, value: string) => void;
  setFit: (fit: Fit) => void;
  setDirection: (direction: ReadingDirection) => void;
  toggleDisclosure: () => void;
  bind: () => void;
}

export interface Bindery {
  readonly state: BinderyState;
  readonly actions: BinderyActions;
  readonly settings: BinderySettings;
}

/**
 * Everything asynchronous lives here, and reaches the reducer as plain actions:
 * reading the book, decoding the portrait, and the bind pipeline itself. The
 * reducer stays pure, so the whole state machine can be reasoned about without
 * a browser.
 */
export function useBindery(settings: BinderySettings): Bindery {
  const [state, dispatch] = useReducer(binderyReducer, settings.defaultFit, initialState);

  // The object URL and the natural size are owned by hooks that revoke and
  // cancel cleanly; the reducer is told the result once it is known.
  const coverUrl = useObjectUrl(state.coverFile);
  const measurement = useImageDimensions(coverUrl);

  useEffect(() => {
    if (measurement.status === 'ready' && coverUrl) {
      dispatch({
        type: 'cover/measured',
        url: coverUrl,
        width: measurement.dimensions.width,
        height: measurement.dimensions.height,
      });
    } else if (measurement.status === 'failed') {
      dispatch({ type: 'cover/failed', error: new EpubError('image-decode-failed') });
    }
  }, [coverUrl, measurement]);

  const selectEpub = useCallback((file: File) => {
    dispatch({ type: 'epub/reading', name: file.name, size: file.size });

    void (async () => {
      try {
        const archive = await readEpub(new Uint8Array(await file.arrayBuffer()));
        const { metadata, direction } = parseOpf(archive.opfXml);
        // The filename heuristic is a fallback, never an override.
        const meta = metadata.title ? metadata : metadataFromFilename(file.name, metadata);
        dispatch({ type: 'epub/read', archive, meta, direction });
      } catch (error) {
        dispatch({ type: 'epub/failed', error: asEpubError(error, 'unsupported-zip') });
      }
    })();
  }, []);

  const bind = useCallback(() => {
    const { archive, meta, coverFile, fit, rtl } = state;
    if (!archive || state.build.kind === 'building') return;

    dispatch({ type: 'build/started' });

    void (async () => {
      try {
        dispatch({ type: 'build/progressed', progress: 0.1 });

        let cover: CoverSource | undefined;
        if (coverFile) {
          const resampled = await resampleCover(coverFile, fit);
          cover = {
            bytes: new Uint8Array(await resampled.blob.arrayBuffer()),
            mediaType: resampled.mediaType,
          };
          dispatch({ type: 'build/progressed', progress: 0.55 });
        }

        const bytes = await rebindEpub({
          archive,
          metadata: meta,
          direction: rtl ? 'rtl' : 'ltr',
          ...(cover ? { cover } : {}),
        });
        dispatch({ type: 'build/progressed', progress: 0.95 });

        const filename = outputFilename(meta.title);
        downloadBlob(bytesToBlob(bytes, 'application/epub+zip'), filename);
        dispatch({ type: 'build/finished', filename });
      } catch (error) {
        dispatch({ type: 'build/failed', error: asEpubError(error, 'repack-failed') });
      }
    })();
  }, [state]);

  const actions = useMemo<BinderyActions>(
    () => ({
      goToStep: (step) => {
        dispatch({ type: 'step/goto', step });
      },
      back: () => {
        dispatch({ type: 'step/back' });
      },
      forward: () => {
        dispatch({ type: 'step/forward' });
      },
      selectEpub,
      selectCover: (file) => {
        dispatch({ type: 'cover/selected', file, name: file.name });
      },
      setField: (field, value) => {
        dispatch({ type: 'meta/changed', field, value });
      },
      setFit: (fit) => {
        dispatch({ type: 'fit/changed', fit });
      },
      setDirection: (direction) => {
        dispatch({ type: 'direction/changed', direction });
      },
      toggleDisclosure: () => {
        dispatch({ type: 'disclosure/toggled' });
      },
      bind,
    }),
    [bind, selectEpub],
  );

  return useMemo(() => ({ state, actions, settings }), [state, actions, settings]);
}
