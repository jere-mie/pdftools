export type ToolId =
  | 'merge'
  | 'split'
  | 'rotate'
  | 'delete'
  | 'reorder'
  | 'compress'
  | 'resize';

export interface ToolDef {
  id: ToolId;
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
}

/** IDs that are hidden from the UI but whose components still exist */
export const hiddenTools: Set<ToolId> = new Set([]);

export const toolDefs: ToolDef[] = [
  {
    id: 'merge',
    name: 'Merge',
    tagline: 'Combine PDFs',
    description: 'Join multiple PDF files into a single document',
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
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="4" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M11 10L14 13L17 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 18L14 15L11 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'resize',
    name: 'Resize',
    tagline: 'Change page size',
    description: 'Resize pages to standard dimensions (A4, Letter, etc.)',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="6" y="6" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" strokeDasharray="4 2" />
        <rect x="9" y="9" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="19" cy="19" r="2" fill="currentColor" />
      </svg>
    ),
  },
];
