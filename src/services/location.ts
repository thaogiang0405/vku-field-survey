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
    return 'Location not captured';
  }
  return `Latitude: ${location.latitude.toFixed(6)}, Longitude: ${location.longitude.toFixed(6)}`;
}

export function parseLocationFromString(str: string): LocationData | null {
  const match = str.match(/Latitude:\s*([-\d.]+),\s*Longitude:\s*([-\d.]+)/);
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
    };
  }
  return null;
}
