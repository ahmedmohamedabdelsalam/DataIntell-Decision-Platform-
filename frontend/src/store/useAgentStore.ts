import { create } from 'zustand';
import type { HistoryItem } from '../types/agent';

const defaultApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AgentState {
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;

  // UI preferences
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;

  autoRefreshHealth: boolean;
  setAutoRefreshHealth: (value: boolean) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  history: [],
  addToHistory: (item) => set((state) => ({ history: [item, ...state.history] })),
  clearHistory: () => set({ history: [] }),

  // Provide defaults so TypeScript and UI compile reliably in build.
  apiBaseUrl:
    (typeof window !== 'undefined' && window.localStorage.getItem('apiBaseUrl')) ||
    defaultApiBaseUrl,
  setApiBaseUrl: (url) =>
    set(() => {
      if (typeof window !== 'undefined') window.localStorage.setItem('apiBaseUrl', url);
      return { apiBaseUrl: url };
    }),

  autoRefreshHealth:
    (typeof window !== 'undefined' && window.localStorage.getItem('autoRefreshHealth') === 'true') ||
    true,
  setAutoRefreshHealth: (value) =>
    set(() => {
      if (typeof window !== 'undefined') window.localStorage.setItem('autoRefreshHealth', String(value));
      return { autoRefreshHealth: value };
    }),
}));
