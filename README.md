# Bindery

Rebind an EPUB for Kindle — replace the cover, correct the metadata, download one clean file. Entirely in the browser.

**Nothing leaves your browser.** The EPUB file is opened locally in your tab, the cover is swapped, the record is rewritten, and a single .epub file is written back out. No upload, no server, no tracking.

## Getting Started

### Requirements

- Node.js 18+ (check with `node --version`)
- npm 10+ or pnpm 9+

### Installation

```bash
git clone <repo-url>
cd design_handoff_bindery
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The page reloads on file changes.

### Build for Production

```bash
npm run build
npm run preview
```

The `build` command runs TypeScript type checking, then Vite builds the bundle. The `preview` command serves the production build locally for testing.

## Project Structure

```
src/
├── app/                          # Application shell
│   ├── App.tsx                   # Root component with context setup
│   └── ErrorBoundary.tsx         # Catches unexpected React errors
│
├── features/bindery/             # Main EPUB rebinding feature
│   ├── components/               # 18 reusable UI components
│   │   ├── DropZone.tsx          # File input with drag-and-drop
│   │   ├── RichTextEditor.tsx    # Formatted text editing
│   │   ├── ChipsInput.tsx        # Tag/keyword input
│   │   ├── Stepper.tsx           # Wizard step indicator
│   │   ├── NavBar.tsx            # Next/Back/Reset buttons
│   │   └── ...
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useImageDimensions.ts # Measure image width/height
│   │   └── useObjectUrl.ts       # Manage Blob URLs
│   │
│   ├── state/                    # State management
│   │   ├── types.ts              # TypeScript types for state/actions
│   │   ├── binderyReducer.ts     # Pure reducer function
│   │   ├── binderyContext.ts     # React Context setup
│   │   ├── context.tsx           # Context provider component
│   │   ├── useBindery.ts         # Hook combining reducer + side effects
│   │   └── selectors.ts          # Derived state functions
│   │
│   ├── steps/                    # 4-panel wizard steps
│   │   ├── UploadStep.tsx        # Step 0: Select EPUB file
│   │   ├── PortraitStep.tsx      # Step 1: Select & preview cover
│   │   ├── RecordStep.tsx        # Step 2: Edit metadata
│   │   └── BindStep.tsx          # Step 3: Build & download
│   │
│   └── BinderyWizard.tsx         # Wizard orchestrator
│
├── lib/                          # Framework-agnostic business logic
│   │                             # (No React imports allowed — enforced by ESLint)
│   │
│   ├── epub/                     # EPUB parsing, rewriting, and repacking
│   │   ├── readEpub.ts           # Unzip and validate EPUB structure
│   │   ├── parseOpf.ts           # Parse package.opf metadata XML
│   │   ├── writeOpf.ts           # Update package.opf with new metadata
│   │   ├── rebind.ts             # Orchestrate cover swap + repack
│   │   ├── writeEpub.ts          # Repack archive and write ZIP
│   │   ├── replaceCover.ts       # Add/update cover in manifest
│   │   ├── types.ts              # Type definitions for EPUB operations
│   │   ├── errors.ts             # Typed error definitions
│   │   ├── xml.ts                # XML parsing and serialization
│   │   └── __fixtures__/         # Test data (sample EPUBs)
│   │
│   ├── image/                    # Image processing
│   │   ├── resampleCover.ts      # Resize/crop cover to Kindle dimensions
│   │   └── geometry.ts           # Image aspect ratio math
│   │
│   ├── sanitizeHtml.ts           # XSS protection for user-edited HTML
│   ├── download.ts               # Trigger browser download of Blob
│   ├── format.ts                 # Generate output filename
│   └── cx.ts                     # Utility for conditional CSS classes
│
├── styles/                       # Global Tailwind CSS
│   └── index.css
│
├── test/                         # Test configuration and setup
│   └── setup.ts
│
└── main.tsx                      # React entry point
```

## Architecture

### The lib/features Boundary

Bindery enforces a clear separation between business logic and UI:

- **`src/lib`** — Framework-agnostic engine. Pure functions for EPUB operations, image processing, and utilities. **No React imports allowed.** Enforced by ESLint.
- **`src/features`** — React UI layer. Components, hooks, and state management. Depends on `lib`.

This boundary keeps the core logic testable without React and reusable in other contexts (CLI tool, headless server, etc.).

### State Management

The wizard uses **React Context + useReducer** for state:

1. **Pure reducer** (`binderyReducer.ts`) — Synchronous, deterministic state transitions.
2. **Side effects** (`useBindery.ts`) — Async operations (file reading, image decoding, ZIP repacking) dispatch plain actions to the reducer.
3. **Selectors** (`selectors.ts`) — Derive display strings and computed values from state.

```
User action (click) → Component callback → dispatch(action) → Reducer → New state → Re-render
```

For async work:

```
User action → useEffect in useBindery → Read file/Decode image/Repack ZIP → dispatch(action) → Reducer → New state → Re-render
```

### The Wizard Flow

1. **Upload (Step 0)** — User selects EPUB file. `readEpub()` unzips and validates. `parseOpf()` extracts metadata and reading direction.
2. **Portrait (Step 1)** — User selects a cover image. `resampleCover()` resizes to Kindle dimensions (1600×2560). Optional crop/pad to fit.
3. **Record (Step 2)** — User edits metadata (title, author, summary, series, etc.). All changes stored in state.
4. **Bind (Step 3)** — User clicks "Bind." `rebindEpub()` orchestrates the rebinding: swaps cover in manifest, updates OPF metadata, repacks ZIP. Browser downloads the result.

Each step has independent render logic; stepping forward/back does not lose user input.

## Development Workflow

### Running Tests

```bash
npm run test           # Run unit tests once
npm run test:watch    # Run tests in watch mode
npm run test:e2e      # Run Playwright E2E tests (requires build)
```

### Linting and Formatting

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix ESLint issues
npm run format        # Format with Prettier
npm run format:check  # Check if formatting is needed
```

