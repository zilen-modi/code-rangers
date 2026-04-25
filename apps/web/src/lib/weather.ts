const WEATHER_CODE_TEXT: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
};

export function getWeatherDescription(code?: number): string {
  if (code === undefined) {
    return 'Unknown';
  }

  return WEATHER_CODE_TEXT[code] || 'Unknown';
}

export function formatTemperature(value?: number): string {
  if (value === undefined) {
    return '--°C';
  }

  return `${Math.round(value)}°C`;
}
