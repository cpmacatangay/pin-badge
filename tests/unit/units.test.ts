import { describe, expect, it } from "vitest";
import {
  cmToMm,
  formatDimension,
  fromMm,
  inToMm,
  mmToCm,
  mmToIn,
  mmToPt,
  normalizeRotation,
  ptToMm,
  roundTo,
  toMm,
} from "../../src/lib/units";

describe("units", () => {
  it("converts millimetres to PDF points exactly", () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 10);
    expect(mmToPt(210)).toBeCloseTo(595.2755905511812, 10);
    expect(mmToPt(297)).toBeCloseTo(841.8897637795277, 10);
    expect(ptToMm(72)).toBeCloseTo(25.4, 10);
  });

  it("converts between mm, cm, and inches", () => {
    expect(mmToCm(210)).toBe(21);
    expect(cmToMm(21)).toBe(210);
    expect(mmToIn(25.4)).toBeCloseTo(1, 10);
    expect(inToMm(1)).toBeCloseTo(25.4, 10);
    expect(toMm(21, "cm")).toBe(210);
    expect(toMm(8.5, "in")).toBeCloseTo(215.9, 10);
    expect(fromMm(215.9, "in")).toBeCloseTo(8.5, 10);
  });

  it("round-trips units without changing physical size", () => {
    const values = [1, 8, 25, 35, 44, 54, 210, 279.4, 297];
    values.forEach((value) => {
      expect(toMm(fromMm(value, "mm"), "mm")).toBeCloseTo(value, 10);
      expect(toMm(fromMm(value, "cm"), "cm")).toBeCloseTo(value, 10);
      expect(toMm(fromMm(value, "in"), "in")).toBeCloseTo(value, 10);
    });
  });

  it("formats dimensions with the requested unit", () => {
    expect(formatDimension(210, "mm")).toBe("210 mm");
    expect(formatDimension(210, "cm")).toBe("21 cm");
    expect(formatDimension(215.9, "in")).toBe("8.5 in");
    expect(formatDimension(Number.NaN, "mm")).toBe("—");
  });

  it("rounds to a fixed number of decimals", () => {
    expect(roundTo(1.23456, 2)).toBe(1.23);
    expect(roundTo(1.235, 2)).toBe(1.24);
    expect(roundTo(-1.235, 2)).toBe(-1.24);
  });

  it("normalises rotation into [-180, 180)", () => {
    expect(normalizeRotation(0)).toBe(0);
    expect(normalizeRotation(360)).toBe(0);
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-450)).toBe(-90);
    expect(normalizeRotation(180)).toBe(180);
  });
});
