import { getPendingInspections, getSyncQueue, mergeServerInspections, removeFromSyncQueue, updateInspectionStatus } from '../db/database';
import { createInspection as apiCreateInspection, getInspections } from './api';
import { isNetworkConnected } from './network';

export type SyncStatusCallback = (status: string) => void;
let isSyncing = false;
const syncListeners: Set<SyncStatusCallback> = new Set();

export function onSyncStatusChange(callback: SyncStatusCallback): () => void { syncListeners.add(callback); return () => syncListeners.delete(callback); }
function notifySyncStatus(status: string): void { console.log(`[SYNC] ${status}`); syncListeners.forEach((callback) => callback(status)); }

/** Upload local queue first, then pull the shared server source into IndexedDB. */
export async function syncPendingInspections(): Promise<{ success: boolean; error?: string }> {
  if (isSyncing) return { success: false, error: 'ALREADY_SYNCING' };
  if (!isNetworkConnected()) { notifySyncStatus('OFFLINE'); return { success: false, error: 'OFFLINE' }; }
  isSyncing = true; notifySyncStatus('SYNCING'); let hasFailure = false;
  try {
    console.log('[SYNC] START');
    const pending = await getPendingInspections(); const queue = await getSyncQueue();
    console.log(`[SYNC] PENDING COUNT: ${pending.length}`);
    for (const inspection of pending) {
      if (!isNetworkConnected()) { hasFailure = true; break; }
      console.log(`[SYNC] POST: sending inspection ${inspection.id}`);
      const response = await apiCreateInspection(inspection);
      console.log(`[SYNC] POST RESPONSE:`, response);
      if (response.success) {
        console.log(`[SYNC] MARK SYNCED: ${inspection.id}`);
        await updateInspectionStatus(inspection.id, 'SYNCED');
        for (const queueItem of queue.filter((item) => item.inspectionId === inspection.id)) await removeFromSyncQueue(queueItem.id);
      } else {
        console.error(`[SYNC] POST FAILED for ${inspection.id}:`, response.error);
        hasFailure = true;
        await updateInspectionStatus(inspection.id, 'PENDING_SYNC', response.error);
      }
    }
    if (!isNetworkConnected()) { notifySyncStatus('OFFLINE'); return { success: false, error: 'OFFLINE' }; }
    console.log('[SYNC] PULL SERVER');
    const remote = await getInspections();
    if (remote.success && remote.data) {
      await mergeServerInspections(remote.data);
    } else {
      console.error('[SYNC] PULL SERVER FAILED:', remote.error);
      hasFailure = true;
    }
    console.log('[SYNC] COMPLETE');
    notifySyncStatus(hasFailure ? 'ERROR' : 'SYNCED');
    return { success: !hasFailure };
  } catch (error: any) {
    console.error('[SYNC] Đồng bộ thất bại:', error); notifySyncStatus('ERROR');
    return { success: false, error: error.message || 'UNKNOWN' };
  } finally { isSyncing = false; }
}

export function isSyncInProgress(): boolean { return isSyncing; }
