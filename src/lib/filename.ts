import { pageSizeMm } from "./layout";
import type { BadgeSetup, PageSetup, SheetLayout } from "./types";
import { formatNumber, roundTo } from "./units";

export function paperLabel(page: PageSetup): string {
  if (page.paperId === "custom") {
    const size = pageSizeMm(page);
    return `${formatNumber(roundTo(size.widthMm, 1), 1)}x${formatNumber(roundTo(size.heightMm, 1), 1)}mm`;
  }
  return page.paperId === "letter" ? "letter" : "a4";
}

export function sheetFileName(
  badge: BadgeSetup,
  page: PageSetup,
  layout: SheetLayout,
  copies: number,
): string {
  const countLabel = copies === 1 ? "1copy" : `${copies}copies`;
  return `pin-badge-${formatNumber(roundTo(badge.faceMm, 1), 1)}mm-${paperLabel(page)}-${layout.cols}x${layout.rows}-${countLabel}.pdf`;
}

export function testSheetFileName(badge: BadgeSetup): string {
  return `pin-badge-${formatNumber(roundTo(badge.faceMm, 1), 1)}mm-test-print.pdf`;
}