### Type Checking

```bash
npm run typecheck     # Run TypeScript compiler without emitting
```

Pre-commit hooks (via Husky) run linting and formatting before commits.

## How to Extend

### Adding a New Metadata Field

1. Add the field to `BookMetadata` in `src/lib/epub/types.ts`:

   ```typescript
   export interface BookMetadata {
     // ... existing fields
     myNewField: string;
   }
   ```

2. Add a field descriptor to `META_FIELDS` in the same file:

   ```typescript
   {
     key: 'myNewField',
     label: 'My Field',
     placeholder: 'Placeholder text',
     group: 'extra',  // or 'core'
     control: 'text',  // or 'textarea'
   }
   ```

3. Update `readMetadata()` in `src/lib/epub/parseOpf.ts` to extract the field from the OPF.

4. Update `applyMetadata()` in `src/lib/epub/writeOpf.ts` to write the field back to the OPF.

The form in `RecordStep` auto-generates from `META_FIELDS`, so no UI changes needed.

### Adding a New Error Type

1. Add the code to `EpubErrorCode` in `src/lib/epub/errors.ts`:

   ```typescript
   export type EpubErrorCode = 'existing-errors' | 'my-new-error'; // ← Add here
   ```

2. Add a message in the `MESSAGES` object:

   ```typescript
   const MESSAGES: Record<EpubErrorCode, string> = {
     // ... existing messages
     'my-new-error': 'A user-friendly message about what went wrong.',
   };
   ```

3. Throw the error in the appropriate place:

   ```typescript
   throw new EpubError('my-new-error', { detail: 'optional context' });
   ```

4. Handle it in the UI by switching on `error.code`.

### Adding a New Wizard Step

