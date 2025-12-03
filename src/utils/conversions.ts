/**
 * Unit Conversion Utilities
 * 
 * Functions for converting between metric and imperial units
 */

import { SURFACE_PRESSURE, PRESSURE_PER_METER } from './buhlmann/constants';

/**
 * Convert depth in meters to absolute pressure in bar
 */
export function depthToPressure(depth: number): number {
  return SURFACE_PRESSURE + (depth * PRESSURE_PER_METER);
}

/**
 * Convert absolute pressure in bar to depth in meters
 */
export function pressureToDepth(pressure: number): number {
  return (pressure - SURFACE_PRESSURE) / PRESSURE_PER_METER;
}

/**
 * Convert meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Convert feet to meters
 */
export function feetToMeters(feet: number): number {
  return feet / 3.28084;
}

/**
 * Convert bar to PSI
 */
export function barToPsi(bar: number): number {
  return bar * 14.5038;
}

/**
 * Convert PSI to bar
 */
export function psiToBar(psi: number): number {
  return psi / 14.5038;
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32;
}

/**
 * Convert Fahrenheit to Celsius
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return (fahrenheit - 32) * 5/9;
}

/**
 * Format depth with appropriate unit
 */
export function formatDepth(depth: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    return `${Math.round(metersToFeet(depth))} ft`;
  }
  return `${Math.round(depth)} m`;
}

/**
 * Format time in minutes to MM:SS format
 */
export function formatTime(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format time in minutes to human readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)} sec`;
  }
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  if (secs === 0) {
    return `${mins} min`;
  }
  return `${mins} min ${secs} sec`;
}

/**
 * Format pressure with appropriate unit
 */
export function formatPressure(pressure: number, units: 'metric' | 'imperial'): string {
  if (units === 'imperial') {
    return `${barToPsi(pressure).toFixed(1)} psi`;
  }
  return `${pressure.toFixed(2)} bar`;
}

/**
 * Round to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Made with Bob
