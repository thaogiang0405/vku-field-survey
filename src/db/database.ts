import { Inspection, SyncQueueItem, SyncStatus } from '../types/inspection';

const DB_NAME = 'vku-field-survey';
const DB_VERSION = 1;
const INSPECTIONS_STORE = 'inspections';
const SYNC_QUEUE_STORE = 'syncQueue';

let db: IDBDatabase | null = null;

export async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database open error:', request.error);
      reject(new Error(`Failed to open database: ${request.error}`));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create inspections store
      if (!database.objectStoreNames.contains(INSPECTIONS_STORE)) {
        const inspectionStore = database.createObjectStore(INSPECTIONS_STORE, {
          keyPath: 'id',
        });
        inspectionStore.createIndex('status', 'status', { unique: false });
        inspectionStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create sync queue store
      if (!database.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = database.createObjectStore(SYNC_QUEUE_STORE, {
          keyPath: 'id',
        });
        syncStore.createIndex('inspectionId', 'inspectionId', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

export async function saveInspection(inspection: Inspection): Promise<string> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([INSPECTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    const request = store.put(inspection);

    request.onerror = () => {
      reject(new Error(`Failed to save inspection: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve(inspection.id);
    };
  });
}

export async function getInspection(id: string): Promise<Inspection | undefined> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([INSPECTIONS_STORE], 'readonly');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    const request = store.get(id);

    request.onerror = () => {
      reject(new Error(`Failed to get inspection: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export async function getAllInspections(): Promise<Inspection[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([INSPECTIONS_STORE], 'readonly');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    const request = store.getAll();

    request.onerror = () => {
      reject(new Error(`Failed to get all inspections: ${request.error}`));
    };

    request.onsuccess = () => {
      const inspections = request.result as Inspection[];
      // Sort by timestamp descending
      inspections.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(inspections);
    };
  });
}

export async function getPendingInspections(): Promise<Inspection[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([INSPECTIONS_STORE], 'readonly');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    const index = store.index('status');
    const request = index.getAll('PENDING_SYNC');

    request.onerror = () => {
      reject(new Error(`Failed to get pending inspections: ${request.error}`));
    };

    request.onsuccess = () => {
      const inspections = request.result as Inspection[];
      inspections.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      resolve(inspections);
    };
  });
}

export async function updateInspectionStatus(
  id: string,
  status: SyncStatus,
  lastSyncError?: string
): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([INSPECTIONS_STORE], 'readwrite');
    const store = transaction.objectStore(INSPECTIONS_STORE);
    const getRequest = store.get(id);

    getRequest.onerror = () => {
      reject(new Error(`Failed to update inspection status: ${getRequest.error}`));
    };

    getRequest.onsuccess = () => {
      const inspection = getRequest.result as Inspection;
      if (!inspection) {
        reject(new Error(`Inspection ${id} not found`));
        return;
      }

      inspection.status = status;
      inspection.updatedAt = new Date().toISOString();
      inspection.syncAttempts = (inspection.syncAttempts || 0) + 1;
      if (lastSyncError) {
        inspection.lastSyncError = lastSyncError;
      }

      const updateRequest = store.put(inspection);
      updateRequest.onerror = () => {
        reject(new Error(`Failed to update inspection: ${updateRequest.error}`));
      };

      updateRequest.onsuccess = () => {
        resolve();
      };
    };
  });
}

export async function addToSyncQueue(inspection: Inspection): Promise<string> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const queueItem: SyncQueueItem = {
      id: `queue-${inspection.id}-${Date.now()}`,
      inspectionId: inspection.id,
      status: 'PENDING_SYNC',
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    const transaction = database.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    const request = store.add(queueItem);

    request.onerror = () => {
      reject(new Error(`Failed to add to sync queue: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve(queueItem.id);
    };
  });
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SYNC_QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    const index = store.index('status');
    const request = index.getAll('PENDING_SYNC');

    request.onerror = () => {
      reject(new Error(`Failed to get sync queue: ${request.error}`));
    };

    request.onsuccess = () => {
      const items = request.result as SyncQueueItem[];
      items.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      resolve(items);
    };
  });
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([SYNC_QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(SYNC_QUEUE_STORE);
    const request = store.delete(id);

    request.onerror = () => {
      reject(new Error(`Failed to remove from sync queue: ${request.error}`));
    };

    request.onsuccess = () => {
      resolve();
    };
  });
}

export async function clearDatabase(): Promise<void> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [INSPECTIONS_STORE, SYNC_QUEUE_STORE],
      'readwrite'
    );

    transaction.objectStore(INSPECTIONS_STORE).clear();
    transaction.objectStore(SYNC_QUEUE_STORE).clear();

    transaction.onerror = () => {
      reject(new Error(`Failed to clear database: ${transaction.error}`));
    };

    transaction.oncomplete = () => {
      resolve();
    };
  });
}
