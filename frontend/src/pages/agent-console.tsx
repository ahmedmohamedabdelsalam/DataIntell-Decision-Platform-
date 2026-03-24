import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { runTask, uploadFile } from '../api/client';
import { TaskInput } from '../components/task-input';
import { AgentLogs } from '../components/agent-logs';
import { ResponseViewer } from '../components/response-viewer';
import { useAgentStore } from '../store/useAgentStore';
import { Database, AlertTriangle } from 'lucide-react';
import type { TaskResponse } from '../types/agent';
import toast from 'react-hot-toast';

export default function AgentConsole() {
  const addToHistory = useAgentStore(state => state.addToHistory);
  const [response, setResponse] = useState<TaskResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // For auto-filling suggestion into input
  const [prefillTask, setPrefillTask] = useState<string | undefined>(undefined);

  const mutation = useMutation({
    mutationFn: ({ task, file_id }: { task: string; file_id?: string }) => runTask(task, file_id),
    onSuccess: (data) => {
      setResponse(data);
      addToHistory({ ...data, id: Date.now().toString(), timestamp: Date.now() });
      if (data.status === 'success') {
        toast.success(`Task completed in ${data.execution_time_seconds}s!`);
      } else {
        toast.error("Task failed to execute properly.");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to reach processing engine.");
    }
  });

  const handleTaskSubmit = async (taskText: string) => {
    if (selectedFile) {
      setIsUploading(true);
      try {
        const { file_id } = await uploadFile(selectedFile);
        setIsUploading(false);
        mutation.mutate({ task: taskText, file_id });
      } catch (err: any) {
        setIsUploading(false);
        toast.error("Failed to upload file.");
      }
    } else {
      mutation.mutate({ task: taskText });
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-inner">
          <Database size={32} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Data Intelligence Platform</h1>
        <p className="text-muted-foreground text-sm">Upload a dataset, describe your goal, and receive an automated consultant-grade analysis.</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-48 no-scrollbar px-2">
        {!response && !mutation.isPending && (
          <div className="flex flex-wrap gap-3 justify-center mt-10">
            {[
              "Perform a full analysis with insights and recommendations",
              "Detect anomalies and explain what caused them",
              "Identify the top drivers affecting revenue",
            ].map((suggestion, i) => (
              <button
                key={i}
                className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
                onClick={() => setPrefillTask(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {(mutation.isPending || isUploading) && (
          <div className="mt-16 flex flex-col items-center justify-center space-y-5">
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Database size={30} className="text-primary" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
              </span>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-primary/90 tracking-wide">
                {isUploading ? 'Uploading dataset...' : 'Processing analysis...'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isUploading ? 'Securely storing your file' : 'Parsing → Planning → Executing → Generating insights'}
              </p>
            </div>
          </div>
        )}

        {mutation.isError && (
          <div className="mt-8 bg-red-500/10 text-red-500 p-6 rounded-xl border border-red-500/20 flex flex-col items-center text-center max-w-md mx-auto">
            <AlertTriangle size={32} className="mb-3" />
            <p className="font-bold text-lg">Execution Failed</p>
            <p className="text-sm opacity-80 mt-1">{mutation.error?.message || "Unknown API error"}</p>
          </div>
        )}

        {response && !mutation.isPending && !isUploading && (
          <div className="mt-6 w-full animate-in slide-in-from-bottom-8 duration-500">
            {response.intent && response.intent !== "unknown" && (
              <div className="mb-4 bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg inline-flex items-center text-sm font-medium">
                Intent Detected: {response.intent.replace('_', ' ').toUpperCase()}
              </div>
            )}
            <AgentLogs steps={response.steps_executed} plan={response.plan} />
            <ResponseViewer result={response.result} />
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 right-0 px-6 sm:px-12 md:px-24 xl:px-32 flex justify-center pointer-events-none">
        <div className="w-full max-w-4xl pointer-events-auto">
          <TaskInput 
            onSubmit={handleTaskSubmit} 
            isLoading={mutation.isPending || isUploading} 
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            prefillValue={prefillTask}
            onPrefillConsumed={() => setPrefillTask(undefined)}
          />
        </div>
      </div>
    </div>
  );
}
