import { useCallback, useState } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  label?: string;
  description?: string;
}

export default function FileUpload({
  onFilesSelected,
  multiple = false,
  label = 'Drop your PDF here',
  description = 'or click to browse files',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf',
      );
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
        e.target.value = '';
      }
    },
    [onFilesSelected],
  );

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center gap-5
        w-full min-h-[300px] rounded-2xl border-2 border-dashed
        cursor-pointer transition-all duration-300 group
        ${
          isDragging
            ? 'border-accent bg-accent-muted scale-[1.005]'
            : 'border-border hover:border-accent/40 hover:bg-surface/60'
        }
      `}
    >
      <input
        type="file"
        accept=".pdf,application/pdf"
        multiple={multiple}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />

      {/* Upload icon */}
      <div
        className={`transition-all duration-300 ${
          isDragging ? 'scale-110 -translate-y-1' : 'group-hover:scale-105'
        }`}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-accent"
        >
          <rect
            x="12"
            y="8"
            width="40"
            height="48"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
          />
          <rect
            x="16"
            y="12"
            width="32"
            height="40"
            rx="3"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M32 40V24M32 24L25 31M32 24L39 31"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="text-center">
        <p className="font-display text-xl font-bold text-text">{label}</p>
        <p className="text-sm text-text-muted mt-1.5">{description}</p>
      </div>

      <span className="px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-mono font-medium tracking-wide">
        {multiple ? 'PDF files' : 'PDF file'}
      </span>
    </label>
  );
}
