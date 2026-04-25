// We will use global fetch available in Node.js 18+

import { Place, TravelCategory } from '../schemas/travel.js';

export interface Coordinates {
  lat: number;
  lng: number;
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

function toTitleCase(input: string): string {
  return input
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function fetchFromOverpass(query: string): Promise<Place[]> {
  try {
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
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Overpass response as JSON. Response text:', text);
      throw new Error('Invalid JSON response from Overpass API');
    }

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
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
      };
    });
  } catch (error) {
    console.error('Error in fetchFromOverpass:', error);
    throw error;
  }
}

export const getSosNearby = async (
  coords: Coordinates,
  radius: number = 5000,
): Promise<TravelCategory[]> => {
  // Fetch hospitals and police stations
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${coords.lat},${coords.lng});
      way["amenity"="hospital"](around:${radius},${coords.lat},${coords.lng});
      node["amenity"="police"](around:${radius},${coords.lat},${coords.lng});
      way["amenity"="police"](around:${radius},${coords.lat},${coords.lng});
    );
    out center;
  `;
  const places = await fetchFromOverpass(query);

  const grouped = places.reduce<Record<string, Place[]>>((acc, place) => {
    if (!acc[place.type]) {
      acc[place.type] = [];
    }
    acc[place.type].push(place);
    return acc;
  }, {});

  return Object.entries(grouped).map(([category, list]) => ({
    category,
    categoryLabel: toTitleCase(category),
    list: list.slice(0, 3),
  }));
};

export const getEssentialsNearby = async (
  coords: Coordinates,
  radius: number = 3000,
): Promise<Record<string, Place[]>> => {
  // Fetch ATMs and charging stations and petrol pumps (fuel)
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="atm"](around:${radius},${coords.lat},${coords.lng});
      node["amenity"="fuel"](around:${radius},${coords.lat},${coords.lng});
      node["amenity"="charging_station"](around:${radius},${coords.lat},${coords.lng});
    );
    out center;
  `;
  const places = await fetchFromOverpass(query);

  return {
    atm: places.filter((p) => p.type === 'atm').slice(0, 3),
    charging_station: places.filter((p) => p.type === 'charging_station').slice(0, 3),
    fuel: places.filter((p) => p.type === 'fuel').slice(0, 3),
  };
};

export const getPlacesNearby = async (
  coords: Coordinates,
  radius: number = 10000,
): Promise<Record<string, Place[]>> => {
  // Fetch tourist attractions
  const query = `
    [out:json][timeout:25];
    (
      node["historic"](around:${radius},${coords.lat},${coords.lng});
      way["historic"](around:${radius},${coords.lat},${coords.lng});
);
      out;
      `;

  // const query = '[out:json];node["historic"](around:10000,23.0215374,72.5800568);out;'
  const places = await fetchFromOverpass(query);

  // Group by type (attraction, museum, zoo, etc.)
  const grouped: Record<string, Place[]> = {};
  places.forEach((p) => {
    if (!grouped[p.type]) {
      grouped[p.type] = [];
    }
    grouped[p.type].push(p);
  });

  return grouped;
};
