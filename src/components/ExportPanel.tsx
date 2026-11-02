import type { Dpi } from "../lib/types";
import { useStudio } from "../state/store";
import { DownloadIcon, PrinterIcon } from "./Icons";
import { Segmented } from "./Segmented";
import { Toggle } from "./Toggle";

interface ExportPanelProps {
  canExport: boolean;
  canTest: boolean;
  exporting: boolean;
  error: string | null;
  fileName: string;
  onExport: () => void;
  onTestExport: () => void;
}

const DPI_OPTIONS: readonly { value: `${Dpi}`; label: string }[] = [
  { value: "300", label: "300 DPI" },
  { value: "600", label: "600 DPI" },
];

export function ExportPanel({
  canExport,
  canTest,
  exporting,
  error,
  fileName,
  onExport,
  onTestExport,
}: ExportPanelProps) {
  const layout = useStudio((state) => state.layout);
  const guides = useStudio((state) => state.guides);
  const setLayoutField = useStudio((state) => state.setLayoutField);
  const setGuide = useStudio((state) => state.setGuide);

  return (
    <section className="panel" aria-labelledby="export-panel-title">
      <div className="panel-head">
        <span className="step" aria-hidden="true">
          04
        </span>
        <div>
          <h2 id="export-panel-title">Export PDF</h2>
          <p className="panel-sub">Exact page size, one image reused, optional cutting guides.</p>
        </div>
      </div>

      <div className="field">
        <span className="field-label">Image quality</span>
        <Segmented
          value={`${layout.dpi}` as `${Dpi}`}
          options={DPI_OPTIONS}
          onChange={(value) => setLayoutField("dpi", Number(value) as Dpi)}
          ariaLabel="Export resolution"
        />
        <p className="field-hint">
          300 DPI is standard. 600 DPI helps line art; the badge image is embedded once,
          so the file stays small.
        </p>
      </div>

      <div className="field">
        <span className="field-label">Guides and marks</span>
        <div className="guide-grid">
          <Toggle
            checked={guides.cut}
            onChange={(value) => setGuide("cut", value)}
            label="Cut line"
          />
          <Toggle
            checked={guides.face}
            onChange={(value) => setGuide("face", value)}
            label="Face ring"
          />
          <Toggle
            checked={guides.safe}
            onChange={(value) => setGuide("safe", value)}
            label="Safe ring"
          />
          <Toggle
            checked={guides.calibration}
            onChange={(value) => setGuide("calibration", value)}
            label="100 mm ruler"
          />
          <Toggle
            checked={guides.pageLabels}
            onChange={(value) => setGuide("pageLabels", value)}
            label="Page labels"
          />
        </div>
      </div>

      <div className="export-actions">
        <button
          type="button"
          className="btn btn-primary btn-wide"
          disabled={!canExport || exporting}
          onClick={onExport}
        >
          <DownloadIcon size={17} />
          {exporting ? "Building PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-wide"
          disabled={!canTest || exporting}
          onClick={onTestExport}
        >
          <PrinterIcon size={17} />
          Test print (1 badge + ruler)
        </button>
      </div>

      <p className="file-name" title={fileName}>
        {fileName}
      </p>

      <div className="print-callout">
        <strong>Before a batch: print at 100% / Actual size.</strong>
        <span>
          Turn off “Fit to page”. Measure the 100 mm ruler and the cut circle on the test
          sheet. If the circle misses your press, adjust the cut diameter.
        </span>
      </div>

      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
