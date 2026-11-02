import { describe, expect, it } from "vitest";
import { computeEffectiveLayout } from "../../src/lib/layout";
import { DEFAULT_BADGE, DEFAULT_PAGE, DEFAULT_TRANSFORM } from "../../src/lib/presets";
import type { Artwork, BadgeSetup, PageSetup, SheetLayout } from "../../src/lib/types";
import {
  canExport,
  effectiveDpi,
  validateStudio,
} from "../../src/lib/validation";

const artwork: Artwork = {
  name: "design.png",
  size: 4096,
  kind: "raster",
  image: {} as HTMLImageElement,
  sourceWidth: 1000,
  sourceHeight: 1000,
  objectUrl: "blob:test",
};

const badge: BadgeSetup = { ...DEFAULT_BADGE, faceMm: 44, cutMm: 54 };
const page: PageSetup = { ...DEFAULT_PAGE };
const layout: SheetLayout = { mode: "auto", rows: 3, cols: 5, copies: 1, dpi: 300 };

function input(overrides: {
  artwork?: Artwork | null;
  badge?: BadgeSetup;
  page?: PageSetup;
  layout?: SheetLayout;
  transform?: typeof DEFAULT_TRANSFORM;
}) {
  const mergedBadge = overrides.badge ?? badge;
  const mergedPage = overrides.page ?? page;
  const mergedLayout = overrides.layout ?? layout;
  return {
    badge: mergedBadge,
    page: mergedPage,
    layout: mergedLayout,
    transform: overrides.transform ?? DEFAULT_TRANSFORM,
    artwork: overrides.artwork === undefined ? artwork : overrides.artwork,
    effective: computeEffectiveLayout(mergedLayout, mergedPage, mergedBadge),
  };
}

describe("effective DPI", () => {
  it("uses the limiting image dimension at 100% cover", () => {
    expect(effectiveDpi(artwork, DEFAULT_TRANSFORM, 54)).toBeCloseTo(470.37, 1);
  });

  it("halves DPI when the artwork is magnified to twice the cover size", () => {
    expect(
      effectiveDpi(artwork, { ...DEFAULT_TRANSFORM, zoom: 2 }, 54),
    ).toBeCloseTo(235.19, 1);
  });

  it("reports vector artwork as resolution-independent", () => {
    expect(
      effectiveDpi({ ...artwork, kind: "vector" }, DEFAULT_TRANSFORM, 54),
    ).toBe(Number.POSITIVE_INFINITY);
  });

  it("returns null without artwork", () => {
    expect(effectiveDpi(null, DEFAULT_TRANSFORM, 54)).toBeNull();
  });
});

describe("validation", () => {
  it("accepts a valid configuration", () => {
    const warnings = validateStudio(input({}));
    expect(warnings.filter((item) => item.severity === "error")).toEqual([]);
  });

  it("blocks a cut diameter smaller than the face", () => {
    const warnings = validateStudio(
      input({ badge: { ...badge, cutMm: 40 } }),
    );
    expect(warnings.some((item) => item.id === "badge-wrap")).toBe(true);
    expect(canExport(input({ badge: { ...badge, cutMm: 40 } }))).toBe(false);
  });

  it("blocks a layout with no capacity", () => {
    const warnings = validateStudio(
      input({ page: { ...page, marginMm: 120 } }),
    );
    expect(warnings.some((item) => item.id === "capacity-zero")).toBe(true);
  });

  it("warns when a manual grid is bounded", () => {
    const warnings = validateStudio(
      input({ layout: { ...layout, mode: "manual", rows: 99, cols: 99 } }),
    );
    expect(warnings.some((item) => item.id === "grid-bounded")).toBe(true);
  });

  it("warns for low effective resolution", () => {
    const smallArtwork: Artwork = {
      ...artwork,
      sourceWidth: 200,
      sourceHeight: 200,
    };
    const warnings = validateStudio(input({ artwork: smallArtwork }));
    expect(warnings.some((item) => item.id === "low-dpi")).toBe(true);
  });

  it("explains that artwork is required", () => {
    const warnings = validateStudio(input({ artwork: null }));
    expect(warnings.some((item) => item.id === "artwork-missing")).toBe(true);
    expect(canExport(input({ artwork: null }))).toBe(false);
  });

  it("warns about printer margins below 5 mm", () => {
    const warnings = validateStudio(
      input({ page: { ...page, marginMm: 2 } }),
    );
    expect(warnings.some((item) => item.id === "printer-margin")).toBe(true);
  });

  it("rejects invalid copy counts", () => {
    const warnings = validateStudio(
      input({ layout: { ...layout, copies: 0 } }),
    );
    expect(warnings.some((item) => item.id === "copies")).toBe(true);
  });
});
