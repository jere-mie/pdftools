import type { ToolId } from '../tools';
import { toolDefs, hiddenTools } from '../tools';

interface LandingProps {
  onSelectTool: (tool: ToolId) => void;
}

export default function Landing({ onSelectTool }: LandingProps) {
  return (
    <div className="min-h-screen bg-base">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[400px] -right-[200px] w-[800px] h-[800px] rounded-full bg-accent/[0.03] blur-3xl" />
        <div className="absolute -bottom-[300px] -left-[200px] w-[600px] h-[600px] rounded-full bg-accent/[0.02] blur-3xl" />
      </div>

      {/* Hero */}
      <header className="relative pt-10 sm:pt-20 pb-10 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in-up mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface/50 text-xs font-mono text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              100% browser-based · No uploads · Private
            </span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up stagger-1 font-display font-extrabold text-5xl sm:text-7xl md:text-8xl tracking-tight leading-[0.9]">
            <span className="text-text">PDF</span>
            <span className="text-accent">TOOLS</span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up stagger-2 mt-6 text-lg sm:text-xl text-text-muted max-w-xl leading-relaxed">
            Your one-stop toolkit for PDF manipulation. Merge, split, rotate,
            resize, and reorder - everything runs locally in your browser.
          </p>

          {/* Decorative line */}
          <div className="animate-fade-in-up stagger-3 mt-10 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-accent/40 to-transparent" />
            <span className="text-xs font-mono text-text-dim uppercase tracking-widest">
              Choose a tool
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-accent/40 to-transparent" />
          </div>
        </div>
      </header>

      {/* Tool Grid */}
      <section className="relative px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolDefs.filter((t) => !hiddenTools.has(t.id)).map((tool, i) => (
              <button
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className={`
                  animate-fade-in-up stagger-${Math.min(i + 1, 7)}
                  group relative p-6 rounded-2xl border border-border bg-surface/40
                  hover:bg-surface-elevated hover:border-accent/40
                  transition-all duration-300 text-left cursor-pointer
                  hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-0.5
                `}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                  {tool.icon}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-lg text-text group-hover:text-accent transition-colors">
                      {tool.name}
                    </h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute top-6 right-6 text-text-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 3L11 8L6 13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/50 py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col items-center sm:flex-row sm:justify-between gap-3 text-xs text-text-dim text-center sm:text-left">
          <p className="font-mono">
            <span className="text-accent font-bold">PDFTOOLS</span> · MIT License · All
            processing happens in your browser
          </p>
          <div className="flex items-center gap-4">
            <p>Built with pdf-lib · No data leaves your device</p>
            <a
              href="https://github.com/jere-mie/pdftools"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
