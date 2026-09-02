import {
  getPendingInspections,
  getSyncQueue,
  updateInspectionStatus,
  removeFromSyncQueue,
} from '../db/database';
import { createInspection as apiCreateInspection } from './api';
import { isNetworkConnected } from './network';

export type SyncStatusCallback = (status: string) => void;

let isSyncing = false;
let syncListeners: Set<SyncStatusCallback> = new Set();

export function onSyncStatusChange(callback: SyncStatusCallback): () => void {
  syncListeners.add(callback);
  return () => {
    syncListeners.delete(callback);
  };
}

function notifySyncStatus(status: string): void {
  console.log(`[SYNC] ${status}`);
  syncListeners.forEach((callback) => callback(status));
}

export async function syncPendingInspections(): Promise<void> {
  if (isSyncing) {
    console.log('[SYNC] Sync already in progress, skipping...');
    return;
  }

  if (!isNetworkConnected()) {
    console.log('[SYNC] Offline, cannot sync');
    notifySyncStatus('OFFLINE');
    return;
  }

  isSyncing = true;
  notifySyncStatus('SYNCING');

  try {
    const pendingInspections = await getPendingInspections();
    const syncQueue = await getSyncQueue();

    console.log(
      `[SYNC] Found ${pendingInspections.length} pending inspections and ${syncQueue.length} queue items`
    );

    for (const inspection of pendingInspections) {
      if (!isNetworkConnected()) {
        console.log('[SYNC] Network went offline during sync');
        break;
      }

      try {
        console.log(`[SYNC] Syncing inspection ${inspection.id}...`);
        const response = await apiCreateInspection(inspection);

        if (response.success) {
          await updateInspectionStatus(inspection.id, 'SYNCED');
          console.log(`[SYNC] Successfully synced ${inspection.id}`);

          // Remove from sync queue
          const queueItems = syncQueue.filter((q) => q.inspectionId === inspection.id);
          for (const queueItem of queueItems) {
            await removeFromSyncQueue(queueItem.id);
          }
        } else {
          console.warn(`[SYNC] Failed to sync ${inspection.id}: ${response.error}`);
          await updateInspectionStatus(
            inspection.id,
            'PENDING_SYNC',
            response.error
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[SYNC] Error syncing ${inspection.id}:`, message);
        await updateInspectionStatus(inspection.id, 'PENDING_SYNC', message);
      }

      // Small delay between syncs to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    notifySyncStatus('SYNCED');
  } catch (error) {
    console.error('[SYNC] Sync error:', error);
    notifySyncStatus('ERROR');
  } finally {
    isSyncing = false;
  }
}

export function isSyncInProgress(): boolean {
  return isSyncing;
}