1. Create a new step component in `src/features/bindery/steps/MyStep.tsx`.
2. Add a new `Step` type value in `src/features/bindery/state/types.ts` (e.g., `type Step = 0 | 1 | 2 | 3 | 4`).
3. Add the component to the `PANELS` map in `BinderyWizard.tsx`.
4. Update `LAST_STEP` to the new maximum step number.
5. Add any new state fields to `BinderyState` and handle them in the reducer.

## Testing Strategy

- **Unit tests** — Pure functions in `src/lib/` (EPUB parsing, image resampling, formatting).
- **Component tests** — React components with user interactions (Testing Library).
- **E2E tests** — Full wizard flow in a real browser (Playwright).

Run tests before committing. Pre-commit hooks enforce this.

## Security & Privacy

- **No backend, no tracking.** Files are processed locally in the browser.
- **No upload.** Users keep their EPUBs.
- **HTML sanitization.** User-edited metadata is sanitized before being written to the EPUB to prevent XSS.
- **File validation.** EPUBs are validated for structure, encryption, and size limits (200 MB max).

## Configuration

### Environment

No environment variables required. All configuration is in the codebase:

- **Tailwind design tokens** — `tailwind.config.ts`
- **EPUB constraints** — `src/lib/epub/types.ts` (e.g., `MAX_EPUB_BYTES`, `KINDLE_COVER_WIDTH`)
- **Settings** — `src/features/bindery/state/types.ts` (`BinderySettings`)

### Tailwind CSS

Design tokens are defined once in `tailwind.config.ts` and replace Tailwind's defaults. Semantic names like `bg`, `accent`, `ink` enforce visual consistency. Arbitrary values (e.g., `bg-[#abc123]`) are not allowed; add them to the config instead.

### ESLint

The `src/lib` folder is restricted from importing React via ESLint rules. This is a design boundary, not just a convention. Try to import React in `src/lib` and the build will fail.

## Deployment

Build the production bundle:

```bash
npm run build
```

Output is in the `dist/` folder. Serve it as a static site (no server-side code needed).

Example deployment options:

- **Vercel:** Push to git, auto-deploys on `main`.
- **Netlify:** Connect repo, set build command to `npm run build`, deploy folder to `dist`.
- **GitHub Pages:** Build locally, push `dist/` to a `gh-pages` branch (or use Actions).

No database, no secrets, no environment config needed.

## Troubleshooting

### "Module not found" or "Cannot import" errors

Check that your import path is correct. Use relative paths from the current file (e.g., `../../../lib/epub/types.ts`). ESLint will catch invalid imports from `src/lib` into `src/features`.

### Tests fail with "jsdom does not implement X"

The test setup mocks some browser APIs (object URLs, canvas) that jsdom doesn't implement. See `src/test/setup.ts`. For full canvas testing, use Playwright E2E tests in a real browser.

### Build fails with TypeScript errors

Run `npm run typecheck` to see all errors. Fix them before building. Errors are not warnings; the build requires clean types.

### EPUB file "works in Apple Books but not Kindle"

Kindle is stricter than some readers. Common issues:

- Cover image too small (&lt;1600px wide)
- Invalid metadata (check dates are ISO 8601, identifiers are unique)
- Unsupported file types inside (some images, fonts)

Use a EPUB validator tool to check the output.

## Contributing

1. Fork the repo and create a feature branch.
2. Make changes, run tests, and ensure linting passes.
3. Commit with a clear message (pre-commit hooks enforce formatting).
4. Open a pull request with a description of changes.

### Code Standards

- **TypeScript strict mode.** No `any`, no non-null assertions without good reason.
- **Pure functions in `src/lib`.** No side effects, no React, testable in isolation.
- **Semantic HTML.** Use proper ARIA labels, roles, and attributes.
- **Comments only when necessary.** Code should be clear; comments explain _why_, not _what_.

## License

MIT (or as specified in the project).

## Questions?

Refer to the design handoff in `docs/design-handoff/HANDOFF.md` for UI/UX details and design tokens. For architecture questions, check the state types (`src/features/bindery/state/types.ts`) and the reducer (`src/features/bindery/state/binderyReducer.ts`).
