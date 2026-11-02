import { useEffect, useRef, useState, type PointerEvent } from "react";
import { renderDisc, renderFaceView } from "../lib/compose";
import { MIN_DPI } from "../lib/presets";
import { formatDpi, formatNumber } from "../lib/units";
import { useStudio } from "../state/store";
import { CircleIcon } from "./Icons";
import { Segmented } from "./Segmented";

type PreviewMode = "disc" | "face";

const MODE_OPTIONS: readonly { value: PreviewMode; label: string }[] = [
  { value: "disc", label: "Print disc" },
  { value: "face", label: "Finished face" },
];

const CANVAS_PX = 900;
const DISC_PX = 1000;
const RIM = 49.4;

interface BadgePreviewProps {
  dpi: number | null;
}

export function BadgePreview({ dpi }: BadgePreviewProps) {
  const artwork = useStudio((state) => state.artwork);
  const transform = useStudio((state) => state.transform);
  const background = useStudio((state) => state.background);
  const badge = useStudio((state) => state.badge);
  const setTransform = useStudio((state) => state.setTransform);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [mode, setMode] = useState<PreviewMode>("disc");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = CANVAS_PX;
    canvas.height = CANVAS_PX;
    context.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
    if (!artwork) return;

    try {
      const disc = renderDisc({
        artwork,
        transform,
        cutMm: badge.cutMm,
        background,
        sizePx: DISC_PX,
      });

      if (mode === "face") {
        const face = renderFaceView({
          disc,
          faceMm: badge.faceMm,
          cutMm: badge.cutMm,
          sizePx: CANVAS_PX,
        });
        context.drawImage(face, 0, 0);
      } else {
        context.drawImage(disc, 0, 0, CANVAS_PX, CANVAS_PX);
      }
    } catch {
      // The validation panel reports invalid dimensions.
    }
  }, [artwork, transform, background, badge.faceMm, badge.cutMm, mode]);

  const safeDiameter = Math.max(0, badge.faceMm - badge.safeInsetMm * 2);
  const faceRatio = badge.cutMm > 0 ? badge.faceMm / badge.cutMm : 1;
  const safeRatio = badge.cutMm > 0 ? safeDiameter / badge.cutMm : 0;
  const faceRim = mode === "face" ? RIM : RIM * Math.max(0, faceRatio);
  const safeRim =
    mode === "face"
      ? RIM * (badge.faceMm > 0 ? Math.max(0, safeDiameter / badge.faceMm) : 0)
      : RIM * Math.max(0, safeRatio);
  const lowDpi = dpi !== null && Number.isFinite(dpi) && dpi < MIN_DPI;

  function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!artwork) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const scale = mode === "face" ? faceRatio : 1;
    const dx = ((event.clientX - drag.startX) / rect.width) * scale;
    const dy = ((event.clientY - drag.startY) / rect.height) * scale;
    const nextX = Math.max(-0.75, Math.min(0.75, drag.offsetX + dx));
    const nextY = Math.max(-0.75, Math.min(0.75, drag.offsetY + dy));
    setTransform({ offsetX: nextX, offsetY: nextY });
  }

  function onPointerUp(event: PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  return (
    <section className="preview-card" aria-labelledby="badge-preview-title">
      <div className="preview-head">
        <div>
          <p className="eyebrow">LIVE PREVIEW</p>
          <h2 id="badge-preview-title">Badge</h2>
        </div>
        <div className="preview-head-right">
          <span className="dpi-chip" data-low={lowDpi}>
            <span className="status-dot" aria-hidden="true" />
            {formatDpi(dpi)}
          </span>
          <Segmented
            value={mode}
            options={MODE_OPTIONS}
            onChange={setMode}
            ariaLabel="Badge preview mode"
          />
        </div>
      </div>

      <div className="badge-stage">
        <div className="badge-frame">
          <canvas
            ref={canvasRef}
            className="badge-canvas"
            aria-label={
              artwork
                ? "Badge artwork preview. Drag to reposition the design."
                : "Empty badge preview"
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />

          {!artwork ? (
            <div className="badge-empty">
              <span className="badge-empty-icon" aria-hidden="true">
                <CircleIcon size={34} />
              </span>
              <strong>Your design goes here</strong>
              <span>Upload artwork to see exactly what will be visible.</span>
            </div>
          ) : null}

          <svg
            className="badge-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {mode === "disc" ? (
              <circle
                cx="50"
                cy="50"
                r={RIM}
                className="ring-cut"
                vectorEffect="non-scaling-stroke"
              />
            ) : null}
            <circle
              cx="50"
              cy="50"
              r={faceRim}
              className="ring-face"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx="50"
              cy="50"
              r={safeRim}
              className="ring-safe"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      <div className="preview-foot">
        <div className="legend">
          {mode === "disc" ? (
            <span>
              <i className="legend-dot cut" /> Cut disc {formatNumber(badge.cutMm, 1)} mm
            </span>
          ) : null}
          <span>
            <i className="legend-dot face" /> Finished face {formatNumber(badge.faceMm, 1)} mm
          </span>
          <span>
            <i className="legend-dot safe" /> Safe area {formatNumber(safeDiameter, 1)} mm
          </span>
        </div>
        <p className="preview-note">
          {mode === "disc"
            ? artwork
              ? "Drag inside the badge to reposition. The outer ring wraps behind the shell."
              : "The dashed rings show your press dimensions even before artwork is added."
            : "Finished face enlarged to fill the view. The outer wrap is hidden."}
        </p>
      </div>
    </section>
  );
}
