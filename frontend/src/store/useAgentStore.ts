import { create } from 'zustand';
import type { HistoryItem } from '../types/agent';

interface AgentState {
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  history: [],
  addToHistory: (item) => set((state) => ({ history: [item, ...state.history] })),
  clearHistory: () => set({ history: [] }),
}));
