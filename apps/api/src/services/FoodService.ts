import { Place } from '../schemas/travel';

export interface Coordinates {
  lat: number;
  lng: number;
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

async function fetchFromOverpass(query: string): Promise<Place[]> {
  const params = new URLSearchParams();
  params.append('data', query);

  const response = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'CodeRangersTravelApp/1.0',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Overpass API error response:', errorText);
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const data = JSON.parse(text) as { elements?: any[] };
  return (data.elements || []).map((element: any) => {
    const lat = element.lat || element.center?.lat;
    const lon = element.lon || element.center?.lon;

    return {
      id: element.id,
      lat,
      lon,
      tags: element.tags || {},
      name: element.tags?.name || 'Unknown',
      type: element.tags?.amenity || element.tags?.tourism || 'place',
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`,
    };
  });
}

export const getFoodNearby = async (
  coords: Coordinates,
  radius: number = 3500,
  search?: string,
): Promise<Record<string, Place[]>> => {
  const amenityFilters = ['restaurant', 'cafe', 'fast_food', 'food_court', 'bar', 'pub'];
  const amenityQuery = amenityFilters
    .flatMap((amenity) => [
      `node["amenity"="${amenity}"](around:${radius},${coords.lat},${coords.lng});`,
      `way["amenity"="${amenity}"](around:${radius},${coords.lat},${coords.lng});`,
    ])
    .join('\n      ');

  const query = `
    [out:json][timeout:25];
    (
      ${amenityQuery}
    );
    out center;
  `;

  const places = await fetchFromOverpass(query);
  const normalizedSearch = search?.trim().toLowerCase();

  const filtered = normalizedSearch
    ? places.filter((place) => {
        const name = place.name.toLowerCase();
        const cuisine = (place.tags.cuisine || '').toLowerCase();
        return name.includes(normalizedSearch) || cuisine.includes(normalizedSearch);
      })
    : places;

  const grouped = filtered.reduce<Record<string, Place[]>>((acc, place) => {
    if (!place.type) return acc;
    if (!acc[place.type]) {
      acc[place.type] = [];
    }
    acc[place.type].push(place);
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(grouped).map(([type, list]) => [type, list.filter((item) => item.name !== 'Unknown').slice(0, 12)]),
  );
};
