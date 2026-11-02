export function downloadBlob(
  data: Uint8Array | ArrayBuffer | Blob,
  filename: string,
  type = "application/pdf",
): void {
  let blob: Blob;
  if (data instanceof Blob) {
    blob = data;
  } else {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    blob = new Blob([copy.buffer], { type });
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
