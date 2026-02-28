import { PDFDocument, degrees, rgb } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Setup PDF.js worker using Vite-bundled URL
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/* ─── Types ─── */

export interface PDFFileInfo {
  file: File;
  name: string;
  pageCount: number;
  size: number;
  data: ArrayBuffer;
}

/* ─── Helpers ─── */

export async function getPdfInfo(file: File): Promise<PDFFileInfo> {
  const data = await file.arrayBuffer();
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  return {
    file,
    name: file.name,
    pageCount: doc.getPageCount(),
    size: file.size,
    data,
  };
}

/**
 * Cache loaded PDF documents so we don't re-parse the same file for every page.
 * WeakMap ensures the cache entry is released when the ArrayBuffer is GC'd.
 * We must copy the buffer before handing it to pdfjs because its worker will
 * *transfer* (detach) the underlying ArrayBuffer, which would break every
 * other concurrent caller that shares the same buffer reference.
 */
const pdfDocCache = new WeakMap<ArrayBuffer, Promise<pdfjsLib.PDFDocumentProxy>>();

function loadPdfDocument(data: ArrayBuffer): Promise<pdfjsLib.PDFDocumentProxy> {
  let cached = pdfDocCache.get(data);
  if (!cached) {
    // .slice(0) creates an independent copy so the original is never detached
    cached = pdfjsLib.getDocument({ data: new Uint8Array(data.slice(0)) }).promise;
    pdfDocCache.set(data, cached);
  }
  return cached;
}

export async function renderPageThumbnail(
  data: ArrayBuffer,
  pageNum: number,
  scale = 0.4,
): Promise<string> {
  const pdf = await loadPdfDocument(data);
  const page = await pdf.getPage(pageNum); // 1-indexed
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function downloadBlob(data: Uint8Array, filename: string) {
  const blob = new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadMultiple(results: Uint8Array[], baseName: string) {
  results.forEach((data, i) => {
    downloadBlob(data, `${baseName}_part${i + 1}.pdf`);
  });
}

/* ─── PDF Operations ─── */

export async function mergePdfs(files: File[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const donor = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(donor, donor.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}

export async function splitPdf(
  data: ArrayBuffer,
  ranges: [number, number][],
): Promise<Uint8Array[]> {
  const source = await PDFDocument.load(data, { ignoreEncryption: true });
  const results: Uint8Array[] = [];

  for (const [start, end] of ranges) {
    const newDoc = await PDFDocument.create();
    const indices = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    const pages = await newDoc.copyPages(source, indices);
    pages.forEach((p) => newDoc.addPage(p));
    results.push(await newDoc.save());
  }

  return results;
}

export async function rotatePdfPages(
  data: ArrayBuffer,
  rotations: Map<number, number>,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const pages = doc.getPages();

  for (const [index, rotation] of rotations) {
    if (index < pages.length) {
      const current = pages[index].getRotation().angle;
      pages[index].setRotation(degrees((current + rotation) % 360));
    }
  }

  return doc.save();
}

export async function deletePdfPages(
  data: ArrayBuffer,
  indicesToDelete: number[],
): Promise<Uint8Array> {
  const source = await PDFDocument.load(data, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const keepIndices = source.getPageIndices().filter((i) => !indicesToDelete.includes(i));
  if (keepIndices.length === 0) throw new Error('Cannot delete all pages');

  const pages = await newDoc.copyPages(source, keepIndices);
  pages.forEach((p) => newDoc.addPage(p));

  return newDoc.save();
}

export async function reorderPdfPages(
  data: ArrayBuffer,
  newOrder: number[],
): Promise<Uint8Array> {
  const source = await PDFDocument.load(data, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const pages = await newDoc.copyPages(source, newOrder);
  pages.forEach((p) => newDoc.addPage(p));

  return newDoc.save();
}

export type GsQuality = 'screen' | 'ebook' | 'printer' | 'prepress';

/**
 * Compress a PDF using Ghostscript WASM in a dedicated web worker.
 * Ghostscript performs real image downsampling and font subsetting, producing
 * significantly smaller files compared to a pure JS re-serialisation.
 *
 * @param data     - Raw PDF bytes
 * @param quality  - Ghostscript PDFSETTINGS preset (screen < ebook < printer < prepress)
 */
export function compressPdf(
  data: ArrayBuffer,
  quality: GsQuality = 'ebook',
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/ghostscript.worker.ts', import.meta.url),
      { type: 'module' },
    );

    const id = Math.random().toString(36).slice(2);

    worker.onmessage = (event) => {
      const { id: msgId, result, error } = event.data;
      if (msgId !== id) return;
      worker.terminate();
      if (error) {
        reject(new Error(error));
      } else {
        resolve(new Uint8Array(result as ArrayBuffer));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    // Transfer the buffer so the worker owns it and no copy is made
    const copy = data.slice(0);
    worker.postMessage({ id, pdfData: copy, quality }, [copy]);
  });
}

export const PAGE_SIZES: Record<string, [number, number]> = {
  'A3': [841.89, 1190.55],
  'A4': [595.28, 841.89],
  'A5': [419.53, 595.28],
  'Letter': [612, 792],
  'Legal': [612, 1008],
  'Tabloid': [792, 1224],
};

export async function resizePdfPages(
  data: ArrayBuffer,
  width: number,
  height: number,
  pageIndices?: number[],
): Promise<Uint8Array> {
  const source = await PDFDocument.load(data, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();
  const allIndices = source.getPageIndices();
  const targets = new Set(pageIndices ?? allIndices);

  for (let i = 0; i < allIndices.length; i++) {
    if (targets.has(i)) {
      const srcPage = source.getPage(i);
      const { width: origW, height: origH } = srcPage.getSize();

      // Create a new blank page at the target size with white background
      const newPage = newDoc.addPage([width, height]);
      newPage.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 1, 1),
      });

      // Embed the page directly from the source document
      const embeddedPage = await newDoc.embedPage(srcPage);

      // Scale to fit within target while preserving aspect ratio
      const scaleX = width / origW;
      const scaleY = height / origH;
      const scale = Math.min(scaleX, scaleY, 1); // never upscale

      const drawW = origW * scale;
      const drawH = origH * scale;

      // Center on the page
      const offsetX = (width - drawW) / 2;
      const offsetY = (height - drawH) / 2;

      newPage.drawPage(embeddedPage, {
        x: offsetX,
        y: offsetY,
        width: drawW,
        height: drawH,
      });
    } else {
      // Non-targeted pages: copy as-is
      const [copied] = await newDoc.copyPages(source, [i]);
      newDoc.addPage(copied);
    }
  }

  return newDoc.save();
}
