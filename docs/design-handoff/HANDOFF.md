# Handoff: Bindery — EPUB → Kindle rebinding tool

## Overview
Bindery is a four-step web wizard that takes an existing EPUB file, replaces its cover image with a user-supplied portrait sized for Kindle, rewrites its metadata (title, author, summary and eight secondary fields), and emits a single .epub file suitable for sending to a Kindle.

The design in this bundle is a **clickable prototype**: the file pickers and cover preview are real (local FileReader / object URLs), metadata prefill is heuristic (parsed from the filename), and the final "Bind and download" action is simulated. The production task includes the real work: parsing the EPUB container, swapping the cover and its manifest references, rewriting the OPF metadata, and repacking the zip.

## About the Design Files
`Bindery.dc.html` in this folder is a **design reference created in HTML** — a prototype showing intended look and behavior, not production code to copy. It uses a small in-house streaming template runtime (`support.js`) and a bound design-system stylesheet (`styles.css`); neither is meant to ship.

The task is to **recreate this design in the target codebase's existing environment** (React, Vue, Svelte, etc.) using its established patterns, component library and state management. If no environment exists yet, choose the framework that fits the project — a client-only SPA is sufficient, since all processing happens in the browser.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy and interaction states are final. Recreate the UI faithfully using the codebase's own primitives, keeping the exact token values listed under Design Tokens.

## Screens / Views

The whole tool is one page: a header, a 4-step stepper, one step panel at a time, a back/continue bar, and a footer. Page container: `max-width: 980px`, centered, `padding: 44px 40px 64px`, background `radial-gradient(120% 80% at 12% -10%, #241812 0%, #17110e 55%)`, text `#ece1d0`.

### Header (persistent)
- Row, `align-items: flex-end; justify-content: space-between; gap: 24px`, bottom rule that fades out at both ends (`border-image: linear-gradient(90deg, transparent, #3d302a 12%, #3d302a 70%, transparent) 1`), `padding-bottom: 18px`.
- Left: logo mark (46×46 inline SVG, `viewBox 0 0 34 34`, `margin-top: 3px`) + text stack, `gap: 16px`.
  - Mark: rounded square `rx=8`, fill `#241b17`, 1px stroke `#7a3527`; an open book drawn as two mirrored 1.3px `#c4b3a1` curves; the spine is a 1.6px `#b4553f` vertical line; a small filled `#b4553f` ribbon notch at the top right of the book block. Exact paths are in the HTML.
  - Kicker: "Bindery — epub to Kindle", Inter 10px, `letter-spacing: .18em`, uppercase, `#a89482`.
  - Title: "Rebind a book", Spectral 34px / 1.05, weight 400, `letter-spacing: -.01em`.
- Right: "Replace the portrait, correct the record, and send one clean file to your Kindle." — Inter 12.5px / 1.6, `#a89482`, `max-width: 300px`, `text-wrap: pretty`.

### Stepper (persistent)
Four equal flex items (`flex: 1 1 0`), each: a 30px circular button + a two-line label + a connector line (hidden on the last item). Steps are clickable and jump directly to that step (no validation gate).
- Circle: `border-radius: 50%`, 1px border, Spectral 13px, centered.
  - Current: background `rgba(180,85,63,.16)`, border `#b4553f`, text `#edc9bb`, plus `box-shadow: 0 0 0 4px rgba(180,85,63,.09)`.
  - Completed: transparent, border `#7a3527`, text `#d99c86`, glyph "✓".
  - Upcoming: transparent, border `#3d302a`, text `#8a7364`, glyph = step number.
- Label stack, `padding-left: 10px`, `gap: 2px`: "Step N" (plate style, `#b4553f` when current else `#55443b`) over the name in Spectral 14px (`#ece1d0` when current or done, else `#8a7364`).
- Names: **Upload, Portrait, Record, Bind**.
- Connector: `height: 1px; margin: 0 14px; min-width: 18px`, `linear-gradient(90deg, …)` from `#7a3527` (completed) or `#3d302a` to `#7a3527` / `#241c18`.

### Step 1 — Upload
Grid `1.15fr 0.85fr`, `gap: 28px`, `align-items: start`.
- Left column (`gap: 14px`):
  - H2 "The book file" — Spectral 21px, weight 400.
  - Drop target: a `<label>` wrapping a visually hidden `<input type="file" accept=".epub,application/epub+zip">`. `padding: 34px 26px`, `border: 1px dashed #55443b`, `radius: 8px`, background `linear-gradient(160deg, rgba(180,85,63,.055), rgba(36,27,23,.5))`. Hover: border `#b4553f`, gradient stops go to `.11` / `.6`. Contains a 26px Phosphor-style upload-file icon stroked `#b4553f`, then "Drop an .epub here, or choose a file" (Inter 14px / 500) over "Metadata inside is read and prefilled for you" (plate, 11.5px, `letter-spacing: .1em`, sentence case).
  - After a file is chosen: a `.card` row (`padding: 14px 16px`, radius 8) with the filename (Inter 13.5px / 500, ellipsis on overflow) over "<size> · metadata prefilled" (plate), and a right-aligned accent tag reading "Read". Size formatting: `>1 MiB` → one decimal "MB", else rounded "KB" (min 1).
