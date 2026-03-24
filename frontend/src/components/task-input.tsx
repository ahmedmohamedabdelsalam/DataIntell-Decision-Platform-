import { useState, useEffect } from 'react';
import { Send, Loader2, Paperclip, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface TaskInputProps {
  onSubmit: (task: string) => void;
  isLoading: boolean;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  prefillValue?: string;
  onPrefillConsumed?: () => void;
}

export function TaskInput({ onSubmit, isLoading, selectedFile, onFileSelect, prefillValue, onPrefillConsumed }: TaskInputProps) {
  const [task, setTask] = useState('');

  // Auto-fill the input when a suggestion chip is clicked
  useEffect(() => {
    if (prefillValue) {
      setTask(prefillValue);
      onPrefillConsumed?.();
    }
  }, [prefillValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim() && !isLoading) {
      onSubmit(task);
      setTask('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full shadow-2xl shadow-primary/5 rounded-xl border border-border bg-card/90 backdrop-blur">
      <textarea
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="E.g. Perform a full analysis with insights and recommendations..."
        className="w-full min-h-[120px] bg-transparent text-foreground p-4 outline-none resize-none placeholder:text-muted-foreground/50 rounded-xl pr-36"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />

      {/* File badge — top-right when file selected */}
      {selectedFile && (
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium border border-primary/20 max-w-[160px]">
          <Paperclip size={12} />
          <span className="truncate">{selectedFile.name}</span>
          <button
            type="button"
            className="hover:bg-primary/20 rounded-full p-0.5 transition-colors ml-0.5 shrink-0"
            onClick={() => onFileSelect(null)}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-1.5">
        {/* File picker */}
        <label className="cursor-pointer p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Upload CSV or Excel">
          <input
            type="file"
            className="hidden"
            accept=".csv,.xlsx"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />
          {!selectedFile && <Paperclip size={17} />}
        </label>

        <span className="text-xs text-muted-foreground hidden sm:inline-block font-medium opacity-50">↵ Send</span>

        {/* Submit */}
        <button
          type="submit"
          disabled={!task.trim() || isLoading}
          className={cn(
            "p-2.5 rounded-lg transition-all flex items-center justify-center",
            task.trim() && !isLoading
              ? "bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 hover:scale-105 active:scale-95"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {isLoading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </div>
    </form>
  );
}
