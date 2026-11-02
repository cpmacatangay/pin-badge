import { PAPER_PRESETS } from "./presets";
import type {
  BadgeSetup,
  Capacity,
  EffectiveLayout,
  PageLayout,
  PageSetup,
  PaperSize,
  SheetLayout,
  Slot,
} from "./types";
import { toMm } from "./units";

const EPSILON = 1e-9;

export function pageSizeMm(page: PageSetup): PaperSize {
  let base: PaperSize;

  if (page.paperId === "custom") {
    base = {
      widthMm: toMm(page.customWidth, page.unit),
      heightMm: toMm(page.customHeight, page.unit),
    };
  } else {
    const preset = PAPER_PRESETS.find((candidate) => candidate.id === page.paperId);
    base = preset
      ? { widthMm: preset.widthMm, heightMm: preset.heightMm }
      : { widthMm: 210, heightMm: 297 };
  }

  if (page.orientation === "landscape") {
    return { widthMm: base.heightMm, heightMm: base.widthMm };
  }
  return base;
}

export function computeCapacity(page: PageSetup, badge: BadgeSetup): Capacity {
  const { widthMm, heightMm } = pageSizeMm(page);
  const usableWidth = widthMm - page.marginMm * 2;
  const usableHeight = heightMm - page.marginMm * 2;
  const diameter = badge.cutMm;
  const gap = Math.max(0, page.gapMm);

  if (
    !Number.isFinite(diameter) ||
    !Number.isFinite(usableWidth) ||
    !Number.isFinite(usableHeight) ||
    diameter <= 0 ||
    usableWidth <= 0 ||
    usableHeight <= 0
  ) {
    return { maxRows: 0, maxCols: 0, capacity: 0 };
  }

  const maxCols = Math.floor((usableWidth + gap + EPSILON) / (diameter + gap));
  const maxRows = Math.floor((usableHeight + gap + EPSILON) / (diameter + gap));
  const safeCols = Math.max(0, maxCols);
  const safeRows = Math.max(0, maxRows);

  return {
    maxRows: safeRows,
    maxCols: safeCols,
    capacity: safeRows * safeCols,
  };
}

export function computeEffectiveLayout(
  layout: SheetLayout,
  page: PageSetup,
  badge: BadgeSetup,
): EffectiveLayout {
  const { maxRows, maxCols, capacity } = computeCapacity(page, badge);

  let rows = maxRows;
  let cols = maxCols;
  let bounded = false;

  if (layout.mode === "manual") {
    const requestedRows = Math.floor(layout.rows);
    const requestedCols = Math.floor(layout.cols);
    bounded =
      requestedRows !== layout.rows ||
      requestedCols !== layout.cols ||
      requestedRows < 0 ||
      requestedCols < 0 ||
      requestedRows > maxRows ||
      requestedCols > maxCols;

    rows = Math.max(0, Math.min(requestedRows, maxRows));
    cols = Math.max(0, Math.min(requestedCols, maxCols));
  }

  const perPage = rows * cols;
  const copies = Math.max(0, Math.floor(layout.copies));
  const pages = perPage > 0 && copies > 0 ? Math.ceil(copies / perPage) : 0;

  return {
    rows,
    cols,
    perPage,
    pages,
    maxRows,
    maxCols,
    maxCapacity: capacity,
    bounded,
  };
}

export function computeSlotPositions(
  rows: number,
  cols: number,
  page: PageSetup,
  badge: BadgeSetup,
  limit = Number.POSITIVE_INFINITY,
): Slot[] {
  if (rows <= 0 || cols <= 0 || badge.cutMm <= 0) return [];

  const { widthMm } = pageSizeMm(page);
  const gap = Math.max(0, page.gapMm);
  const diameter = badge.cutMm;
  const blockWidth = cols * diameter + (cols - 1) * gap;
  const startX = (widthMm - blockWidth) / 2;
  const startY = Math.max(0, page.marginMm);

  const slots: Slot[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (slots.length >= limit) return slots;
      const xMm = startX + col * (diameter + gap);
      const yMm = startY + row * (diameter + gap);
      slots.push({
        row,
        col,
        xMm,
        yMm,
        centerXMm: xMm + diameter / 2,
        centerYMm: yMm + diameter / 2,
      });
    }
  }
  return slots;
}

export function buildPages(
  layout: SheetLayout,
  page: PageSetup,
  badge: BadgeSetup,
): PageLayout[] {
  const effective = computeEffectiveLayout(layout, page, badge);
  const copies = Math.max(0, Math.floor(layout.copies));
  if (effective.perPage === 0 || effective.pages === 0) return [];

  const pages: PageLayout[] = [];
  let remaining = copies;

  for (let index = 0; index < effective.pages; index += 1) {
    const count = Math.min(effective.perPage, remaining);
    if (count <= 0) break;

    const usedRows = Math.ceil(count / effective.cols);
    const usedCols = Math.min(effective.cols, count);
    const slots = computeSlotPositions(usedRows, usedCols, page, badge, count);

    pages.push({ index, count, slots });
    remaining -= count;
  }

  return pages;
}
