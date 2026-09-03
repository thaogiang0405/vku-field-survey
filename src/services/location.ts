import { Geolocation } from '@capacitor/geolocation';
import { LocationData } from '../types/inspection';

export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
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
