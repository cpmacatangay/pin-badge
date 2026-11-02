import type { ReactNode } from "react";
import { Field } from "./Field";

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  hint?: string;
  disabled?: boolean;
  aside?: ReactNode;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  hint,
  disabled = false,
  aside,
}: NumberFieldProps) {
  return (
    <Field label={label} htmlFor={id} hint={hint} aside={aside}>
      <div className="input-shell">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(event) => {
            const parsed = event.target.valueAsNumber;
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
        />
        {suffix ? <span className="input-suffix">{suffix}</span> : null}
      </div>
    </Field>
  );
}
