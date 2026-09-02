export type ConditionRating = 1 | 2 | 3 | 4 | 5;

export type CategoryType = 
  | 'Hardware'
  | 'Projector'
  | 'AC'
  | 'Electrical'
  | 'Furniture';

export type SyncStatus = 'PENDING_SYNC' | 'SYNCED';

export interface Inspection {
  id: string;
  building: string;
  floor: number;
  room: string;
  category: CategoryType;
  rating: ConditionRating;
  defectNotes: string;
  photo?: string; // base64 or blob URL
  latitude?: number;
  longitude?: number;
  timestamp: string;
  status: SyncStatus;
  createdAt: string;
  updatedAt: string;
  syncAttempts: number;
  lastSyncError?: string;
}

export interface SyncQueueItem {
  id: string;
  inspectionId: string;
  status: SyncStatus;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType?: string;
}
