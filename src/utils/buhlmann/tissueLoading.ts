/**
 * Tissue Loading Calculations
 * 
 * Implementation of the Schreiner equation for tissue inert gas loading
 */

import type { TissueCompartment, GasMix } from '../../types';
import {
  ZHL16C_N2_HALFTIMES,
  ZHL16C_HE_HALFTIMES,
  ZHL16C_N2_A,
  ZHL16C_N2_B,
  ZHL16C_HE_A,
  ZHL16C_HE_B,
  COMPARTMENT_COUNT,
  SURFACE_PRESSURE
} from './constants';
import { inspiredPressure } from '../gasMix';
import { depthToPressure } from '../conversions';

/**
 * Initialize tissue compartments at surface pressure
 * 
 * @param surfaceGasMix - Gas mix at surface (default: air)
 * @returns Array of initialized tissue compartments
 */
export function initializeTissues(surfaceGasMix?: GasMix): TissueCompartment[] {
  const tissues: TissueCompartment[] = [];
  
  // Default to air at surface
  const gasMix = surfaceGasMix || {
    oxygen: 0.21,
    nitrogen: 0.79,
    helium: 0
  };
  
  const surfaceN2Pressure = inspiredPressure(SURFACE_PRESSURE, gasMix.nitrogen);
  
  for (let i = 0; i < COMPARTMENT_COUNT; i++) {
    tissues.push({
      number: i + 1,
      n2Pressure: surfaceN2Pressure,
      hePressure: 0,
      n2HalfTime: ZHL16C_N2_HALFTIMES[i]!,
      heHalfTime: ZHL16C_HE_HALFTIMES[i]!,
      a: ZHL16C_N2_A[i]!,
      b: ZHL16C_N2_B[i]!,
      ceiling: 0,
      mValue: 0
    });
  }
  
  return tissues;
}

/**
 * Calculate tissue pressure after time at constant depth (Schreiner equation)
 * 
 * Formula: P_tissue = P_inspired + (P_initial - P_inspired) * e^(-k*t)
 * 
 * @param initialPressure - Initial tissue pressure
 * @param inspiredPressure - Inspired inert gas pressure
 * @param halfTime - Tissue half-time in minutes
 * @param time - Time at depth in minutes
 * @returns New tissue pressure
 */
export function calculateTissuePressure(
  initialPressure: number,
  inspiredPressure: number,
  halfTime: number,
  time: number
): number {
  const k = Math.LN2 / halfTime;
  return inspiredPressure + (initialPressure - inspiredPressure) * Math.exp(-k * time);
}

/**
 * Calculate tissue pressure during depth change (Haldane equation)
 * 
 * Formula: P_tissue = P_i0 + R * (t - 1/k) - (P_i0 - P_initial - R/k) * e^(-k*t)
 * 
 * @param initialPressure - Initial tissue pressure
 * @param initialInspiredPressure - Initial inspired pressure
 * @param finalInspiredPressure - Final inspired pressure
 * @param halfTime - Tissue half-time in minutes
 * @param time - Time for depth change in minutes
 * @returns New tissue pressure
 */
export function calculateTissuePressureChangingDepth(
  initialPressure: number,
  initialInspiredPressure: number,
  finalInspiredPressure: number,
  halfTime: number,
  time: number
): number {
  const k = Math.LN2 / halfTime;
  const R = (finalInspiredPressure - initialInspiredPressure) / time;
  
  return initialInspiredPressure + 
         R * (time - 1/k) - 
         (initialInspiredPressure - initialPressure - R/k) * Math.exp(-k * time);
}

/**
 * Update all tissue compartments for constant depth segment
 * 
 * @param tissues - Array of tissue compartments
 * @param depth - Depth in meters
 * @param duration - Duration in minutes
 * @param gasMix - Gas mix being breathed
 */
