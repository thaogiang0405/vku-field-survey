import { NetworkStatus } from '../types/inspection';
import { getNetworkStatus, onNetworkStatusChange } from '../services/network';
import { onSyncStatusChange } from '../services/sync';

export function createStatusIndicator(): HTMLDivElement {
  const container = document.createElement('div'); container.id = 'status-indicator'; container.className = 'status-indicator';
  container.innerHTML = '<div class="network-chip"><span class="status-dot online"></span><strong>Trực tuyến</strong></div><p class="status-message">Sẵn sàng đồng bộ dữ liệu.</p>';
  const updateNetwork = (status: NetworkStatus) => { const chip = container.querySelector('.network-chip') as HTMLElement; const text = chip.querySelector('strong') as HTMLElement; const dot = chip.querySelector('.status-dot') as HTMLElement; chip.classList.toggle('offline', !status.connected); dot.className = `status-dot ${status.connected ? 'online' : 'offline'}`; text.textContent = status.connected ? 'Trực tuyến' : 'Ngoại tuyến'; (container.querySelector('.status-message') as HTMLElement).textContent = status.connected ? 'Đã kết nối mạng. Dữ liệu sẽ được đồng bộ tự động.' : 'Bạn đang ở chế độ ngoại tuyến. Phiếu vẫn được lưu trên thiết bị.'; };
  updateNetwork(getNetworkStatus()); onNetworkStatusChange(updateNetwork); onSyncStatusChange((status) => { const message = container.querySelector('.status-message') as HTMLElement; if (status === 'SYNCING') message.textContent = 'Đang kiểm tra và đồng bộ dữ liệu…'; if (status === 'SYNCED') message.textContent = 'Đồng bộ dữ liệu thành công.'; if (status === 'ERROR') message.textContent = 'Đồng bộ chưa thành công. Dữ liệu vẫn được lưu an toàn trên thiết bị.'; }); return container;
}
