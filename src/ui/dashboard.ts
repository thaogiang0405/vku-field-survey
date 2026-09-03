import { getAllInspections } from '../db/database';

export async function createDashboard(): Promise<HTMLDivElement> {
  const container = document.createElement('div'); container.className = 'dashboard';
  container.innerHTML = `<div class="dashboard-heading"><p class="eyebrow">Tổng quan</p><h2>Tiến độ khảo sát</h2></div><div class="stats-grid"><div class="stat-card"><span class="stat-label">Tổng phiếu</span><strong data-stat="total">—</strong></div><div class="stat-card stat-pending"><span class="stat-label">Chờ đồng bộ</span><strong data-stat="pending">—</strong></div><div class="stat-card stat-synced"><span class="stat-label">Đã đồng bộ</span><strong data-stat="synced">—</strong></div></div>`;
  async function refresh(): Promise<void> { const inspections = await getAllInspections(); (container.querySelector('[data-stat="total"]') as HTMLElement).textContent = String(inspections.length); (container.querySelector('[data-stat="pending"]') as HTMLElement).textContent = String(inspections.filter((item) => item.status === 'PENDING_SYNC').length); (container.querySelector('[data-stat="synced"]') as HTMLElement).textContent = String(inspections.filter((item) => item.status === 'SYNCED').length); }
  await refresh(); (container as any).refresh = refresh; return container;
}
