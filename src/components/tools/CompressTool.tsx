import { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import FileUpload from '../FileUpload';
import type { PDFFileInfo, GsQuality } from '../../lib/pdf';
import { getPdfInfo, compressPdf, downloadBlob, formatFileSize } from '../../lib/pdf';

const QUALITY_OPTIONS: { value: GsQuality; label: string; description: string }[] = [
  { value: 'screen', label: 'Screen', description: '72 dpi · smallest file' },
  { value: 'ebook', label: 'eBook', description: '150 dpi · balanced' },
  { value: 'printer', label: 'Print', description: '300 dpi · high quality' },
  { value: 'prepress', label: 'Prepress', description: '300+ dpi · largest file' },
];

interface CompressFileInfo extends PDFFileInfo {
  id: string;
}

interface CompressResult {
  id: string;
  name: string;
  originalSize: number;
  pageCount: number;
  data: Uint8Array | null;
  size: number | null;
  error: string | null;
}

function optimizedName(name: string) {
  return name.replace(/\.pdf$/i, '') + '_optimized.pdf';
}

function uniqueName(name: string, usedNames: Set<string>) {
  if (!usedNames.has(name)) {
    usedNames.add(name);
    return name;
  }

  const extensionMatch = name.match(/(\.[^.]+)$/);
  const extension = extensionMatch?.[1] ?? '';
  const base = extension ? name.slice(0, -extension.length) : name;
  let index = 2;
  let candidate = `${base}_${index}${extension}`;

  while (usedNames.has(candidate)) {
    index += 1;
    candidate = `${base}_${index}${extension}`;
  }

  usedNames.add(candidate);
  return candidate;
}

export default function CompressTool() {
  const [pdfInfos, setPdfInfos] = useState<CompressFileInfo[]>([]);
  const [processing, setProcessing] = useState(false);
  const [quality, setQuality] = useState<GsQuality>('ebook');
  const [results, setResults] = useState<CompressResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setProgress(100);
      const t = setTimeout(() => {
        if (results.length === 0) setProgress(0);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [processing, results.length]);

  const handleFileSelected = useCallback(async (files: File[]) => {
    setLoadingFiles(true);
    try {
      const settled = await Promise.allSettled(files.map(getPdfInfo));
      const infos = settled
        .filter((result): result is PromiseFulfilledResult<PDFFileInfo> => result.status === 'fulfilled')
        .map((result) => ({ ...result.value, id: crypto.randomUUID() }));

      if (infos.length === 0) {
        alert('No readable PDFs were selected.');
        return;
      }

      if (settled.some((result) => result.status === 'rejected')) {
        alert('Some PDFs could not be read and were skipped.');
      }

      setPdfInfos((prev) => [...prev, ...infos]);
      setResults([]);
      setProgress(0);
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  const handleCompress = async () => {
    if (pdfInfos.length === 0) return;
    setProcessing(true);
    setResults([]);
    setProgress(0);
    setCurrentFile(null);
    try {
      for (let i = 0; i < pdfInfos.length; i++) {
        const info = pdfInfos[i];
        setCurrentFile(info.name);

        try {
          const data = await compressPdf(info.data, quality);
          setResults((prev) => [
            ...prev,
            {
              id: info.id,
              name: info.name,
              originalSize: info.size,
              pageCount: info.pageCount,
              data,
              size: data.length,
              error: null,
            },
          ]);
        } catch (err) {
          console.error(`Compress failed for ${info.name}:`, err);
          setResults((prev) => [
            ...prev,
            {
              id: info.id,
              name: info.name,
              originalSize: info.size,
              pageCount: info.pageCount,
              data: null,
              size: null,
              error: err instanceof Error ? err.message : 'Compression failed',
            },
          ]);
        }

        setProgress(Math.round(((i + 1) / pdfInfos.length) * 100));
      }
    } finally {
      setCurrentFile(null);
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    const successful = results.filter((result) => result.data && result.size !== null);
    if (successful.length === 0) return;

    if (successful.length === 1) {
      downloadBlob(successful[0].data!, optimizedName(successful[0].name));
      return;
    }

    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (const result of successful) {
      zip.file(uniqueName(optimizedName(result.name), usedNames), result.data!);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized_pdfs.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFile = (result: CompressResult) => {
    if (!result.data) return;
    downloadBlob(result.data, optimizedName(result.name));
  };

  const reset = () => {
    setPdfInfos([]);
    setResults([]);
    setProgress(0);
    setCurrentFile(null);
  };

  const removeFile = (id: string) => {
    setPdfInfos((prev) => prev.filter((info) => info.id !== id));
    setResults([]);
    setProgress(0);
  };

  if (pdfInfos.length === 0) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        multiple
        label={loadingFiles ? 'Reading PDFs...' : 'Drop PDFs to compress'}
        description="Optimize one PDF or a whole batch with Ghostscript"
      />
    );
  }

  const successfulResults = results.filter((result) => result.data && result.size !== null);
  const failedResults = results.filter((result) => result.error);
  const totalOriginalSize = pdfInfos.reduce((sum, info) => sum + info.size, 0);
  const totalOptimizedSize = successfulResults.reduce((sum, result) => sum + (result.size ?? 0), 0);
  const totalSuccessfulOriginalSize = successfulResults.reduce((sum, result) => sum + result.originalSize, 0);
  const totalSavings = totalSuccessfulOriginalSize - totalOptimizedSize;
  const totalSavingsPercent = totalSuccessfulOriginalSize > 0
    ? ((totalSavings / totalSuccessfulOriginalSize) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between gap-4 p-5 rounded-xl bg-surface border border-border">
        <div>
          <p className="font-medium">
            {pdfInfos.length} {pdfInfos.length === 1 ? 'PDF' : 'PDFs'} selected
          </p>
          <p className="text-sm text-text-muted font-mono">
            {pdfInfos.reduce((sum, info) => sum + info.pageCount, 0)} pages · {formatFileSize(totalOriginalSize)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (files.length > 0) handleFileSelected(files);
              event.target.value = '';
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={processing || loadingFiles}
            className="text-sm text-text-muted hover:text-accent disabled:opacity-40 transition-colors cursor-pointer"
          >
            Add files
          </button>
          <button
            onClick={reset}
            disabled={processing}
            className="text-sm text-text-muted hover:text-danger disabled:opacity-40 transition-colors cursor-pointer"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {pdfInfos.map((info) => {
          const result = results.find((item) => item.id === info.id);
          const savings = result?.size !== null && result?.size !== undefined
            ? info.size - result.size
            : 0;
          const savingsPercent = result?.size !== null && result?.size !== undefined
            ? ((savings / info.size) * 100).toFixed(1)
            : '0';

          return (
            <div
              key={info.id}
              className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-surface border border-border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{info.name}</p>
                <p className="text-xs text-text-muted font-mono">
                  {info.pageCount} pages · {formatFileSize(info.size)}
                  {result?.size !== null && result?.size !== undefined && (
                    <>
                      {' '}→ {formatFileSize(result.size)} · {savings > 0 ? '-' : ''}{savingsPercent}%
                    </>
                  )}
                </p>
                {result?.error && (
                  <p className="text-xs text-danger mt-1 truncate">{result.error}</p>
                )}
              </div>

              {processing && currentFile === info.name && (
                <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin shrink-0" />
              )}
              {result?.data && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-1 rounded-lg bg-success/10 text-success text-xs font-mono">
                    Done
                  </span>
                  <button
                    onClick={() => handleDownloadFile(result)}
                    className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white text-xs font-display font-bold transition-colors cursor-pointer"
                  >
                    Download
                  </button>
                </div>
              )}
              {result?.error && (
                <span className="px-2 py-1 rounded-lg bg-danger/10 text-danger text-xs font-mono">
                  Failed
                </span>
              )}
              {!processing && results.length === 0 && (
                <button
                  onClick={() => removeFile(info.id)}
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer shrink-0"
                  aria-label={`Remove ${info.name}`}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-display font-bold">Quality preset</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setResults([]); setQuality(opt.value); setProgress(0); }}
              disabled={processing}
              className={`flex flex-col items-start p-3 rounded-xl border transition-all cursor-pointer disabled:opacity-40 ${
                quality === opt.value
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

      <div className="p-5 rounded-xl bg-surface-elevated border border-border">
        <h3 className="font-display font-bold text-sm mb-2">What this does</h3>
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

      {results.length > 0 && (
        <div className="p-6 rounded-xl border-2 border-accent/30 bg-accent-muted animate-fade-in">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Original</p>
              <p className="font-mono text-xl font-bold">{formatFileSize(totalSuccessfulOriginalSize)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Optimized</p>
              <p className="font-mono text-xl font-bold text-accent">{formatFileSize(totalOptimizedSize)}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Saved</p>
              <p className={`font-mono text-xl font-bold ${totalSavings > 0 ? 'text-success' : 'text-text-muted'}`}>
                {totalSavings > 0 ? '-' : ''}{totalSavingsPercent}%
              </p>
            </div>
          </div>
          {failedResults.length > 0 && (
            <p className="text-sm text-danger text-center mt-4">
              {failedResults.length} {failedResults.length === 1 ? 'PDF failed' : 'PDFs failed'} to compress. Successful files can still be downloaded.
            </p>
          )}
          {successfulResults.length > 0 && totalSavings <= 0 && (
            <p className="text-sm text-text-muted text-center mt-4">
              These PDFs may already be well-optimized. The output can be the same size or slightly larger.
            </p>
          )}
        </div>
      )}

      {processing && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-text-muted">
            <span className="truncate">
              {currentFile ? `Processing ${currentFile}...` : 'Processing with Ghostscript...'}
            </span>
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

      <div className="flex gap-3">
        {successfulResults.length === 0 ? (
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
              <>Compress {pdfInfos.length} {pdfInfos.length === 1 ? 'PDF' : 'PDFs'}</>
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
            Download {successfulResults.length === 1 ? 'Optimized PDF' : 'Optimized PDFs (.zip)'}
          </button>
        )}
      </div>
    </div>
  );
}
