import { describe, expect, it } from "vitest";
import {
  buildPages,
  computeCapacity,
  computeEffectiveLayout,
  computeSlotPositions,
  pageSizeMm,
} from "../../src/lib/layout";
import { DEFAULT_BADGE, DEFAULT_PAGE } from "../../src/lib/presets";
import type { BadgeSetup, PageSetup, SheetLayout } from "../../src/lib/types";

const badge25: BadgeSetup = { ...DEFAULT_BADGE, presetId: "25", faceMm: 25, cutMm: 35 };
const badge44: BadgeSetup = { ...DEFAULT_BADGE, faceMm: 44, cutMm: 54 };

function layout(overrides: Partial<SheetLayout> = {}): SheetLayout {
  return {
    mode: "auto",
    rows: 3,
    cols: 5,
    copies: 1,
    dpi: 300,
    ...overrides,
  };
}

describe("capacity", () => {
  it("fits 35 badges on A4 at 25 mm", () => {
    const capacity = computeCapacity(DEFAULT_PAGE, badge25);
    expect(capacity).toEqual({ maxCols: 5, maxRows: 7, capacity: 35 });
  });

  it("fits 15 badges on A4 at 44 mm", () => {
    const capacity = computeCapacity(DEFAULT_PAGE, badge44);
    expect(capacity).toEqual({ maxCols: 3, maxRows: 5, capacity: 15 });
  });

  it("fits 12 badges on US Letter at 44 mm", () => {
    const page: PageSetup = { ...DEFAULT_PAGE, paperId: "letter" };
    expect(computeCapacity(page, badge44)).toEqual({
      maxCols: 3,
      maxRows: 4,
      capacity: 12,
    });
  });

  it("returns zero when the margin consumes the page", () => {
    const page: PageSetup = { ...DEFAULT_PAGE, marginMm: 120 };
    expect(computeCapacity(page, badge44).capacity).toBe(0);
  });

  it("supports custom paper in centimetres and inches", () => {
    const cmPage: PageSetup = {
      ...DEFAULT_PAGE,
      paperId: "custom",
      unit: "cm",
      customWidth: 21,
      customHeight: 29.7,
    };
    expect(pageSizeMm(cmPage).widthMm).toBeCloseTo(210, 10);
    expect(pageSizeMm(cmPage).heightMm).toBeCloseTo(297, 10);

    const inchPage: PageSetup = {
      ...DEFAULT_PAGE,
      paperId: "custom",
      unit: "in",
      customWidth: 8.5,
      customHeight: 11,
    };
    expect(pageSizeMm(inchPage).widthMm).toBeCloseTo(215.9, 10);
    expect(pageSizeMm(inchPage).heightMm).toBeCloseTo(279.4, 10);
  });

  it("swaps dimensions in landscape", () => {
    const page: PageSetup = { ...DEFAULT_PAGE, orientation: "landscape" };
    expect(pageSizeMm(page)).toEqual({ widthMm: 297, heightMm: 210 });
  });
});

describe("effective layout", () => {
  it("uses capacity in automatic mode", () => {
    const effective = computeEffectiveLayout(layout(), DEFAULT_PAGE, badge44);
    expect(effective.rows).toBe(5);
    expect(effective.cols).toBe(3);
    expect(effective.perPage).toBe(15);
    expect(effective.pages).toBe(1);
  });

  it("bounds a manual grid and reports it", () => {
    const effective = computeEffectiveLayout(
      layout({ mode: "manual", rows: 99, cols: 99 }),
      DEFAULT_PAGE,
      badge44,
    );
    expect(effective.rows).toBe(5);
    expect(effective.cols).toBe(3);
    expect(effective.bounded).toBe(true);
  });

  it("computes pages for a partial final page", () => {
    const effective = computeEffectiveLayout(
      layout({ copies: 20 }),
      DEFAULT_PAGE,
      badge44,
    );
    expect(effective.pages).toBe(2);
    expect(effective.perPage).toBe(15);
  });

  it("returns zero pages for zero copies", () => {
    const effective = computeEffectiveLayout(
      layout({ copies: 0 }),
      DEFAULT_PAGE,
      badge44,
    );
    expect(effective.pages).toBe(0);
  });
});

describe("slot geometry", () => {
  it("centres the grid on the page", () => {
    const slots = computeSlotPositions(5, 3, DEFAULT_PAGE, badge44);
    expect(slots).toHaveLength(15);
    const first = slots[0];
    const last = slots[slots.length - 1];
    expect(first.xMm).toBeCloseTo(22, 10);
    expect(first.yMm).toBeCloseTo(9.5, 10);
    expect(first.xMm).toBeCloseTo(210 - (last.xMm + 54), 10);
    expect(first.yMm).toBeCloseTo(297 - (last.yMm + 54), 10);
  });

  it("centres a partial page by its used rows and columns", () => {
    const slots = computeSlotPositions(1, 5, DEFAULT_PAGE, badge44, 5);
    expect(slots).toHaveLength(5);
    const blockWidth = 5 * 54 + 4 * 2;
    expect(slots[0].xMm).toBeCloseTo((210 - blockWidth) / 2, 10);
    expect(slots[0].yMm).toBeCloseTo((297 - 54) / 2, 10);
  });

  it("builds pages whose slot totals equal the copies", () => {
    const pages = buildPages(layout({ copies: 20 }), DEFAULT_PAGE, badge44);
    expect(pages).toHaveLength(2);
    expect(pages[0].count).toBe(15);
    expect(pages[1].count).toBe(5);
    expect(pages[0].slots).toHaveLength(15);
    expect(pages[1].slots).toHaveLength(5);
    expect(pages.reduce((sum, page) => sum + page.count, 0)).toBe(20);
  });

  it("centres the remaining five badges on the last page", () => {
    const pages = buildPages(layout({ copies: 20 }), DEFAULT_PAGE, badge44);
    const last = pages[1];
    expect(last.slots).toHaveLength(5);
    const blockWidth = 3 * 54 + 2 * 2;
    expect(last.slots[0].xMm).toBeCloseTo((210 - blockWidth) / 2, 10);
  });

  it("returns no pages when capacity is zero", () => {
    const page: PageSetup = { ...DEFAULT_PAGE, marginMm: 120 };
    expect(buildPages(layout({ copies: 20 }), page, badge44)).toEqual([]);
  });
});
