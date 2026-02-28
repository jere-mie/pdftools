import { useState, useCallback, useRef } from 'react';
import FileUpload from '../FileUpload';
import PageThumbnail from '../PageThumbnail';
import type { PDFFileInfo } from '../../lib/pdf';
import { getPdfInfo, reorderPdfPages, downloadBlob, formatFileSize } from '../../lib/pdf';

export default function ReorderTool() {
  const [pdfInfo, setPdfInfo] = useState<PDFFileInfo | null>(null);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const info = await getPdfInfo(files[0]);
    setPdfInfo(info);
    setPageOrder(Array.from({ length: info.pageCount }, (_, i) => i));
    setDone(false);
  }, []);

  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragIndex.current = idx;
    setDragIdx(idx);
  };

  const handleDragEnter = (idx: number) => {
    dragOverIndex.current = idx;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from !== null && to !== null && from !== to) {
      setPageOrder((prev) => {
        const next = [...prev];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
      setDone(false);
    }
    dragIndex.current = null;
    dragOverIndex.current = null;
    setDragIdx(null);
  };

  const handleReorder = async () => {
    if (!pdfInfo) return;
    setProcessing(true);
    try {
      const result = await reorderPdfPages(pdfInfo.data, pageOrder);
      const name = pdfInfo.name.replace(/\.pdf$/i, '_reordered.pdf');
      downloadBlob(result, name);
      setDone(true);
    } catch (err) {
      console.error('Reorder failed:', err);
      alert('Failed to reorder PDF.');
    } finally {
      setProcessing(false);
    }
  };

  const resetOrder = () => {
    if (!pdfInfo) return;
    setPageOrder(Array.from({ length: pdfInfo.pageCount }, (_, i) => i));
    setDone(false);
  };

  const reverseOrder = () => {
    setPageOrder((prev) => [...prev].reverse());
    setDone(false);
  };

  const reset = () => {
    setPdfInfo(null);
    setPageOrder([]);
    setDone(false);
  };

  if (!pdfInfo) {
    return (
      <FileUpload
        onFilesSelected={handleFileSelected}
        label="Drop a PDF to reorder"
        description="Drag pages to rearrange their order"
      />
    );
  }

  const isModified = pageOrder.some((v, i) => v !== i);

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

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-muted">
          Drag pages to reorder them
        </span>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={reverseOrder}
            className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border hover:border-accent text-xs font-mono transition-colors cursor-pointer"
          >
            Reverse
          </button>
          <button
            onClick={resetOrder}
            className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border hover:border-accent text-xs font-mono transition-colors cursor-pointer"
          >
            Reset order
          </button>
        </div>
      </div>

      {/* Page grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {pageOrder.map((originalIdx, currentIdx) => (
          <div
            key={originalIdx}
            draggable
            onDragStart={() => handleDragStart(currentIdx)}
            onDragEnter={() => handleDragEnter(currentIdx)}
            onDragOver={(e) => handleDragOver(e)}
            onDragEnd={handleDragEnd}
            className={`relative cursor-grab active:cursor-grabbing transition-all ${dragIdx === currentIdx ? 'opacity-40 scale-95' : ''
              }`}
          >
            {/* Position badge */}
            <div className="absolute -top-2 -left-2 z-10 w-7 h-7 rounded-full bg-accent text-white text-[11px] font-mono font-bold flex items-center justify-center shadow-lg">
              {currentIdx + 1}
            </div>
            <PageThumbnail
              pdfData={pdfInfo.data}
              pageNum={originalIdx + 1}
              label={`Was page ${originalIdx + 1}`}
              selected={originalIdx !== currentIdx}
            />
          </div>
        ))}
      </div>

      {/* Action */}
      <button
        onClick={handleReorder}
        disabled={processing || !isModified}
        className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-3"
      >
        {processing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Reordering...
          </>
        ) : done ? (
          <>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3.5 9L7.5 13L14.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Downloaded!
          </>
        ) : (
          'Apply New Order & Download'
        )}
      </button>
    </div>
  );
}
