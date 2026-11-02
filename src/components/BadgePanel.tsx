import { BADGE_PRESETS, findBadgePreset } from "../lib/presets";
import { formatNumber } from "../lib/units";
import { useStudio } from "../state/store";
import { NumberField } from "./NumberField";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export function BadgePanel() {
  const badge = useStudio((state) => state.badge);
  const selectPreset = useStudio((state) => state.selectPreset);
  const setBadgeField = useStudio((state) => state.setBadgeField);
  const resetBadge = useStudio((state) => state.resetBadge);

  const wrapMm = badge.cutMm - badge.faceMm;
  const safeMm = badge.faceMm - badge.safeInsetMm * 2;

  return (
    <section className="panel" aria-labelledby="badge-panel-title">
      <div className="panel-head">
        <span className="step" aria-hidden="true">
          01
        </span>
        <div>
          <h2 id="badge-panel-title">Badge size</h2>
          <p className="panel-sub">Pick your press, then check the printed disc.</p>
        </div>
      </div>

      <div className="preset-grid">
        {BADGE_PRESETS.map((preset) => {
          const selected = badge.presetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              className="preset-card"
              aria-pressed={selected}
              onClick={() => selectPreset(preset.id)}
            >
              <span className="preset-diameter">{preset.label}</span>
              <span className="preset-sub">{preset.sublabel}</span>
              <span
                className="preset-ring"
                style={{ width: 26 + preset.faceMm * 0.42, height: 26 + preset.faceMm * 0.42 }}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      <div className="stat-row">
        <Stat label="Finished face" value={`${formatNumber(badge.faceMm, 1)} mm`} />
        <Stat label="Cut disc" value={`${formatNumber(badge.cutMm, 1)} mm`} />
        <Stat label="Wrap ring" value={`${formatNumber(wrapMm, 1)} mm`} />
      </div>

      <p className="wrap-note">
        <span className="wrap-note-mark" aria-hidden="true" />
        The outer ring folds around the badge shell. Artwork can run into it, but keep
        names and fine detail inside the {formatNumber(safeMm, 1)} mm safe circle.
      </p>

      <details className="advanced">
        <summary>Fine-tune dimensions</summary>
        <div className="field-row">
          <NumberField
            id="cut-diameter"
            label="Cut disc"
            value={badge.cutMm}
            onChange={(value) => setBadgeField("cutMm", value)}
            min={1}
            step={0.5}
            suffix="mm"
            hint="Measure your press template if 54 mm does not fit. Some 44 mm presses use 52 mm."
          />
          <NumberField
            id="safe-inset"
            label="Safe inset"
            value={badge.safeInsetMm}
            onChange={(value) => setBadgeField("safeInsetMm", value)}
            min={0}
            step={0.5}
            suffix="mm"
            hint="Distance from the face edge kept clear of important content."
          />
        </div>
        <div className="inline-actions">
          <span className="muted-small">
            Preset: {findBadgePreset(badge.presetId)?.faceMm ?? badge.faceMm} mm face /{" "}
            {findBadgePreset(badge.presetId)?.cutMm ?? badge.cutMm} mm cut
          </span>
          <button type="button" className="btn btn-ghost" onClick={resetBadge}>
            Restore preset
          </button>
        </div>
      </details>
    </section>
  );
}
