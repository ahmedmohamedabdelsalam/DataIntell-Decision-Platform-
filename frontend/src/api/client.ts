import axios from 'axios';
import type { HealthResponse, TaskResponse } from '../types/agent';

// Robust base URL resolution to support:
// - Local dev (Vite on 5173, API on 8000 via VITE_API_BASE_URL)
// - Deployed environments (same-origin, e.g. HuggingFace Space)
let API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';

if (!API_BASE_URL) {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;

    try {
      const url = new URL(origin);
      const isLocalHost =
        url.hostname === '127.0.0.1' ||
        url.hostname === 'localhost';

      // أي بورت محلي (5173, 5174, ...) → وجّه الـAPI دائماً إلى 8000
      if (isLocalHost && url.port !== '8000') {
        API_BASE_URL = 'http://127.0.0.1:8000';
      } else {
        // في الـdeployment (HF Space مثلاً) استخدم نفس الـorigin
        API_BASE_URL = origin;
      }
    } catch {
      API_BASE_URL = 'http://127.0.0.1:8000';
    }
  } else {
    // Fallback لبيئات غير المتصفح
    API_BASE_URL = 'http://127.0.0.1:8000';
  }
}

const client = axios.create({
  baseURL: API_BASE_URL,
});

// Debug logging to help diagnose Network Error issues locally
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log('[DataIntell] API_BASE_URL resolved to:', API_BASE_URL);
}

client.interceptors.response.use(
  (res) => res,
  (error) => {
    // eslint-disable-next-line no-console
    console.error('[DataIntell] API request failed:', {
      url: error?.config?.baseURL + error?.config?.url,
      message: error?.message,
    });
    return Promise.reject(error);
  }
);

export const checkHealth = async (): Promise<HealthResponse> => {
  const { data } = await client.get<HealthResponse>('/health');
  return data;
};

export const runTask = async (task: string, file_id?: string): Promise<TaskResponse> => {
  const { data } = await client.post<TaskResponse>(
    '/run-task',
    { task, file_id },
    { headers: { 'Content-Type': 'application/json' } }
  );
  return data;
};

export const uploadFile = async (file: File): Promise<{ file_id: string; filename: string; status: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

