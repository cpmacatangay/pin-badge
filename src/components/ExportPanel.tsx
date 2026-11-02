import type { Dpi } from "../lib/types";
import { resetAllSettings, useStudio } from "../state/store";
import { Segmented } from "./Segmented";
import { Toggle } from "./Toggle";

interface ExportPanelProps {
  fileName: string;
  error: string | null;
}

const DPI_OPTIONS: readonly { value: `${Dpi}`; label: string }[] = [
  { value: "300", label: "300 DPI" },
  { value: "600", label: "600 DPI" },
];

export function ExportPanel({ fileName, error }: ExportPanelProps) {
  const layout = useStudio((state) => state.layout);
  const guides = useStudio((state) => state.guides);
  const setLayoutField = useStudio((state) => state.setLayoutField);
  const setGuide = useStudio((state) => state.setGuide);

  return (
    <section className="settings-section" aria-labelledby="export-section-title">
      <div className="section-head">
        <h2 id="export-section-title">Export</h2>
        <span className="section-meta">PDF · exact size</span>
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
          300 DPI is standard. 600 DPI helps line art; the badge image is embedded once.
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
            checked={guides.pageLabels}
            onChange={(value) => setGuide("pageLabels", value)}
            label="Page labels"
          />
        </div>
      </div>

      <p className="file-name" title={fileName}>
        {fileName}
      </p>

      <div className="notice">
        <strong>Print at 100% / Actual size.</strong>
        <span>
          Disable “Fit to page”. Check the ruler and cut circle on the test print before a batch.
        </span>
      </div>

      {error ? (
        <p className="inline-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="inline-actions">
        <span className="field-hint">Preferences are saved on this device.</span>
        <button type="button" className="btn ghost" onClick={resetAllSettings}>
          Reset preferences
        </button>
      </div>
    </section>
  );
}
