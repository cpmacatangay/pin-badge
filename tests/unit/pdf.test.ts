import { PDFDict, PDFDocument, PDFName } from "pdf-lib";
import { describe, expect, it } from "vitest";
import { buildPages } from "../../src/lib/layout";
import {
  buildSheetPdf,
  buildTestSheetPdf,
} from "../../src/lib/pdf";
import {
  sheetFileName,
  testSheetFileName,
} from "../../src/lib/filename";
import { DEFAULT_BADGE, DEFAULT_GUIDES, DEFAULT_PAGE } from "../../src/lib/presets";
import type { BadgeSetup, PageSetup, SheetLayout } from "../../src/lib/types";
import { mmToPt } from "../../src/lib/units";

// 1x1 transparent PNG
const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  ),
);

const badge: BadgeSetup = { ...DEFAULT_BADGE, faceMm: 44, cutMm: 54 };
const page: PageSetup = { ...DEFAULT_PAGE };
const layout: SheetLayout = { mode: "auto", rows: 3, cols: 5, copies: 20, dpi: 300 };

async function load(bytes: Uint8Array) {
  return PDFDocument.load(bytes);
}

describe("sheet PDF", () => {
  it("creates exact A4 pages", async () => {
    const pages = buildPages(layout, page, badge);
    const bytes = await buildSheetPdf({
      badge,
      page,
      guides: DEFAULT_GUIDES,
      pages,
      imagePng: PNG,
    });
    const pdf = await load(bytes);
    expect(pdf.getPageCount()).toBe(2);
    const first = pdf.getPage(0);
    expect(first.getWidth()).toBeCloseTo(595.2756, 3);
    expect(first.getHeight()).toBeCloseTo(841.8898, 3);
  });

  it("creates exact US Letter pages", async () => {
    const letterPage: PageSetup = { ...page, paperId: "letter" };
    const pages = buildPages({ ...layout, copies: 1 }, letterPage, badge);
    const bytes = await buildSheetPdf({
      badge,
      page: letterPage,
      guides: DEFAULT_GUIDES,
      pages,
      imagePng: PNG,
    });
    const pdf = await load(bytes);
    const first = pdf.getPage(0);
    expect(first.getWidth()).toBeCloseTo(612, 3);
    expect(first.getHeight()).toBeCloseTo(792, 3);
  });

  it("creates a custom page at the physical size", async () => {
    const customPage: PageSetup = {
      ...page,
      paperId: "custom",
      unit: "cm",
      customWidth: 12,
      customHeight: 18,
      marginMm: 5,
      gapMm: 2,
    };
    const pages = buildPages({ ...layout, copies: 1 }, customPage, badge);
    const bytes = await buildSheetPdf({
      badge,
      page: customPage,
      guides: DEFAULT_GUIDES,
      pages,
      imagePng: PNG,
    });
    const pdf = await load(bytes);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(mmToPt(120), 4);
    expect(pdf.getPage(0).getHeight()).toBeCloseTo(mmToPt(180), 4);
  });

  it("splits copies across pages without dropping any", async () => {
    const pages = buildPages(layout, page, badge);
    expect(pages.map((item) => item.count)).toEqual([15, 5]);
    expect(pages.flatMap((item) => item.slots)).toHaveLength(20);

    const bytes = await buildSheetPdf({
      badge,
      page,
      guides: DEFAULT_GUIDES,
      pages,
      imagePng: PNG,
    });
    const pdf = await load(bytes);
    expect(pdf.getPageCount()).toBe(2);
  });

  it("embeds the badge image once and reuses it across slots", async () => {
    const pages = buildPages(layout, page, badge);
    const bytes = await buildSheetPdf({
      badge,
      page,
      guides: DEFAULT_GUIDES,
      pages,
      imagePng: PNG,
    });
    const pdf = await load(bytes);
    const resources = pdf.getPage(0).node.Resources();
    const xobjects = resources?.lookup(PDFName.of("XObject"));
    expect(xobjects).toBeInstanceOf(PDFDict);
    if (!(xobjects instanceof PDFDict)) return;
    const refs = xobjects.keys().map((key) => String(xobjects.get(key)));
    expect(refs.length).toBeGreaterThanOrEqual(15);
    expect(new Set(refs).size).toBe(1);
  });

  it("builds a single-badge test sheet", async () => {
    const bytes = await buildTestSheetPdf({
      badge,
      page,
      guides: DEFAULT_GUIDES,
      imagePng: PNG,
    });
    const pdf = await load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getPage(0).getWidth()).toBeCloseTo(595.2756, 3);
  });

  it("rejects an empty page list", async () => {
    await expect(
      buildSheetPdf({
        badge,
        page,
        guides: DEFAULT_GUIDES,
        pages: [],
        imagePng: PNG,
      }),
    ).rejects.toThrow(/no pages/i);
  });

  it("generates descriptive file names", () => {
    expect(sheetFileName(badge, page, layout, 20)).toBe(
      "pin-badge-44mm-a4-5x3-20copies.pdf",
    );
    expect(sheetFileName(badge, page, layout, 1)).toBe(
      "pin-badge-44mm-a4-5x3-1copy.pdf",
    );
    expect(testSheetFileName(badge)).toBe("pin-badge-44mm-test-print.pdf");
  });
});
