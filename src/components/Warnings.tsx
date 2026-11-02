import type { Warning } from "../lib/types";
import { CheckIcon } from "./Icons";

interface WarningsProps {
  warnings: Warning[];
}

const SEVERITY_ORDER: Record<Warning["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function Warnings({ warnings }: WarningsProps) {
  const sorted = [...warnings].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );

  if (sorted.length === 0) {
    return (
      <div className="warning ok" role="status">
        <span className="warning-icon" aria-hidden="true">
          <CheckIcon size={14} />
        </span>
        <div>
          <strong>Ready to print</strong>
          <span>Use Actual size / 100% in the print dialog.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="warning-stack" aria-live="polite">
      {sorted.map((warning) => (
        <div
          key={warning.id}
          className={`warning ${warning.severity}`}
          role={warning.severity === "error" ? "alert" : "status"}
        >
          <span className="warning-dot" aria-hidden="true" />
          <div>
            <strong>{warning.message}</strong>
            {warning.hint ? <span>{warning.hint}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
