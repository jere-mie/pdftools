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
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-text-muted hover:text-accent transition-colors group cursor-pointer"
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
            <span className="text-sm font-medium">All Tools</span>
          </button>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-3">
            <div className="text-accent w-7 h-7 flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">
                {title}
              </h1>
              <p className="text-xs text-text-muted leading-tight">
                {description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
