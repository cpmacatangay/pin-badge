import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { AppHeader } from "./components/AppHeader";
import { ArtworkPanel } from "./components/ArtworkPanel";
import { BadgePanel } from "./components/BadgePanel";
import { BadgePreview } from "./components/BadgePreview";
import { ExportPanel } from "./components/ExportPanel";
import { LayoutPanel } from "./components/LayoutPanel";
import { Segmented } from "./components/Segmented";
import { SheetPreview } from "./components/SheetPreview";
import { Warnings } from "./components/Warnings";
import { renderDisc, discToPngBytes } from "./lib/compose";
import { downloadBlob } from "./lib/download";
import { buildPages, computeEffectiveLayout, pageSizeMm } from "./lib/layout";
import { sheetFileName, testSheetFileName } from "./lib/filename";
import { yieldToBrowser } from "./lib/timing";
import { effectiveDpi, canExport, validateStudio } from "./lib/validation";
import { formatNumber } from "./lib/units";
import { useStudio } from "./state/store";

type Pane = "setup" | "preview";

const PANE_OPTIONS: readonly { value: Pane; label: string }[] = [
  { value: "setup", label: "Set up" },
  { value: "preview", label: "Preview" },
];

export default function App() {
  const badge = useStudio((state) => state.badge);
  const page = useStudio((state) => state.page);
  const layout = useStudio((state) => state.layout);
  const transform = useStudio((state) => state.transform);
  const artwork = useStudio((state) => state.artwork);
  const exporting = useStudio((state) => state.exporting);
  const exportError = useStudio((state) => state.exportError);
  const setExportError = useStudio((state) => state.setExportError);

  const [pageIndex, setPageIndex] = useState(0);
  const [pane, setPane] = useState<Pane>("setup");
  const paneScroll = useRef<Record<Pane, number>>({ setup: 0, preview: 0 });
  const restorePaneScroll = useRef(false);

  function changePane(next: Pane) {
    if (next === pane) return;
    paneScroll.current[pane] = window.scrollY;
    restorePaneScroll.current = true;
    setPane(next);
  }

  useLayoutEffect(() => {
    if (!restorePaneScroll.current) return;
    restorePaneScroll.current = false;
    window.scrollTo({ top: paneScroll.current[pane] });
  }, [pane]);

  useEffect(() => {
    if (!exportError) return;
    paneScroll.current.setup = 0;
    setPane("setup");
    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: 0 });
      document.querySelector<HTMLElement>(".controls")?.scrollTo({ top: 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [exportError]);

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
  const paperName =
    page.paperId === "custom"
      ? "custom paper"
      : page.paperId === "letter"
        ? "US Letter"
        : "A4";
  const context = `${formatNumber(badge.faceMm, 1)} mm face · ${formatNumber(
    badge.cutMm,
    1,
  )} mm cut · ${effective.cols} × ${effective.rows} on ${paperName}`;

  useEffect(() => {
    const lastIndex = Math.max(0, pages.length - 1);
    if (pageIndex > lastIndex) setPageIndex(lastIndex);
  }, [pages.length, pageIndex]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        if (exportReady && !exporting) void handleExport("sheet");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exportReady, exporting]);

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
    <>
      <Analytics />
      <div className="app">
      <AppHeader
        context={context}
        canExport={exportReady}
        canTest={testReady}
        exporting={exporting}
        onExport={() => void handleExport("sheet")}
        onTestExport={() => void handleExport("test")}
      />

      <main className="sheet">
        <div className="pane-switch">
          <Segmented
            value={pane}
            options={PANE_OPTIONS}
            onChange={changePane}
            ariaLabel="Mobile view"
          />
        </div>

        <div className="workspace" data-pane={pane}>
          <div className="controls">
            <div className="panel-title">
              <div>
                <h1>Badge sheet</h1>
                <p className="sub">
                  {formatNumber(badge.faceMm, 1)} mm badge · {formatNumber(badge.cutMm, 1)} mm
                  cut · {effective.perPage} per page
                </p>
              </div>
              <span className="stamp">Saved locally</span>
            </div>

            <div className="page-status">
              {exportError ? (
                <div className="warning error export-error" role="alert">
                  <span className="warning-dot" aria-hidden="true" />
                  <div>
                    <strong>PDF could not be created.</strong>
                    <span>{exportError}</span>
                  </div>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setExportError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
              <Warnings warnings={warnings} />
            </div>

            <BadgePanel />
            <ArtworkPanel />
            <LayoutPanel effective={effective} pageIndex={pageIndex} pageCount={pages.length} />
            <ExportPanel fileName={fileName} />
          </div>

          <div className="preview-panel">
            <div className="preview-title-row">
              <div>
                <h2>Preview</h2>
                <p className="sub">Cut disc, finished face, and the printed sheet</p>
              </div>
              <span className="stamp">{layout.dpi} DPI</span>
            </div>

            <div className="preview-grid">
              <BadgePreview dpi={dpi} />
              <SheetPreview pages={pages} pageIndex={pageIndex} onPageChange={setPageIndex} />
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
