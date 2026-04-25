import { GEOLOCATION_OPTIONS } from '@/config/travel';
import { GeoCoords } from '@/lib/geo';

export function requestCurrentPosition(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Location is only available in the browser.'));
      return;
    }

    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported on this device.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      GEOLOCATION_OPTIONS,
    );
  });
}

export function getLocationErrorMessage(error: unknown): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'Location access usually requires HTTPS (or localhost). Open the app on a secure URL.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const geolocationError = error as GeolocationPositionError;
    if (geolocationError.code === 1) {
      return 'Location permission denied. Tap "Enable Location" to try again.';
    }
    if (geolocationError.code === 2) {
      return 'Location unavailable. Please check GPS/network and try again.';
    }
    if (geolocationError.code === 3) {
      return 'Location request timed out. Tap "Enable Location" to retry.';
    }
  }

  return 'Unable to get location. Tap "Enable Location" to try again.';
}
