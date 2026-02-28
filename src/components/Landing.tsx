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
      <header className="relative pt-20 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in-up mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface/50 text-xs font-mono text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              100% browser-based · No uploads · Private
            </span>
          </div>

          {/* Title */}
          <h1 className="animate-fade-in-up stagger-1 font-display font-extrabold text-6xl sm:text-7xl md:text-8xl tracking-tight leading-[0.9]">
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
      <section className="relative px-6 pb-24">
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
      <footer className="relative border-t border-border/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-dim">
          <p className="font-mono">
            <span className="text-accent font-bold">PDFTOOLS</span> - All
            processing happens in your browser
          </p>
          <p>
            Built with pdf-lib · No data leaves your device
          </p>
        </div>
      </footer>
    </div>
  );
}
