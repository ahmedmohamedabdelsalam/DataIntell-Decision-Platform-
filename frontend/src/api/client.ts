import axios from 'axios';
import type { HealthResponse, TaskResponse } from '../types/agent';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const checkHealth = async (): Promise<HealthResponse> => {
  const { data } = await client.get<HealthResponse>('/health');
  return data;
};

export const runTask = async (task: string, file_id?: string): Promise<TaskResponse> => {
  const { data } = await client.post<TaskResponse>('/run-task', { task, file_id });
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

