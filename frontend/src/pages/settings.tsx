import { useAgentStore } from '../store/useAgentStore';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settings() {
  const { apiBaseUrl, setApiBaseUrl, autoRefreshHealth, setAutoRefreshHealth } = useAgentStore();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings saved securely!");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage API connections and local preferences.</p>
      </div>

      <form onSubmit={handleSave} className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-8">
        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight">API Connection</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">FastAPI Base URL</label>
            <input 
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-inner font-mono"
              placeholder="http://127.0.0.1:8000"
              required
            />
            <p className="text-xs text-muted-foreground pt-1">This URL will be used internally by Axios for all API communication with the Python core data engine.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight">System Preferences</h3>
          
          <div className="flex items-center justify-between p-5 border border-border rounded-lg bg-background/50 hover:bg-background transition-colors">
            <div>
              <p className="font-semibold text-sm">Auto-Refresh System Health</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ping the /health endpoint every 10 seconds locally</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={autoRefreshHealth}
                onChange={(e) => setAutoRefreshHealth(e.target.checked)}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end">
          <button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-all shadow-md shadow-primary/20 scale-100 hover:scale-105 active:scale-95"
          >
            <Save size={18} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
