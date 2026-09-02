import { getAllInspections } from '../db/database';
import { Inspection } from '../types/inspection';

export async function createInspectionList(): Promise<HTMLDivElement> {
  const container = document.createElement('div');
  container.className = 'list-container';

  container.innerHTML = `
    <div class="list-card">
      <div class="list-header">
        <h2>Recent Inspections</h2>
        <button id="refreshBtn" class="btn-refresh" title="Refresh list">🔄</button>
      </div>
      <div id="inspectionsList" class="inspections-list">
        <div class="loading">Loading inspections...</div>
      </div>
    </div>
  `;

  const listDiv = container.querySelector('#inspectionsList') as HTMLDivElement;
  const refreshBtn = container.querySelector('#refreshBtn') as HTMLButtonElement;

  async function loadInspections(): Promise<void> {
    try {
      listDiv.innerHTML = '<div class="loading">Loading inspections...</div>';
      const inspections = await getAllInspections();

      if (inspections.length === 0) {
        listDiv.innerHTML = '<div class="empty-state">No inspections yet. Create your first inspection!</div>';
        return;
      }

      listDiv.innerHTML = '';
      inspections.forEach((inspection) => {
        const item = createInspectionItem(inspection);
        listDiv.appendChild(item);
      });
    } catch (error) {
      console.error('Error loading inspections:', error);
      listDiv.innerHTML = '<div class="error-state">Failed to load inspections</div>';
    }
  }

  refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⏳';
    try {
      await loadInspections();
    } finally {
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄';
    }
  });

  // Initial load
  await loadInspections();

  // Expose refresh method
  (container as any).refresh = loadInspections;

  return container;
}

function createInspectionItem(inspection: Inspection): HTMLDivElement {
  const item = document.createElement('div');
  item.className = 'inspection-item';
  item.setAttribute('data-id', inspection.id);

  const title = `${inspection.building} - Room ${inspection.room}`;
  const categoryBadge = `<span class="category-badge">${inspection.category}</span>`;
  const ratingDisplay = `<span class="rating-badge">Rating: ${inspection.rating}/5</span>`;
  const statusIcon = inspection.status === 'SYNCED' ? '🟢' : '🟠';
  const statusText = inspection.status === 'SYNCED' ? 'SYNCED' : 'PENDING_SYNC';
  const timestamp = new Date(inspection.timestamp).toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  item.innerHTML = `
    <div class="inspection-header">
      <div class="inspection-title">${title}</div>
      <div class="inspection-badges">
        ${categoryBadge}
        ${ratingDisplay}
      </div>
    </div>
    
    <div class="inspection-details">
      ${inspection.defectNotes ? `<p class="defect-notes"><strong>Defects:</strong> ${escapeHtml(inspection.defectNotes)}</p>` : ''}
      ${inspection.latitude && inspection.longitude ? `<p class="location-info"><strong>Location:</strong> ${inspection.latitude.toFixed(4)}, ${inspection.longitude.toFixed(4)}</p>` : ''}
    </div>

    ${inspection.photo ? `<div class="photo-section"><img src="data:image/jpeg;base64,${inspection.photo}" alt="Inspection photo" class="inspection-photo" /></div>` : ''}

    <div class="inspection-footer">
      <div class="status-badge">
        <span class="status-icon">${statusIcon}</span>
        <span class="status-text">${statusText}</span>
      </div>
      <div class="timestamp">${timestamp}</div>
    </div>
  `;

  // Expand/collapse on photo click
  const photoEl = item.querySelector('.inspection-photo') as HTMLImageElement;
  if (photoEl) {
    photoEl.addEventListener('click', () => {
      item.classList.toggle('expanded');
    });
  }

  return item;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
