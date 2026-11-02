import type { LengthUnit } from "./types";

export const MM_PER_INCH = 25.4;
export const MM_PER_CM = 10;
export const PT_PER_INCH = 72;

export function mmToPt(mm: number): number {
  return (mm * PT_PER_INCH) / MM_PER_INCH;
}

export function ptToMm(pt: number): number {
  return (pt * MM_PER_INCH) / PT_PER_INCH;
}

export function mmToCm(mm: number): number {
  return mm / MM_PER_CM;
}

export function cmToMm(cm: number): number {
  return cm * MM_PER_CM;
}

export function mmToIn(mm: number): number {
  return mm / MM_PER_INCH;
}

export function inToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

export function toMm(value: number, unit: LengthUnit): number {
  if (unit === "cm") return cmToMm(value);
  if (unit === "in") return inToMm(value);
  return value;
}

export function fromMm(mm: number, unit: LengthUnit): number {
  if (unit === "cm") return mmToCm(mm);
  if (unit === "in") return mmToIn(mm);
  return mm;
}

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return (Math.sign(value) * Math.round(Math.abs(value) * factor)) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "—";
  return String(roundTo(value, decimals));
}

export function formatDimension(mm: number, unit: LengthUnit = "mm"): string {
  if (!Number.isFinite(mm)) return "—";
  const decimals = unit === "mm" ? 1 : 2;
  return `${formatNumber(fromMm(mm, unit), decimals)} ${unit}`;
}

export function formatDpi(dpi: number | null): string {
  if (dpi === null) return "—";
  if (!Number.isFinite(dpi)) return "Vector";
  return `${Math.round(dpi)} DPI`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeRotation(deg: number): number {
  const wrapped = ((deg + 180) % 360 + 360) % 360 - 180;
  return wrapped === -180 ? 180 : wrapped;
}
