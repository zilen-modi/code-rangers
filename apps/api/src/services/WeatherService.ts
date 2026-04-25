export interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    display_name?: string;
  };
}

export const getWeatherNearby = async (lat: number, lng: number): Promise<WeatherData> => {
  // 1. Fetch Weather
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
  const weatherResponse = await fetch(weatherUrl);
  
  if (!weatherResponse.ok) {
    throw new Error('Failed to fetch weather data');
  }
  
  const weatherData = await weatherResponse.json() as any;

  // 2. Fetch Location Details (Reverse Geocoding)
  // Nominatim requires a User-Agent header
  const locationUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const locationResponse = await fetch(locationUrl, {
    headers: {
      'User-Agent': 'TravelApp/1.0'
    }
  });

  let locationInfo = {};
  if (locationResponse.ok) {
    const locData = await locationResponse.json() as any;
    locationInfo = {
      city: locData.address?.city || locData.address?.town || locData.address?.village || locData.address?.city_district || locData.address?.suburb || locData.address?.county,
      state: locData.address?.state,
      country: locData.address?.country,
      display_name: locData.display_name
    };
  }

  return {
    ...weatherData.current_weather,
    location: locationInfo
  };
};