- Right column: aside, background `#201814`, radius 8, `box-shadow: 0 0 0 1px #3d302a`, `padding: 20px 20px 22px`, `gap: 10px`: plate "Ex libris"; body "Nothing leaves this page. The file is opened locally, the portrait swapped, the record retyped, and a single .epub written back out." (12.5px / 1.7, `#c4b3a1`); a 1px fading rule; plate "Accepted: EPUB 2 and 3, up to 200 MB."

### Step 2 — Portrait
Grid `1fr 300px` (collapses to `1fr` when the Kindle preview is disabled), `gap: 34px`.
- Left (`gap: 16px`): H2 "The portrait"; an image drop label (same dashed treatment, `padding: 18px 20px`, horizontal, 22px image icon) with `<input type="file" accept="image/*">`, text "Choose a cover image" over "JPEG or PNG · target 1600 × 2560".
- Fit control: plate "Fit to Kindle 1600 × 2560" over a segmented control with **Crop to fill** / **Fit whole, pad edges**. Selected option: background `rgba(180,85,63,.16)`, text `#edc9bb`, border `#b4553f`. Unselected: `background: transparent`, text `#a89482`, border `#3d302a` (must be explicit — otherwise the UA button face shows through).
- Source readout: plate "Source" over either "<filename> · <w> × <h> px" or "No image chosen — the cover already inside the EPUB is kept."
- Low-resolution warning, shown when the chosen image's natural width < threshold (default 1600, configurable): background `#341a11`, `border-left: 2px solid #b4553f`, radius 8, `padding: 13px 15px`, an 18px warning-circle icon stroked `#d99c86`, copy "This image is <W> px wide — under the <T> px Kindle covers want. It will be upscaled, and text on the jacket may soften." in `#edc9bb` 12.5px / 1.6.
- Right: device preview. Outer shell `padding: 16px 16px 34px` (heavier chin), background `#2b211c`, radius 12, `box-shadow: 0 0 0 1px #55443b, 0 6px 18px rgba(0,0,0,.55)`. Screen `236 × 378`, background `#0d0907`, radius 3, overflow hidden. Inside: the cover `<img>` at `width/height: 100%`, `object-fit: cover` when cropping and `contain` when padding; when no cover, centered plate "No portrait yet". Caption below: plate "Kindle preview", `letter-spacing: .14em`.

### Step 3 — Record
Single column, `max-width: 720px`, `gap: 20px`. H2 "The record".
- Core fields, each a label (plate) over a full-width `.input`:
  - **Title** — placeholder "Book title"
  - **Author** — placeholder "Surname, Given name"
  - **Summary** — `<textarea rows="5">`, `resize: vertical`, `line-height: 1.6`, placeholder "A paragraph the Kindle shows on the book's detail page."
- Disclosure button (no background/border, `#d99c86`, 12.5px, hover `#edc9bb`): a "▸" caret that rotates 90° over `transform 140ms ease`, and a label that reads "Series, language, publisher and six more" when collapsed and "Fewer fields" when open.
- Expanded panel: two-column grid, `gap: 16px 20px`, `padding: 20px`, background `#201814`, radius 8, `box-shadow: 0 0 0 1px #3d302a`. Fields in order: Series ("e.g. The Aubrey–Maturin"), Number in series ("3"), Language ("en"), Publisher ("Imprint"), Publication date ("1969-10-01"), ASIN / ISBN ("9780393037012"), then full-width Tags & subjects ("Naval fiction, Historical, 19th century"), then full-width "Reading order" as a segmented control **Left to right** / **Right to left** (same selected/unselected styling as the fit control).

### Step 4 — Bind
Grid `1fr 220px`, `gap: 34px`.
- Left: H2 "Ready to bind"; a `.table` (13px) of label/value rows, label cell `width: 34%` in plate style, value in `#ece1d0`, `padding: 10px 0`:
  Title · Author · Series ("<series> #<n>", or "—") · Portrait ("Replaced · cropped to 1600 × 2560" / "Replaced · padded to 1600 × 2560" / "Kept from source file") · Language ("<lang>" plus " · right to left" when RTL) · Publisher · Published · Identifier · Tags · Output (slugified title + ".epub", fallback "book.epub"). Empty values render "—".
