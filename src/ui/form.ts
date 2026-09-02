import { Inspection, CategoryType, ConditionRating } from '../types/inspection';
import { saveInspection, addToSyncQueue } from '../db/database';
import { getCurrentLocation, getLocationDisplayText } from '../services/location';
import { takePhoto, getWebPhotoDataUrl, fallbackFileInput } from '../services/camera';
import { isNetworkConnected } from '../services/network';
import { syncPendingInspections } from '../services/sync';

const CATEGORIES: CategoryType[] = ['Hardware', 'Projector', 'AC', 'Electrical', 'Furniture'];
const BUILDINGS = ['Building A', 'Building B', 'Building C'];
const ROOMS = ['A101', 'A201', 'A301', 'B101', 'B201', 'B301'];

export interface FormData {
  building: string;
  floor: number;
  room: string;
  category: CategoryType;
  rating: ConditionRating;
  defectNotes: string;
  photo?: string;
  latitude?: number;
  longitude?: number;
}

let currentPhoto: string | undefined = undefined;
let currentLocation: { latitude: number; longitude: number } | undefined = undefined;

export function createInspectionForm(onInspectionSaved: () => void): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'form-container';

  container.innerHTML = `
    <div class="form-card">
      <h2>Facility Inspection</h2>
      
      <form id="inspectionForm" class="inspection-form">
        <div class="form-group">
          <label for="building">Building*</label>
          <select id="building" name="building" required>
            <option value="">Select a building</option>
            ${BUILDINGS.map((b) => `<option value="${b}">${b}</option>`).join('')}
          </select>
          <small class="error-message"></small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="floor">Floor*</label>
            <input
              id="floor"
              name="floor"
              type="number"
              min="1"
              max="10"
              required
              placeholder="1"
            />
            <small class="error-message"></small>
          </div>

          <div class="form-group">
            <label for="room">Room #*</label>
            <input
              id="room"
              name="room"
              type="text"
              required
              placeholder="e.g., A101"
              list="room-list"
            />
            <datalist id="room-list">
              ${ROOMS.map((r) => `<option value="${r}"></option>`).join('')}
            </datalist>
            <small class="error-message"></small>
          </div>
        </div>

        <div class="form-group">
          <label for="category">Category*</label>
          <select id="category" name="category" required>
            <option value="">Select a category</option>
            ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
          <small class="error-message"></small>
        </div>

        <div class="form-group">
          <label for="rating">Condition Rating*</label>
          <div class="rating-container">
            <div class="rating-display">
              <span id="ratingValue">-</span>
              <span class="rating-label">/5</span>
            </div>
            <input
              id="rating"
              name="rating"
              type="range"
              min="1"
              max="5"
              value="3"
              class="rating-slider"
            />
            <div class="rating-labels">
              <span title="Very Bad">1</span>
              <span title="Bad">2</span>
              <span title="Average">3</span>
              <span title="Good">4</span>
              <span title="Excellent">5</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="defectNotes">Defect Notes</label>
          <textarea
            id="defectNotes"
            name="defectNotes"
            rows="4"
            placeholder="Describe any defects or issues..."
          ></textarea>
        </div>

        <div class="form-section-title">Media & Location</div>

        <div class="form-group">
          <label>Photo</label>
          <div class="photo-container">
            <div id="photoPreview" class="photo-preview"></div>
            <button type="button" id="takePhotoBtn" class="btn-secondary">
              📷 Take Photo
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>GPS Location</label>
          <div class="location-container">
            <div id="locationDisplay" class="location-display">
              Location not captured
            </div>
            <button type="button" id="getLocationBtn" class="btn-secondary">
              📍 Get Location
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary">💾 Save Inspection</button>
          <button type="button" id="syncBtn" class="btn-secondary">🔄 Sync Now</button>
          <button type="reset" class="btn-tertiary">↺ Clear Form</button>
        </div>
      </form>
    </div>
  `;

  const form = container.querySelector('#inspectionForm') as HTMLFormElement;
  const ratingSlider = form.querySelector('#rating') as HTMLInputElement;
  const ratingValue = container.querySelector('#ratingValue') as HTMLElement;
  const takePhotoBtn = form.querySelector('#takePhotoBtn') as HTMLButtonElement;
  const getLocationBtn = form.querySelector('#getLocationBtn') as HTMLButtonElement;
  const syncBtn = form.querySelector('#syncBtn') as HTMLButtonElement;
  const photoPreview = container.querySelector('#photoPreview') as HTMLDivElement;
  const locationDisplay = container.querySelector('#locationDisplay') as HTMLDivElement;

  // Rating slider handler
  ratingSlider.addEventListener('change', () => {
    ratingValue.textContent = ratingSlider.value;
  });

  ratingSlider.addEventListener('input', () => {
    ratingValue.textContent = ratingSlider.value;
  });

  // Photo button handler
  takePhotoBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    takePhotoBtn.disabled = true;
    takePhotoBtn.textContent = '📷 Taking photo...';

    try {
      const photo = await takePhoto();

      if (photo?.base64) {
        currentPhoto = photo.base64;
        photoPreview.innerHTML = `
          <img src="${getWebPhotoDataUrl(currentPhoto)}" alt="Inspection photo" class="photo-thumbnail" />
          <button type="button" class="btn-remove-photo">✕ Remove</button>
        `;

        const removeBtn = photoPreview.querySelector('.btn-remove-photo') as HTMLButtonElement;
        removeBtn.addEventListener('click', (e2) => {
          e2.preventDefault();
          currentPhoto = undefined;
          photoPreview.innerHTML = '';
          takePhotoBtn.textContent = '📷 Take Photo';
        });
      } else {
        // Fallback for web
        const base64 = await fallbackFileInput();
        if (base64) {
          currentPhoto = base64;
          photoPreview.innerHTML = `
            <img src="${getWebPhotoDataUrl(currentPhoto)}" alt="Inspection photo" class="photo-thumbnail" />
            <button type="button" class="btn-remove-photo">✕ Remove</button>
          `;

          const removeBtn = photoPreview.querySelector('.btn-remove-photo') as HTMLButtonElement;
          removeBtn.addEventListener('click', (e2) => {
            e2.preventDefault();
            currentPhoto = undefined;
            photoPreview.innerHTML = '';
            takePhotoBtn.textContent = '📷 Take Photo';
          });
        }
      }
    } catch (error) {
      console.error('Photo error:', error);
      showMessage('Failed to take photo', 'error');
    } finally {
      takePhotoBtn.disabled = false;
      takePhotoBtn.textContent = '📷 Take Photo';
    }
  });

  // Location button handler
  getLocationBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    getLocationBtn.disabled = true;
    getLocationBtn.textContent = '📍 Getting location...';

    try {
      const location = await getCurrentLocation();
      if (location) {
        currentLocation = location;
        locationDisplay.textContent = getLocationDisplayText(location);
        locationDisplay.classList.add('location-captured');
      } else {
        showMessage('Failed to get location. Please check permissions.', 'warning');
      }
    } catch (error) {
      console.error('Location error:', error);
      showMessage('Failed to get location', 'error');
    } finally {
      getLocationBtn.disabled = false;
      getLocationBtn.textContent = '📍 Get Location';
    }
  });

  // Sync button handler
  syncBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    syncBtn.disabled = true;
    syncBtn.textContent = '🔄 Syncing...';

    try {
      await syncPendingInspections();
    } catch (error) {
      console.error('Sync error:', error);
      showMessage('Sync failed', 'error');
    } finally {
      syncBtn.disabled = false;
      syncBtn.textContent = '🔄 Sync Now';
    }
  });

  // Form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm(form, container)) {
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement;
    submitBtn.disabled = true;
    submitBtn.textContent = '💾 Saving...';

    try {
      const formData = new FormData(form);
      const inspection: Inspection = {
        id: crypto.randomUUID(),
        building: formData.get('building') as string,
        floor: parseInt(formData.get('floor') as string),
        room: formData.get('room') as string,
        category: formData.get('category') as CategoryType,
        rating: parseInt(formData.get('rating') as string) as ConditionRating,
        defectNotes: formData.get('defectNotes') as string,
        photo: currentPhoto,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        timestamp: new Date().toISOString(),
        status: 'PENDING_SYNC',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncAttempts: 0,
      };

      await saveInspection(inspection);
      await addToSyncQueue(inspection);

      if (isNetworkConnected()) {
        showMessage('Inspection saved. Syncing...', 'success');
        await syncPendingInspections();
      } else {
        showMessage('Inspection saved locally. Will sync when back online.', 'info');
      }

      // Reset form and UI
      form.reset();
      currentPhoto = undefined;
      currentLocation = undefined;
      photoPreview.innerHTML = '';
      locationDisplay.textContent = 'Location not captured';
      locationDisplay.classList.remove('location-captured');
      ratingValue.textContent = '3';

      onInspectionSaved();
    } catch (error) {
      console.error('Save error:', error);
      const message = error instanceof Error ? error.message : 'Failed to save inspection';
      showMessage(message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '💾 Save Inspection';
    }
  });

  return container;
}

