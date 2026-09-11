import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { LocationData } from '../types/inspection';

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    if (Capacitor.isNativePlatform()) {
      let permStatus = await Geolocation.checkPermissions();
      if (permStatus.location !== 'granted') {
        permStatus = await Geolocation.requestPermissions();
      }
      if (permStatus.location !== 'granted') {
        throw new Error('Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền trong Cài đặt.');
      }
    }

    const coordinates = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return {
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude,
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    if (error instanceof Error && error.message) {
      if (error.message.includes('Location services are not enabled')) {
        throw new Error('Vui lòng bật Vị trí/GPS trên điện thoại rồi thử lại.');
      }
      throw error;
    }
    return null;
  }
}

export function getLocationDisplayText(location: LocationData | undefined): string {
  if (!location) {
    return 'Chưa ghi nhận vị trí';
  }
  return `Vĩ độ: ${location.latitude.toFixed(6)}, Kinh độ: ${location.longitude.toFixed(6)}`;
}

export function parseLocationFromString(str: string): LocationData | null {
  const match = str.match(/(?:Latitude|Vĩ độ):\s*([-\d.]+),\s*(?:Longitude|Kinh độ):\s*([-\d.]+)/);
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
    };
  }
  return null;
}
