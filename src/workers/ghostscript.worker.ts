/**
 * Web worker for PDF compression via Ghostscript WASM.
 * Runs in a separate thread to keep the UI responsive during CPU-intensive processing.
 */

// @ts-expect-error - no types shipped with the package
import initGhostscript from '@jspawn/ghostscript-wasm/gs.js';
import gsWasmUrl from '@jspawn/ghostscript-wasm/gs.wasm?url';

export type GsQuality = 'screen' | 'ebook' | 'printer' | 'prepress';

export interface GsRequest {
  id: string;
  pdfData: ArrayBuffer;
  quality: GsQuality;
}

export interface GsResponse {
  id: string;
  result?: ArrayBuffer;
  error?: string;
}

self.onmessage = async (event: MessageEvent<GsRequest>) => {
  const { id, pdfData, quality } = event.data;

  try {
    const gs = await initGhostscript({
      locateFile: (file: string) => (file === 'gs.wasm' ? gsWasmUrl : file),
      print: () => {},
      printErr: () => {},
    });

    gs.FS.writeFile('/input.pdf', new Uint8Array(pdfData));

    gs.callMain([
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.5',
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      `-dPDFSETTINGS=/${quality}`,
      '-sOutputFile=/output.pdf',
      '/input.pdf',
    ]);

    const result: Uint8Array = gs.FS.readFile('/output.pdf');

    const response: GsResponse = { id, result: result.buffer as ArrayBuffer };
    (self as unknown as Worker).postMessage(response, [result.buffer as ArrayBuffer]);
  } catch (err) {
    const response: GsResponse = { id, error: String(err) };
    (self as unknown as Worker).postMessage(response);
  }
};
