/**
 * Gradient Factor Calculations
 * 
 * Implementation of gradient factor logic for conservative decompression
 */

import type { TissueCompartment } from '../../types';
import { SURFACE_PRESSURE } from './constants';
import { pressureToDepth, depthToPressure } from '../conversions';
import { getTotalInertPressure, calculateCombinedMValueParams } from './tissueLoading';

/**
 * Calculate M-value for a tissue compartment at given ambient pressure
 * 
 * Formula: M-value = (P_amb / b) - (a / b)
 * Or equivalently: M-value = a + (P_amb * b)
 * 
 * @param ambientPressure - Ambient pressure in bar
 * @param a - M-value a coefficient
 * @param b - M-value b coefficient
 * @returns M-value in bar
 */
export function calculateMValue(
  ambientPressure: number,
  a: number,
  b: number
): number {
  return (ambientPressure / b) - (a / b);
}

/**
 * Calculate tolerated ambient pressure for given tissue pressure
 * 
 * Formula: P_amb_tol = (P_tissue - a) * b
 * 
 * @param tissuePressure - Tissue inert gas pressure
 * @param a - M-value a coefficient
 * @param b - M-value b coefficient
 * @returns Tolerated ambient pressure in bar
 */
export function calculateToleratedPressure(
  tissuePressure: number,
  a: number,
  b: number
): number {
  return (tissuePressure - a) * b;
}

/**
 * Calculate gradient factor at current depth
 * 
 * GF interpolates linearly between GF_low (at first stop) and GF_high (at surface)
 * 
 * @param currentDepth - Current depth in meters
 * @param firstStopDepth - Depth of first decompression stop in meters
 * @param gfLow - Gradient factor low (0-100)
 * @param gfHigh - Gradient factor high (0-100)
 * @returns Current gradient factor (0-100)
 */
export function calculateCurrentGF(
  currentDepth: number,
  firstStopDepth: number,
  gfLow: number,
  gfHigh: number
): number {
  if (currentDepth >= firstStopDepth) {
    // At or below first stop, use GF_low
    return gfLow;
  }
  
  if (firstStopDepth === 0) {
    // No decompression required, use GF_high
    return gfHigh;
  }
  
  // Interpolate between GF_low and GF_high
  const depthFraction = currentDepth / firstStopDepth;
  return gfHigh + (gfLow - gfHigh) * depthFraction;
}

/**
 * Apply gradient factor to M-value
 * 
 * @param mValue - Original M-value
 * @param gradientFactor - Gradient factor (0-100)
 * @returns Adjusted M-value
 */
export function applyGradientFactor(mValue: number, gradientFactor: number): number {
  return mValue * (gradientFactor / 100);
}

/**
 * Calculate ceiling depth for a tissue compartment
 * 
 * The ceiling is the shallowest depth where tissue pressure equals adjusted M-value
 * 
 * @param tissue - Tissue compartment
 * @param gfLow - Gradient factor low
 * @param gfHigh - Gradient factor high
 * @param firstStopDepth - Depth of first stop (for GF interpolation)
 * @returns Ceiling depth in meters
 */
export function calculateCeiling(
  tissue: TissueCompartment,
  gfLow: number,
  gfHigh: number,
  firstStopDepth: number
): number {
  const totalInert = getTotalInertPressure(tissue);
  
  // Get combined M-value parameters (for mixed gases)
  const { a, b } = calculateCombinedMValueParams(tissue);
  
  // Calculate tolerated ambient pressure
  const toleratedPressure = calculateToleratedPressure(totalInert, a, b);
  
  // Apply gradient factor
  // At surface, use GF_high
  const gf = gfHigh / 100;
  const adjustedPressure = SURFACE_PRESSURE + (toleratedPressure - SURFACE_PRESSURE) * gf;
  
  // Convert to depth
  const ceiling = pressureToDepth(adjustedPressure);
  
  return Math.max(0, ceiling);
}

/**
 * Find the controlling tissue (tissue with highest ceiling)
 * 
 * @param tissues - Array of tissue compartments
 * @param gfLow - Gradient factor low
 * @param gfHigh - Gradient factor high
 * @param firstStopDepth - Depth of first stop
 * @returns Controlling tissue compartment
 */
export function findControllingTissue(
  tissues: TissueCompartment[],
  gfLow: number,
  gfHigh: number,
  firstStopDepth: number
): TissueCompartment {
  let maxCeiling = 0;
  let controllingTissue = tissues[0]!;
  
  for (const tissue of tissues) {
    const ceiling = calculateCeiling(tissue, gfLow, gfHigh, firstStopDepth);
    tissue.ceiling = ceiling;
    
    // Update M-value for display
    const { a, b } = calculateCombinedMValueParams(tissue);
    const ambientPressure = depthToPressure(ceiling);
    tissue.mValue = calculateMValue(ambientPressure, a, b);
    
    if (ceiling > maxCeiling) {
      maxCeiling = ceiling;
      controllingTissue = tissue;
    }
  }
  
  return controllingTissue;
}

/**
 * Check if ascent to target depth is safe
 * 
 * @param tissues - Array of tissue compartments
 * @param targetDepth - Target depth in meters
 * @param gfLow - Gradient factor low
 * @param gfHigh - Gradient factor high
 * @param firstStopDepth - Depth of first stop
 * @returns true if ascent is safe
 */
export function isAscentSafe(
  tissues: TissueCompartment[],
  targetDepth: number,
  gfLow: number,
  gfHigh: number,
  firstStopDepth: number
): boolean {
  const controlling = findControllingTissue(tissues, gfLow, gfHigh, firstStopDepth);
  return controlling.ceiling <= targetDepth;
}

/**
 * Calculate supersaturation percentage for a tissue
 * 
 * @param tissue - Tissue compartment
 * @param currentDepth - Current depth in meters
 * @returns Supersaturation percentage (0-100+)
 */
export function calculateSupersaturation(
  tissue: TissueCompartment,
  currentDepth: number
): number {
  const totalInert = getTotalInertPressure(tissue);
  const { a, b } = calculateCombinedMValueParams(tissue);
  const ambientPressure = depthToPressure(currentDepth);
  const mValue = calculateMValue(ambientPressure, a, b);
  
  if (mValue === 0) return 0;
  
  return (totalInert / mValue) * 100;
}

/**
 * Get tissue loading status
 * 
 * @param supersaturation - Supersaturation percentage
 * @returns Status: 'safe', 'caution', or 'danger'
 */
export function getTissueLoadingStatus(supersaturation: number): 'safe' | 'caution' | 'danger' {
  if (supersaturation < 70) return 'safe';
  if (supersaturation < 90) return 'caution';
  return 'danger';
}

/**
 * Calculate gradient factor percentage currently being used
 * 
 * @param tissue - Tissue compartment
 * @param currentDepth - Current depth in meters
 * @returns Current GF percentage being used
 */
export function calculateActualGF(
  tissue: TissueCompartment,
  currentDepth: number
): number {
  const totalInert = getTotalInertPressure(tissue);
  const { a, b } = calculateCombinedMValueParams(tissue);
  const ambientPressure = depthToPressure(currentDepth);
  const mValue = calculateMValue(ambientPressure, a, b);
  
  if (mValue === 0) return 0;
  
  const gf = ((totalInert - ambientPressure) / (mValue - ambientPressure)) * 100;
  return Math.max(0, Math.min(100, gf));
}

// Made with Bob
