export type GeoCoords = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_KM = 6371;

const toRadians = (value: number) => (value * Math.PI) / 180;

export function calculateDistanceKm(origin: GeoCoords, destination: GeoCoords): number {
  const deltaLat = toRadians(destination.lat - origin.lat);
  const deltaLng = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function formatDistanceKm(distanceKm: number, precision = 1): string {
  return `${distanceKm.toFixed(precision)} km`;
}

export function toLatLngQuery(coords: GeoCoords): string {
  return `${coords.lat},${coords.lng}`;
}
