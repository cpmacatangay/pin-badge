import type {
  BadgeSetup,
  Guides,
  PageSetup,
  PaperId,
  SheetLayout,
  StudioSettings,
  Transform,
} from "./types";

export interface BadgePreset {
  id: "25" | "44";
  label: string;
  sublabel: string;
  faceMm: number;
  cutMm: number;
}

export const BADGE_PRESETS: readonly BadgePreset[] = [
  { id: "25", label: "25 mm", sublabel: "1 inch · collector", faceMm: 25, cutMm: 35 },
  { id: "44", label: "44 mm", sublabel: "1¾ inch · standard", faceMm: 44, cutMm: 54 },
] as const;

export interface PaperPreset {
  id: Exclude<PaperId, "custom">;
  label: string;
  widthMm: number;
  heightMm: number;
  note: string;
}

export const PAPER_PRESETS: readonly PaperPreset[] = [
  { id: "a4", label: "A4", widthMm: 210, heightMm: 297, note: "210 × 297 mm" },
  { id: "letter", label: "US Letter", widthMm: 215.9, heightMm: 279.4, note: "8.5 × 11 in" },
] as const;

export const DEFAULT_BADGE: BadgeSetup = {
  presetId: "44",
  faceMm: 44,
  cutMm: 54,
  safeInsetMm: 3,
};

export const DEFAULT_PAGE: PageSetup = {
  paperId: "a4",
  customWidth: 210,
  customHeight: 297,
  customInitialized: false,
  unit: "mm",
  orientation: "portrait",
  marginMm: 8,
  gapMm: 2,
};

export const DEFAULT_LAYOUT: SheetLayout = {
  mode: "auto",
  rows: 3,
  cols: 5,
  copies: 1,
  dpi: 300,
};

export const DEFAULT_GUIDES: Guides = {
  cut: true,
  face: false,
  safe: false,
  pageLabels: true,
};

export const DEFAULT_TRANSFORM: Transform = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotationDeg: 0,
};

export const DEFAULT_BACKGROUND = "#ffffff";

export const DEFAULT_SETTINGS: StudioSettings = {
  badge: DEFAULT_BADGE,
  page: DEFAULT_PAGE,
  layout: DEFAULT_LAYOUT,
  guides: DEFAULT_GUIDES,
  transform: DEFAULT_TRANSFORM,
  background: DEFAULT_BACKGROUND,
};

export const PRINTER_SAFE_MARGIN_MM = 5;
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_PX = 4096;
export const MIN_DPI = 200;
export const MAX_COPIES = 999;
export const CALIBRATION_MM = 100;

export function findBadgePreset(id: string): BadgePreset | undefined {
  return BADGE_PRESETS.find((preset) => preset.id === id);
}