- Action row (`gap: 16px`, `padding-top: 4px`): outlined primary button, label cycling "Bind and download" → "Binding…" → "Downloaded ✓"; beside it a plate note, "One file, written in your browser." and after completion "Saved as <output filename> — send it to your Kindle."
- Right: a small cover card — background `#201814`, radius 8, `padding: 18px`, `box-shadow: 0 0 0 1px #3d302a`; a `130 × 208` screen (`#0d0907`, radius 2) with the cover under the same object-fit rule; below it the title in Spectral 14px, centered, `line-height: 1.35`, then the author as a plate line.

### Navigation bar (persistent, below the step panel)
Row, `justify-content: space-between`, `padding-top: 10px`, top rule fading at both ends. Left: ghost "Back" button, `visibility: hidden` on step 1. Right: a plate hint then the primary button ("Continue", or "Review" on step 3; hidden on step 4).
Hints by step: step 1 "Choose an .epub to begin." until a file exists; step 2 "You can keep the original cover and move on." until a cover is chosen; step 3 "A title is the one field Kindle really needs." until a title is typed; step 4 none.

### Footer (persistent)
Row, `justify-content: space-between`, `margin-top: 8px`, `padding-top: 16px`, top rule fading at both ends. Left plate "© 2026 Bindery", right plate "Developed by devemg", both `letter-spacing: .1em`.

