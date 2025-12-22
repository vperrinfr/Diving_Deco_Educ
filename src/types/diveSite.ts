export type WaterType = 'sea' | 'lake' | 'river' | 'quarry';

export interface DiveSite {
  id: string;
  name: string;
  waterType: WaterType;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    country?: string;
  };
  altitude: number; // meters above sea level
  waterTemperature: number; // Celsius
  visibility?: number; // meters
  maxDepth?: number; // meters
  description?: string;
  lastUpdated: Date;
}

export interface WeatherConditions {
  temperature: number; // Celsius
  windSpeed: number; // km/h
  windDirection: number; // degrees
  waveHeight?: number; // meters
  precipitation: number; // mm
  cloudCover: number; // percentage
  pressure: number; // hPa
  humidity: number; // percentage
  weatherCode: number; // WMO weather code
  timestamp: Date;
}

export interface CurrentConditions {
  waterTemperature: number;
  airTemperature: number;
  windSpeed: number;
  windDirection: number;
  waveHeight?: number;
  visibility?: number;
  currentSpeed?: number; // knots
  currentDirection?: number; // degrees
  weatherDescription: string;
}

// WMO Weather interpretation codes
export const weatherCodeDescriptions: Record<number, { en: string; fr: string }> = {
  0: { en: 'Clear sky', fr: 'Ciel dégagé' },
  1: { en: 'Mainly clear', fr: 'Principalement dégagé' },
  2: { en: 'Partly cloudy', fr: 'Partiellement nuageux' },
  3: { en: 'Overcast', fr: 'Couvert' },
  45: { en: 'Foggy', fr: 'Brouillard' },
  48: { en: 'Depositing rime fog', fr: 'Brouillard givrant' },
  51: { en: 'Light drizzle', fr: 'Bruine légère' },
  53: { en: 'Moderate drizzle', fr: 'Bruine modérée' },
  55: { en: 'Dense drizzle', fr: 'Bruine dense' },
  61: { en: 'Slight rain', fr: 'Pluie légère' },
  63: { en: 'Moderate rain', fr: 'Pluie modérée' },
  65: { en: 'Heavy rain', fr: 'Pluie forte' },
  71: { en: 'Slight snow', fr: 'Neige légère' },
  73: { en: 'Moderate snow', fr: 'Neige modérée' },
  75: { en: 'Heavy snow', fr: 'Neige forte' },
  77: { en: 'Snow grains', fr: 'Grains de neige' },
  80: { en: 'Slight rain showers', fr: 'Averses légères' },
  81: { en: 'Moderate rain showers', fr: 'Averses modérées' },
  82: { en: 'Violent rain showers', fr: 'Averses violentes' },
  85: { en: 'Slight snow showers', fr: 'Averses de neige légères' },
  86: { en: 'Heavy snow showers', fr: 'Averses de neige fortes' },
  95: { en: 'Thunderstorm', fr: 'Orage' },
  96: { en: 'Thunderstorm with slight hail', fr: 'Orage avec grêle légère' },
  99: { en: 'Thunderstorm with heavy hail', fr: 'Orage avec grêle forte' },
};

// Made with Bob
