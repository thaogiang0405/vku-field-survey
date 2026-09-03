import { Inspection, CategoryType, ConditionRating } from '../types/inspection';
import { saveInspection, addToSyncQueue } from '../db/database';
import { getCurrentLocation, getLocationDisplayText } from '../services/location';
import { takePhoto, getWebPhotoDataUrl, fallbackFileInput } from '../services/camera';
import { isNetworkConnected } from '../services/network';
import { syncPendingInspections } from '../services/sync';

const CATEGORIES: { value: CategoryType; label: string }[] = [
  { value: 'Hardware', label: 'Thiết bị' },
  { value: 'Projector', label: 'Máy chiếu' },
  { value: 'AC', label: 'Điều hòa' }, { value: 'Electrical', label: 'Hệ thống điện' }, { value: 'Furniture', label: 'Nội thất' },
];
const BUILDINGS = ['Tòa nhà A', 'Tòa nhà B', 'Tòa nhà C'];
const ROOMS = ['A101', 'A201', 'A301', 'B101', 'B201', 'B301'];

export interface FormData { building: string; floor: number; room: string; category: CategoryType; rating: ConditionRating; defectNotes: string; photo?: string; latitude?: number; longitude?: number; }
let currentPhoto: string | undefined;
let currentLocation: { latitude: number; longitude: number } | undefined;

