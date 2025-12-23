/**
 * VPM-B Decompression Algorithm (Simplified)
 * 
 * Educational implementation that approximates VPM-B behavior
 * by modifying Bühlmann calculations to favor deeper stops
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
  updateTissuesChangingDepth,
  cloneTissues
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
  VPM_ADJUSTMENT_FACTORS,
  VPM_ASCENT_RATE,
  DEFAULT_CONSERVATISM
} from './constants';

/**
 * Calculate dive profile using VPM-B algorithm (simplified)
 * 
 * This is an educational approximation that:
 * 1. Uses Bühlmann tissue loading
 * 2. Adjusts first stop to be deeper
 * 3. Adds intermediate stops
 * 4. Increases time at deep stops
 * 5. Reduces time at shallow stops
 * 
 * @param parameters - Dive parameters
 * @returns Complete dive profile with VPM-B characteristics
 */
export function calculateVPMBProfile(parameters: DiveParameters): DiveProfile {
  const {
    depth,
    bottomTime,
    gasMix,
    gradientFactorLow,
    gradientFactorHigh
  } = parameters;
  
  // Initialize
  const tissues = initializeTissues();
  const stops: DecompressionStop[] = [];
  const warnings: Warning[] = [];
  
  // Add VPM-B info warning
  warnings.push({
    level: WarningLevel.INFO,
    message: 'VPM-B Model',
    details: 'Bubble model favoring deeper stops. Simplified implementation for educational purposes.'
  });
  
  // 1. Bottom phase - load tissues at depth
  updateTissuesConstantDepth(tissues, depth, bottomTime, gasMix);
  
  // 2. Find first stop depth using more conservative gradient factors
  // VPM-B typically starts deeper than Bühlmann
  let currentDepth = depth;
  const vpmGFLow = Math.max(20, gradientFactorLow - 10); // More conservative
  const vpmGFHigh = Math.max(70, gradientFactorHigh - 5);
  
  const controlling = findControllingTissue(tissues, vpmGFLow, vpmGFHigh, depth);
  let firstStopDepth = Math.ceil(controlling.ceiling / 3) * 3;
  
  // VPM-B adjustment: Add deeper first stop
  if (firstStopDepth > 0) {
    firstStopDepth = Math.min(
      depth - 3,
      firstStopDepth + VPM_ADJUSTMENT_FACTORS.FIRST_STOP_ADJUSTMENT
    );
  }
  
  // 3. Ascend to first stop
  let runtime = bottomTime;
  if (firstStopDepth > 0) {
    const ascentTime = (currentDepth - firstStopDepth) / VPM_ASCENT_RATE;
    updateTissuesChangingDepth(tissues, currentDepth, firstStopDepth, ascentTime, gasMix);
    runtime += ascentTime;
    currentDepth = firstStopDepth;
    
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Decompression required',
      details: 'VPM-B requires mandatory decompression stops with emphasis on deeper stops.'
    });
  }
  
  // 4. Calculate decompression stops with VPM-B characteristics
  const maxIterations = 1000;
  let iterations = 0;
  
  while (currentDepth > 0 && iterations < maxIterations) {
    iterations++;
    
    const controlling = findControllingTissue(tissues, vpmGFLow, vpmGFHigh, firstStopDepth);
    
    // Determine next depth
    let nextDepth: number;
    if (VPM_ADJUSTMENT_FACTORS.ADD_INTERMEDIATE_STOPS && currentDepth > 12) {
      // Add intermediate stops every 3m for deep stops
      nextDepth = Math.max(0, currentDepth - 3);
    } else {
      // Standard 3m intervals for shallow stops
      nextDepth = Math.max(0, currentDepth - 3);
    }
    
    if (isAscentSafe(tissues, nextDepth, vpmGFLow, vpmGFHigh, firstStopDepth)) {
      // Can ascend
      if (currentDepth === SAFETY_STOP_DEPTH + 3 && nextDepth < SAFETY_STOP_DEPTH) {
        // Add safety stop
        stops.push({
          depth: SAFETY_STOP_DEPTH,
          duration: SAFETY_STOP_TIME,
          runtime: runtime + SAFETY_STOP_TIME,
          gasMix: gasMix
        });
        
        updateTissuesConstantDepth(tissues, SAFETY_STOP_DEPTH, SAFETY_STOP_TIME, gasMix);
        runtime += SAFETY_STOP_TIME;
        currentDepth = SAFETY_STOP_DEPTH;
      } else {
        // Normal ascent
        const ascentTime = (currentDepth - nextDepth) / VPM_ASCENT_RATE;
        updateTissuesChangingDepth(tissues, currentDepth, nextDepth, ascentTime, gasMix);
        runtime += ascentTime;
        currentDepth = nextDepth;
      }
    } else {
      // Must stay at current depth
      let stopTime = VPM_ADJUSTMENT_FACTORS.MIN_STOP_TIME;
      
      // Apply VPM-B time adjustments
      if (currentDepth >= VPM_ADJUSTMENT_FACTORS.DEEP_STOP_THRESHOLD) {
        // Deep stop: increase time
        stopTime = Math.ceil(stopTime * VPM_ADJUSTMENT_FACTORS.DEEP_STOP_MULTIPLIER);
      } else {
        // Shallow stop: standard or slightly reduced time
        stopTime = Math.ceil(stopTime * VPM_ADJUSTMENT_FACTORS.SHALLOW_STOP_MULTIPLIER);
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
      details: 'Unable to calculate safe VPM-B decompression schedule.'
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
  warnings.push({
    level: WarningLevel.INFO,
    message: 'VPM-B Characteristics',
    details: `This profile emphasizes deeper stops to limit bubble growth. Expect ${stops.filter(s => s.depth >= 12).length} deep stops and longer overall decompression time compared to Bühlmann.`
  });
  
  return {
    parameters,
    decompressionStops: stops,
    totalDecompressionTime: totalDecoTime,
    totalDiveTime: runtime,
    noDecompressionLimit: 0, // VPM-B doesn't use NDL concept
    tissueCompartments: tissues,
    warnings,
    maxDepth: depth,
    averageDepth: depth,
    segments
  };
}

/**
 * Helper function to determine if a stop is "deep" for VPM-B purposes
 */
export function isDeepStop(depth: number): boolean {
  return depth >= VPM_ADJUSTMENT_FACTORS.DEEP_STOP_THRESHOLD;
}

/**
 * Helper function to calculate VPM-B conservatism adjustment
 */
export function calculateConservatismAdjustment(
  conservatism: number = DEFAULT_CONSERVATISM
): { gfLowAdjustment: number; gfHighAdjustment: number } {
  return {
    gfLowAdjustment: -conservatism * 2, // Lower GF Low
    gfHighAdjustment: -conservatism * 1  // Lower GF High
  };
}

// Made with Bob