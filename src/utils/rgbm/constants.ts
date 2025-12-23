/**
 * RGBM (Reduced Gradient Bubble Model) Constants
 * 
 * Simplified implementation for educational purposes
 * Based on the work of Bruce Wienke
 */

/**
 * RGBM gradient factors
 * More conservative than standard Bühlmann
 */
export const RGBM_GRADIENT_FACTORS = {
  LOW: 30,   // Very conservative for first stop
  HIGH: 70   // Conservative for surface
};

/**
 * Bubble formation threshold (bar)
 * Pressure difference that triggers bubble formation
 */
export const BUBBLE_FORMATION_THRESHOLD = 0.8;

/**
 * Repetitive dive penalty factors
 * RGBM penalizes repetitive dives more than Bühlmann
 */
export const REPETITIVE_PENALTY = {
  NONE: 1.0,        // First dive of the day
  LIGHT: 1.1,       // 1 previous dive, >3h surface interval
  MODERATE: 1.25,   // 2 previous dives or <3h interval
  HEAVY: 1.4        // 3+ dives or <2h interval
};

/**
 * Yo-yo dive penalty
 * RGBM heavily penalizes ascending and descending repeatedly
 */
export const YO_YO_PENALTY = 1.3;

/**
 * Deep stop emphasis
 * RGBM favors deep stops similar to VPM-B
 */
export const DEEP_STOP_EMPHASIS = {
  ENABLED: true,
  DEPTH_THRESHOLD: 15, // meters
  TIME_MULTIPLIER: 1.2
};

/**
 * Ascent rate for RGBM (m/min)
 * Slower than recreational standard
 */
export const RGBM_ASCENT_RATE = 9; // meters per minute

/**
 * Microbubble seed population
 * Represents the number of bubble nuclei in tissues
 */
export const MICROBUBBLE_SEEDS = {
  INITIAL: 1.0,
  AFTER_DIVE: 1.5,      // Increased after dive
  REGENERATION_RATE: 0.1 // Per hour
};

/**
 * Critical supersaturation ratios for RGBM
 * Lower than Bühlmann = more conservative
 */
export const CRITICAL_SUPERSATURATION_RATIOS = [
  1.8,  // Compartment 1 (fastest)
  1.75,
  1.7,
  1.65,
  1.6,
  1.55,
  1.5,
  1.45,
  1.4,
  1.35,
  1.3,
  1.25,
  1.2,
  1.15,
  1.1,
  1.05  // Compartment 16 (slowest)
];

/**
 * RGBM adjustment factors for simplified implementation
 */
export const RGBM_ADJUSTMENT_FACTORS = {
  // Reduce gradient factors for conservatism
  GF_LOW_REDUCTION: 10,
  GF_HIGH_REDUCTION: 15,
  
  // Deep stop adjustments
  DEEP_STOP_THRESHOLD: 15,
  DEEP_STOP_MULTIPLIER: 1.2,
  
  // Add extra stops
  ADD_INTERMEDIATE_STOPS: true,
  INTERMEDIATE_STOP_INTERVAL: 3, // meters
  
  // Minimum stop time
  MIN_STOP_TIME: 1,
  
  // First stop adjustment (meters deeper)
  FIRST_STOP_ADJUSTMENT: 3
};

/**
 * Helper function to get critical supersaturation ratio
 */
export function getCriticalSupersaturationRatio(compartmentNumber: number): number {
  return CRITICAL_SUPERSATURATION_RATIOS[compartmentNumber - 1] || CRITICAL_SUPERSATURATION_RATIOS[0]!;
}

/**
 * Helper function to calculate repetitive dive penalty
 */
export function calculateRepetitivePenalty(
  previousDives: number,
  surfaceInterval: number // minutes
): number {
  if (previousDives === 0) {
    return REPETITIVE_PENALTY.NONE;
  }
  
  if (previousDives === 1 && surfaceInterval >= 180) {
    return REPETITIVE_PENALTY.LIGHT;
  }
  
  if (previousDives <= 2 || surfaceInterval >= 120) {
    return REPETITIVE_PENALTY.MODERATE;
  }
  
  return REPETITIVE_PENALTY.HEAVY;
}

/**
 * Helper function to detect yo-yo diving pattern
 */
export function detectYoYoPattern(depths: number[]): boolean {
  if (depths.length < 3) return false;
  
  let ascents = 0;
  let descents = 0;
  
  for (let i = 1; i < depths.length; i++) {
    const diff = depths[i]! - depths[i - 1]!;
    if (diff > 3) descents++;
    if (diff < -3) ascents++;
  }
  
  // Yo-yo if multiple ascents and descents
  return ascents >= 2 && descents >= 2;
}

/**
 * Helper function to calculate bubble growth factor
 */
export function calculateBubbleGrowthFactor(
  depth: number,
  time: number,
  previousDives: number
): number {
  const baseGrowth = 1.0;
  const depthFactor = depth > 30 ? 1.1 : 1.0;
  const timeFactor = time > 30 ? 1.05 : 1.0;
  const repetitiveFactor = previousDives > 0 ? 1.1 : 1.0;
  
  return baseGrowth * depthFactor * timeFactor * repetitiveFactor;
}

// Made with Bob