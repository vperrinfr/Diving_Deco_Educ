import type { WeatherConditions } from '../types/diveSite';

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast';
const MARINE_API = 'https://marine-api.open-meteo.com/v1/marine';

export interface WeatherApiResponse {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
}

export interface MarineApiResponse {
  current: {
    wave_height?: number;
    wave_direction?: number;
    wave_period?: number;
  };
}

/**
 * Fetch current weather conditions from Open-Meteo API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Weather conditions
 */
export async function fetchWeatherConditions(
  latitude: number,
  longitude: number
): Promise<WeatherConditions> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'weather_code',
        'cloud_cover',
        'pressure_msl',
        'wind_speed_10m',
        'wind_direction_10m',
      ].join(','),
      timezone: 'auto',
    });

    const response = await fetch(`${OPEN_METEO_API}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data: WeatherApiResponse = await response.json();

    return {
      temperature: data.current.temperature_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      precipitation: data.current.precipitation,
      cloudCover: data.current.cloud_cover,
      pressure: data.current.pressure_msl,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching weather conditions:', error);
    throw error;
  }
}

/**
 * Fetch marine conditions (wave height, etc.) from Open-Meteo Marine API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Marine conditions including wave height
 */
export async function fetchMarineConditions(
  latitude: number,
  longitude: number
): Promise<{ waveHeight?: number }> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: ['wave_height', 'wave_direction', 'wave_period'].join(','),
    });

    const response = await fetch(`${MARINE_API}?${params}`);
    
    if (!response.ok) {
      // Marine API might not be available for all locations
      console.warn('Marine API not available for this location');
      return {};
    }

    const data: MarineApiResponse = await response.json();

    return {
      waveHeight: data.current.wave_height,
    };
  } catch (error) {
    console.warn('Error fetching marine conditions:', error);
    return {};
  }
}

/**
 * Fetch complete weather and marine conditions
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @returns Combined weather and marine conditions
 */
export async function fetchCompleteConditions(
  latitude: number,
  longitude: number
): Promise<WeatherConditions> {
  const [weather, marine] = await Promise.all([
    fetchWeatherConditions(latitude, longitude),
    fetchMarineConditions(latitude, longitude).catch(() => ({})),
  ]);

  return {
    ...weather,
    waveHeight: 'waveHeight' in marine ? marine.waveHeight : undefined,
  };
}

/**
 * Estimate water temperature based on air temperature and season
 * This is a rough estimation - actual water temperature sensors would be better
 * @param airTemp - Current air temperature in Celsius
 * @param month - Current month (0-11)
 * @param waterType - Type of water body
 * @returns Estimated water temperature
 */
export function estimateWaterTemperature(
  airTemp: number,
  month: number,
  waterType: 'sea' | 'lake' | 'river' | 'quarry'
): number {
  // Water temperature lags behind air temperature
  // Sea water has more thermal inertia than lakes
  const lagFactor = waterType === 'sea' ? 0.7 : 0.8;
  
  // Seasonal adjustment (Northern hemisphere)
  const seasonalAdjustment = Math.sin((month - 2) * Math.PI / 6) * 5;
  
  // Base water temperature
  let waterTemp = airTemp * lagFactor + seasonalAdjustment;
  
  // Different water types have different characteristics
  switch (waterType) {
    case 'sea':
      // Sea maintains more stable temperature
      waterTemp = Math.max(waterTemp, 10);
      break;
    case 'lake':
      // Lakes can get colder in winter
      waterTemp = Math.max(waterTemp, 4);
      break;
    case 'river':
      // Rivers closer to air temperature
      waterTemp = airTemp * 0.85;
      break;
    case 'quarry':
      // Quarries often colder due to depth
      waterTemp = Math.max(waterTemp - 3, 6);
      break;
  }
  
  return Math.round(waterTemp * 10) / 10;
}

// Made with Bob
