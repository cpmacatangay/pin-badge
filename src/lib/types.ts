export type BadgePresetId = "25" | "44";
export type PaperId = "a4" | "letter" | "custom";
export type LengthUnit = "mm" | "cm" | "in";
export type Orientation = "portrait" | "landscape";
export type LayoutMode = "auto" | "manual";
export type Dpi = 300 | 600;
export type Severity = "error" | "warning" | "info";

export interface BadgeSetup {
  presetId: BadgePresetId;
  faceMm: number;
  cutMm: number;
  safeInsetMm: number;
}

export interface PageSetup {
  paperId: PaperId;
  customWidth: number;
  customHeight: number;
  customInitialized: boolean;
  unit: LengthUnit;
  orientation: Orientation;
  marginMm: number;
  gapMm: number;
}

export interface SheetLayout {
  mode: LayoutMode;
  rows: number;
  cols: number;
  copies: number;
  dpi: Dpi;
}

export interface Guides {
  cut: boolean;
  face: boolean;
  safe: boolean;
  calibration: boolean;
  pageLabels: boolean;
}

export interface Transform {
  zoom: number;
  offsetX: number;
  offsetY: number;
  rotationDeg: number;
}

export interface Artwork {
  name: string;
  size: number;
  kind: "raster" | "vector";
  image: HTMLImageElement;
  sourceWidth: number;
  sourceHeight: number;
  objectUrl: string;
}

export interface PaperSize {
  widthMm: number;
  heightMm: number;
}

export interface Capacity {
  maxRows: number;
  maxCols: number;
  capacity: number;
}

export interface EffectiveLayout {
  rows: number;
  cols: number;
  perPage: number;
  pages: number;
  maxRows: number;
  maxCols: number;
  maxCapacity: number;
  bounded: boolean;
}

export interface Slot {
  row: number;
  col: number;
  xMm: number;
  yMm: number;
  centerXMm: number;
  centerYMm: number;
}

export interface PageLayout {
  index: number;
  count: number;
  slots: Slot[];
}

export interface Warning {
  id: string;
  severity: Severity;
  message: string;
  hint?: string;
}

export interface StudioSettings {
  badge: BadgeSetup;
  page: PageSetup;
  layout: SheetLayout;
  guides: Guides;
  transform: Transform;
  background: string;
}
