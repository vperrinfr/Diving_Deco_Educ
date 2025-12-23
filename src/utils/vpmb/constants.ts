/**
 * VPM-B (Varying Permeability Model - Baker) Constants
 * 
 * Simplified implementation for educational purposes
 * Based on the work of Yount & Hoffman, adapted by Erik Baker
 */

/**
 * Critical bubble nucleus radii (micrometers)
 * These represent the initial size of bubble nuclei in tissues
 */
export const CRITICAL_RADII = [
  1.0,  // Compartment 1 (fastest)
  0.95,
  0.9,
  0.85,
  0.8,
  0.75,
  0.7,
  0.65,
  0.6,
  0.55,
  0.5,
  0.45,
  0.4,
  0.35,
  0.3,
  0.25  // Compartment 16 (slowest)
];

/**
 * Surface tension of blood-gas interface (N/m)
 */
export const SURFACE_TENSION = 0.0179;

/**
 * Skin compression (bar)
 * Represents the compression of bubble nuclei
 */
export const SKIN_COMPRESSION = 0.257;

/**
 * Critical volume parameter (liters)
 * Used to calculate allowable supersaturation
 */
export const CRITICAL_VOLUME_LAMBDA = 7500;

/**
 * Regeneration time constant (minutes)
 * Time for bubble nuclei to regenerate after crushing
 */
export const REGENERATION_TIME = 20160; // 14 days in minutes

/**
 * VPM-B conservatism settings
 * Higher values = more conservative (more/longer deep stops)
 */
export const VPM_CONSERVATISM = {
  NOMINAL: 0,      // Standard VPM-B
  PLUS_1: 1,       // +1 conservatism
  PLUS_2: 2,       // +2 conservatism
  PLUS_3: 3,       // +3 conservatism
  PLUS_4: 4        // +4 conservatism (very conservative)
};

/**
 * Default conservatism level for simplified implementation
 */
export const DEFAULT_CONSERVATISM = VPM_CONSERVATISM.PLUS_1;

/**
 * Gradient onset of impermeability (bar)
 * Pressure at which bubble permeability changes
 */
export const GRADIENT_ONSET = 8.2;

/**
 * VPM-B adjustment factors for simplified implementation
 * These factors modify Bühlmann calculations to approximate VPM-B behavior
 */
export const VPM_ADJUSTMENT_FACTORS = {
  // Favor deeper stops by increasing time at depth
  DEEP_STOP_MULTIPLIER: 1.3,
  
  // Reduce time at shallow stops
  SHALLOW_STOP_MULTIPLIER: 0.85,
  
  // Depth threshold for "deep" vs "shallow" (meters)
  DEEP_STOP_THRESHOLD: 12,
  
  // Add intermediate stops
  ADD_INTERMEDIATE_STOPS: true,
  
  // Minimum stop time (minutes)
  MIN_STOP_TIME: 1,
  
  // First stop depth adjustment (meters deeper than Bühlmann)
  FIRST_STOP_ADJUSTMENT: 3
};

/**
 * Ascent rate for VPM-B (m/min)
 * Typically slower than standard recreational rate
 */
export const VPM_ASCENT_RATE = 9; // meters per minute

/**
 * Helper function to get critical radius for compartment
 */
export function getCriticalRadius(compartmentNumber: number): number {
  return CRITICAL_RADII[compartmentNumber - 1] || CRITICAL_RADII[0]!;
}

/**
 * Helper function to calculate allowable supersaturation
 * Simplified version for educational purposes
 */
export function calculateAllowableSupersaturation(
  depth: number,
  compartmentNumber: number,
  conservatism: number = DEFAULT_CONSERVATISM
): number {
  const radius = getCriticalRadius(compartmentNumber);
  const ambientPressure = (depth / 10) + 1.01325; // bar
  
  // Simplified calculation
  // Real VPM-B uses complex bubble mechanics
  const baseSupersaturation = (2 * SURFACE_TENSION) / (radius * 1e-6);
  const adjustment = conservatism * 0.1; // Conservatism adjustment
  
  return baseSupersaturation * (1 - adjustment);
}

// Made with Bob