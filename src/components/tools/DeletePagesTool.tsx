import { useState, useCallback } from 'react';
import FileUpload from '../FileUpload';
import PageThumbnail from '../PageThumbnail';
import type { PDFFileInfo } from '../../lib/pdf';
import { getPdfInfo, deletePdfPages, downloadBlob, formatFileSize } from '../../lib/pdf';

export default function DeletePagesTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setSelected(new Set());
    setDone(false);
  }, []);

  const togglePage = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setDone(false);
  };

  const handleDelete = async () => {
    if (!pdfInfo || selected.size === 0) return;
    if (selected.size >= pdfInfo.pageCount) {
      alert('Cannot delete all pages.');
      return;
    }
    setProcessing(true);
    try {
      const result = await deletePdfPages(pdfInfo.data, Array.from(selected));
      const name = pdfInfo.name.replace(/\.pdf$/i, '_edited.pdf');
      downloadBlob(result, name);
      setDone(true);
    } catch (err) {
      console.error('Delete pages failed:', err);
      alert('Failed to delete pages.');
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setPdfInfo(null);
    setSelected(new Set());
    setDone(false);
  };

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to edit"
        description="Select and remove pages from your document"
      />
    );
  }

  const remaining = pdfInfo.pageCount - selected.size;

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

      {/* Status */}
      <div className="flex items-center gap-3">
        <p className="text-sm text-text-muted">
          Click pages to mark for deletion.{' '}
          <span className="text-accent font-mono font-medium">{selected.size}</span>{' '}
          selected · <span className="font-mono">{remaining}</span> will remain
        </p>
        {selected.size > 0 && (
          <button
            onClick={() => { setSelected(new Set()); setDone(false); }}
            className="text-xs text-text-muted hover:text-text underline cursor-pointer"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Page grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: pdfInfo.pageCount }, (_, i) => (
          <div key={i} className={`transition-opacity ${selected.has(i) ? 'opacity-50' : ''}`}>
            <PageThumbnail
              pdfData={pdfInfo.data}
              pageNum={i + 1}
              selected={selected.has(i)}
              onClick={() => togglePage(i)}
              label={`Page ${i + 1}${selected.has(i) ? ' · DELETE' : ''}`}
            />
          </div>
        ))}
      </div>

      {/* Action */}
      <button
        onClick={handleDelete}
        disabled={processing || selected.size === 0 || remaining === 0}
        className="px-8 py-3 bg-danger hover:bg-danger/80 text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-3"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Removing pages...
          </>
        ) : done ? (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9L7.5 13L14.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Downloaded!
          </>
        ) : (
          <>Delete {selected.size} page{selected.size !== 1 ? 's' : ''} & Download</>
        )}
      </button>
    </div>
  );
}
