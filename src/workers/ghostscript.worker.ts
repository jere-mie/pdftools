/**
 * Web worker for PDF compression via Ghostscript WASM.
 * Runs in a separate thread to keep the UI responsive during the CPU-intensive
 * Ghostscript processing.
 */

// @ts-expect-error – no types shipped with the package
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
    // Each compression creates a fresh Ghostscript WASM instance because
    // the Emscripten runtime is not designed for multiple callMain invocations.
    const gs = await initGhostscript({
      locateFile: (file: string) => (file === 'gs.wasm' ? gsWasmUrl : file),
      // Suppress Ghostscript stdout/stderr in the worker console
      print: () => {},
      printErr: () => {},
    });

    // Write the input PDF into the virtual MEMFS
    gs.FS.writeFile('/input.pdf', new Uint8Array(pdfData));

    // Run Ghostscript – this is synchronous inside the WASM execution context
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

    // Transfer the underlying buffer to avoid copying
    const response: GsResponse = { id, result: result.buffer as ArrayBuffer };
    (self as unknown as Worker).postMessage(response, [result.buffer as ArrayBuffer]);
  } catch (err) {
    const response: GsResponse = { id, error: String(err) };
    (self as unknown as Worker).postMessage(response);
  }
};
