export interface RegionWeather {
  region_id: number;
  county: string;
  town: string;
  gis_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  station_id?: string | null;
  station_name?: string | null;
  forecast_time?: string | null;
  weather?: string | null;
  temperature?: number | null;
  min_temp?: number | null;
  max_temp?: number | null;
  pop?: number | null;
  humidity?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  air_pressure?: number | null;
}

export interface RegionsHierarchy {
  [county: string]: string[];
}

export type WeatherMetric = 'temperature' | 'pop' | 'humidity';
