import type { ReactNode } from 'react';

interface ToolLayoutProps {
  title: string;
  description: string;
  icon: ReactNode;
  onBack: () => void;
  children: ReactNode;
}

export default function ToolLayout({
  title,
  description,
  icon,
  onBack,
  children,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-base animate-fade-in">
      {/* Header */}
      <header className="border-b border-border/50 bg-surface/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-text-muted hover:text-accent transition-colors group cursor-pointer shrink-0"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="group-hover:-translate-x-0.5 transition-transform"
            >
              <path
                d="M13 4L7 10L13 16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-sm font-medium hidden sm:inline">All Tools</span>
          </button>
          <div className="h-6 w-px bg-border shrink-0" />
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="text-accent w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-base sm:text-lg font-bold leading-tight truncate text-text">
                {title}
              </h1>
              <p className="text-xs text-text-muted leading-tight truncate hidden sm:block">
                {description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">{children}</main>
    </div>
  );
}
