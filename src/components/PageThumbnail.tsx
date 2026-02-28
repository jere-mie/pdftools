import { useState, useEffect } from 'react';
import { renderPageThumbnail } from '../lib/pdf';

interface PageThumbnailProps {
  pdfData: ArrayBuffer;
  pageNum: number; // 1-indexed
  selected?: boolean;
  onClick?: () => void;
  label?: string;
  rotation?: number;
  className?: string;
  showOverlay?: boolean;
  overlayContent?: React.ReactNode;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
}

export default function PageThumbnail({
  pdfData,
  pageNum,
  selected = false,
  onClick,
  label,
  rotation = 0,
  className = '',
  showOverlay = true,
  overlayContent,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}: PageThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    renderPageThumbnail(pdfData, pageNum, 0.5)
      .then((url) => {
        if (!cancelled) {
          setThumbnail(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pdfData, pageNum]);

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative group rounded-xl overflow-hidden border-2 transition-all duration-200
        ${onClick ? 'cursor-pointer' : ''}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
        ${
          selected
            ? 'border-accent shadow-lg shadow-accent/20 scale-[1.03]'
            : 'border-border hover:border-border-light'
        }
        ${className}
      `}
    >
      {/* Page content */}
      <div className="bg-white aspect-[3/4] flex items-center justify-center overflow-hidden">
        {loading ? (
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={`Page ${pageNum}`}
            className="w-full h-full object-contain"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <span className="text-gray-400 font-mono text-sm">
            {pageNum}
          </span>
        )}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Custom overlay */}
      {overlayContent && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          {overlayContent}
        </div>
      )}

      {/* Bottom label */}
      {showOverlay && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 pt-6">
          <span className="font-mono text-[11px] text-white/90 tracking-wide">
            {label || `Page ${pageNum}`}
          </span>
        </div>
      )}
    </div>
  );
}
