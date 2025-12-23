/**
 * RGBM Decompression Algorithm (Simplified)
 * 
 * Educational implementation that approximates RGBM behavior
 * Combines dissolved gas model with bubble mechanics
 */

import type {
  DiveParameters,
  DecompressionStop,
  DiveProfile,
  TissueCompartment,
  Warning,
  DiveSegment
} from '../../types';
import { WarningLevel } from '../../types';
import {
  initializeTissues,
  updateTissuesConstantDepth,
  updateTissuesChangingDepth
} from '../buhlmann/tissueLoading';
import {
  findControllingTissue,
  isAscentSafe
} from '../buhlmann/gradientFactors';
import {
  SAFETY_STOP_DEPTH,
  SAFETY_STOP_TIME
} from '../buhlmann/constants';
import {
  RGBM_GRADIENT_FACTORS,
  RGBM_ASCENT_RATE,
  RGBM_ADJUSTMENT_FACTORS,
  calculateRepetitivePenalty,
  calculateBubbleGrowthFactor
} from './constants';

/**
 * RGBM-specific parameters
 */
export interface RGBMParameters extends DiveParameters {
  previousDives?: number;
  surfaceInterval?: number; // minutes
}

/**
 * Calculate dive profile using RGBM algorithm (simplified)
 * 
 * This is an educational approximation that:
 * 1. Uses very conservative gradient factors (30/70)
 * 2. Adds penalties for repetitive dives
 * 3. Emphasizes deep stops
 * 4. Combines dissolved gas and bubble models
 * 
 * @param parameters - Dive parameters with RGBM-specific options
 * @returns Complete dive profile with RGBM characteristics
 */
