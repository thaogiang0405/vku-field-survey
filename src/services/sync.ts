import { getPendingInspections, getSyncQueue, mergeServerInspections, removeFromSyncQueue, updateInspectionStatus } from '../db/database';
import { createInspection as apiCreateInspection, getInspections } from './api';
import { isNetworkConnected } from './network';

export type SyncStatusCallback = (status: string) => void;
let isSyncing = false;
const syncListeners: Set<SyncStatusCallback> = new Set();

export function onSyncStatusChange(callback: SyncStatusCallback): () => void { syncListeners.add(callback); return () => syncListeners.delete(callback); }
function notifySyncStatus(status: string): void { console.log(`[SYNC] ${status}`); syncListeners.forEach((callback) => callback(status)); }

/** Upload local queue first, then pull the shared server source into IndexedDB. */
export async function syncPendingInspections(): Promise<void> {
  if (isSyncing) return;
  if (!isNetworkConnected()) { notifySyncStatus('OFFLINE'); return; }
  isSyncing = true; notifySyncStatus('SYNCING'); let hasFailure = false;
  try {
    const pending = await getPendingInspections(); const queue = await getSyncQueue();
    for (const inspection of pending) {
      if (!isNetworkConnected()) { hasFailure = true; break; }
      const response = await apiCreateInspection(inspection);
      if (response.success) {
        await updateInspectionStatus(inspection.id, 'SYNCED');
        for (const queueItem of queue.filter((item) => item.inspectionId === inspection.id)) await removeFromSyncQueue(queueItem.id);
      } else {
        hasFailure = true;
        await updateInspectionStatus(inspection.id, 'PENDING_SYNC', response.error);
      }
    }
    if (!isNetworkConnected()) { notifySyncStatus('OFFLINE'); return; }
    const remote = await getInspections();
    if (remote.success && remote.data) await mergeServerInspections(remote.data); else hasFailure = true;
    notifySyncStatus(hasFailure ? 'ERROR' : 'SYNCED');
  } catch (error) {
    console.error('[SYNC] Đồng bộ thất bại:', error); notifySyncStatus('ERROR');
  } finally { isSyncing = false; }
}

export function isSyncInProgress(): boolean { return isSyncing; }
