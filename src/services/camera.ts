import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface PhotoResult {
  webPath?: string;
  base64?: string;
  exif?: any;
}

export function isNativeCameraPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

const cameraOptions = (source: CameraSource) => ({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Base64,
  source,
  promptLabelPhoto: 'Chọn từ thư viện',
  promptLabelPicture: 'Chụp ảnh',
  promptLabelCancel: 'Hủy',
});

function toPhotoResult(image: { base64String?: string; webPath?: string; exif?: any }): PhotoResult {
  return { base64: image.base64String, webPath: image.webPath, exif: image.exif };
}

/** Opens the native Android/iOS camera through Capacitor, or the web camera fallback. */
export async function takePhoto(): Promise<PhotoResult | null> {
  try {
    return toPhotoResult(await Camera.getPhoto(cameraOptions(CameraSource.Camera)));
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
}

/** Opens the native Android/iOS photo library through Capacitor. */
export async function pickPhoto(): Promise<PhotoResult | null> {
  try {
    return toPhotoResult(await Camera.getPhoto(cameraOptions(CameraSource.Photos)));
  } catch (error) {
    console.error('Photo picker error:', error);
    return null;
  }
}

export function getWebPhotoDataUrl(base64: string | undefined): string {
  return base64 ? `data:image/jpeg;base64,${base64}` : '';
}

/** Web/PWA fallback. `camera` requests the rear-facing mobile camera when supported. */
export function fallbackFileInput(source: 'camera' | 'library' = 'library'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.onchange = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const value = reader.result;
        resolve(typeof value === 'string' ? value.split(',')[1] || null : null);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
