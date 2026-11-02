import { MAX_COPIES, MIN_DPI, PRINTER_SAFE_MARGIN_MM } from "./presets";
import { pageSizeMm } from "./layout";
import type {
  Artwork,
  BadgeSetup,
  EffectiveLayout,
  PageSetup,
  Severity,
  SheetLayout,
  Transform,
  Warning,
} from "./types";
import { formatDpi, formatDimension } from "./units";

export interface ValidationInput {
  badge: BadgeSetup;
  page: PageSetup;
  layout: SheetLayout;
  transform: Transform;
  artwork: Artwork | null;
  effective: EffectiveLayout;
}

export function effectiveDpi(
  artwork: Artwork | null,
  transform: Transform,
  cutMm: number,
): number | null {
  if (!artwork) return null;
  if (artwork.kind === "vector") return Number.POSITIVE_INFINITY;
  if (
    cutMm <= 0 ||
    !Number.isFinite(cutMm) ||
    artwork.sourceWidth <= 0 ||
    artwork.sourceHeight <= 0
  ) {
    return 0;
  }

  const zoom = Math.max(0.001, transform.zoom);
  const mmPerSourcePx = Math.max(
    cutMm / artwork.sourceWidth,
    cutMm / artwork.sourceHeight,
  );

  return (1 / (mmPerSourcePx * zoom)) * 25.4;
}

function warning(
  id: string,
  severity: Severity,
  message: string,
  hint?: string,
): Warning {
  return { id, severity, message, hint };
}

export function validateStudio(input: ValidationInput): Warning[] {
  const { badge, page, layout, transform, artwork, effective } = input;
  const warnings: Warning[] = [];
  const paper = pageSizeMm(page);

  if (!Number.isFinite(badge.cutMm) || badge.cutMm <= 0) {
    warnings.push(
      warning("badge-cut", "error", "Enter a cut diameter greater than zero."),
    );
  } else if (!Number.isFinite(badge.faceMm) || badge.faceMm <= 0) {
    warnings.push(
      warning("badge-face", "error", "Enter a finished diameter greater than zero."),
    );
  } else if (badge.faceMm >= badge.cutMm) {
    warnings.push(
      warning(
        "badge-wrap",
        "error",
        "The cut disc must be larger than the finished face.",
        "The extra ring is the paper that wraps around the badge shell.",
      ),
    );
  }

  const safeDiameter = badge.faceMm - badge.safeInsetMm * 2;
  if (badge.safeInsetMm < 0 || safeDiameter <= 0) {
    warnings.push(
      warning(
        "badge-safe",
        "error",
        "The safe area inset leaves no visible face.",
        "Reduce the inset so it is less than half the finished diameter.",
      ),
    );
  }

  if (page.paperId === "custom") {
    if (
      !Number.isFinite(paper.widthMm) ||
      !Number.isFinite(paper.heightMm) ||
      paper.widthMm <= 0 ||
      paper.heightMm <= 0
    ) {
      warnings.push(
        warning("paper-custom", "error", "Enter a positive custom paper size."),
      );
    } else if (paper.widthMm > 2000 || paper.heightMm > 2000) {
      warnings.push(
        warning("paper-large", "warning", "Custom paper is unusually large.", "Maximum recommended size is 2000 mm."),
      );
    }
  }

  if (
    Number.isFinite(paper.widthMm) &&
    Number.isFinite(paper.heightMm) &&
    badge.cutMm > Math.min(paper.widthMm, paper.heightMm)
  ) {
    warnings.push(
      warning(
        "badge-too-large",
        "error",
        `A ${formatDimension(badge.cutMm)} disc cannot fit on this paper.`,
      ),
    );
  }

  if (effective.maxCapacity === 0 && paper.widthMm > 0 && paper.heightMm > 0) {
    warnings.push(
      warning(
        "capacity-zero",
        "error",
        "No badges fit with these settings.",
        "Reduce the margin or gap, or check the cut diameter.",
      ),
    );
  }

  if (layout.mode === "manual" && effective.bounded) {
    warnings.push(
      warning(
        "grid-bounded",
        "warning",
        `The manual grid was limited to ${effective.cols} columns by ${effective.rows} rows to stay on the page.`,
        `Maximum for this page is ${effective.maxRows} rows by ${effective.maxCols} columns.`,
      ),
    );
  }

  if (
    !Number.isInteger(layout.copies) ||
    layout.copies < 1 ||
    layout.copies > MAX_COPIES
  ) {
    warnings.push(
      warning(
        "copies",
        "error",
        `Copies must be a whole number from 1 to ${MAX_COPIES}.`,
      ),
    );
  }

  if (page.marginMm < PRINTER_SAFE_MARGIN_MM && page.marginMm >= 0) {
    warnings.push(
      warning(
        "printer-margin",
        "warning",
        `A ${formatDimension(page.marginMm)} margin may sit inside your printer's non-printable border.`,
        `Most printers need at least ${PRINTER_SAFE_MARGIN_MM} mm. If the edge is clipped, increase the margin.`,
      ),
    );
  }

  if (page.marginMm < 0 || page.gapMm < 0) {
    warnings.push(
      warning("negative-spacing", "error", "Margin and gap cannot be negative."),
    );
  }

  if (!artwork) {
    warnings.push(
      warning(
        "artwork-missing",
        "info",
        "Add artwork to enable PDF export.",
        "PNG, JPG, WebP, and SVG are supported. Files stay on your device.",
      ),
    );
  } else {
    const dpi = effectiveDpi(artwork, transform, badge.cutMm);
    if (dpi !== null && Number.isFinite(dpi) && dpi < MIN_DPI) {
      warnings.push(
        warning(
          "low-dpi",
          "warning",
          `Estimated print resolution is ${formatDpi(dpi)}.`,
          `Below ${MIN_DPI} DPI may look soft. Use a larger source image or zoom out.`,
        ),
      );
    }
  }

  return warnings;
}

export function canExport(input: ValidationInput): boolean {
  if (!input.artwork) return false;
  if (input.effective.pages <= 0) return false;
  return !validateStudio(input).some((item) => item.severity === "error");
}
