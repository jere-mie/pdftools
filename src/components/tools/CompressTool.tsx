import { useState, useCallback, useEffect, useRef } from 'react';
import FileUpload from '../FileUpload';
import type { PDFFileInfo, GsQuality } from '../../lib/pdf';
import { getPdfInfo, compressPdf, downloadBlob, formatFileSize } from '../../lib/pdf';

const QUALITY_OPTIONS: { value: GsQuality; label: string; description: string }[] = [
  { value: 'screen', label: 'Screen', description: '72 dpi · smallest file' },
  { value: 'ebook', label: 'eBook', description: '150 dpi · balanced' },
  { value: 'printer', label: 'Print', description: '300 dpi · high quality' },
  { value: 'prepress', label: 'Prepress', description: '300+ dpi · largest file' },
];

export default function CompressTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [quality, setQuality] = useState<GsQuality>('ebook');
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elastic simulated progress: advances quickly then decelerates toward 90%
  useEffect(() => {
    if (processing) {
      setProgress(0);
      progressIntervalRef.current = setInterval(() => {
        setProgress((p) => p + (90 - p) * 0.045);
      }, 250);
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      // Snap to 100 briefly when done, then reset
      setProgress(100);
      const t = setTimeout(() => setProgress(0), 600);
      return () => clearTimeout(t);
    }
  }, [processing]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setResult(null);
  }, []);

  const handleCompress = async () => {
    if (!pdfInfo) return;
    setProcessing(true);
    try {
      const data = await compressPdf(pdfInfo.data, quality);
      setResult({ data, size: data.length });
    } catch (err) {
      console.error('Compress failed:', err);
      alert('Failed to compress PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !pdfInfo) return;
    const name = pdfInfo.name.replace(/\.pdf$/i, '_optimized.pdf');
    downloadBlob(result.data, name);
  };

  const reset = () => {
    setPdfInfo(null);
    setResult(null);
    setProgress(0);
  };

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to compress"
        description="Optimize your PDF with Ghostscript - real image downsampling and font subsetting"
      />
    );
  }

  const savings = result ? pdfInfo.size - result.size : 0;
  const savingsPercent = result
    ? ((savings / pdfInfo.size) * 100).toFixed(1)
    : '0';

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

      {/* Quality selector */}
      <div className="space-y-3">
        <p className="text-sm font-display font-bold">Quality preset</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setResult(null); setQuality(opt.value); }}
              disabled={processing}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${quality === opt.value
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border bg-surface hover:border-accent/50'
                }`}
            >
              <span className="font-display font-bold text-sm">{opt.label}</span>
              <span className="text-xs text-text-muted mt-0.5">{opt.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="p-5 rounded-xl bg-surface-elevated border border-border">
        <h3 className="font-display font-bold text-sm mb-2">
          What this does
        </h3>
        <ul className="space-y-1.5 text-sm text-text-muted">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">→</span>
            Downsamples and recompresses images to the selected quality
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">→</span>
            Subsets and removes unused embedded fonts
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">→</span>
            Strips metadata and removes redundant PDF objects
          </li>
        </ul>
        <p className="text-xs text-text-dim mt-3">
          Processed locally in your browser via Ghostscript WebAssembly - no upload required.
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className="p-6 rounded-xl border-2 border-accent/30 bg-accent-muted animate-fade-in">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Original
              </p>
              <p className="font-mono text-xl font-bold">
                {formatFileSize(pdfInfo.size)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Optimized
              </p>
              <p className="font-mono text-xl font-bold text-accent">
                {formatFileSize(result.size)}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
                Saved
              </p>
              <p
                className={`font-mono text-xl font-bold ${savings > 0 ? 'text-success' : 'text-text-muted'
                  }`}
              >
                {savings > 0 ? '-' : ''}
                {savingsPercent}%
              </p>
            </div>
          </div>
          {savings <= 0 && (
            <p className="text-sm text-text-muted text-center mt-4">
              This PDF is already well-optimized. The output may be the same size or slightly larger.
            </p>
          )}
        </div>
      )}

      {/* Progress bar */}
      {processing && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span>Processing with Ghostscript...</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-elevated overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text-dim">
            This may take a moment for large or image-heavy PDFs.
          </p>
        </div>
      )}

      {/* Action */}
      <div className="flex gap-3">
        {!result ? (
          <button
            onClick={handleCompress}
            disabled={processing}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-3"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Compressing...
              </>
            ) : (
              'Compress PDF'
            )}
          </button>
        ) : (
          <button
            onClick={handleDownload}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2V12M9 12L5 8M9 12L13 8M3 15H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Download Optimized PDF
          </button>
        )}
      </div>
    </div>
  );
}
