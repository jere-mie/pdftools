import { useState, useCallback } from 'react';
import FileUpload from '../FileUpload';
import PageThumbnail from '../PageThumbnail';
import type { PDFFileInfo } from '../../lib/pdf';
import { getPdfInfo, rotatePdfPages, downloadBlob, formatFileSize } from '../../lib/pdf';

export default function RotateTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [rotations, setRotations] = useState<Map<number, number>>(new Map());
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setRotations(new Map());
    setDone(false);
  }, []);

  const rotateAll = (deg: number) => {
    if (!pdfInfo) return;
    const newRot = new Map<number, number>();
    for (let i = 0; i < pdfInfo.pageCount; i++) {
      const current = rotations.get(i) ?? 0;
      newRot.set(i, (current + deg + 360) % 360);
    }
    setRotations(newRot);
    setDone(false);
  };

  const rotatePage = (index: number, deg: number) => {
    const current = rotations.get(index) ?? 0;
    setRotations(new Map(rotations).set(index, (current + deg + 360) % 360));
    setDone(false);
  };

  const handleRotate = async () => {
    if (!pdfInfo || rotations.size === 0) return;
    setProcessing(true);
    try {
      const result = await rotatePdfPages(pdfInfo.data, rotations);
      const name = pdfInfo.name.replace(/\.pdf$/i, '_rotated.pdf');
      downloadBlob(result, name);
      setDone(true);
    } catch (err) {
      console.error('Rotate failed:', err);
      alert('Failed to rotate PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setPdfInfo(null);
    setRotations(new Map());
    setDone(false);
  };

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to rotate"
        description="Rotate individual pages or the entire document"
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* File info */}
      <div className="flex items-center justify-between p-5 rounded-xl bg-surface border border-border">
        <div>
          <p className="font-medium">{pdfInfo.name}</p>
          <p className="text-sm text-text-muted font-mono">
            {pdfInfo.pageCount} pages · {formatFileSize(pdfInfo.size)}
          </p>
        </div>
        <button
          onClick={reset}
          className="text-sm text-text-muted hover:text-accent transition-colors cursor-pointer"
        >
          Change file
        </button>
      </div>

      {/* Rotate all controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-muted font-medium">Rotate all:</span>
        {[90, 180, 270].map((deg) => (
          <button
            key={deg}
            onClick={() => rotateAll(deg)}
            className="px-4 py-2 rounded-lg bg-surface-elevated border border-border hover:border-accent text-sm font-mono transition-colors cursor-pointer"
          >
            {deg}°
          </button>
        ))}
      </div>

      {/* Page grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: pdfInfo.pageCount }, (_, i) => {
          const rot = rotations.get(i) ?? 0;
          return (
            <div key={i} className="space-y-2">
              <PageThumbnail
                pdfData={pdfInfo.data}
                pageNum={i + 1}
                rotation={rot}
                label={`Page ${i + 1}${rot ? ` · ${rot}°` : ''}`}
                selected={rot !== 0}
              />
              <div className="flex gap-1 justify-center">
                <button
                  onClick={() => rotatePage(i, -90)}
                  className="p-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-muted hover:text-text transition-colors cursor-pointer"
                  title="Rotate left"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7.5A4.5 4.5 0 017.5 3H9M9 3L7 1M9 3L7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" transform="scale(-1,1) translate(-14,0)" />
                  </svg>
                </button>
                <button
                  onClick={() => rotatePage(i, 90)}
                  className="p-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-border text-text-muted hover:text-text transition-colors cursor-pointer"
                  title="Rotate right"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7.5A4.5 4.5 0 017.5 3H9M9 3L7 1M9 3L7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <button
        onClick={handleRotate}
        disabled={processing || rotations.size === 0}
        className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Rotating...
          </>
        ) : done ? (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9L7.5 13L14.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Downloaded!
          </>
        ) : (
          'Apply Rotation & Download'
        )}
      </button>
    </div>
  );
}
