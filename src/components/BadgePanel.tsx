import { BADGE_PRESETS } from "../lib/presets";
import { formatNumber } from "../lib/units";
import { useStudio } from "../state/store";
import { NumberField } from "./NumberField";

export function BadgePanel() {
  const badge = useStudio((state) => state.badge);
  const selectPreset = useStudio((state) => state.selectPreset);
  const setBadgeField = useStudio((state) => state.setBadgeField);
  const resetBadge = useStudio((state) => state.resetBadge);

  const wrapMm = badge.cutMm - badge.faceMm;
  const safeMm = Math.max(0, badge.faceMm - badge.safeInsetMm * 2);

  return (
    <section className="settings-section" aria-labelledby="badge-section-title">
      <div className="section-head">
        <h2 id="badge-section-title">Badge size</h2>
        <span className="section-meta">Press preset</span>
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

      <div className="dimension-strip">
        <div className="dimension">
          <span className="dimension-label">Finished face</span>
          <span className="dimension-value">
            {formatNumber(badge.faceMm, 1)}
            <small>mm</small>
          </span>
        </div>
        <div className="dimension">
          <span className="dimension-label">Cut disc</span>
          <span className="dimension-value">
            {formatNumber(badge.cutMm, 1)}
            <small>mm</small>
          </span>
        </div>
        <div className="dimension">
          <span className="dimension-label">Wrap ring</span>
          <span className="dimension-value">
            {formatNumber(wrapMm, 1)}
            <small>mm</small>
          </span>
        </div>
      </div>

      <p className="note">
        The outer ring folds behind the shell. Artwork can run into it; keep names and fine
        detail inside the <strong>{formatNumber(safeMm, 1)} mm</strong> safe circle.
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
          <span className="field-hint">Preset values can be restored at any time.</span>
          <button type="button" className="btn ghost" onClick={resetBadge}>
            Restore preset
          </button>
        </div>
      </details>
    </section>
  );
}
