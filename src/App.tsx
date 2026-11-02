import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ArtworkPanel } from "./components/ArtworkPanel";
import { BadgePanel } from "./components/BadgePanel";
import { BadgePreview } from "./components/BadgePreview";
import { ExportPanel } from "./components/ExportPanel";
import { LayoutPanel } from "./components/LayoutPanel";
import { SheetPreview } from "./components/SheetPreview";
import { Warnings } from "./components/Warnings";
import { renderDisc, discToPngBytes } from "./lib/compose";
import { downloadBlob } from "./lib/download";
import { buildPages, computeEffectiveLayout, pageSizeMm } from "./lib/layout";
import { sheetFileName, testSheetFileName } from "./lib/filename";
import { yieldToBrowser } from "./lib/timing";
import { effectiveDpi, canExport, validateStudio } from "./lib/validation";
import { resetAllSettings, useStudio } from "./state/store";

export default function App() {
  const badge = useStudio((state) => state.badge);
  const page = useStudio((state) => state.page);
  const layout = useStudio((state) => state.layout);
  const transform = useStudio((state) => state.transform);
  const artwork = useStudio((state) => state.artwork);
  const exporting = useStudio((state) => state.exporting);
  const exportError = useStudio((state) => state.exportError);

  const [pageIndex, setPageIndex] = useState(0);

  const effective = useMemo(
    () => computeEffectiveLayout(layout, page, badge),
    [layout, page, badge],
  );
  const pages = useMemo(() => buildPages(layout, page, badge), [layout, page, badge]);
  const paper = useMemo(() => pageSizeMm(page), [page]);

  const validationInput = useMemo(
    () => ({ badge, page, layout, transform, artwork, effective }),
    [badge, page, layout, transform, artwork, effective],
  );

  const warnings = useMemo(() => validateStudio(validationInput), [validationInput]);
  const dpi = effectiveDpi(artwork, transform, badge.cutMm);
  const exportReady = canExport(validationInput);

  const safeDiameter = badge.faceMm - badge.safeInsetMm * 2;
  const testReady =
    !!artwork &&
    badge.cutMm > 0 &&
    badge.faceMm > 0 &&
    badge.faceMm < badge.cutMm &&
    safeDiameter > 0 &&
    badge.cutMm <= Math.min(paper.widthMm, paper.heightMm) &&
    Number.isInteger(layout.copies) &&
    layout.copies > 0;

  const copies = Math.max(0, Math.floor(layout.copies));
  const fileName = sheetFileName(badge, page, layout, copies);

  useEffect(() => {
    const lastIndex = Math.max(0, pages.length - 1);
    if (pageIndex > lastIndex) setPageIndex(lastIndex);
  }, [pages.length, pageIndex]);

  async function handleExport(mode: "sheet" | "test") {
    const state = useStudio.getState();
    if (!state.artwork) return;

    state.setExporting(true);
    state.setExportError(null);
    await yieldToBrowser();

    try {
      const sizePx = Math.max(
        64,
        Math.round((state.badge.cutMm / 25.4) * state.layout.dpi),
      );
      const disc = renderDisc({
        artwork: state.artwork,
        transform: state.transform,
        cutMm: state.badge.cutMm,
        background: state.background,
        sizePx,
      });
      const imagePng = await discToPngBytes(disc);
      const { buildSheetPdf, buildTestSheetPdf } = await import("./lib/pdf");

      if (mode === "test") {
        const pdf = await buildTestSheetPdf({
          badge: state.badge,
          page: state.page,
          guides: state.guides,
          imagePng,
        });
        downloadBlob(pdf, testSheetFileName(state.badge));
      } else {
        const sheetPages = buildPages(state.layout, state.page, state.badge);
        if (sheetPages.length === 0) {
          throw new Error("There are no pages to export. Check the layout warnings.");
        }
        const pdf = await buildSheetPdf({
          badge: state.badge,
          page: state.page,
          guides: state.guides,
          pages: sheetPages,
          imagePng,
        });
        downloadBlob(
          pdf,
          sheetFileName(
            state.badge,
            state.page,
            state.layout,
            Math.max(0, Math.floor(state.layout.copies)),
          ),
        );
      }
    } catch (cause) {
      state.setExportError(
        cause instanceof Error ? cause.message : "The PDF could not be created.",
      );
    } finally {
      state.setExporting(false);
    }
  }

  return (
    <div className="app-shell">
      <AppHeader />

      <main className="studio-grid">
        <div className="controls">
          <BadgePanel />
          <ArtworkPanel />
          <LayoutPanel
            effective={effective}
            pageIndex={pageIndex}
            pageCount={pages.length}
          />
          <ExportPanel
            canExport={exportReady}
            canTest={testReady}
            exporting={exporting}
            error={exportError}
            fileName={fileName}
            onExport={() => void handleExport("sheet")}
            onTestExport={() => void handleExport("test")}
          />
        </div>

        <div className="workspace">
          <BadgePreview dpi={dpi} />
          <Warnings warnings={warnings} />
          <SheetPreview
            pages={pages}
            pageIndex={pageIndex}
            onPageChange={setPageIndex}
          />
        </div>
      </main>

      <footer className="app-footer">
        <span>
          Badge {badge.faceMm} mm · cut {badge.cutMm} mm · {effective.cols} ×{" "}
          {effective.rows} grid · {copies} copies
        </span>
        <span className="footer-privacy">
          No uploads. No accounts. Print at 100%.
        </span>
        <button type="button" className="footer-reset" onClick={resetAllSettings}>
          Reset preferences
        </button>
      </footer>
    </div>
  );
}
