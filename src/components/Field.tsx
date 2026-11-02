import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  aside?: ReactNode;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, aside, children }: FieldProps) {
  return (
    <div className="field">
      <div className="field-head">
        {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span className="field-label">{label}</span>}
        {aside}
      </div>
      {children}
      {hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
