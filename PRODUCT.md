# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a **small seller or maker** producing repeat batches of round pin badges for
online listings, market stalls, clubs, or events. Their current use is personal/hobby-scale rather
than a registered commercial business, but they care about repeatable output and selling-ready
results.

They work at a home or small-studio bench: a desktop printer, a hand press, badge shells and pin
backs, paper, and a circle cutter. Their job is to turn artwork into a correctly sized print sheet,
cut the discs, and press a batch without wasting parts or paper.

## Product Purpose

Pin Badge Studio makes a print-ready PDF for round pin badges. The user chooses a 25 mm or 44 mm
badge, frames artwork inside the printed disc, chooses paper and a repeat layout, and exports at
exact physical size.

Success means the printed sheet can be cut and pressed without resizing: the 100 mm calibration
line measures 100 mm, the cut circle matches the press, and every requested copy appears on the
sheet. The product exists to remove the guesswork and repeated trial prints from small badge runs.

## Positioning

The product's distinct mechanism is a **print-first geometry model**: the cut disc, finished face,
and safe area are treated as three separate physical dimensions, the press cut size remains
editable because manufacturers differ, and a single-badge test print verifies the printer before a
batch. This model is carried through the live preview, the sheet layout, and the exported PDF while
the artwork stays in the browser.

## Operating Context

- Small badge runs, typically a handful of copies through a few dozen per sheet.
- A4 and US Letter are the expected working papers; custom sizes are available when the printer
  or project needs them.
- The user prints at 100% / Actual size, then cuts and presses. Printer scaling and press cut-size
  variance are normal parts of the workflow.
- Artwork arrives as an existing PNG, JPG, WebP, or SVG file. The product does not create artwork.
- One design is repeated across a sheet; the same design is embedded once in the PDF.
- Repeat work is common, so previously used badge, paper, layout, transform, and guide settings are
  remembered on the device.

## Capabilities and Constraints

- Static client-side web application built with React, TypeScript, and Vite. There is no backend,
  account system, upload endpoint, or runtime network dependency.
- Badge presets: 25 mm finished / 35 mm cut, and 44 mm finished / 54 mm cut. The cut diameter and
  safe inset are editable; some 44 mm presses use a 52 mm cut rather than 54 mm.
- Paper: A4, US Letter, and custom sizes entered in millimetres, centimetres, or inches.
- Layout: automatic maximum fit or explicit columns × rows; copies and multipage sheets.
- Output: PDF only, 300 or 600 DPI, optional cut/face/safe guides and page labels, plus a dedicated
  single-badge test print with a 100 mm ruler. Batch sheets do not include the ruler.
- Artwork formats: PNG, JPG, WebP, SVG; 25 MB upload limit; transparent backgrounds are composited
  onto a user-selected colour.
- Current scope is one design repeated per sheet. Mixed designs, in-app artwork editing, accounts,
  cloud storage, direct printer control, and non-circular badges are not implemented.
- The app cannot control printer driver scaling; the test print and calibration ruler exist because
  that limitation cannot be removed in software.

## Brand Commitments

- Working name: **Pin Badge Studio** (from the current implementation; not explicitly confirmed by
  the user as final).
- The user requested a **purple interface accent**. No external logo files, brand guidelines,
  typography system, or marketing assets exist.
- Product voice is plain, direct, and physical: use badge-making language such as cut disc, finished
  face, wrap ring, safe area, press, and sheet.

## Evidence on Hand

- The 25 mm / 35 mm and 44 mm / 54 mm dimensions are user-provided press constraints; 52 mm is a
  known alternative for some 44 mm presses.
- There are no customer testimonials, reviews, sales figures, press mentions, photographs of real
  badge runs, or client logos. Future work must not invent them.
- The SVG design in the test fixture is sample test material, not a customer design.
- The product's privacy claim is verifiable in the implementation: no upload endpoint and no
  runtime network requests after the app loads.

## Product Principles

1. **Print accuracy before features.** Every new capability must preserve exact millimetre output
   and remain testable against the 100 mm ruler and cut circle.
2. **Privacy is part of the product.** Artwork stays on the device; do not add accounts, uploads, or
   cloud processing without an explicit product decision.
3. **Explain the physical wrap.** Always distinguish the cut disc, finished face, and safe area so
   the user can predict what survives pressing.
4. **Optimize for repeat batches.** Remember settings, make sheet filling fast, and keep multi-page
   output predictable.
5. **Keep the path direct.** Badge, artwork, sheet, export. Do not turn a small production tool into
   a general-purpose design suite.
