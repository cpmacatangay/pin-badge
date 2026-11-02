import { PDFDocument, PDFName, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { CALIBRATION_MM } from "./presets";
import { pageSizeMm } from "./layout";
import type {
  BadgeSetup,
  Guides,
  PageLayout,
  PageSetup,
  Slot,
} from "./types";
import { formatNumber, mmToPt, roundTo } from "./units";

export interface SheetPdfInput {
  badge: BadgeSetup;
  page: PageSetup;
  guides: Guides;
  pages: PageLayout[];
  imagePng: Uint8Array;
}

export interface TestPdfInput {
  badge: BadgeSetup;
  page: PageSetup;
  guides: Guides;
  imagePng: Uint8Array;
}

const GUIDE_WIDTH_PT = 0.4;
const CUT_COLOR = rgb(0.12, 0.12, 0.12);
const FACE_COLOR = rgb(0.09, 0.43, 0.78);
const SAFE_COLOR = rgb(0.78, 0.34, 0.12);
const LABEL_COLOR = rgb(0.35, 0.33, 0.3);

function drawGuides(
  pdfPage: ReturnType<PDFDocument["addPage"]>,
  slot: Slot,
  pageHeightMm: number,
  badge: BadgeSetup,
  guides: Guides,
): void {
  const centerX = mmToPt(slot.centerXMm);
  const centerY = mmToPt(pageHeightMm - slot.centerYMm);
  const safeDiameter = badge.faceMm - badge.safeInsetMm * 2;

  if (guides.cut) {
    pdfPage.drawCircle({
      x: centerX,
      y: centerY,
      size: mmToPt(badge.cutMm) / 2,
      borderColor: CUT_COLOR,
      borderWidth: GUIDE_WIDTH_PT,
    });
  }

  if (guides.face) {
    pdfPage.drawCircle({
      x: centerX,
      y: centerY,
      size: mmToPt(badge.faceMm) / 2,
      borderColor: FACE_COLOR,
      borderWidth: GUIDE_WIDTH_PT,
      borderDashArray: [2.4, 2.4],
    });
  }

  if (guides.safe && safeDiameter > 0) {
    pdfPage.drawCircle({
      x: centerX,
      y: centerY,
      size: mmToPt(safeDiameter) / 2,
      borderColor: SAFE_COLOR,
      borderWidth: GUIDE_WIDTH_PT,
      borderDashArray: [1.2, 2.4],
    });
  }
}

function drawCalibration(
  pdfPage: ReturnType<PDFDocument["addPage"]>,
  pageWidthMm: number,
  font: PDFFont,
): void {
  const rulerLengthPt = mmToPt(CALIBRATION_MM);
  const startX = mmToPt(Math.max(6, (pageWidthMm - CALIBRATION_MM) / 2));
  const baseY = mmToPt(6);
  const majorHeight = mmToPt(2.2);
  const minorHeight = mmToPt(1.2);

  pdfPage.drawLine({
    start: { x: startX, y: baseY },
    end: { x: startX + rulerLengthPt, y: baseY },
    thickness: 0.7,
    color: CUT_COLOR,
  });

  for (let mm = 0; mm <= CALIBRATION_MM; mm += 10) {
    const isMajor = mm % 50 === 0;
    const tickX = startX + mmToPt(mm);
    pdfPage.drawLine({
      start: { x: tickX, y: baseY },
      end: { x: tickX, y: baseY + (isMajor ? majorHeight : minorHeight) },
      thickness: isMajor ? 0.7 : 0.4,
      color: CUT_COLOR,
    });
  }

  pdfPage.drawText("100 mm - print at 100% / Actual size", {
    x: startX,
    y: baseY + mmToPt(3.4),
    size: 5.6,
    font,
    color: CUT_COLOR,
  });
}

function drawPageLabels(
  pdfPage: ReturnType<PDFDocument["addPage"]>,
  pageWidthMm: number,
  index: number,
  total: number,
  font: PDFFont,
): void {
  const label = `${index + 1} / ${total}`;
  const size = 6;
  const width = font.widthOfTextAtSize(label, size);
  pdfPage.drawText(label, {
    x: mmToPt(pageWidthMm - 6) - width,
    y: mmToPt(6),
    size,
    font,
    color: LABEL_COLOR,
  });
}

async function buildPdf(
  input: SheetPdfInput,
  includeCalibration: boolean,
): Promise<Uint8Array> {
  const { badge, page, guides, pages, imagePng } = input;
  if (pages.length === 0) {
    throw new Error("There are no pages to export.");
  }

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Pin badge sheet - ${formatNumber(roundTo(badge.faceMm, 1), 1)} mm`);
  pdfDoc.setCreator("Pin Badge Studio");
  pdfDoc.setProducer("Pin Badge Studio");
  pdfDoc.setSubject("Print at 100% / Actual size. Do not use fit-to-page.");

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const image = await pdfDoc.embedPng(imagePng);
  const { widthMm, heightMm } = pageSizeMm(page);
  const pageWidthPt = mmToPt(widthMm);
  const pageHeightPt = mmToPt(heightMm);
  const discPt = mmToPt(badge.cutMm);

  pages.forEach((pageLayout, index) => {
    const pdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

    pageLayout.slots.forEach((slot) => {
      pdfPage.drawImage(image, {
        x: mmToPt(slot.xMm),
        y: mmToPt(heightMm - slot.yMm - badge.cutMm),
        width: discPt,
        height: discPt,
      });
      drawGuides(pdfPage, slot, heightMm, badge, guides);
    });

    if (includeCalibration && index === 0 && widthMm >= CALIBRATION_MM + 16) {
      drawCalibration(pdfPage, widthMm, font);
    }

    if (guides.pageLabels) {
      drawPageLabels(pdfPage, widthMm, index, pages.length, font);
    }
  });

  try {
    const catalog = pdfDoc.catalog;
    catalog.set(
      PDFName.of("ViewerPreferences"),
      pdfDoc.context.obj({ PrintScaling: PDFName.of("None") }),
    );
  } catch {
    // Viewer preferences are a convenience; the page geometry is still exact.
  }

  return pdfDoc.save();
}

export async function buildSheetPdf(input: SheetPdfInput): Promise<Uint8Array> {
  return buildPdf(input, false);
}

export async function buildTestSheetPdf(input: TestPdfInput): Promise<Uint8Array> {
  const { badge, page, guides, imagePng } = input;
  const { widthMm, heightMm } = pageSizeMm(page);
  const cut = badge.cutMm;
  const safeDiameter = badge.faceMm - badge.safeInsetMm * 2;
  if (safeDiameter <= 0) throw new Error("Invalid badge dimensions.");

  const slot: Slot = {
    row: 0,
    col: 0,
    xMm: (widthMm - cut) / 2,
    yMm: Math.min(35, Math.max(page.marginMm, (heightMm - cut) / 3)),
    centerXMm: widthMm / 2,
    centerYMm: 0,
  };
  slot.centerYMm = slot.yMm + cut / 2;

  const testPage: PageLayout = { index: 0, count: 1, slots: [slot] };

  return buildPdf(
    {
      badge,
      page,
      guides: { ...guides, pageLabels: false },
      pages: [testPage],
      imagePng,
    },
    true,
  );
}
