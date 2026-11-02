import { useEffect, useMemo, useState } from "react";
import { renderDisc } from "../lib/compose";
import { pageSizeMm } from "../lib/layout";
import type { PageLayout } from "../lib/types";
import { formatNumber } from "../lib/units";
import { useStudio } from "../state/store";
import { ArrowLeftIcon, ArrowRightIcon } from "./Icons";

interface SheetPreviewProps {
  pages: PageLayout[];
  pageIndex: number;
  onPageChange: (index: number) => void;
}

export function SheetPreview({ pages, pageIndex, onPageChange }: SheetPreviewProps) {
  const page = useStudio((state) => state.page);
  const badge = useStudio((state) => state.badge);
  const guides = useStudio((state) => state.guides);
  const artwork = useStudio((state) => state.artwork);
  const transform = useStudio((state) => state.transform);
  const background = useStudio((state) => state.background);

  const paper = pageSizeMm(page);

  // The badge preview stays live during a drag; the small sheet thumbnails can
  // settle a beat later instead of re-encoding the disc on every pointer move.
  const [settledTransform, setSettledTransform] = useState(transform);
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledTransform(transform), 120);
    return () => window.clearTimeout(timer);
  }, [transform]);

  const discUrl = useMemo(() => {
    if (!artwork) return null;
    try {
      const disc = renderDisc({
        artwork,
        transform: settledTransform,
        cutMm: badge.cutMm,
        background,
        sizePx: 512,
      });
      return disc.toDataURL("image/png");
    } catch {
      return null;
    }
  }, [artwork, settledTransform, badge.cutMm, background]);

  const safeIndex = pages.length > 0 ? Math.min(pageIndex, pages.length - 1) : 0;
  const current = pages[safeIndex];

  const faceRatio = badge.cutMm > 0 ? badge.faceMm / badge.cutMm : 1;
  const safeRatio =
    badge.cutMm > 0
      ? Math.max(0, badge.faceMm - badge.safeInsetMm * 2) / badge.cutMm
      : 1;
  const faceInset = ((1 - faceRatio) / 2) * 100;
  const safeInset = ((1 - safeRatio) / 2) * 100;

  return (
    <section className="preview-block" aria-labelledby="sheet-preview-title">
      <div className="sheet-head">
        <h3 id="sheet-preview-title">Sheet</h3>
        <div className="sheet-nav">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous page"
            disabled={safeIndex <= 0}
            onClick={() => onPageChange(safeIndex - 1)}
          >
            <ArrowLeftIcon size={15} />
          </button>
          <span className="page-counter">
            {pages.length > 0 ? `${safeIndex + 1} / ${pages.length}` : "0 / 0"}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Next page"
            disabled={safeIndex >= pages.length - 1}
            onClick={() => onPageChange(safeIndex + 1)}
          >
            <ArrowRightIcon size={15} />
          </button>
        </div>
      </div>

      {pages.length === 0 || !current ? (
        <div className="sheet-empty">
          <strong>No badges fit yet.</strong>
          <span>Adjust the margin, gap, grid, or cut diameter to make room.</span>
        </div>
      ) : (
        <>
          <div className="sheet-stage">
            <div
              className="sheet-page"
              style={{ aspectRatio: `${paper.widthMm} / ${paper.heightMm}` }}
            >
              {current.slots.map((slot, index) => {
                const style = {
                  left: `${(slot.xMm / paper.widthMm) * 100}%`,
                  top: `${(slot.yMm / paper.heightMm) * 100}%`,
                  width: `${(badge.cutMm / paper.widthMm) * 100}%`,
                  height: `${(badge.cutMm / paper.heightMm) * 100}%`,
                };
                return (
                  <div className="sheet-slot" key={index} style={style}>
                    {discUrl ? (
                      <img src={discUrl} alt="" draggable={false} />
                    ) : (
                      <span className="slot-placeholder" aria-hidden="true" />
                    )}
                    {guides.cut ? <span className="slot-ring cut" aria-hidden="true" /> : null}
                    {guides.face ? (
                      <span
                        className="slot-ring face"
                        style={{ inset: `${faceInset}%` }}
                        aria-hidden="true"
                      />
                    ) : null}
                    {guides.safe ? (
                      <span
                        className="slot-ring safe"
                        style={{ inset: `${safeInset}%` }}
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                );
              })}

              {guides.pageLabels ? (
                <span className="sheet-page-label" aria-hidden="true">
                  {safeIndex + 1} / {pages.length}
                </span>
              ) : null}
            </div>
          </div>

          <div className="sheet-foot">
            <span>
              {page.paperId === "custom"
                ? "Custom"
                : page.paperId === "letter"
                  ? "US Letter"
                  : "A4"}{" "}
              · {formatNumber(paper.widthMm, 1)} × {formatNumber(paper.heightMm, 1)} mm
            </span>
            <span>
              {current.count} badge{current.count === 1 ? "" : "s"} on this page
            </span>
          </div>
        </>
      )}
    </section>
  );
}
