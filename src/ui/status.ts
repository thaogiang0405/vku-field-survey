import { NetworkStatus } from '../types/inspection';
import { onNetworkStatusChange } from '../services/network';
import { onSyncStatusChange } from '../services/sync';

export type StatusType = 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'ERROR';

let currentNetworkStatus: NetworkStatus | null = null;
let currentSyncStatus: string | null = null;

export function createStatusIndicator(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'status-indicator';
  container.className = 'status-indicator';

  const networkIndicator = document.createElement('div');
  networkIndicator.className = 'status-item network-status';
  networkIndicator.innerHTML = `
    <span class="status-dot online"></span>
    <span class="status-text">Online</span>
  `;

  const syncIndicator = document.createElement('div');
  syncIndicator.className = 'status-item sync-status';
  syncIndicator.innerHTML = `
    <span class="status-dot synced"></span>
    <span class="status-text">Ready</span>
  `;

  const messageBox = document.createElement('div');
  messageBox.className = 'status-message';
  messageBox.textContent = 'All changes can be synchronized.';

  container.appendChild(networkIndicator);
  container.appendChild(syncIndicator);
  container.appendChild(messageBox);

  // Listen for network changes
  const unsubscribeNetwork = onNetworkStatusChange((status: NetworkStatus) => {
    currentNetworkStatus = status;
    updateNetworkDisplay(networkIndicator, status);
    updateStatusMessage(messageBox);
  });

  // Listen for sync changes
  const unsubscribeSyncStatus = onSyncStatusChange((status: string) => {
    currentSyncStatus = status;
    updateSyncDisplay(syncIndicator, status);
    updateStatusMessage(messageBox);
  });

  // Store cleanup functions
  (container as any).cleanup = () => {
    unsubscribeNetwork();
    unsubscribeSyncStatus();
  };

  return container;
}

function updateNetworkDisplay(element: HTMLElement, status: NetworkStatus): void {
  const dot = element.querySelector('.status-dot') as HTMLElement;
  const text = element.querySelector('.status-text') as HTMLElement;

  if (status.connected) {
    dot.className = 'status-dot online';
    text.textContent = '🟢 Online';
  } else {
    dot.className = 'status-dot offline';
    text.textContent = '🔴 Offline';
  }
}

function updateSyncDisplay(element: HTMLElement, status: string): void {
  const dot = element.querySelector('.status-dot') as HTMLElement;
  const text = element.querySelector('.status-text') as HTMLElement;

  switch (status) {
    case 'SYNCING':
      dot.className = 'status-dot syncing';
      text.textContent = '🔄 Syncing...';
      break;
    case 'SYNCED':
      dot.className = 'status-dot synced';
      text.textContent = '🟢 Synced';
      break;
    case 'OFFLINE':
      dot.className = 'status-dot offline';
      text.textContent = '⏸️ Offline Mode';
      break;
    case 'ERROR':
      dot.className = 'status-dot error';
      text.textContent = '⚠️ Sync Error';
      break;
    default:
      dot.className = 'status-dot synced';
      text.textContent = '✓ Ready';
  }
}

function updateStatusMessage(element: HTMLElement): void {
  const networkConnected = currentNetworkStatus?.connected ?? true;
  const syncStatus = currentSyncStatus;

  if (!networkConnected) {
    element.textContent = 'Offline mode: Changes will be saved locally and synced when back online.';
  } else if (syncStatus === 'SYNCING') {
    element.textContent = 'Syncing pending changes...';
  } else if (syncStatus === 'ERROR') {
    element.textContent = 'Sync failed. Data remains stored locally and will retry when online.';
  } else {
    element.textContent = 'All changes can be synchronized.';
  }
}

export function updateStatusOnNetwork(connected: boolean): void {
  const indicator = document.getElementById('status-indicator');
  if (indicator) {
    const networkItem = indicator.querySelector('.network-status');
    if (networkItem) {
      updateNetworkDisplay(
        networkItem as HTMLElement,
        { connected } as NetworkStatus
      );
    }
    const messageBox = indicator.querySelector('.status-message') as HTMLElement;
    if (messageBox) {
      updateStatusMessage(messageBox);
    }
  }
}

export function updateStatusOnSync(status: string): void {
  const indicator = document.getElementById('status-indicator');
  if (indicator) {
    const syncItem = indicator.querySelector('.sync-status');
    if (syncItem) {
      updateSyncDisplay(syncItem as HTMLElement, status);
    }
    const messageBox = indicator.querySelector('.status-message') as HTMLElement;
    if (messageBox) {
      updateStatusMessage(messageBox);
    }
  }
}
