import { getAllInspections } from '../db/database';
import { Inspection } from '../types/inspection';

const categoryLabels: Record<Inspection['category'], string> = { Hardware: 'Thiết bị', Projector: 'Máy chiếu', AC: 'Điều hòa', Electrical: 'Hệ thống điện', Furniture: 'Nội thất' };

export async function createInspectionList(): Promise<HTMLDivElement> {
  const container = document.createElement('div'); container.className = 'list-container';
  container.innerHTML = `<div class="list-card"><div class="list-header"><div><p class="eyebrow">Dữ liệu đã ghi nhận</p><h2>Phiếu khảo sát gần đây</h2></div><button id="refreshBtn" class="btn-icon" title="Làm mới danh sách" aria-label="Làm mới danh sách">↻</button></div><div id="inspectionsList" class="inspections-list"><div class="loading"><span class="spinner"></span>Đang tải phiếu khảo sát…</div></div></div>`;
  const listDiv = container.querySelector('#inspectionsList') as HTMLDivElement;
  const refreshBtn = container.querySelector('#refreshBtn') as HTMLButtonElement;
  async function loadInspections(): Promise<void> {
    try { listDiv.innerHTML = '<div class="loading"><span class="spinner"></span>Đang tải phiếu khảo sát…</div>'; const inspections = await getAllInspections();
      if (!inspections.length) { listDiv.innerHTML = '<div class="empty-state"><span aria-hidden="true">▣</span><h3>Chưa có phiếu khảo sát</h3><p>Hãy tạo phiếu khảo sát đầu tiên của bạn.</p></div>'; return; }
      listDiv.innerHTML = ''; inspections.forEach((inspection) => listDiv.appendChild(createInspectionItem(inspection)));
    } catch (error) { console.error('Error loading inspections:', error); listDiv.innerHTML = '<div class="error-state"><strong>Không thể tải phiếu khảo sát</strong><p>Vui lòng thử làm mới danh sách.</p></div>'; }
  }
  refreshBtn.addEventListener('click', async () => { refreshBtn.disabled = true; refreshBtn.classList.add('is-loading'); try { await loadInspections(); } finally { refreshBtn.disabled = false; refreshBtn.classList.remove('is-loading'); } });
  await loadInspections(); (container as any).refresh = loadInspections; return container;
}
function createInspectionItem(inspection: Inspection): HTMLElement {
  const item = document.createElement('article'); item.className = 'inspection-item'; item.setAttribute('data-id', inspection.id);
  const synced = inspection.status === 'SYNCED'; const status = synced ? 'Đã đồng bộ' : 'Chờ đồng bộ'; const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(inspection.timestamp));
  item.innerHTML = `<div class="inspection-header"><div><h3>⌂ ${escapeHtml(localizeBuilding(inspection.building))}</h3><p>Phòng ${escapeHtml(inspection.room)} · Tầng ${inspection.floor}</p></div><span class="status-badge ${synced ? 'synced' : 'pending'}"><span aria-hidden="true">${synced ? '●' : '◐'}</span>${status}</span></div><div class="inspection-meta"><span>⌘ ${categoryLabels[inspection.category]}</span><span class="rating-badge">★ ${inspection.rating}/5</span></div>${inspection.defectNotes ? `<p class="defect-notes"><strong>Mô tả:</strong> ${escapeHtml(inspection.defectNotes)}</p>` : ''}${inspection.latitude && inspection.longitude ? `<p class="location-info">⌖ ${inspection.latitude.toFixed(4)}, ${inspection.longitude.toFixed(4)}</p>` : ''}${inspection.photo ? `<div class="photo-section"><img src="data:image/jpeg;base64,${inspection.photo}" alt="Ảnh hiện trạng của phòng ${escapeHtml(inspection.room)}" class="inspection-photo" /></div>` : ''}<footer class="inspection-footer"><span>◷ ${date}</span></footer>`;
  item.querySelector('.inspection-photo')?.addEventListener('click', () => item.classList.toggle('expanded')); return item;
}
function escapeHtml(text: string): string { const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }; return text.replace(/[&<>"']/g, (char) => map[char]); }
function localizeBuilding(building: string): string { return building.replace(/^Building\s+/i, 'Tòa nhà '); }