function validateForm(form: HTMLFormElement, container: HTMLDivElement): boolean {
  const errorMessages = container.querySelectorAll('.error-message');
  errorMessages.forEach((msg) => {
    (msg as HTMLElement).textContent = '';
  });

  let isValid = true;

  const building = (form.querySelector('#building') as HTMLSelectElement).value;
  if (!building) {
    showFieldError(form, 'building', 'Building is required');
    isValid = false;
  }

  const floor = (form.querySelector('#floor') as HTMLInputElement).value;
  if (!floor || isNaN(parseInt(floor))) {
    showFieldError(form, 'floor', 'Valid floor number is required');
    isValid = false;
  }

  const room = (form.querySelector('#room') as HTMLInputElement).value;
  if (!room.trim()) {
    showFieldError(form, 'room', 'Room number is required');
    isValid = false;
  }

  const category = (form.querySelector('#category') as HTMLSelectElement).value;
  if (!category) {
    showFieldError(form, 'category', 'Category is required');
    isValid = false;
  }

  return isValid;
}

function showFieldError(form: HTMLFormElement, fieldName: string, message: string): void {
  const field = form.querySelector(`[name="${fieldName}"]`) as HTMLElement;
  if (field) {
    const errorEl = field.parentElement?.querySelector('.error-message') as HTMLElement;
    if (errorEl) {
      errorEl.textContent = message;
    }
  }
}

function showMessage(message: string, type: 'success' | 'error' | 'info' | 'warning'): void {
  const messageEl = document.createElement('div');
  messageEl.className = `message message-${type}`;
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 16px 24px;
    border-radius: 8px;
    background: ${getMessageColor(type)};
    color: white;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
  `;

  document.body.appendChild(messageEl);

  setTimeout(() => {
    messageEl.remove();
  }, 4000);
}

function getMessageColor(type: string): string {
  switch (type) {
    case 'success':
      return '#4caf50';
    case 'error':
      return '#f44336';
    case 'warning':
      return '#ff9800';
    case 'info':
    default:
      return '#2196f3';
  }
}
