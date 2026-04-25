import { GOOGLE_MAPS_SEARCH_BASE_URL } from '@/config/travel';
import { GeoCoords, toLatLngQuery } from '@/lib/geo';

export function buildGoogleMapsSearchUrl(query: string): string {
  return `${GOOGLE_MAPS_SEARCH_BASE_URL}?api=1&query=${encodeURIComponent(query)}`;
}

export function buildGoogleMapsSearchUrlFromCoords(coords: GeoCoords): string {
  return buildGoogleMapsSearchUrl(toLatLngQuery(coords));
}
