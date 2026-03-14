import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import FileUpload from '../FileUpload';
import type { PDFFileInfo, ImageFormat } from '../../lib/pdf';
import { getPdfInfo, renderPageAsImage, formatFileSize } from '../../lib/pdf';

type Resolution = { label: string; scale: number; dpi: number };

const RESOLUTIONS: Resolution[] = [
  { label: 'Screen', scale: 72 / 72,       dpi: 72  },  // 72 dpi  - low res, small file
  { label: 'Good',   scale: 150 / 72,      dpi: 150 },  // 150 dpi - solid screen quality
  { label: 'Print',  scale: 300 / 72,      dpi: 300 },  // 300 dpi - standard print quality
  { label: 'High',   scale: 600 / 72,      dpi: 600 },  // 600 dpi - high-res / archival
];

const FORMATS: { id: ImageFormat; label: string; ext: string }[] = [
  { id: 'png', label: 'PNG', ext: 'png' },
  { id: 'jpeg', label: 'JPEG', ext: 'jpg' },
  { id: 'webp', label: 'WebP', ext: 'webp' },
];

export default function ExportImageTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [mode, setMode] = useState<'all' | 'ranges'>('all');
  const [rangeText, setRangeText] = useState('');
  const [format, setFormat] = useState<ImageFormat>('png');
  const [resolution, setResolution] = useState<Resolution>(RESOLUTIONS[2]);
  const [quality, setQuality] = useState(90);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setDone(false);
    setRangeText('');
  }, []);

  const parseRanges = (): number[] | null => {
    if (!pdfInfo) return null;
    try {
      const pages = new Set<number>();
      rangeText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((part) => {
          if (part.includes('-')) {
            const [a, b] = part.split('-').map((n) => parseInt(n.trim(), 10));
            if (isNaN(a) || isNaN(b) || a < 1 || b > pdfInfo.pageCount || a > b) throw new Error();
            for (let i = a; i <= b; i++) pages.add(i);
          } else {
            const n = parseInt(part, 10);
            if (isNaN(n) || n < 1 || n > pdfInfo.pageCount) throw new Error();
            pages.add(n);
          }
        });
      const sorted = Array.from(pages).sort((a, b) => a - b);
      return sorted.length > 0 ? sorted : null;
    } catch {
      return null;
    }
  };

  const handleExport = async () => {
    if (!pdfInfo) return;
    setProcessing(true);
    setProgress(0);
    setDone(false);

    try {
      let pageNums: number[];
      if (mode === 'all') {
        pageNums = Array.from({ length: pdfInfo.pageCount }, (_, i) => i + 1);
      } else {
        const parsed = parseRanges();
        if (!parsed) {
          alert('Please enter valid page ranges.');
          setProcessing(false);
          return;
        }
        pageNums = parsed;
      }

      const qualityFraction = quality / 100;
      const baseName = pdfInfo.name.replace(/\.pdf$/i, '');
      const fmt = FORMATS.find((f) => f.id === format)!;

      if (pageNums.length === 1) {
        const blob = await renderPageAsImage(
          pdfInfo.data,
          pageNums[0],
          resolution.scale,
          format,
          qualityFraction,
        );
        setProgress(100);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_p${pageNums[0]}.${fmt.ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const zip = new JSZip();
        for (let i = 0; i < pageNums.length; i++) {
          const blob = await renderPageAsImage(
            pdfInfo.data,
            pageNums[i],
            resolution.scale,
            format,
            qualityFraction,
          );
          const padded = String(pageNums[i]).padStart(String(pdfInfo.pageCount).length, '0');
          zip.file(`${baseName}_p${padded}.${fmt.ext}`, blob);
          setProgress(Math.round(((i + 1) / pageNums.length) * 100));
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_images.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setDone(true);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export images.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setPdfInfo(null);
    setRangeText('');
    setDone(false);
    setProgress(0);
  };

  const validRanges = mode === 'ranges' ? parseRanges() : null;
  const pageCount = mode === 'all' ? (pdfInfo?.pageCount ?? 0) : (validRanges?.length ?? 0);

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to export as images"
        description="Convert pages to PNG, JPEG or WebP - all in your browser"
      />
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* File info bar */}
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

      {/* Page selection */}
      <div className="space-y-4">
        <h3 className="font-display font-bold text-lg">Pages</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { setMode('all'); setDone(false); }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              mode === 'all' ? 'border-accent bg-accent-muted' : 'border-border hover:border-border-light'
            }`}
          >
            <p className="font-display font-bold text-sm">All pages</p>
            <p className="text-xs text-text-muted mt-1">Export every page as an image</p>
          </button>
          <button
            onClick={() => { setMode('ranges'); setDone(false); }}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              mode === 'ranges' ? 'border-accent bg-accent-muted' : 'border-border hover:border-border-light'
            }`}
          >
            <p className="font-display font-bold text-sm">Custom pages</p>
            <p className="text-xs text-text-muted mt-1">Specify which pages to export</p>
          </button>
        </div>

        {mode === 'ranges' && (
          <div className="space-y-3 animate-fade-in">
            <label className="block text-sm text-text-muted">
              Enter pages or ranges (e.g.{' '}
              <span className="font-mono text-accent">1-3, 5, 8-10</span>)
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
                Invalid pages. Use format: 1-3, 5, 8-10 (max page: {pdfInfo.pageCount})
              </p>
            )}
          </div>
        )}
      </div>

      {/* Image format */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-lg">Format</h3>
        <div className="flex gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFormat(f.id); setDone(false); }}
              className={`px-5 py-2.5 rounded-xl border-2 font-display font-bold text-sm transition-all cursor-pointer ${
                format === f.id
                  ? 'border-accent bg-accent-muted text-accent'
                  : 'border-border hover:border-border-light text-text-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {format === 'png' && (
          <p className="text-xs text-text-muted">Lossless · supports transparency</p>
        )}
        {format === 'jpeg' && (
          <p className="text-xs text-text-muted">Lossy · smaller files · white background</p>
        )}
        {format === 'webp' && (
          <p className="text-xs text-text-muted">Modern · best compression · wide support</p>
        )}
      </div>

      {/* Resolution */}
      <div className="space-y-3">
        <h3 className="font-display font-bold text-lg">Resolution</h3>
        <div className="flex gap-2">
          {RESOLUTIONS.map((r) => (
            <button
              key={r.label}
              onClick={() => { setResolution(r); setDone(false); }}
              className={`flex-1 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                resolution.label === r.label
                  ? 'border-accent bg-accent-muted'
                  : 'border-border hover:border-border-light'
              }`}
            >
              <p className={`font-display font-bold text-sm text-center ${resolution.label === r.label ? 'text-accent' : 'text-text'}`}>
                {r.label}
              </p>
              <p className="text-xs text-text-muted text-center mt-0.5">{r.dpi} dpi</p>
            </button>
          ))}
        </div>
      </div>

      {/* Quality (JPEG / WebP only) */}
      {(format === 'jpeg' || format === 'webp') && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg">Quality</h3>
            <span className="font-mono text-accent text-sm">{quality}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={100}
            step={5}
            value={quality}
            onChange={(e) => { setQuality(Number(e.target.value)); setDone(false); }}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-xs text-text-muted font-mono">
            <span>50% smaller</span>
            <span>100% best quality</span>
          </div>
        </div>
      )}

      {/* Progress bar (while processing) */}
      {processing && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex justify-between text-xs text-text-muted font-mono">
            <span>Rendering pages...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-surface-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={processing || (mode === 'ranges' && !validRanges)}
        className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Exporting...
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v9M5 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Export{pageCount > 0 ? ` ${pageCount} ${pageCount === 1 ? 'image' : 'images'}` : ' images'}
            {pageCount > 1 && (
              <span className="text-sm font-mono opacity-70">→ .zip</span>
            )}
          </>
        )}
      </button>
    </div>
  );
}
