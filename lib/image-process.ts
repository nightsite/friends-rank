export const AVATAR_DATA_MAX_BYTES = 2_500_000;
export const ATTACHMENT_DATA_MAX_BYTES = 4_000_000;
export const ALLOWED_IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIMES)[number];

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("Could not read file."));
    fr.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image."));
    img.src = dataUrl;
  });
}

type ProcessOpts = {
  /** Maximum side length, square crop applied. */
  maxSize: number;
  /** Output mime; for stills we prefer image/webp. GIFs are passed through untouched. */
  outputMime?: "image/webp" | "image/jpeg";
  /** 0..1 quality for jpeg/webp. */
  quality?: number;
  /** Square-crop centered, rather than letterbox. */
  square?: boolean;
};

export type ProcessedImage = { dataUrl: string; mime: string };

/**
 * Reads a File and returns a base64 data URL.
 * - GIFs are passed through unchanged so their animation is preserved.
 * - Other images are decoded to a Canvas, optionally square-cropped centered, and downscaled.
 */
export async function fileToProcessedImage(
  file: File,
  opts: ProcessOpts,
): Promise<ProcessedImage> {
  const mime = (file.type || "").toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.includes(mime as AllowedImageMime)) {
    throw new Error("Unsupported image type. Use PNG, JPEG, WEBP or GIF.");
  }

  const original = await readAsDataUrl(file);

  if (mime === "image/gif") {
    if (file.size > AVATAR_DATA_MAX_BYTES) {
      throw new Error(
        `GIF is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${(AVATAR_DATA_MAX_BYTES / 1024 / 1024).toFixed(1)} MB.`,
      );
    }
    return { dataUrl: original, mime };
  }

  const img = await loadImage(original);
  const { maxSize, outputMime = "image/webp", quality = 0.85, square = true } = opts;

  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (square) {
    const side = Math.min(sw, sh);
    sx = Math.floor((sw - side) / 2);
    sy = Math.floor((sh - side) / 2);
    sw = side;
    sh = side;
  }

  const ratio = Math.min(1, maxSize / Math.max(sw, sh));
  const dw = Math.max(1, Math.round(sw * ratio));
  const dh = Math.max(1, Math.round(sh * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

  const dataUrl = canvas.toDataURL(outputMime, quality);
  return { dataUrl, mime: outputMime };
}

export function approximateBase64Bytes(dataUrl: string): number {
  const i = dataUrl.indexOf(",");
  const b64 = i >= 0 ? dataUrl.slice(i + 1) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}
