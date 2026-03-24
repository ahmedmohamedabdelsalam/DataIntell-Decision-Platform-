import { useAgentStore } from '../store/useAgentStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Dashboard() {
  const history = useAgentStore(state => state.history);

  const totalTasks = history.length;
  const successfulTasks = history.filter(t => t.status === 'success').length;
  const failedTasks = history.filter(t => t.status === 'error').length;
  const avgResponseTime = totalTasks > 0 
    ? (history.reduce((acc, curr) => acc + curr.execution_time_seconds, 0) / totalTasks).toFixed(2)
    : 0;

  // Prepare chart data
  const chartData = [...history].reverse().slice(-10).map((item, idx) => ({
    name: `Task ${idx + 1}`,
    time: item.execution_time_seconds,
    status: item.status === 'success' ? 1 : 0
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Metrics and operations history for your data pipelines.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Executions" value={totalTasks} icon={Activity} />
        <MetricCard title="Success Rate" value={`${totalTasks > 0 ? Math.round((successfulTasks / totalTasks) * 100) : 0}%`} icon={CheckCircle} color="text-emerald-500" />
        <MetricCard title="Failed Runs" value={failedTasks} icon={XCircle} color="text-red-500" />
        <MetricCard title="Avg Latency" value={`${avgResponseTime}s`} icon={Clock} color="text-blue-500" />
      </div>

      {totalTasks === 0 ? (
         <div className="border border-border/50 bg-card rounded-xl p-12 text-center mt-6">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">No data available</h3>
            <p className="text-sm text-muted-foreground/60">Run some tasks in the Analysis Console to view metrics.</p>
         </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold tracking-tight mb-6">Execution Latency (Last 10 Runs)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}s`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#222', borderRadius: '8px' }} 
                    itemStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold tracking-tight mb-6">Task Success Tracking</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#222', borderRadius: '8px' }} 
                    cursor={{fill: '#222'}}
                  />
                  <Bar dataKey="status" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, color = "text-muted-foreground" }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl bg-muted/80 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        <h3 className="text-[28px] font-bold tracking-tight leading-none mt-1">{value}</h3>
      </div>
    </div>
  );
}
