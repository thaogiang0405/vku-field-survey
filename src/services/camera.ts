import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export interface PhotoResult {
  webPath?: string;
  base64?: string;
  exif?: any;
}

export async function takePhoto(): Promise<PhotoResult | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      promptLabelPhoto: 'From photos',
      promptLabelPicture: 'Take picture',
      promptLabelCancel: 'Cancel',
    });

    return {
      base64: image.base64String,
      webPath: image.webPath,
      exif: image.exif,
    };
  } catch (error) {
    console.error('Camera error:', error);
    return null;
  }
}

export async function pickPhoto(): Promise<PhotoResult | null> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
    });

    return {
      base64: image.base64String,
      webPath: image.webPath,
      exif: image.exif,
    };
  } catch (error) {
    console.error('Photo picker error:', error);
    return null;
  }
}

export function getWebPhotoDataUrl(base64: string | undefined): string {
  if (!base64) return '';
  return `data:image/jpeg;base64,${base64}`;
}

export async function fallbackFileInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    (input as any).capture = 'environment';

    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
        } else {
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
}
