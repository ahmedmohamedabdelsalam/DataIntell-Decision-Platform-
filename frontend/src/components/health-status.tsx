import { useQuery } from '@tanstack/react-query';
import { checkHealth } from '../api/client';
import { useAgentStore } from '../store/useAgentStore';

export function HealthStatus() {
  const autoRefreshHealth = useAgentStore(state => state.autoRefreshHealth);
  
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    refetchInterval: autoRefreshHealth ? 10000 : false,
    retry: false
  });

  const isOnline = !isError && data?.status === 'active';

  return (
    <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-full text-sm border border-border/50 shadow-sm">
      <span className="relative flex h-2.5 w-2.5">
        {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
      </span>
      <span className="text-muted-foreground font-medium text-xs">
        {isOnline ? 'System Online' : 'System Offline'}
      </span>
    </div>
  );
}
