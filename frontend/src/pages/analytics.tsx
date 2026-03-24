import { useAgentStore } from '../store/useAgentStore';
import { CheckCircle2, XCircle, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function Analytics() {
  const { history, clearHistory } = useAgentStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item => 
    item.task.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task History & Analytics</h1>
          <p className="text-muted-foreground mt-1 text-sm">Review previously executed workflows and their results.</p>
        </div>
        <button 
          onClick={clearHistory}
          className="flex items-center space-x-2 text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 rounded-lg transition-colors text-sm font-semibold"
        >
          <Trash2 size={16} />
          <span>Clear Data</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center bg-muted/30">
          <Search size={18} className="text-muted-foreground mr-3" />
          <input 
            type="text" 
            placeholder="Search by task description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-foreground placeholder:text-muted-foreground text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-card/50 text-sm">
                <th className="px-6 py-4 font-semibold tracking-wide text-muted-foreground w-1/2">Task Description</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-muted-foreground">Status</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-muted-foreground">Duration</th>
                <th className="px-6 py-4 font-semibold tracking-wide text-muted-foreground">Date Executed</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
                    <p className="mb-2">No task history found.</p>
                    <p className="text-xs opacity-70">Execute pipelines to track history.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="line-clamp-2 pr-4">{item.task}</div>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'success' ? (
                         <div className="flex items-center space-x-1.5 text-emerald-500 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-500/20">
                           <CheckCircle2 size={14} />
                           <span>Success</span>
                         </div>
                      ) : (
                         <div className="flex items-center space-x-1.5 text-red-500 bg-red-500/10 w-fit px-2.5 py-1 rounded-full text-xs font-semibold border border-red-500/20">
                           <XCircle size={14} />
                           <span>Failed</span>
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground/80 font-mono">
                      {item.execution_time_seconds}s
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
