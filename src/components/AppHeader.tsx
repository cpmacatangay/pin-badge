import { LockIcon } from "./Icons";

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand">
        <svg
          className="brand-mark"
          viewBox="0 0 64 64"
          role="img"
          aria-label="Pin Badge Studio mark"
        >
          <circle cx="32" cy="32" r="30" fill="#231f1a" />
          <circle
            cx="32"
            cy="32"
            r="23"
            fill="none"
            stroke="#f6f0e4"
            strokeWidth="1.4"
            strokeDasharray="2.2 4"
          />
          <circle cx="32" cy="32" r="15.5" fill="#c4562f" />
          <circle cx="32" cy="32" r="6" fill="#231f1a" />
          <circle cx="44.5" cy="19.5" r="3.4" fill="#f6f0e4" />
        </svg>
        <div>
          <p className="eyebrow">PRINT-READY PIN BADGES</p>
          <h1>Pin Badge Studio</h1>
          <p className="brand-sub">Design once. Print at the right size, every time.</p>
        </div>
      </div>
      <div className="privacy-pill">
        <LockIcon size={15} />
        <span>Artwork stays on your device</span>
      </div>
    </header>
  );
}
