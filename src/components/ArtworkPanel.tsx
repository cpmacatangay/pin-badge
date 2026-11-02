import { useRef, useState } from "react";
import { loadArtwork } from "../lib/image";
import { MIN_DPI } from "../lib/presets";
import { formatDpi, formatFileSize, normalizeRotation } from "../lib/units";
import { effectiveDpi } from "../lib/validation";
import { useStudio } from "../state/store";
import { ResetIcon, TrashIcon, UploadIcon } from "./Icons";

interface SliderRowProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  display: string;
}

function SliderRow({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: SliderRowProps) {
  return (
    <div className="field">
      <div className="field-head">
        <label htmlFor={id}>{label}</label>
        <span className="slider-value">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

const SWATCHES = ["#ffffff", "#f5f7f5", "#131614", "#6b3fa0", "#a86f0c"];

export function ArtworkPanel() {
  const artwork = useStudio((state) => state.artwork);
  const transform = useStudio((state) => state.transform);
  const background = useStudio((state) => state.background);
  const badge = useStudio((state) => state.badge);
  const setArtwork = useStudio((state) => state.setArtwork);
  const clearArtwork = useStudio((state) => state.clearArtwork);
  const setTransform = useStudio((state) => state.setTransform);
  const resetTransform = useStudio((state) => state.resetTransform);
  const setBackground = useStudio((state) => state.setBackground);

  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dpi = effectiveDpi(artwork, transform, badge.cutMm);
  const lowDpi = dpi !== null && Number.isFinite(dpi) && dpi < MIN_DPI;

  async function acceptFile(file: File | undefined) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const next = await loadArtwork(file);
      setArtwork(next);
      resetTransform();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be loaded.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="settings-section" aria-labelledby="artwork-section-title">
      <div className="section-head">
        <h2 id="artwork-section-title">Artwork</h2>
        <span className="section-meta">PNG · JPG · WebP · SVG</span>
      </div>

      <input
        ref={inputRef}
        className="sr-only"
        id="artwork-file"
        type="file"
        tabIndex={-1}
        aria-hidden="true"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
        onChange={(event) => void acceptFile(event.target.files?.[0])}
      />

      {!artwork ? (
        <div
          className="dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void acceptFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="dropzone-icon" aria-hidden="true">
            <UploadIcon size={20} />
          </span>
          <strong>{loading ? "Preparing image…" : "Drop your design here"}</strong>
          <span>Up to 25 MB. Artwork never leaves this device.</span>
          <button
            type="button"
            className="btn"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
          >
            Choose a file
          </button>
        </div>
      ) : (
        <>
          <div className="artwork-row">
            <img className="artwork-thumb" src={artwork.objectUrl} alt="" />
            <div className="artwork-meta">
              <strong title={artwork.name}>{artwork.name}</strong>
              <span>
                {artwork.sourceWidth} × {artwork.sourceHeight} px ·{" "}
                {artwork.kind === "vector" ? "Vector" : formatFileSize(artwork.size)}
              </span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={() => inputRef.current?.click()}
              aria-label="Replace artwork"
            >
              <UploadIcon size={15} />
            </button>
            <button
              type="button"
              className="icon-button danger"
              onClick={clearArtwork}
              aria-label="Remove artwork"
            >
              <TrashIcon size={15} />
            </button>
          </div>

          <div className="artwork-dpi" data-low={lowDpi}>
            <span className="status-dot" aria-hidden="true" />
            <span>
              Estimated print resolution <strong>{formatDpi(dpi)}</strong>
              {lowDpi ? " · may look soft" : ""}
            </span>
          </div>

          <SliderRow
            id="artwork-zoom"
            label="Zoom"
            value={transform.zoom}
            min={0.25}
            max={4}
            step={0.01}
            onChange={(value) => setTransform({ zoom: value })}
            display={`${Math.round(transform.zoom * 100)}%`}
          />

          <div className="field-row">
            <SliderRow
              id="artwork-x"
              label="Position X"
              value={transform.offsetX}
              min={-0.5}
              max={0.5}
              step={0.005}
              onChange={(value) => setTransform({ offsetX: value })}
              display={`${Math.round(transform.offsetX * 100)}%`}
            />
            <SliderRow
              id="artwork-y"
              label="Position Y"
              value={transform.offsetY}
              min={-0.5}
              max={0.5}
              step={0.005}
              onChange={(value) => setTransform({ offsetY: value })}
              display={`${Math.round(transform.offsetY * 100)}%`}
            />
          </div>

          <SliderRow
            id="artwork-rotation"
            label="Rotation"
            value={transform.rotationDeg}
            min={-180}
            max={180}
            step={1}
            onChange={(value) => setTransform({ rotationDeg: value })}
            display={`${Math.round(transform.rotationDeg)}°`}
          />

          <div className="rotation-actions">
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                setTransform({ rotationDeg: normalizeRotation(transform.rotationDeg - 90) })
              }
            >
              ↺ 90°
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                setTransform({ rotationDeg: normalizeRotation(transform.rotationDeg + 90) })
              }
            >
              ↻ 90°
            </button>
            <button type="button" className="btn ghost" onClick={resetTransform}>
              <ResetIcon size={13} /> Reset framing
            </button>
          </div>

          <div className="field">
            <div className="field-head">
              <span className="field-label">Background</span>
              <span className="field-hint">Shows through transparency</span>
            </div>
            <div className="color-row">
              {SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="color-swatch"
                  style={{ background: color }}
                  aria-label={`Background ${color}`}
                  aria-pressed={background.toLowerCase() === color.toLowerCase()}
                  onClick={() => setBackground(color)}
                />
              ))}
              <label className="color-picker" title="Custom background colour">
                <span className="sr-only">Custom background colour</span>
                <input
                  type="color"
                  value={background}
                  onChange={(event) => setBackground(event.target.value)}
                />
              </label>
            </div>
          </div>
        </>
      )}

      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
