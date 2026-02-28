import { useState, useCallback } from 'react';
import FileUpload from '../FileUpload';
import type { PDFFileInfo } from '../../lib/pdf';
import { getPdfInfo, resizePdfPages, downloadBlob, formatFileSize, PAGE_SIZES } from '../../lib/pdf';

const SIZE_KEYS = Object.keys(PAGE_SIZES);

export default function ResizeTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setDone(false);
  }, []);

  const handleResize = async () => {
    if (!pdfInfo) return;
    setProcessing(true);
    try {
      const [w, h] = PAGE_SIZES[selectedSize];
      const width = orientation === 'portrait' ? w : h;
      const height = orientation === 'portrait' ? h : w;
      const result = await resizePdfPages(pdfInfo.data, width, height);
      const name = pdfInfo.name.replace(
        /\.pdf$/i,
        `_${selectedSize.toLowerCase()}.pdf`,
      );
      downloadBlob(result, name);
      setDone(true);
    } catch (err) {
      console.error('Resize failed:', err);
      alert('Failed to resize PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setPdfInfo(null);
    setDone(false);
  };

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to resize"
        description="Change page dimensions to a standard size"
      />
    );
  }

  const [w, h] = PAGE_SIZES[selectedSize];
  const displayW = orientation === 'portrait' ? w : h;
  const displayH = orientation === 'portrait' ? h : w;

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

      {/* Page size selection */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg">Target Page Size</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
          {SIZE_KEYS.map((key) => {
            const [sw, sh] = PAGE_SIZES[key];
            return (
              <button
                key={key}
                onClick={() => { setSelectedSize(key); setDone(false); }}
                className={`p-4 rounded-xl border-2 text-center transition-all cursor-pointer ${selectedSize === key
                    ? 'border-accent bg-accent-muted'
                    : 'border-border hover:border-border-light'
                  }`}
              >
                <p className="font-display font-bold text-sm">{key}</p>
                <p className="text-[10px] text-text-muted font-mono mt-1">
                  {sw.toFixed(0)}×{sh.toFixed(0)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orientation */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg">Orientation</h3>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button
            onClick={() => { setOrientation('portrait'); setDone(false); }}
            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${orientation === 'portrait'
                ? 'border-accent bg-accent-muted'
                : 'border-border hover:border-border-light'
              }`}
          >
            <div className="w-6 h-8 rounded border-2 border-current opacity-50" />
            <span className="font-display font-bold text-sm">Portrait</span>
          </button>
          <button
            onClick={() => { setOrientation('landscape'); setDone(false); }}
            className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all cursor-pointer ${orientation === 'landscape'
                ? 'border-accent bg-accent-muted'
                : 'border-border hover:border-border-light'
              }`}
          >
            <div className="w-8 h-6 rounded border-2 border-current opacity-50" />
            <span className="font-display font-bold text-sm">Landscape</span>
          </button>
        </div>
      </div>

      {/* Preview size info */}
      <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
        <p className="text-sm text-text-muted">
          All {pdfInfo.pageCount} pages will be padded to{' '}
          <span className="text-accent font-mono font-medium">
            {selectedSize} {orientation}
          </span>{' '}
          ({displayW.toFixed(0)} × {displayH.toFixed(0)} pts)
        </p>
        <p className="text-xs text-text-dim">
          Original content is centered on the new page size. Nothing is cropped.
        </p>
      </div>

      {/* Action */}
      <button
        onClick={handleResize}
        disabled={processing}
        className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Resizing...
          </>
        ) : done ? (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9L7.5 13L14.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Downloaded!
          </>
        ) : (
          'Resize & Download'
        )}
      </button>
    </div>
  );
}
