import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { DashboardLayout } from './layouts/dashboard-layout';

import Dashboard from './pages/dashboard';
import AgentConsole from './pages/agent-console';
import Analytics from './pages/analytics';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="agent" element={<AgentConsole />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{
        className: 'bg-card text-foreground border border-border shadow-lg shadow-black/20 text-sm font-medium',
      }}/>
    </QueryClientProvider>
  );
}

export default App;
