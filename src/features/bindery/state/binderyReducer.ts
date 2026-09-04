import { EMPTY_METADATA, type Fit } from '../../../lib/epub/types';
import { LAST_STEP, type BinderyAction, type BinderyState, type Step } from './types';

export function initialState(defaultFit: Fit): BinderyState {
  return {
    step: 0,
    epubName: '',
    epubSize: 0,
    archive: null,
    loadError: null,
    isReading: false,
    coverFile: null,
    coverUrl: '',
    coverW: 0,
    coverH: 0,
    coverName: '',
    fit: defaultFit,
    rtl: false,
    showMore: false,
    build: { kind: 'idle' },
    meta: EMPTY_METADATA,
  };
}

/**
 * Pure, and the only place the shape of the wizard changes. Everything
 * asynchronous — reading the file, decoding the image, building the book —
 * happens in `useBindery` and arrives here as a plain action.
 */
export function binderyReducer(state: BinderyState, action: BinderyAction): BinderyState {
  switch (action.type) {
    case 'step/goto':
      return state.step === action.step ? state : { ...state, step: clampStep(action.step) };

    case 'step/back':
      return state.step === 0 ? state : { ...state, step: clampStep(state.step - 1) };

    case 'step/forward':
      return state.step === LAST_STEP ? state : { ...state, step: clampStep(state.step + 1) };

    case 'wizard/reset':
      return initialState(action.defaultFit);

    case 'epub/reading':
      return {
        ...state,
        epubName: action.name,
        epubSize: action.size,
        archive: null,
        loadError: null,
        isReading: true,
        // A new book invalidates any finished bind of the previous one.
        build: { kind: 'idle' },
      };

    case 'epub/read':
      return {
        ...state,
        archive: action.archive,
        loadError: null,
        isReading: false,
        rtl: action.direction === 'rtl',
        meta: action.meta,
      };

    case 'epub/failed':
      return {
        ...state,
        archive: null,
        loadError: action.error,
        isReading: false,
        meta: EMPTY_METADATA,
      };

    case 'cover/selected':
      return {
        ...state,
        coverFile: action.file,
        coverName: action.name,
        // The preview stays empty until the image has actually decoded.
        coverUrl: '',
        coverW: 0,
        coverH: 0,
        build: idleAfterEdit(state),
      };

    case 'cover/measured':
      return state.coverUrl === action.url &&
        state.coverW === action.width &&
        state.coverH === action.height
        ? state
        : { ...state, coverUrl: action.url, coverW: action.width, coverH: action.height };

    case 'cover/failed':
      return {
        ...state,
        coverFile: null,
        coverName: '',
        coverUrl: '',
        coverW: 0,
        coverH: 0,
        build: { kind: 'error', error: action.error },
      };

    case 'meta/changed':
      return state.meta[action.field] === action.value
        ? state
        : {
            ...state,
            meta: { ...state.meta, [action.field]: action.value },
            build: idleAfterEdit(state),
          };

    case 'fit/changed':
      return state.fit === action.fit
        ? state
        : { ...state, fit: action.fit, build: idleAfterEdit(state) };

    case 'direction/changed': {
      const rtl = action.direction === 'rtl';
      return state.rtl === rtl ? state : { ...state, rtl, build: idleAfterEdit(state) };
    }

    case 'disclosure/toggled':
      return { ...state, showMore: !state.showMore };

    case 'build/started':
      return { ...state, build: { kind: 'building', progress: 0 } };

    case 'build/progressed':
      return state.build.kind === 'building'
        ? { ...state, build: { kind: 'building', progress: action.progress } }
        : state;

    case 'build/finished':
      return { ...state, build: { kind: 'done', filename: action.filename } };

    case 'build/failed':
      return { ...state, build: { kind: 'error', error: action.error } };
  }
}

function clampStep(step: number): Step {
  return Math.max(0, Math.min(LAST_STEP, step)) as Step;
}

/**
 * Editing anything after a successful bind retires the "Downloaded" state: the
 * file on disk no longer matches what the form says.
 */
function idleAfterEdit(state: BinderyState): BinderyState['build'] {
  return state.build.kind === 'building' ? state.build : { kind: 'idle' };
}