export function updateTissuesConstantDepth(
  tissues: TissueCompartment[],
  depth: number,
  duration: number,
  gasMix: GasMix
): void {
  const ambientPressure = depthToPressure(depth);
  const inspiredN2 = inspiredPressure(ambientPressure, gasMix.nitrogen);
  const inspiredHe = inspiredPressure(ambientPressure, gasMix.helium);
  
  for (const tissue of tissues) {
    // Update nitrogen loading
    tissue.n2Pressure = calculateTissuePressure(
      tissue.n2Pressure,
      inspiredN2,
      tissue.n2HalfTime,
      duration
    );
    
    // Update helium loading (if present)
    if (gasMix.helium > 0) {
      tissue.hePressure = calculateTissuePressure(
        tissue.hePressure,
        inspiredHe,
        tissue.heHalfTime,
        duration
      );
    }
  }
}

/**
 * Update all tissue compartments during depth change
 * 
 * @param tissues - Array of tissue compartments
 * @param startDepth - Starting depth in meters
 * @param endDepth - Ending depth in meters
 * @param duration - Duration of depth change in minutes
 * @param gasMix - Gas mix being breathed
 */
export function updateTissuesChangingDepth(
  tissues: TissueCompartment[],
  startDepth: number,
  endDepth: number,
  duration: number,
  gasMix: GasMix
): void {
  const startPressure = depthToPressure(startDepth);
  const endPressure = depthToPressure(endDepth);
  
  const startInspiredN2 = inspiredPressure(startPressure, gasMix.nitrogen);
  const endInspiredN2 = inspiredPressure(endPressure, gasMix.nitrogen);
  
  const startInspiredHe = inspiredPressure(startPressure, gasMix.helium);
  const endInspiredHe = inspiredPressure(endPressure, gasMix.helium);
  
  for (const tissue of tissues) {
    // Update nitrogen
    tissue.n2Pressure = calculateTissuePressureChangingDepth(
      tissue.n2Pressure,
      startInspiredN2,
      endInspiredN2,
      tissue.n2HalfTime,
      duration
    );
    
    // Update helium (if present)
    if (gasMix.helium > 0) {
      tissue.hePressure = calculateTissuePressureChangingDepth(
        tissue.hePressure,
        startInspiredHe,
        endInspiredHe,
        tissue.heHalfTime,
        duration
      );
    }
  }
}

/**
 * Get total inert gas pressure in a tissue compartment
 * 
 * @param tissue - Tissue compartment
 * @returns Total inert gas pressure (N2 + He)
 */
export function getTotalInertPressure(tissue: TissueCompartment): number {
  return tissue.n2Pressure + tissue.hePressure;
}

/**
 * Calculate combined M-value parameters for mixed inert gases
 * 
 * When both nitrogen and helium are present, we need to calculate
 * combined a and b coefficients based on their relative pressures
 * 
 * @param tissue - Tissue compartment
 * @returns Combined {a, b} coefficients
 */
export function calculateCombinedMValueParams(tissue: TissueCompartment): { a: number; b: number } {
  const totalInert = getTotalInertPressure(tissue);
  
  if (totalInert === 0) {
    return { a: tissue.a, b: tissue.b };
  }
  
  // Get helium parameters for this compartment
  const heA = ZHL16C_HE_A[tissue.number - 1]!;
  const heB = ZHL16C_HE_B[tissue.number - 1]!;
  
  // Weight by relative pressures
  const n2Fraction = tissue.n2Pressure / totalInert;
  const heFraction = tissue.hePressure / totalInert;
  
  const combinedA = (tissue.a * n2Fraction) + (heA * heFraction);
  const combinedB = (tissue.b * n2Fraction) + (heB * heFraction);
  
  return { a: combinedA, b: combinedB };
}

/**
 * Clone tissue compartments for comparison or backup
 * 
 * @param tissues - Tissue compartments to clone
 * @returns Deep copy of tissue compartments
 */
export function cloneTissues(tissues: TissueCompartment[]): TissueCompartment[] {
  return tissues.map(tissue => ({ ...tissue }));
}

// Made with Bob
