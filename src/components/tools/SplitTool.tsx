import { useState, useCallback } from 'react';
import FileUpload from '../FileUpload';
import type { PDFFileInfo } from '../../lib/pdf';
import { getPdfInfo, splitPdf, downloadBlob, downloadMultiple, formatFileSize } from '../../lib/pdf';

export default function SplitTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [rangeText, setRangeText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<'ranges' | 'each'>('each');

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setDone(false);
    setRangeText('');
  }, []);

  const parseRanges = (): [number, number][] | null => {
    if (!pdfInfo) return null;
    try {
      return rangeText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((part) => {
          const [a, b] = part.split('-').map((n) => parseInt(n.trim(), 10));
          const start = a - 1;
          const end = (b ?? a) - 1;
          if (start < 0 || end >= pdfInfo.pageCount || start > end) {
            throw new Error(`Invalid range: ${part}`);
          }
          return [start, end] as [number, number];
        });
    } catch {
      return null;
    }
  };

  const handleSplit = async () => {
    if (!pdfInfo) return;
    setProcessing(true);
    try {
      let ranges: [number, number][];

      if (mode === 'each') {
        ranges = Array.from({ length: pdfInfo.pageCount }, (_, i) => [i, i] as [number, number]);
      } else {
        const parsed = parseRanges();
        if (!parsed || parsed.length === 0) {
          alert('Please enter valid page ranges.');
          setProcessing(false);
          return;
        }
        ranges = parsed;
      }

      const results = await splitPdf(pdfInfo.data, ranges);
      const baseName = pdfInfo.name.replace(/\.pdf$/i, '');

      if (results.length === 1) {
        downloadBlob(results[0], `${baseName}_split.pdf`);
      } else {
        downloadMultiple(results, baseName);
      }
      setDone(true);
    } catch (err) {
      console.error('Split failed:', err);
      alert('Failed to split PDF. Please check your ranges.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setPdfInfo(null);
    setRangeText('');
    setDone(false);
  };

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to split"
        description="Extract pages or split into separate files"
      />
    );
  }

  const validRanges = mode === 'ranges' ? parseRanges() : null;

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

      {/* Mode selection */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg">Split mode</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setMode('each'); setDone(false); }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${mode === 'each'
                ? 'border-accent bg-accent-muted'
                : 'border-border hover:border-border-light'
              }`}
          >
            <p className="font-display font-bold text-sm">Extract every page</p>
            <p className="text-xs text-text-muted mt-1">
              Each page becomes its own PDF
            </p>
          </button>
          <button
            onClick={() => { setMode('ranges'); setDone(false); }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${mode === 'ranges'
                ? 'border-accent bg-accent-muted'
                : 'border-border hover:border-border-light'
              }`}
          >
            <p className="font-display font-bold text-sm">Custom ranges</p>
            <p className="text-xs text-text-muted mt-1">
              Specify which pages to extract
            </p>
          </button>
        </div>
      </div>

      {/* Range input */}
      {mode === 'ranges' && (
        <div className="space-y-3 animate-fade-in">
          <label className="block text-sm text-text-muted">
            Enter page ranges (e.g. <span className="font-mono text-accent">1-3, 5, 8-10</span>)
          </label>
          <input
            type="text"
            value={rangeText}
            onChange={(e) => { setRangeText(e.target.value); setDone(false); }}
            placeholder="1-3, 5, 8-10"
            className="w-full px-4 py-3 rounded-xl bg-surface-elevated border border-border text-text font-mono focus:outline-none focus:border-accent transition-colors"
          />
          {rangeText && !validRanges && (
            <p className="text-xs text-danger">
              Invalid ranges. Use format: 1-3, 5, 8-10 (max page: {pdfInfo.pageCount})
            </p>
          )}
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleSplit}
        disabled={processing || (mode === 'ranges' && !validRanges)}
        className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Splitting...
          </>
        ) : done ? (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9L7.5 13L14.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Downloaded!
          </>
        ) : (
          <>
            Split PDF
            {mode === 'each' && (
              <span className="text-sm font-mono opacity-70">
                → {pdfInfo.pageCount} files
              </span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
