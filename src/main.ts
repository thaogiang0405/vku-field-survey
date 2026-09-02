import './style.css';
import { createInspectionForm } from './ui/form';
import { createInspectionList } from './ui/inspection-list';
import { createStatusIndicator } from './ui/status';
import { initNetworkListener } from './services/network';
import { onNetworkStatusChange, isNetworkConnected } from './services/network';
import { syncPendingInspections, onSyncStatusChange } from './services/sync';
import { openDatabase } from './db/database';

async function initApp(): Promise<void> {
  console.log('Initializing VKU Field Survey App...');

  try {
    // Initialize database
    await openDatabase();
    console.log('Database initialized');

    // Setup network listener
    initNetworkListener();
    console.log('Network listener initialized');

    // Create main layout
    const app = document.getElementById('app');
    if (!app) {
      throw new Error('App container not found');
    }

    // Create header
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <div class="header-content">
        <h1>VKU Field Survey</h1>
        <p class="subtitle">Offline Data Collection</p>
      </div>
    `;

    // Create status indicator
    const statusIndicator = createStatusIndicator();

    // Create main content container
    const mainContainer = document.createElement('main');
    mainContainer.className = 'main-container';

    // Create form
    await setupFormWithList(mainContainer);

    // Append to app
    app.appendChild(header);
    app.appendChild(statusIndicator);
    app.appendChild(mainContainer);

    // Setup network and sync listeners
    setupNetworkSync();

    // Initial sync if online
    if (isNetworkConnected()) {
      console.log('App online, attempting initial sync...');
      await syncPendingInspections();
    }

    console.log('VKU Field Survey App initialized successfully');
  } catch (error) {
    console.error('Failed to initialize app:', error);
    displayInitError();
  }
}

async function setupFormWithList(mainContainer: HTMLElement): Promise<HTMLElement> {
  const formContainer = createInspectionForm(async () => {
    // Refresh list when inspection is saved
    const listEl = mainContainer.querySelector('.list-container') as any;
    if (listEl && listEl.refresh) {
      await listEl.refresh();
    }
  });

  mainContainer.appendChild(formContainer);

  // Create and append inspection list
  const listContainer = await createInspectionList();
  mainContainer.appendChild(listContainer);

  return formContainer;
}

function setupNetworkSync(): void {
  // Listen for network status changes
  onNetworkStatusChange((status) => {
    console.log('[NETWORK]', status.connected ? 'Online' : 'Offline');
    if (status.connected) {
      console.log('Network restored, initiating sync...');
      syncPendingInspections().catch((error) => {
        console.error('Sync error on network restore:', error);
      });
    }
  });

  // Listen for sync status changes
  onSyncStatusChange((status) => {
    console.log('[SYNC STATUS]', status);
  });
}

function displayInitError(): void {
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = `
      <div style="padding: 40px 20px; text-align: center;">
        <h1>⚠️ Application Error</h1>
        <p>Failed to initialize the application. Please refresh the page or contact support.</p>
        <button onclick="location.reload()" style="
          padding: 10px 20px;
          background: #284c7c;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        ">Refresh Page</button>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      });
      console.log('[SW] Service Worker registered:', registration);
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
    }
  });
}
