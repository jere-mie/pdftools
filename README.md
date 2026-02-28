# PDFTools

A free, browser-based PDF toolkit. Merge, split, rotate, resize, reorder, and delete pages - all processing happens locally in your browser. No uploads, no servers, 100% private.

## Features

| Tool | Description |
|------|-------------|
| **Merge** | Combine multiple PDF files into one. Drag-and-drop reorder with live thumbnails. |
| **Split** | Extract every page individually or by custom ranges (e.g. `1-3, 5, 8-10`). |
| **Rotate** | Rotate pages 90°/180°/270° individually or in bulk. Visual page grid preview. |
| **Delete Pages** | Click to select and remove unwanted pages from a document. |
| **Reorder** | Drag-and-drop pages to rearrange their order with live thumbnails. |
| **Resize** | Pad pages to standard sizes (A4, Letter, Legal, A3, A5, Tabloid). Content is scaled to fit and centered - nothing is cropped. |

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for dev/build
- **Tailwind CSS v4** for styling
- **pdf-lib** for PDF manipulation (merge, split, rotate, resize, etc.)
- **pdfjs-dist** for rendering page thumbnails in the browser
- Fully client-side - no backend required

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
src/
├── lib/pdf.ts            # All PDF operations (merge, split, rotate, etc.)
├── tools.tsx             # Tool definitions (id, name, icon, description)
├── App.tsx               # Main app with tool routing
├── components/
│   ├── Landing.tsx       # Home page with tool grid
│   ├── ToolLayout.tsx    # Shared layout for tool pages
│   ├── FileUpload.tsx    # Drag-and-drop file upload component
│   ├── PageThumbnail.tsx # PDF page thumbnail renderer
│   └── tools/            # Individual tool components
│       ├── MergeTool.tsx
│       ├── SplitTool.tsx
│       ├── RotateTool.tsx
│       ├── DeletePagesTool.tsx
│       ├── ReorderTool.tsx
│       ├── CompressTool.tsx   # Hidden - pending WASM implementation
│       └── ResizeTool.tsx
```

## Privacy

All PDF processing is performed entirely in the browser using JavaScript. Your files never leave your device - nothing is uploaded to any server.

## License

MIT
