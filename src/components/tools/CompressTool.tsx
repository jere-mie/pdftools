import { useState, useCallback } from 'react';
import FileUpload from '../FileUpload';
import type { PDFFileInfo } from '../../lib/pdf';
import { getPdfInfo, compressPdf, downloadBlob, formatFileSize } from '../../lib/pdf';

export default function CompressTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ data: Uint8Array; size: number } | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setResult(null);
  }, []);

  const handleCompress = async () => {
    if (!pdfInfo) return;
    setProcessing(true);
    try {
      const data = await compressPdf(pdfInfo.data);
      setResult({ data, size: data.length });
    } catch (err) {
      console.error('Compress failed:', err);
      alert('Failed to optimize PDF.');
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
  };

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to compress"
        description="Optimize your PDF by stripping metadata and re-serializing"
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

      {/* Info box */}
      <div className="p-5 rounded-xl bg-surface-elevated border border-border">
        <h3 className="font-display font-bold text-sm mb-2">
          What this does
        </h3>
        <ul className="space-y-1.5 text-sm text-text-muted">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">→</span>
            Re-serializes the PDF through a clean document structure
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">→</span>
            Strips document metadata (author, title, keywords)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">→</span>
            Removes unused objects and redundancies
          </li>
        </ul>
        <p className="text-xs text-text-dim mt-3">
          Note: This is a frontend-only optimization. For maximum compression
          (including image downsampling), a server-side tool is recommended.
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className="p-6 rounded-xl border-2 border-accent/30 bg-accent-muted animate-fade-in">
          <div className="grid grid-cols-3 gap-6 text-center">
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
                className={`font-mono text-xl font-bold ${
                  savings > 0 ? 'text-success' : 'text-text-muted'
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

      {/* Action */}
      <div className="flex gap-3">
        {!result ? (
          <button
            onClick={handleCompress}
            disabled={processing}
            className="px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-3"
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
            className="px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all cursor-pointer flex items-center gap-3"
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
