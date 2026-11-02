import { DownloadIcon, LockIcon, PrinterIcon } from "./Icons";

interface AppHeaderProps {
  context: string;
  canExport: boolean;
  canTest: boolean;
  exporting: boolean;
  onExport: () => void;
  onTestExport: () => void;
}

export function AppHeader({
  context,
  canExport,
  canTest,
  exporting,
  onExport,
  onTestExport,
}: AppHeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <svg
          className="brand-mark"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Pin Badge Studio mark"
        >
          <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12" cy="12" r="6" fill="var(--accent)" />
          <circle cx="12" cy="12" r="2.1" fill="var(--surface)" />
        </svg>
        <div className="brand-copy">
          <span className="brand-name">Pin Badge Studio</span>
          <span className="brand-scope">Local print studio</span>
        </div>
      </div>

      <div className="topbar-context" aria-label="Current badge setup">
        <span>{context}</span>
        <span className="topbar-sep" aria-hidden="true" />
        <span className="privacy-note">
          <LockIcon size={12} />
          Stays on this device
        </span>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="btn"
          disabled={!canTest || exporting}
          onClick={onTestExport}
        >
          <PrinterIcon size={15} />
          Test print
        </button>
        <button
          type="button"
          className="btn primary"
          disabled={!canExport || exporting}
          onClick={onExport}
        >
          <DownloadIcon size={15} />
          {exporting ? "Building…" : "Download PDF"}
        </button>
      </div>
    </header>
  );
}
