# Pin Badge Studio

A browser-based design and print-sheet generator for round pin badges. Choose 25 mm or
44 mm, frame your artwork inside the printed disc, lay copies out on A4, US Letter, or
custom paper, and export a millimetre-accurate PDF with optional cutting guides. Use the
separate test print to verify the 100 mm calibration ruler and the cut circle.

Artwork is processed entirely in the browser. There is no upload, no account, and no
analytics.

## Features

- **25 mm and 44 mm presets** with editable cut diameter and safe inset.
- **Finished-face preview** that separates the printed cut disc from what stays visible
  after the paper wraps around the shell.
- **Artwork framing** with zoom, pan, rotation, and a background colour for transparency.
- **Effective DPI estimate** with a warning below 200 DPI.
- **Repeat sheets** using automatic maximum fit or an explicit columns × rows grid.
- **Paper sizes**: A4, US Letter, and custom dimensions entered in mm, cm, or inches.
- **Automatic pagination** with a correctly centred partial final page.
- **Exact-size PDF export** at 300 or 600 DPI, with optional cut line, face ring, safe ring,
  and page labels.
- **Single-badge test print** with a 100 mm ruler for verifying printer scaling and press fit.
- **Local preferences**: settings persist, artwork deliberately does not.

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL. Build a static bundle with:

```bash
npm run build
npm run preview
```

## How to use

1. Pick **25 mm** or **44 mm**. The cut disc defaults to 35 mm or 54 mm.
2. Upload a PNG, JPG, WebP, or SVG and frame it in the badge preview.
3. Choose paper, orientation, margin, gap, and copies. Use **Fill sheet** for a full page.
4. Check the **Sheet preview** and warnings.
5. Download the PDF, or export a **test print** first.
6. Print at **100% / Actual size**. Do not use “Fit to page”.

### Verify the print

On the test sheet, measure the 100 mm ruler. It must measure 100 mm ±0.5 mm. Then measure
the cut circle; it must match the configured diameter within ±0.3 mm.

If the ruler is right but the circle is wrong, edit the cut diameter to match your press.
Some 44 mm presses use a **52 mm** cut disc instead of the default 54 mm.

## Print model

The product treats three concentric circles as different things:

| Circle | Meaning |
| --- | --- |
| Cut disc | The paper you print and cut. Defaults: 35 mm for 25 mm badges, 54 mm for 44 mm badges. |
| Finished face | The visible front of the pressed badge. Defaults: 25 mm and 44 mm. |
| Safe area | The part of the face kept clear of important content. Default: 3 mm inside the face edge. |

All physical values are stored in millimetres. PDF points are derived only at export
(`mm × 72 / 25.4`), which is why A4 is exactly 595.28 × 841.89 pt. The app cannot control
printer driver scaling, so the ruler and test sheet exist to catch it.

## Privacy

- No network requests after the app loads.
- No server, database, or upload endpoint.
- The uploaded image is decoded into browser memory and released when replaced or removed.
- Only non-artwork settings are stored in `localStorage` under `pin-badge-studio/v1`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Typecheck and build the static bundle. |
| `npm run preview` | Serve the production build locally. |
| `npm run typecheck` | TypeScript only, no emit. |
| `npm run test` | Vitest unit tests (units, layout, validation, PDF construction). |
| `npm run test:e2e` | Playwright upload-to-PDF tests. |
| `npm run test:watch` | Vitest in watch mode. |

First-time end-to-end setup:

```bash
npx playwright install chromium
```

## Architecture

```text
src/
  components/        UI panels, badge preview, sheet preview, warnings
  lib/
    units.ts         mm / cm / in / pt conversion
    layout.ts        capacity, grid centring, pagination
    validation.ts    warnings and effective-DPI estimation
    image.ts         import, validation, downscaling
    compose.ts       circular composition shared by preview and export
    pdf.ts           exact-size PDF, guides, ruler, single image embedding
    filename.ts      descriptive output names
  state/store.ts     Zustand store with selective persistence
  styles/            design tokens and layout
tests/
  unit/              pure geometry, validation, and PDF tests
  e2e/               browser upload-to-PDF tests
```

The badge is composed once at the selected export DPI, embedded once in the PDF, and
reused for every slot. `pdf-lib` builds the page at the exact physical size; cut guides
and the test-print ruler remain vector. The PDF module is loaded on demand so the
initial app bundle stays small.

IBM Plex Sans and IBM Plex Mono are bundled locally through Fontsource, so the app still
makes no runtime network requests.

## Browser support

Current Chrome, Edge, Firefox, and Safari. Desktop is the primary experience; the layout
collapses to a single column on tablets and phones.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Badges are too large or small | Printer scaled the page | Print at 100% / Actual size |
| Badge does not fit the press shell | Cut diameter differs from the preset | Measure the press template and edit the cut diameter |
| Download is disabled | No artwork, zero capacity, or invalid dimensions | Check the warnings panel |
| Artwork looks soft | Effective resolution below 200 DPI | Use a larger source image or reduce zoom |
| Grid is empty | Manual grid or margins exceed the page | Reduce margin, gap, columns, or rows |
