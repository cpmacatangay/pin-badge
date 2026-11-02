import { pageSizeMm } from "../lib/layout";
import { PAPER_PRESETS, MAX_COPIES } from "../lib/presets";
import type { EffectiveLayout, LengthUnit, Orientation } from "../lib/types";
import { formatDimension, fromMm, roundTo, toMm } from "../lib/units";
import { useStudio } from "../state/store";
import { NumberField } from "./NumberField";
import { Segmented } from "./Segmented";

const PAPER_OPTIONS = [
  ...PAPER_PRESETS.map((preset) => ({ value: preset.id, label: preset.label })),
  { value: "custom", label: "Custom" },
] as const;

const ORIENTATION_OPTIONS: readonly { value: Orientation; label: string }[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const UNIT_OPTIONS: readonly { value: LengthUnit; label: string }[] = [
  { value: "mm", label: "mm" },
  { value: "cm", label: "cm" },
  { value: "in", label: "in" },
];

const MODE_OPTIONS = [
  { value: "auto", label: "Auto fit" },
  { value: "manual", label: "Cols × rows" },
] as const;

interface LayoutPanelProps {
  effective: EffectiveLayout;
  pageIndex: number;
  pageCount: number;
}

export function LayoutPanel({ effective, pageIndex, pageCount }: LayoutPanelProps) {
  const page = useStudio((state) => state.page);
  const layout = useStudio((state) => state.layout);
  const setPageField = useStudio((state) => state.setPageField);
  const setLayoutField = useStudio((state) => state.setLayoutField);

  const paper = pageSizeMm(page);
  const custom = page.paperId === "custom";

  function changePaper(next: typeof page.paperId) {
    if (next === "custom" && !page.customInitialized) {
      const preset = PAPER_PRESETS.find((candidate) => candidate.id === page.paperId);
      const baseWidth = preset?.widthMm ?? paper.widthMm;
      const baseHeight = preset?.heightMm ?? paper.heightMm;
      setPageField("customWidth", roundTo(fromMm(baseWidth, page.unit), 3));
      setPageField("customHeight", roundTo(fromMm(baseHeight, page.unit), 3));
      setPageField("customInitialized", true);
    }
    setPageField("paperId", next);
  }

  function changeUnit(next: LengthUnit) {
    if (next === page.unit) return;
    const widthMm = toMm(page.customWidth, page.unit);
    const heightMm = toMm(page.customHeight, page.unit);
    setPageField("unit", next);
    setPageField("customWidth", roundTo(fromMm(widthMm, next), 3));
    setPageField("customHeight", roundTo(fromMm(heightMm, next), 3));
  }

  function changeMode(next: "auto" | "manual") {
    setLayoutField("mode", next);
    if (next === "manual") {
      setLayoutField("rows", effective.rows);
      setLayoutField("cols", effective.cols);
    }
  }

  return (
    <section className="settings-section" aria-labelledby="layout-section-title">
      <div className="section-head">
        <h2 id="layout-section-title">Sheet layout</h2>
        <span className="section-meta">
          {formatDimension(paper.widthMm, "mm")} × {formatDimension(paper.heightMm, "mm")}
        </span>
      </div>

      <div className="field">
        <div className="field-head">
          <label htmlFor="paper-size">Paper</label>
        </div>
        <select
          id="paper-size"
          className="select"
          value={page.paperId}
          onChange={(event) => changePaper(event.target.value as typeof page.paperId)}
        >
          {PAPER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {custom ? (
        <>
          <div className="field-row">
            <NumberField
              id="paper-width"
              label="Width"
              value={page.customWidth}
              onChange={(value) => {
                setPageField("customWidth", value);
                if (!page.customInitialized) setPageField("customInitialized", true);
              }}
              min={1}
              step={0.1}
              suffix={page.unit}
            />
            <NumberField
              id="paper-height"
              label="Height"
              value={page.customHeight}
              onChange={(value) => {
                setPageField("customHeight", value);
                if (!page.customInitialized) setPageField("customInitialized", true);
              }}
              min={1}
              step={0.1}
              suffix={page.unit}
            />
          </div>
          <div className="field">
            <span className="field-label">Custom size unit</span>
            <Segmented
              value={page.unit}
              options={UNIT_OPTIONS}
              onChange={changeUnit}
              ariaLabel="Custom paper unit"
            />
            <p className="field-hint">
              Equivalent to {formatDimension(paper.widthMm, "mm")} ×{" "}
              {formatDimension(paper.heightMm, "mm")}.
            </p>
          </div>
        </>
      ) : null}

      <div className="field">
        <span className="field-label">Orientation</span>
        <Segmented
          value={page.orientation}
          options={ORIENTATION_OPTIONS}
          onChange={(value) => setPageField("orientation", value)}
          ariaLabel="Paper orientation"
        />
      </div>

      <div className="field-row">
        <NumberField
          id="margin"
          label="Margin"
          value={page.marginMm}
          onChange={(value) => setPageField("marginMm", value)}
          min={0}
          step={0.5}
          suffix="mm"
          hint="Most printers need 5 mm or more."
        />
        <NumberField
          id="gap"
          label="Gap"
          value={page.gapMm}
          onChange={(value) => setPageField("gapMm", value)}
          min={0}
          step={0.5}
          suffix="mm"
          hint="Space between cut circles on the sheet."
        />
      </div>

      <div className="field">
        <span className="field-label">Grid</span>
        <Segmented
          value={layout.mode}
          options={MODE_OPTIONS}
          onChange={changeMode}
          ariaLabel="Grid mode"
        />
      </div>

      {layout.mode === "manual" ? (
        <div className="field-row">
          <NumberField
            id="grid-cols"
            label="Columns"
            value={layout.cols}
            onChange={(value) => setLayoutField("cols", value)}
            min={1}
            max={effective.maxCols}
            step={1}
            hint={`Maximum ${effective.maxCols} on this page.`}
          />
          <NumberField
            id="grid-rows"
            label="Rows"
            value={layout.rows}
            onChange={(value) => setLayoutField("rows", value)}
            min={1}
            max={effective.maxRows}
            step={1}
            hint={`Maximum ${effective.maxRows} on this page.`}
          />
        </div>
      ) : null}

      <div className="readout-strip" aria-live="polite">
        <div className="readout">
          <span className="readout-label">Grid</span>
          <span className="readout-value">
            {effective.cols} × {effective.rows}
          </span>
        </div>
        <div className="readout">
          <span className="readout-label">Per page</span>
          <span className="readout-value">{effective.perPage}</span>
        </div>
        <div className="readout">
          <span className="readout-label">Pages</span>
          <span className="readout-value">{pageCount}</span>
        </div>
      </div>

      <div className="field">
        <div className="field-head">
          <label htmlFor="copies">Copies</label>
          <span className="field-hint">
            {pageCount > 0
              ? `${pageCount} page${pageCount === 1 ? "" : "s"}${
                  pageIndex < pageCount ? ` · viewing ${pageIndex + 1}` : ""
                }`
              : "No pages"}
          </span>
        </div>
        <div className="inline-input">
          <div className="input-shell">
            <input
              id="copies"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_COPIES}
              step={1}
              value={Number.isFinite(layout.copies) ? layout.copies : ""}
              onChange={(event) => {
                const parsed = event.target.valueAsNumber;
                setLayoutField("copies", Number.isFinite(parsed) ? parsed : 0);
              }}
            />
            <span className="input-suffix">badges</span>
          </div>
          <button
            type="button"
            className="btn"
            disabled={effective.perPage <= 0}
            onClick={() => setLayoutField("copies", effective.perPage)}
          >
            Fill sheet ({effective.perPage})
          </button>
        </div>
        <p className="field-hint">
          {pageCount > 1
            ? `Page 1 holds ${effective.perPage}; the last page holds the remainder.`
            : "Every copy is identical; the design is embedded once in the PDF."}
        </p>
      </div>
    </section>
  );
}
