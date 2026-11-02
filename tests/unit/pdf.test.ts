import { inflateSync } from "node:zlib";
import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFRawStream,
} from "pdf-lib";
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

function pageContent(pdf: PDFDocument, pageIndex: number): string {
  const page = pdf.getPage(pageIndex);
  const contents = page.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  let text = "";
  for (const ref of refs) {
    const stream = pdf.context.lookup(ref);
    if (stream instanceof PDFRawStream) {
      try {
        text += inflateSync(Buffer.from(stream.getContents())).toString("latin1");
      } catch {
        text += Buffer.from(stream.getContents()).toString("latin1");
      }
    }
  }
  return text;
}

function longestHorizontalLinePt(text: string): number {
  const lines = [
    ...text.matchAll(
      /(-?[\d.]+) (-?[\d.]+) m\n(?:-?[\d.]+ -?[\d.]+ m\n)*(-?[\d.]+) (-?[\d.]+) l/g,
    ),
  ].map((match) => ({
    x1: Number(match[1]),
    y1: Number(match[2]),
    x2: Number(match[3]),
    y2: Number(match[4]),
  }));
  const horizontal = lines.filter(
    (line) => Math.abs(line.y1 - line.y2) < 0.01 && Math.abs(line.x2 - line.x1) > 100,
  );
  return horizontal.reduce(
    (longest, line) => Math.max(longest, Math.abs(line.x2 - line.x1)),
    0,
  );
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

  it("omits the calibration ruler from batch sheets and includes it on the test print", async () => {
    const pages = buildPages({ ...layout, copies: 1 }, page, badge);
    const batchBytes = await buildSheetPdf({
      badge,
      page,
      guides: DEFAULT_GUIDES,
      pages,
      imagePng: PNG,
    });
    const batchPdf = await load(batchBytes);
    expect(longestHorizontalLinePt(pageContent(batchPdf, 0))).toBeLessThan(200);

    const testBytes = await buildTestSheetPdf({
      badge,
      page,
      guides: DEFAULT_GUIDES,
      imagePng: PNG,
    });
    const testPdf = await load(testBytes);
    expect(longestHorizontalLinePt(pageContent(testPdf, 0))).toBeCloseTo(283.4646, 3);
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
