import { Inspection } from '../types/inspection';
import { API_BASE_URL, API_CONFIGURATION_ERROR } from '../config/api';

export interface ApiResponse<T> { success: boolean; data?: T; error?: string; message?: string; }

async function request<T>(path: string, options: RequestInit): Promise<ApiResponse<T>> {
  if (API_CONFIGURATION_ERROR) return { success: false, error: API_CONFIGURATION_ERROR };
  try {
    const response = await fetch(`${API_BASE_URL}/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, error: body.error || body.message || `HTTP ${response.status}` };
    return { success: true, data: body.data ?? body, message: body.message };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Không thể kết nối máy chủ';
    console.error('API error:', message);
    return { success: false, error: message };
  }
}

// Compression affects only the network payload; the original remains in IndexedDB for offline access.
async function prepareForUpload(inspection: Inspection): Promise<Inspection> {
  if (!inspection.photo || inspection.photo.length < 1_800_000) return inspection;
  try {
    const image = await loadImage(`data:image/jpeg;base64,${inspection.photo}`);
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL('image/jpeg', 0.76).split(',')[1];
    return compressed ? { ...inspection, photo: compressed } : inspection;
  } catch { return inspection; }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = source; });
}

export async function createInspection(inspection: Inspection): Promise<ApiResponse<Inspection>> { return request<Inspection>('/inspections', { method: 'POST', body: JSON.stringify(await prepareForUpload(inspection)) }); }
export function getInspections(): Promise<ApiResponse<Inspection[]>> { return request<Inspection[]>('/inspections', { method: 'GET' }); }
export function updateInspection(id: string, inspection: Partial<Inspection>): Promise<ApiResponse<Inspection>> { return request<Inspection>(`/inspections/${id}`, { method: 'PUT', body: JSON.stringify(inspection) }); }
export async function healthCheck(): Promise<boolean> { return (await request<unknown>('/health', { method: 'GET' })).success; }
