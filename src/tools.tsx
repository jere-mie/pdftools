import type { ReactNode } from 'react';

export type ToolId =
  | 'merge'
  | 'split'
  | 'rotate'
  | 'delete'
  | 'reorder'
  | 'compress'
  | 'resize'
  | 'export-image';

export interface ToolDef {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  icon: ReactNode;
  metaDescription: string;
}

/** IDs that are hidden from the UI but whose components still exist */
export const hiddenTools: Set<ToolId> = new Set([]);

export const toolDefs: ToolDef[] = [
  {
    id: 'merge',
    name: 'Merge',
    tagline: 'Combine PDFs',
    description: 'Join multiple PDF files into a single document',
    metaDescription: 'Merge multiple PDF files into one document - free, fast, and 100% in your browser. No uploads needed.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="15" y="9" width="10" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M13 12H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'split',
    name: 'Split',
    tagline: 'Extract pages',
    description: 'Split a PDF into separate files by page ranges',
    metaDescription: 'Split a PDF into separate files by page ranges or extract every page individually - free, browser-based, no uploads.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <line x1="14" y1="4" x2="14" y2="24" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
        <path d="M10 14L7 11M10 14L7 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 14L21 11M18 14L21 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'rotate',
    name: 'Rotate',
    tagline: 'Turn pages',
    description: 'Rotate individual pages or the entire document',
    metaDescription: 'Rotate PDF pages 90°, 180°, or 270° - rotate individual pages or the whole document. Free, browser-based.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 14a8 8 0 0114-5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M22 14a8 8 0 01-14 5.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M20 5L20.7 9.3L16.4 8.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 23L7.3 18.7L11.6 19.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'delete',
    name: 'Delete Pages',
    tagline: 'Remove pages',
    description: 'Select and remove unwanted pages from your PDF',
    metaDescription: 'Delete unwanted pages from a PDF with a visual page grid. Free, browser-based, no uploads required.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="4" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 11L17 17M17 11L11 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'reorder',
    name: 'Reorder',
    tagline: 'Rearrange pages',
    description: 'Drag and drop to rearrange pages in your PDF',
    metaDescription: 'Drag and drop to reorder PDF pages visually. Free, browser-based PDF page rearrangement.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="16" y="4" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="15" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="16" y="15" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M14 7L12 5M14 7L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 21L16 19M14 21L16 23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'compress',
    name: 'Compress',
    tagline: 'Reduce file size',
    description: 'Optimize and reduce your PDF file size',
    metaDescription: 'Compress PDF files using Ghostscript WebAssembly - real image downsampling and font subsetting. Free, browser-based.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="4" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 10L14 13L17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 18L14 15L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="14" y1="13" x2="14" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'resize',
    name: 'Resize',
    tagline: 'Change page size',
    description: 'Pad pages to standard sizes like A4 or Letter',
    metaDescription: 'Resize PDF pages to standard sizes (A4, Letter, Legal, A3, A5, Tabloid). Content is centered and nothing is cropped.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="5" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="9" y="9" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" />
        <path d="M5 5L9 9M23 5L19 9M23 23L19 19M5 23L9 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'export-image',
    name: 'PDF to Image',
    tagline: 'Export as images',
    description: 'Convert PDF pages to high-quality PNG, JPEG, or WebP images',
    metaDescription: 'Convert PDF pages to high-quality PNG, JPEG, or WebP images. Choose resolution and export specific pages or ranges. Free, browser-based.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="10.5" cy="10.5" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 18l6-5 4 4 3-3 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];