export function createInspectionForm(onInspectionSaved: () => void | Promise<void>): HTMLDivElement {
  const container = document.createElement('div'); container.className = 'form-container';
  container.innerHTML = `
    <div class="form-card"><div class="card-heading"><div class="heading-icon" aria-hidden="true">▣</div><div><p class="eyebrow">Khảo sát hiện trường</p><h2>Tạo phiếu khảo sát mới</h2></div></div>
      <form id="inspectionForm" class="inspection-form" novalidate>
        <fieldset class="form-section"><legend><span aria-hidden="true">⌖</span> Thông tin địa điểm</legend>
          <div class="form-group"><label for="building">Tòa nhà <span aria-hidden="true">*</span></label><select id="building" name="building" required aria-describedby="building-error"><option value="">Chọn tòa nhà</option>${BUILDINGS.map((b) => `<option value="${b}">${b}</option>`).join('')}</select><small id="building-error" class="error-message" aria-live="polite"></small></div>
          <div class="form-row"><div class="form-group"><label for="floor">Tầng <span aria-hidden="true">*</span></label><input id="floor" name="floor" type="number" min="1" max="10" required placeholder="Ví dụ: 1" aria-describedby="floor-error" /><small id="floor-error" class="error-message" aria-live="polite"></small></div><div class="form-group"><label for="room">Phòng <span aria-hidden="true">*</span></label><input id="room" name="room" type="text" required placeholder="Ví dụ: A101" list="room-list" aria-describedby="room-error" /><datalist id="room-list">${ROOMS.map((r) => `<option value="${r}"></option>`).join('')}</datalist><small id="room-error" class="error-message" aria-live="polite"></small></div></div>
        </fieldset>
        <fieldset class="form-section"><legend><span aria-hidden="true">⌘</span> Hạng mục kiểm tra</legend><div class="form-group"><label for="category">Hạng mục <span aria-hidden="true">*</span></label><select id="category" name="category" required aria-describedby="category-error"><option value="">Chọn hạng mục</option>${CATEGORIES.map((c) => `<option value="${c.value}">${c.label}</option>`).join('')}</select><small id="category-error" class="error-message" aria-live="polite"></small></div></fieldset>
        <fieldset class="form-section"><legend><span aria-hidden="true">★</span> Đánh giá tình trạng</legend><div class="rating-container"><div class="rating-display"><span id="ratingValue">3</span><span>/5</span><strong id="ratingDescription">Trung bình</strong></div><input id="rating" name="rating" type="range" min="1" max="5" value="3" class="rating-slider" aria-label="Đánh giá tình trạng" /><div class="rating-labels" aria-hidden="true"><span>1<br><small>Rất kém</small></span><span>2<br><small>Kém</small></span><span>3<br><small>Trung bình</small></span><span>4<br><small>Tốt</small></span><span>5<br><small>Rất tốt</small></span></div></div></fieldset>
        <fieldset class="form-section"><legend><span aria-hidden="true">✎</span> Mô tả sự cố</legend><div class="form-group"><label for="defectNotes">Ghi chú tình trạng <span class="optional">(không bắt buộc)</span></label><textarea id="defectNotes" name="defectNotes" rows="4" placeholder="Nhập mô tả tình trạng hoặc sự cố phát hiện được..."></textarea></div></fieldset>
        <fieldset class="form-section"><legend><span aria-hidden="true">◈</span> Hình ảnh và vị trí</legend><div class="form-group"><label>Ảnh hiện trạng</label><div id="photoPreview" class="photo-preview empty-photo"><span class="photo-icon" aria-hidden="true">▣</span><strong>Chụp ảnh hiện trạng</strong><small>Ảnh giúp xác minh tình trạng nhanh hơn</small></div><button type="button" id="takePhotoBtn" class="btn-secondary">Chụp ảnh</button></div><div class="form-group"><label>Vị trí GPS</label><div id="locationDisplay" class="location-display">Chưa ghi nhận vị trí</div><button type="button" id="getLocationBtn" class="btn-tertiary">Lấy vị trí hiện tại</button></div></fieldset>
        <div class="form-actions"><button type="submit" class="btn-primary">Lưu phiếu khảo sát</button><button type="button" id="syncBtn" class="btn-secondary">Đồng bộ ngay</button><button type="reset" class="btn-tertiary">Xóa nội dung</button></div>
      </form></div>`;
  const form = container.querySelector('#inspectionForm') as HTMLFormElement;
  const ratingSlider = form.querySelector('#rating') as HTMLInputElement;
  const ratingValue = container.querySelector('#ratingValue') as HTMLElement;
  const ratingDescription = container.querySelector('#ratingDescription') as HTMLElement;
  const takePhotoBtn = form.querySelector('#takePhotoBtn') as HTMLButtonElement;
  const getLocationBtn = form.querySelector('#getLocationBtn') as HTMLButtonElement;
  const syncBtn = form.querySelector('#syncBtn') as HTMLButtonElement;
  const photoPreview = container.querySelector('#photoPreview') as HTMLDivElement;
  const locationDisplay = container.querySelector('#locationDisplay') as HTMLDivElement;
  const updateRating = () => { ratingValue.textContent = ratingSlider.value; ratingDescription.textContent = ['Rất kém', 'Kém', 'Trung bình', 'Tốt', 'Rất tốt'][Number(ratingSlider.value) - 1]; };
  ratingSlider.addEventListener('input', updateRating);
  const renderPhoto = () => {
    if (!currentPhoto) { photoPreview.className = 'photo-preview empty-photo'; photoPreview.innerHTML = '<span class="photo-icon" aria-hidden="true">▣</span><strong>Chụp ảnh hiện trạng</strong><small>Ảnh giúp xác minh tình trạng nhanh hơn</small>'; return; }
    photoPreview.className = 'photo-preview'; photoPreview.innerHTML = `<img src="${getWebPhotoDataUrl(currentPhoto)}" alt="Ảnh hiện trạng khảo sát" class="photo-thumbnail" /><button type="button" class="btn-remove-photo" aria-label="Xóa ảnh">×</button>`;
    photoPreview.querySelector('.btn-remove-photo')?.addEventListener('click', () => { currentPhoto = undefined; renderPhoto(); takePhotoBtn.textContent = 'Chụp ảnh'; });
  };
  takePhotoBtn.addEventListener('click', async () => { takePhotoBtn.disabled = true; takePhotoBtn.textContent = 'Đang mở máy ảnh…'; try { const photo = await takePhoto(); currentPhoto = photo?.base64 || await fallbackFileInput() || undefined; if (currentPhoto) renderPhoto(); } catch (error) { console.error('Photo error:', error); showMessage('Không thể chụp ảnh. Vui lòng thử lại.', 'error'); } finally { takePhotoBtn.disabled = false; takePhotoBtn.textContent = currentPhoto ? 'Thay đổi ảnh' : 'Chụp ảnh'; } });
  getLocationBtn.addEventListener('click', async () => { getLocationBtn.disabled = true; getLocationBtn.textContent = 'Đang lấy vị trí…'; try { const location = await getCurrentLocation(); if (location) { currentLocation = location; locationDisplay.textContent = getLocationDisplayText(location); locationDisplay.classList.add('location-captured'); } else showMessage('Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập.', 'warning'); } catch (error) { console.error('Location error:', error); showMessage('Không thể lấy vị trí.', 'error'); } finally { getLocationBtn.disabled = false; getLocationBtn.textContent = 'Lấy vị trí hiện tại'; } });
  syncBtn.addEventListener('click', async () => { syncBtn.disabled = true; syncBtn.textContent = 'Đang đồng bộ…'; try { await syncPendingInspections(); } catch (error) { console.error('Sync error:', error); showMessage('Đồng bộ thất bại.', 'error'); } finally { syncBtn.disabled = false; syncBtn.textContent = 'Đồng bộ ngay'; } });
  form.addEventListener('reset', () => setTimeout(() => { currentPhoto = undefined; currentLocation = undefined; renderPhoto(); locationDisplay.textContent = 'Chưa ghi nhận vị trí'; locationDisplay.classList.remove('location-captured'); updateRating(); }, 0));
  form.addEventListener('submit', async (event) => { event.preventDefault(); if (!validateForm(form, container)) return; const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement; submitBtn.disabled = true; submitBtn.textContent = 'Đang lưu…'; try { const values = new FormData(form); const inspection: Inspection = { id: crypto.randomUUID(), building: values.get('building') as string, floor: parseInt(values.get('floor') as string), room: values.get('room') as string, category: values.get('category') as CategoryType, rating: parseInt(values.get('rating') as string) as ConditionRating, defectNotes: values.get('defectNotes') as string, photo: currentPhoto, latitude: currentLocation?.latitude, longitude: currentLocation?.longitude, timestamp: new Date().toISOString(), status: 'PENDING_SYNC', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), syncAttempts: 0 }; await saveInspection(inspection); await addToSyncQueue(inspection); if (isNetworkConnected()) { showMessage('Đã lưu phiếu, đang đồng bộ dữ liệu…', 'success'); await syncPendingInspections(); } else showMessage('Đã lưu trên thiết bị. Phiếu sẽ tự động đồng bộ khi có kết nối mạng.', 'info'); form.reset(); await onInspectionSaved(); } catch (error) { console.error('Save error:', error); showMessage('Không thể lưu phiếu khảo sát. Vui lòng thử lại.', 'error'); } finally { submitBtn.disabled = false; submitBtn.textContent = isNetworkConnected() ? 'Lưu phiếu khảo sát' : 'Lưu trên thiết bị'; } });
  return container;
}
function validateForm(form: HTMLFormElement, container: HTMLElement): boolean { container.querySelectorAll('.error-message').forEach((message) => ((message as HTMLElement).textContent = '')); let valid = true; const checks: [string, string, boolean][] = [['building', 'Vui lòng chọn tòa nhà.', !!(form.elements.namedItem('building') as HTMLSelectElement).value], ['floor', 'Vui lòng nhập số tầng hợp lệ.', !!(form.elements.namedItem('floor') as HTMLInputElement).value], ['room', 'Vui lòng nhập số phòng.', !!(form.elements.namedItem('room') as HTMLInputElement).value.trim()], ['category', 'Vui lòng chọn hạng mục.', !!(form.elements.namedItem('category') as HTMLSelectElement).value]]; checks.forEach(([name, message, passed]) => { if (!passed) { const field = form.elements.namedItem(name) as HTMLElement; const error = field.parentElement?.querySelector('.error-message') as HTMLElement; if (error) error.textContent = message; valid = false; } }); return valid; }
function showMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void { const element = document.createElement('div'); element.className = `message message-${type}`; element.setAttribute('role', 'status'); element.textContent = message; document.body.appendChild(element); setTimeout(() => element.remove(), 4500); }
