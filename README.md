# PDFTools

A free, browser-based PDF toolkit. Merge, split, rotate, resize, reorder, compress, and delete pages - all processing happens locally in your browser. No uploads, no servers, 100% private.

## Features

| Tool | Route | Description |
|------|-------|-------------|
| **Merge** | `/merge` | Combine multiple PDF files into one. Drag-and-drop reorder with live thumbnails. |
| **Split** | `/split` | Extract every page individually or by custom ranges (e.g. `1-3, 5, 8-10`). |
| **Rotate** | `/rotate` | Rotate pages 90°/180°/270° individually or in bulk. Visual page grid preview. |
| **Delete Pages** | `/delete` | Click to select and remove unwanted pages from a document. |
| **Reorder** | `/reorder` | Drag-and-drop pages to rearrange their order with live thumbnails. |
| **Resize** | `/resize` | Pad pages to standard sizes (A4, Letter, Legal, A3, A5, Tabloid). Content is scaled to fit and centered - nothing is cropped. |
| **Compress** | `/compress` | Reduce file size using Ghostscript WebAssembly. Real image downsampling, font subsetting, and metadata stripping. Four presets: Screen, eBook, Print, Prepress. |

## Tech Stack

- **Astro 5** - static site generator with file-based routing and per-page SEO
- **React 19** + **TypeScript** - interactive tool components as client-side islands
- **Tailwind CSS v4** - styling via `@tailwindcss/vite`
- **pdf-lib** - PDF manipulation (merge, split, rotate, resize, delete, reorder)
- **pdfjs-dist** - rendering page thumbnails in the browser
- **@jspawn/ghostscript-wasm** - Ghostscript-powered compression in a Web Worker
- Fully client-side (`client:only="react"`) - no backend, no uploads

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
astro.config.mjs    # Astro config (React integration, Vite/Tailwind)
src/
├── lib/pdf.ts      # All PDF operations (merge, split, rotate, etc.)
├── tools.tsx       # Tool definitions (id, name, icon, meta descriptions)
├── layouts/
│   └── Layout.astro        # Base HTML layout with SEO meta tags
├── pages/
│   ├── index.astro         # Home page (tool grid)
│   ├── merge.astro
│   ├── split.astro
│   ├── rotate.astro
│   ├── delete.astro
│   ├── reorder.astro
│   ├── compress.astro
│   └── resize.astro
├── components/
│   ├── Landing.tsx         # Home page tool grid (React island)
│   ├── ToolLayout.tsx      # Shared tool page layout with back navigation
│   ├── ToolPage.tsx        # Generic wrapper: ToolLayout + tool component
│   ├── FileUpload.tsx      # Drag-and-drop file upload
│   ├── PageThumbnail.tsx   # PDF page thumbnail renderer
│   └── tools/              # Individual tool components
│       ├── MergeTool.tsx
│       ├── SplitTool.tsx
│       ├── RotateTool.tsx
│       ├── DeletePagesTool.tsx
│       ├── ReorderTool.tsx
│       ├── CompressTool.tsx
│       └── ResizeTool.tsx
├── workers/
│   └── ghostscript.worker.ts  # Web Worker for Ghostscript compression
└── styles/
    └── global.css             # Tailwind theme + custom CSS
```

## SEO

Each tool page has its own:
- `<title>` - descriptive, keyword-rich page title
- `<meta name="description">` - unique per-tool description
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`)
- Twitter Card tags
- Canonical URL
- `robots` and `theme-color` meta tags

## Privacy

All PDF processing is performed entirely in the browser using JavaScript and WebAssembly. Your files never leave your device - nothing is uploaded to any server.

## License

MIT
