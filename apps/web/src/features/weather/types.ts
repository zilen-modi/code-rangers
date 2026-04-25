export type WeatherLocation = {
  city?: string;
  state?: string;
  country?: string;
  display_name?: string;
};

export type WeatherData = {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time: string;
  location?: WeatherLocation;
};

export type WeatherInfoResponse = {
  success: boolean;
  data: WeatherData;
};

export type WeatherInfoQuery = {
  lat: number;
  lng: number;
};