export function calculateRGBMProfile(parameters: RGBMParameters): DiveProfile {
  const {
    depth,
    bottomTime,
    gasMix,
    previousDives = 0,
    surfaceInterval = 0
  } = parameters;
  
  // Initialize
  const tissues = initializeTissues();
  const stops: DecompressionStop[] = [];
  const warnings: Warning[] = [];
  
  // Add RGBM info warning
  warnings.push({
    level: WarningLevel.INFO,
    message: 'RGBM Model',
    details: 'Hybrid model combining dissolved gas and bubble mechanics. Very conservative approach.'
  });
  
  // Calculate penalties
  const repetitivePenalty = calculateRepetitivePenalty(previousDives, surfaceInterval);
  const bubbleGrowthFactor = calculateBubbleGrowthFactor(depth, bottomTime, previousDives);
  
  if (repetitivePenalty > 1.0) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Repetitive Dive Penalty',
      details: `RGBM applies ${Math.round((repetitivePenalty - 1) * 100)}% penalty for repetitive diving. Longer decompression required.`
    });
  }
  
  // 1. Bottom phase - load tissues at depth
  // Apply repetitive penalty by extending effective bottom time
  const effectiveBottomTime = bottomTime * repetitivePenalty;
  updateTissuesConstantDepth(tissues, depth, effectiveBottomTime, gasMix);
  
  // 2. Find first stop depth using RGBM gradient factors
  let currentDepth = depth;
  const rgbmGFLow = RGBM_GRADIENT_FACTORS.LOW;
  const rgbmGFHigh = RGBM_GRADIENT_FACTORS.HIGH;
  
  const controlling = findControllingTissue(tissues, rgbmGFLow, rgbmGFHigh, depth);
  let firstStopDepth = Math.ceil(controlling.ceiling / 3) * 3;
  
  // RGBM adjustment: Add deeper first stop
  if (firstStopDepth > 0) {
    firstStopDepth = Math.min(
      depth - 3,
      firstStopDepth + RGBM_ADJUSTMENT_FACTORS.FIRST_STOP_ADJUSTMENT
    );
  }
  
  // 3. Ascend to first stop
  let runtime = bottomTime; // Use actual bottom time for runtime
  if (firstStopDepth > 0) {
    const ascentTime = (currentDepth - firstStopDepth) / RGBM_ASCENT_RATE;
    updateTissuesChangingDepth(tissues, currentDepth, firstStopDepth, ascentTime, gasMix);
    runtime += ascentTime;
    currentDepth = firstStopDepth;
    
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Decompression required',
      details: 'RGBM requires mandatory decompression stops. Model accounts for both dissolved gas and bubble formation.'
    });
  }
  
  // 4. Calculate decompression stops with RGBM characteristics
  const maxIterations = 1000;
  let iterations = 0;
  
  while (currentDepth > 0 && iterations < maxIterations) {
    iterations++;
    
    const controlling = findControllingTissue(tissues, rgbmGFLow, rgbmGFHigh, firstStopDepth);
    
    // Determine next depth
    const nextDepth = Math.max(0, currentDepth - RGBM_ADJUSTMENT_FACTORS.INTERMEDIATE_STOP_INTERVAL);
    
    if (isAscentSafe(tissues, nextDepth, rgbmGFLow, rgbmGFHigh, firstStopDepth)) {
      // Can ascend
      if (currentDepth === SAFETY_STOP_DEPTH + 3 && nextDepth < SAFETY_STOP_DEPTH) {
        // Add extended safety stop (RGBM is conservative)
        const extendedSafetyStopTime = Math.ceil(SAFETY_STOP_TIME * 1.5);
        stops.push({
          depth: SAFETY_STOP_DEPTH,
          duration: extendedSafetyStopTime,
          runtime: runtime + extendedSafetyStopTime,
          gasMix: gasMix
        });
        
        updateTissuesConstantDepth(tissues, SAFETY_STOP_DEPTH, extendedSafetyStopTime, gasMix);
        runtime += extendedSafetyStopTime;
        currentDepth = SAFETY_STOP_DEPTH;
      } else {
        // Normal ascent
        const ascentTime = (currentDepth - nextDepth) / RGBM_ASCENT_RATE;
        updateTissuesChangingDepth(tissues, currentDepth, nextDepth, ascentTime, gasMix);
        runtime += ascentTime;
        currentDepth = nextDepth;
      }
    } else {
      // Must stay at current depth
      let stopTime = RGBM_ADJUSTMENT_FACTORS.MIN_STOP_TIME;
      
      // Apply RGBM time adjustments
      if (currentDepth >= RGBM_ADJUSTMENT_FACTORS.DEEP_STOP_THRESHOLD) {
        // Deep stop: increase time significantly
        stopTime = Math.ceil(stopTime * RGBM_ADJUSTMENT_FACTORS.DEEP_STOP_MULTIPLIER * bubbleGrowthFactor);
      } else {
        // Shallow stop: apply bubble growth factor
        stopTime = Math.ceil(stopTime * bubbleGrowthFactor);
      }
      
      // Consolidate with previous stop if at same depth
      const lastStop = stops[stops.length - 1];
      if (lastStop && lastStop.depth === currentDepth) {
        lastStop.duration += stopTime;
        lastStop.runtime += stopTime;
      } else {
        stops.push({
          depth: currentDepth,
          duration: stopTime,
          runtime: runtime + stopTime,
          gasMix: gasMix
        });
      }
      
      updateTissuesConstantDepth(tissues, currentDepth, stopTime, gasMix);
      runtime += stopTime;
    }
  }
  
  if (iterations >= maxIterations) {
    warnings.push({
      level: WarningLevel.DANGER,
      message: 'Calculation error',
      details: 'Unable to calculate safe RGBM decompression schedule.'
    });
  }
  
  // Calculate total decompression time
  const totalDecoTime = stops.reduce((sum, stop) => sum + stop.duration, 0);
  
  // Create segments for air consumption calculation
  const segments: DiveSegment[] = [];
  
  // Add bottom segment
  segments.push({
    depth: depth,
    duration: bottomTime,
    gasMix: gasMix,
    segmentType: 'bottom'
  });
  
  // Add decompression stops as segments
  stops.forEach(stop => {
    segments.push({
      depth: stop.depth,
      duration: stop.duration,
      gasMix: stop.gasMix,
      segmentType: 'deco'
    });
  });
  
  // Add comparison info
  const deepStops = stops.filter(s => s.depth >= RGBM_ADJUSTMENT_FACTORS.DEEP_STOP_THRESHOLD).length;
  warnings.push({
    level: WarningLevel.INFO,
    message: 'RGBM Characteristics',
    details: `This profile uses very conservative gradient factors (${rgbmGFLow}/${rgbmGFHigh}) and includes ${deepStops} deep stops. RGBM accounts for bubble formation and growth.`
  });
  
  return {
    parameters,
    decompressionStops: stops,
    totalDecompressionTime: totalDecoTime,
    totalDiveTime: runtime,
    noDecompressionLimit: 0, // RGBM doesn't use traditional NDL
    tissueCompartments: tissues,
    warnings,
    maxDepth: depth,
    averageDepth: depth,
    segments
  };
}

/**
 * Helper function to determine if RGBM penalties should apply
 */
export function shouldApplyRGBMPenalties(
  previousDives: number,
  surfaceInterval: number
): boolean {
  return previousDives > 0 || surfaceInterval < 180;
}

/**
 * Helper function to calculate recommended surface interval for RGBM
 */
export function calculateRecommendedSurfaceInterval(
  previousDives: number,
  maxDepth: number
): number {
  // RGBM recommends longer surface intervals
  const baseInterval = 180; // 3 hours
  const depthFactor = maxDepth > 30 ? 1.5 : 1.0;
  const diveFactor = 1 + (previousDives * 0.2);
  
  return Math.ceil(baseInterval * depthFactor * diveFactor);
}

// Made with Bob