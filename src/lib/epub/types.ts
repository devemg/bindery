/**
 * The record Bindery owns. One type shared by the OPF parser, the OPF writer
 * and the form — the form's field list is derived from `META_FIELDS` below
 * rather than typed out a second time.
 */
export interface BookMetadata {
  title: string;
  author: string;
  summary: string;
  series: string;
  seriesNo: string;
  language: string;
  publisher: string;
  pubdate: string;
  ident: string;
  tags: string;
}

export type MetadataField = keyof BookMetadata;

export type ReadingDirection = 'ltr' | 'rtl';

/** How a new cover is fitted onto the 1600 x 2560 Kindle canvas. */
export type Fit = 'crop' | 'pad';

export const KINDLE_COVER_WIDTH = 1600;
export const KINDLE_COVER_HEIGHT = 2560;

/** The handoff's stated ceiling: "Accepted: EPUB 2 and 3, up to 200 MB." */
export const MAX_EPUB_BYTES = 200 * 1024 * 1024;

export const EMPTY_METADATA: BookMetadata = {
  title: '',
  author: '',
  summary: '',
  series: '',
  seriesNo: '',
  language: 'en',
  publisher: '',
  pubdate: '',
  ident: '',
  tags: '',
};

/**
 * Field descriptors, in the order the design lays them out. `core` fields are
 * the three always on screen; `extra` fields live behind the disclosure.
 */
export interface MetadataFieldSpec {
  readonly key: MetadataField;
  readonly label: string;
  readonly placeholder: string;
  readonly group: 'core' | 'extra';
  readonly control: 'text' | 'textarea';
  /** Spans both columns of the disclosure grid. */
  readonly fullWidth?: true;
}

export const META_FIELDS: readonly MetadataFieldSpec[] = [
  { key: 'title', label: 'Title', placeholder: 'Book title', group: 'core', control: 'text' },
  {
    key: 'author',
    label: 'Author',
    placeholder: 'Surname, Given name',
    group: 'core',
    control: 'text',
  },
  {
    key: 'summary',
    label: 'Summary',
    placeholder: "A paragraph the Kindle shows on the book's detail page.",
    group: 'core',
    control: 'textarea',
  },
  {
    key: 'series',
    label: 'Series',
    placeholder: 'e.g. The Aubrey–Maturin',
    group: 'extra',
    control: 'text',
  },
  {
    key: 'seriesNo',
    label: 'Number in series',
    placeholder: '3',
    group: 'extra',
    control: 'text',
  },
  { key: 'language', label: 'Language', placeholder: 'en', group: 'extra', control: 'text' },
  { key: 'publisher', label: 'Publisher', placeholder: 'Imprint', group: 'extra', control: 'text' },
  {
    key: 'pubdate',
    label: 'Publication date',
    placeholder: '1969-10-01',
    group: 'extra',
    control: 'text',
  },
  {
    key: 'ident',
    label: 'ASIN / ISBN',
    placeholder: '9780393037012',
    group: 'extra',
    control: 'text',
  },
  {
    key: 'tags',
    label: 'Tags & subjects',
    placeholder: 'Naval fiction, Historical, 19th century',
    group: 'extra',
    control: 'text',
    fullWidth: true,
  },
];

export const CORE_FIELDS = META_FIELDS.filter((field) => field.group === 'core');
export const EXTRA_FIELDS = META_FIELDS.filter((field) => field.group === 'extra');
