import type { Artwork, Transform } from "./types";

export interface RenderDiscOptions {
  artwork: Artwork;
  transform: Transform;
  cutMm: number;
  background: string;
  sizePx: number;
}

export interface RenderFaceOptions {
  disc: HTMLCanvasElement;
  faceMm: number;
  cutMm: number;
  sizePx: number;
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

/**
 * Compose the circular print disc. The area outside the cut circle stays
 * transparent so the PDF page (paper) shows through.
 */
export function renderDisc(options: RenderDiscOptions): HTMLCanvasElement {
  const { artwork, transform, cutMm, background, sizePx } = options;

  if (!Number.isFinite(cutMm) || cutMm <= 0) {
    throw new Error("Invalid cut diameter.");
  }

  const canvas = createCanvas(sizePx, sizePx);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");

  const radius = canvas.width / 2;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.beginPath();
  context.arc(radius, radius, radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();

  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const coverScale =
    Math.max(canvas.width / artwork.sourceWidth, canvas.height / artwork.sourceHeight) *
    Math.max(0.01, transform.zoom);
  const drawWidth = artwork.sourceWidth * coverScale;
  const drawHeight = artwork.sourceHeight * coverScale;
  const centerX = radius + transform.offsetX * canvas.width;
  const centerY = radius + transform.offsetY * canvas.height;

  context.translate(centerX, centerY);
  context.rotate((transform.rotationDeg * Math.PI) / 180);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    artwork.image,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );

  context.restore();
  return canvas;
}

/**
 * Magnify the finished face (the central portion of the print disc) to fill the
 * preview frame. The outer wrap ring is intentionally hidden.
 */
export function renderFaceView(options: RenderFaceOptions): HTMLCanvasElement {
  const { disc, faceMm, cutMm, sizePx } = options;
  const canvas = createCanvas(sizePx, sizePx);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");

  const radius = canvas.width / 2;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.beginPath();
  context.arc(radius, radius, radius, 0, Math.PI * 2);
  context.closePath();
  context.clip();

  const facePx = disc.width * Math.min(1, faceMm / cutMm);
  const sourceX = (disc.width - facePx) / 2;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    disc,
    sourceX,
    sourceX,
    facePx,
    facePx,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  context.restore();

  return canvas;
}

export function discToDataUrl(disc: HTMLCanvasElement): string {
  return disc.toDataURL("image/png");
}

export function discToPngBytes(disc: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    disc.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error("The badge image could not be encoded."));
        return;
      }
      try {
        resolve(new Uint8Array(await blob.arrayBuffer()));
      } catch (error) {
        reject(error);
      }
    }, "image/png");
  });
}
