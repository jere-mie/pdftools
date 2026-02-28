import { useState, useCallback, useRef, useEffect } from 'react';
import FileUpload from '../FileUpload';
import { mergePdfs, downloadBlob, formatFileSize, renderPageThumbnail } from '../../lib/pdf';

interface FileItem {
  file: File;
  id: string;
  thumbnail: string | null;
}

function FileThumbnail({ file, onLoaded }: { file: File; onLoaded: (url: string) => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    file.arrayBuffer().then((buf) =>
      renderPageThumbnail(buf, 1, 0.35).then((url) => {
        setSrc(url);
        onLoaded(url);
      }),
    ).catch(() => {});
  }, [file, onLoaded]);

  if (!src) {
    return (
      <div className="w-12 h-16 rounded-lg bg-surface-elevated border border-border flex items-center justify-center shrink-0">
        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="PDF preview"
      className="w-12 h-16 rounded-lg object-cover border border-border shrink-0 bg-white"
    />
  );
}

export default function MergeTool() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({ file: f, id: crypto.randomUUID(), thumbnail: null })),
    ]);
    setDone(false);
  }, []);

  const setThumbnail = useCallback((id: string, url: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, thumbnail: url } : f)),
    );
  }, []);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setDone(false);
  };

  const moveFile = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDone(false);
  };

  /* Drag-and-drop handlers */
  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDragIdx(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from !== null && to !== null && from !== to) {
      moveFile(from, to);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragIdx(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setProcessing(true);
    try {
      const result = await mergePdfs(files.map((f) => f.file));
      downloadBlob(result, 'merged.pdf');
      setDone(true);
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <FileUpload
        onFilesSelected={handleFilesSelected}
        multiple
        label="Drop PDFs to merge"
        description="Upload multiple PDF files to combine them"
      />

      {files.length > 0 && (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg">
              Files to merge
              <span className="ml-2 text-sm font-mono text-text-muted">
                ({files.length} files)
              </span>
            </h3>
            <button
              onClick={() => { setFiles([]); setDone(false); }}
              className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>

          <p className="text-xs text-text-dim -mt-2">
            Drag files to reorder, or use the arrow buttons
          </p>

          <div className="space-y-2">
            {files.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-4 p-4 rounded-xl bg-surface border border-border group hover:border-border-light transition-all cursor-grab active:cursor-grabbing ${
                  dragIdx === index ? 'opacity-40 scale-[0.98]' : ''
                }`}
              >
                {/* Drag handle + order */}
                <div className="flex items-center gap-3">
                  {/* Grip icon */}
                  <svg width="12" height="20" viewBox="0 0 12 20" fill="none" className="text-text-dim shrink-0">
                    <circle cx="3" cy="3" r="1.5" fill="currentColor" />
                    <circle cx="9" cy="3" r="1.5" fill="currentColor" />
                    <circle cx="3" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="9" cy="10" r="1.5" fill="currentColor" />
                    <circle cx="3" cy="17" r="1.5" fill="currentColor" />
                    <circle cx="9" cy="17" r="1.5" fill="currentColor" />
                  </svg>
                  <span className="w-8 h-8 rounded-lg bg-accent/10 text-accent font-mono text-sm font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                </div>

                {/* PDF thumbnail */}
                <FileThumbnail
                  file={item.file}
                  onLoaded={(url) => setThumbnail(item.id, url)}
                />

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-xs text-text-muted font-mono">
                    {formatFileSize(item.file.size)}
                  </p>
                </div>

                {/* Move buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); index > 0 && moveFile(index, index - 1); }}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 11L3 7L7 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      index < files.length - 1 && moveFile(index, index + 1);
                    }}
                    disabled={index === files.length - 1}
                    className="p-1.5 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-text disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M7 3L11 7L7 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>

                {/* Remove */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(item.id); }}
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Action */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || processing}
              className="px-8 py-3 bg-accent hover:bg-accent-hover text-white font-display font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-3"
            >
              {processing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Merging...
                </>
              ) : done ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M3.5 9L7.5 13L14.5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Downloaded!
                </>
              ) : (
                <>Merge {files.length} PDFs</>
              )}
            </button>
            {files.length < 2 && (
              <p className="text-sm text-text-muted">
                Add at least 2 files to merge
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