## Interactions & Behavior
- **Step navigation**: Continue/Back move one step; stepper circles jump to any step. No hard validation — the hints are advisory. If production needs gating, block Continue on step 1 until an EPUB is present (the prototype already computes this flag).
- **EPUB selection**: reads name and size, then prefills metadata. Prefill heuristic: strip `.epub`, replace `_` with spaces; if the name splits on " - ", the first part is the author and the rest the title; if the title ends in a number < 40, that number becomes "Number in series" and the preceding text the series; language defaults to "en"; author falls back to "Unknown author". **In production, replace this with a real OPF read** (`META-INF/container.xml` → the rootfile OPF → `dc:title`, `dc:creator`, `dc:description`, `dc:language`, `dc:publisher`, `dc:date`, `dc:identifier`, `dc:subject`, `calibre:series` / `belongs-to-collection`, and `page-progression-direction` on `<spine>`), keeping the filename parse only as a fallback when the OPF is empty.
- **Cover selection**: creates an object URL, loads it into an `Image` to capture natural dimensions, then renders the preview and evaluates the low-res warning. Revoke object URLs on replace/unmount in production.
- **Fit toggle**: switches the preview between `object-fit: cover` and `contain`. In production this decides the actual resample: crop-to-fill centers and crops to 1600 × 2560; fit-whole letterboxes onto a 1600 × 2560 canvas (pad with a neutral drawn from the image's own edge, or `#0d0907`).
- **Metadata inputs**: uncontrolled-feel text entry committed to state; all fields optional except that a title is expected.
- **Disclosure**: pure client toggle, caret rotation 140ms ease.
- **Bind**: first click enters a "Binding…" state, second lands on "Downloaded ✓". In production: build the new EPUB, then trigger the download once, with a real progress or spinner state and an error state for malformed EPUBs (missing container.xml, encrypted content, unsupported zip).
- **Hover/focus**: every interactive element gets an accent-tinted hover; keyboard focus uses `outline: 2px solid var(--color-accent); outline-offset: 2px` — never the browser default.
- **Responsive**: the prototype targets desktop (fixed 980px column, two-column grids). If mobile matters, collapse each grid to a single column at ~840px and let the device preview shrink proportionally.

## State Management
```
step: 0..3
epubName: string
epubSize: number (bytes)
coverUrl: string (object URL)
coverW, coverH: number (natural px)
coverName: string
fit: "crop" | "pad"
rtl: boolean
showMore: boolean
built: 0 | 1 | 2        // idle / binding / done
meta: { title, author, summary, series, seriesNo, language, publisher, pubdate, ident, tags }
```
Transitions: EPUB pick → sets epubName/epubSize + prefilled meta. Cover pick → sets coverUrl/W/H/name after the image loads. Field edits → merge into meta. Fit and reading-order toggles → set fit / rtl. Disclosure → toggles showMore. Bind → advances built. No network requests; all processing is local.

Configurable options exposed in the prototype (worth keeping as props/settings): `showKindlePreview` (boolean, default true), `defaultFit` ("crop" | "pad", default "crop"), `lowResThreshold` (int px, default 1600, range 600–2400).

## Design Tokens

Brown-red "old library" palette overriding the base dark theme.

Roles
- bg `#17110e` (page gradient to `#241812`), surface `#241b17`, raised panel `#201814`, device shell `#2b211c`, device screen `#0d0907`
- text `#ece1d0`, muted `#c4b3a1`, dim `#a89482`, faint `#8a7364`, hairline `#3d302a`, dashed border `#55443b`
- accent `#b4553f`, secondary accent `#a8705a`
- divider: `color-mix(in srgb, #ece1d0 16%, transparent)`

Neutral ramp 100→900: `#faf4ea`, `#efe3d3`, `#ddcbb6`, `#c4b3a1`, `#a89482`, `#8a7364`, `#6a5449`, `#3d302a`, `#241c18`
Accent ramp 100→900: `#fdf1ec`, `#f7dcd2`, `#edc9bb`, `#d99c86`, `#b4553f`, `#97432f`, `#7a3527`, `#4d2318`, `#341a11`
Accent-2 ramp 100→900: `#fdf1ec`, `#f5ded4`, `#e8c8b9`, `#cfa08b`, `#a8705a`, `#8c5a46`, `#6f4635`, `#472c21`, `#2f1d16`
Accent tints used as fills: `rgba(180,85,63,.055)`, `.09`, `.11`, `.16`

Typography
- Headings: **Spectral** 300/400/500 (Google Fonts) — h1 34px/1.05 w400 `-.01em`; h2 21px w400; small serif labels 14px.
- Body / UI: **Inter** 400/500 — 14px (emphasis, w500), 13.5px, 13px, 12.5px/1.6–1.7 (prose).
- "Plate" label style (the book-plate small caps used throughout): Inter 10px, `letter-spacing: .18em`, `text-transform: uppercase`, color `#8a7364`; variants relax to `.1em`/`.06em` and drop the uppercase for sentence-case notes, and grow to 11.5px in the drop zones.

Spacing scale (0.7× density): 2.8 / 5.6 / 8.4 / 11.2 / 16.8 / 22.4 px, with layout gaps at 26 / 28 / 34 px and page padding 44 / 40 / 64 px.

Radii: 2 (device screen) · 3 · 4 (sm) · 8 (md — the default) · 12 (device shell) · 14 (lg) · 50% (stepper circles)

Shadows (dark ground = hairline edge + ambient darkness; do not stack)
- sm `0 0 0 1px #3d302a`
- md `0 0 0 1px #55443b, 0 6px 18px rgba(0,0,0,.55)`
- lg `0 0 0 1px #a89482, 0 16px 40px rgba(0,0,0,.65)`

Other conventions: horizontal rules fade to transparent at both ends over ~10–12% of their width rather than stopping cleanly; primary buttons are 1px accent outlines on transparent, never filled; no pure black or pure white anywhere except shadow ink.

## Assets
- **Logo**: inline SVG, drawn for this design, no external file. Full path data in `Bindery.dc.html`.
- **Icons**: Phosphor (https://phosphoricons.com), inlined as SVG paths on a 256 viewBox, stroked with the accent — an upload-file glyph (step 1), an image glyph (step 2), a warning circle (low-res notice). Swap to the codebase's icon package if it already carries Phosphor or an equivalent.
- **Fonts**: Spectral and Inter, loaded from Google Fonts in the prototype; self-host in production.
- **Cover images**: user-supplied at runtime. No bundled imagery, and no placeholder art is needed.

## Implementation notes for the real thing
The prototype stops where the real work starts. A browser-only implementation is viable:
1. Unzip the EPUB (e.g. `fflate` / `jszip`), preserving `mimetype` as the first, stored (uncompressed) entry when repacking.
2. Read `META-INF/container.xml` to find the OPF; parse it as XML, not with regex.
3. Resample the new cover to 1600 × 2560 on a canvas per the fit mode; export JPEG at ~q0.9.
4. Replace the existing cover image item in place where one exists (keep its href and id so `<meta name="cover">`, the `cover-image` property and any cover XHTML page keep resolving); otherwise add a manifest item with `properties="cover-image"` plus the legacy `<meta name="cover">` for older Kindles.
5. Rewrite the `dc:*` metadata, series (`belongs-to-collection` + `group-position` for EPUB 3, `calibre:series`/`calibre:series_index` for compatibility), and set `page-progression-direction` on `<spine>` for RTL.
6. Repack and download as `<slugified-title>.epub`.
Kindle-specific caveat worth surfacing in the UI: Send-to-Kindle accepts EPUB and converts server-side, so cover and metadata must be correct inside the file — Amazon will not ask.

## Files
- `Bindery.dc.html` — the full prototype (template markup + logic class in one file). This is the design of record.
- `styles.css` — the design-system token sheet and component classes the prototype links (`.btn`, `.input`, `.field`, `.seg`, `.card`, `.table`, `.tag`). Reference for the base component styling; the palette above overrides its color tokens.
- `support.js` — the streaming template runtime the prototype file needs in order to open in a browser. Not part of the design; do not port it.
