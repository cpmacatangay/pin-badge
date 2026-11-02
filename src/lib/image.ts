import { MAX_SOURCE_PX, MAX_UPLOAD_BYTES } from "./presets";
import type { Artwork } from "./types";
import { formatFileSize } from "./units";

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);

const EXTENSION_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  svg: "image/svg+xml",
};

export function resolveMimeType(file: File): string {
  if (ALLOWED_TYPES.has(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[extension] ?? file.type;
}

export function validateFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return `That file is ${formatFileSize(file.size)}. The limit is ${formatFileSize(MAX_UPLOAD_BYTES)}.`;
  }
  const mime = resolveMimeType(file);
  if (!ALLOWED_TYPES.has(mime)) {
    return "Use a PNG, JPG, WebP, or SVG file.";
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  return null;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("The image could not be decoded. Try another format."));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The image could not be prepared."));
    }, "image/png");
  });
}

export async function loadArtwork(file: File): Promise<Artwork> {
  const validationError = validateFile(file);
  if (validationError) throw new Error(validationError);

  const mime = resolveMimeType(file);
  const kind: Artwork["kind"] = mime === "image/svg+xml" ? "vector" : "raster";
  let objectUrl = URL.createObjectURL(file);
  let image = await loadImage(objectUrl);

  let sourceWidth = image.naturalWidth || image.width || 1024;
  let sourceHeight = image.naturalHeight || image.height || 1024;

  const maxDimension = Math.max(sourceWidth, sourceHeight);
  if (kind === "raster" && maxDimension > MAX_SOURCE_PX) {
    const scale = MAX_SOURCE_PX / maxDimension;
    const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
    const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare this image.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas);
    const resizedUrl = URL.createObjectURL(blob);
    const resizedImage = await loadImage(resizedUrl);

    URL.revokeObjectURL(objectUrl);
    objectUrl = resizedUrl;
    image = resizedImage;
    sourceWidth = targetWidth;
    sourceHeight = targetHeight;
  }

  return {
    name: file.name,
    size: file.size,
    kind,
    image,
    sourceWidth,
    sourceHeight,
    objectUrl,
  };
}

export function releaseArtwork(artwork: Artwork | null): void {
  if (artwork) URL.revokeObjectURL(artwork.objectUrl);
}
