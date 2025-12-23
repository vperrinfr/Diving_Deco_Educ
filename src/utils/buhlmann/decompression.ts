/**
 * Decompression Schedule Calculation
 *
 * Main algorithm for calculating decompression schedules
 */

import type {
  DiveParameters,
  DecompressionStop,
  DiveProfile,
  TissueCompartment,
  Warning,
  MultiLevelDiveParameters,
  GasSwitch,
  DiveSegment
} from '../../types';
import { WarningLevel } from '../../types';
import {
  ASCENT_RATE,
  SAFETY_STOP_DEPTH,
  SAFETY_STOP_TIME,
  MAX_RECREATIONAL_DEPTH,
  GAS_SWITCH_TIME
} from './constants';
import {
  initializeTissues,
  updateTissuesConstantDepth,
  updateTissuesChangingDepth,
  cloneTissues
} from './tissueLoading';
import {
  findControllingTissue,
  isAscentSafe
} from './gradientFactors';
import {
  isOxygenSafe,
  isNarcosisAcceptable,
  validateGasAtDepth,
  selectBestGas,
  areGasesEqual,
  isGasSwitchWorthwhile,
  formatGasMix
} from '../gasMix';

/**
 * Calculate complete dive profile with decompression schedule
 * 
 * @param parameters - Dive parameters
 * @returns Complete dive profile
 */
export function calculateDiveProfile(parameters: DiveParameters): DiveProfile {
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
  
  // Validate parameters
  validateDiveParameters(parameters, warnings);
  
  // 1. Bottom phase - load tissues at depth
  updateTissuesConstantDepth(tissues, depth, bottomTime, gasMix);
  
  // 2. Find first stop depth
  let currentDepth = depth;
  const controlling = findControllingTissue(tissues, gradientFactorLow, gradientFactorHigh, depth);
  let firstStopDepth = Math.ceil(controlling.ceiling / 3) * 3; // Round to 3m intervals
  
  // 3. Ascend to first stop (or surface if no deco required)
  if (firstStopDepth > 0) {
    // Decompression required
    const ascentTime = (currentDepth - firstStopDepth) / ASCENT_RATE;
    updateTissuesChangingDepth(tissues, currentDepth, firstStopDepth, ascentTime, gasMix);
    currentDepth = firstStopDepth;
    
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Decompression required',
      details: `This dive exceeds no-decompression limits. Mandatory decompression stops required.`
    });
  } else {
    // No decompression required, but add safety stop
    firstStopDepth = 0;
  }
  
  // 4. Calculate decompression stops
  let runtime = bottomTime;
  const maxIterations = 1000; // Prevent infinite loops
  let iterations = 0;
  
  while (currentDepth > 0 && iterations < maxIterations) {
    iterations++;
    
    const controlling = findControllingTissue(tissues, gradientFactorLow, gradientFactorHigh, firstStopDepth);
    
    // Check if we can ascend to next stop
    const nextDepth = Math.max(0, currentDepth - 3);
    
    if (isAscentSafe(tissues, nextDepth, gradientFactorLow, gradientFactorHigh, firstStopDepth)) {
      // Can ascend
      if (currentDepth === SAFETY_STOP_DEPTH + 3 && nextDepth < SAFETY_STOP_DEPTH) {
        // Add safety stop before final ascent
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
        const ascentTime = (currentDepth - nextDepth) / ASCENT_RATE;
        updateTissuesChangingDepth(tissues, currentDepth, nextDepth, ascentTime, gasMix);
        runtime += ascentTime;
        currentDepth = nextDepth;
      }
    } else {
      // Must stay at current depth
      const stopTime = 1; // 1 minute increment
      
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
      details: 'Unable to calculate safe decompression schedule. Dive may be too extreme.'
    });
  }
  
  // Calculate total decompression time
  const totalDecoTime = stops.reduce((sum, stop) => sum + stop.duration, 0);
  
  // Calculate NDL for this depth/gas
  const ndl = calculateNDL(depth, gasMix, gradientFactorHigh);
  
  // Add informational warnings
  if (bottomTime > ndl) {
    warnings.push({
      level: WarningLevel.INFO,
      message: 'No-decompression limit exceeded',
      details: `NDL for this depth is ${Math.round(ndl)} minutes. Bottom time: ${bottomTime} minutes.`
    });
  }
  
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
  
  return {
    parameters,
    decompressionStops: stops,
    totalDecompressionTime: totalDecoTime,
    totalDiveTime: runtime,
    noDecompressionLimit: ndl,
    tissueCompartments: tissues,
    warnings,
    maxDepth: depth,
    averageDepth: depth, // Simplified for single-level dive
    segments
  };
}

/**
 * Calculate no-decompression limit for given depth and gas
 * 
 * @param depth - Depth in meters
 * @param gasMix - Gas mix
 * @param gfHigh - Gradient factor high
 * @returns NDL in minutes
 */
export function calculateNDL(
  depth: number,
  gasMix: any,
  gfHigh: number
): number {
  const tissues = initializeTissues();
  const timeStep = 1; // 1 minute increments
  let time = 0;
  const maxTime = 300; // Max 5 hours
  
  while (time < maxTime) {
    // Update tissues
    updateTissuesConstantDepth(tissues, depth, timeStep, gasMix);
    time += timeStep;
    
    // Check if we can still ascend directly to surface
    if (!isAscentSafe(tissues, 0, gfHigh, gfHigh, 0)) {
      return time - timeStep; // Return last safe time
    }
  }
  
  return maxTime;
}

/**
 * Validate dive parameters and add warnings
 * 
 * @param parameters - Dive parameters
 * @param warnings - Array to add warnings to
 */
function validateDiveParameters(parameters: DiveParameters, warnings: Warning[]): void {
  const { depth, bottomTime, gasMix } = parameters;
  
  // Check depth limits
  if (depth > MAX_RECREATIONAL_DEPTH) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Depth exceeds recreational limit',
      details: `Maximum recreational depth is ${MAX_RECREATIONAL_DEPTH}m. Current depth: ${depth}m.`
    });
  }
  
  // Check oxygen toxicity
  if (!isOxygenSafe(depth, gasMix, false)) {
    warnings.push({
      level: WarningLevel.DANGER,
      message: 'Oxygen toxicity risk',
      details: 'PPO2 exceeds safe limits for this depth and gas mix.'
    });
  }
  
  // Check nitrogen narcosis
  if (!isNarcosisAcceptable(depth, gasMix)) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Nitrogen narcosis risk',
      details: 'Equivalent narcotic depth exceeds recommended limits.'
    });
  }
  
  // Check reasonable bottom time
  if (bottomTime < 1) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Invalid bottom time',
      details: 'Bottom time must be at least 1 minute.'
    });
  }
  
  if (bottomTime > 200) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Excessive bottom time',
      details: 'Bottom time exceeds reasonable limits for recreational diving.'
    });
  }
}

/**
 * Compare two dive profiles with different gradient factors
 * 
 * @param parameters - Base dive parameters
 * @param gfLow1 - First GF low
 * @param gfHigh1 - First GF high
 * @param gfLow2 - Second GF low
 * @param gfHigh2 - Second GF high
 * @returns Two dive profiles for comparison
 */
export function compareGradientFactors(
  parameters: DiveParameters,
  gfLow1: number,
  gfHigh1: number,
  gfLow2: number,
  gfHigh2: number
): { profile1: DiveProfile; profile2: DiveProfile } {
  const params1 = { ...parameters, gradientFactorLow: gfLow1, gradientFactorHigh: gfHigh1 };
  const params2 = { ...parameters, gradientFactorLow: gfLow2, gradientFactorHigh: gfHigh2 };
  
  return {
    profile1: calculateDiveProfile(params1),
    profile2: calculateDiveProfile(params2)
  };
}

/**
 * Calculate surface interval required before next dive
 * 
 * @param tissues - Tissue compartments after dive
 * @returns Recommended surface interval in minutes
 */
export function calculateSurfaceInterval(tissues: TissueCompartment[]): number {
  // Simplified: recommend time for slowest tissue to off-gas to 50% saturation
  const slowestTissue = tissues[tissues.length - 1]!;
  const currentPressure = slowestTissue.n2Pressure;
  const surfacePressure = 0.79 * 1.01325; // N2 at surface
  const targetPressure = surfacePressure + (currentPressure - surfacePressure) * 0.5;
  
  // Calculate time using half-time
  const ratio = (currentPressure - surfacePressure) / (targetPressure - surfacePressure);
  const halfTimes = Math.log(ratio) / Math.LN2;
  
  return Math.ceil(halfTimes * slowestTissue.n2HalfTime);
}
/**
 * Calculate multi-level dive profile with multiple gases
 * 
 * @param parameters - Multi-level dive parameters
 * @returns Complete dive profile with gas switches
 */
export function calculateMultiLevelDiveProfile(
  parameters: MultiLevelDiveParameters
): DiveProfile {
  const {
    segments,
    gasInventory,
    gradientFactorLow,
    gradientFactorHigh,
    descentRate,
    ascentRate
  } = parameters;
  
  // Initialize
  const tissues = initializeTissues();
  const stops: DecompressionStop[] = [];
  const warnings: Warning[] = [];
  const gasSwitches: GasSwitch[] = [];
  const processedSegments: DiveSegment[] = [];
  
  // Validate segments
  if (segments.length === 0) {
    warnings.push({
      level: WarningLevel.DANGER,
      message: 'No dive segments defined',
      details: 'At least one dive segment is required.'
    });
    return createEmptyProfile(parameters, warnings);
  }
  
  // Process each segment
  let runtime = 0;
  let currentDepth = 0;
  let currentGas = gasInventory.bottomGas;
  let maxDepth = 0;
  let totalDepthTime = 0; // For average depth calculation
  
  for (const segment of segments) {
    // Validate segment
    const segmentValidation = validateGasAtDepth(segment.gasMix, segment.depth, false);
    warnings.push(...segmentValidation.warnings);
    
    // Descend to segment depth
    if (segment.depth > currentDepth) {
      const descentTime = (segment.depth - currentDepth) / descentRate;
      updateTissuesChangingDepth(
        tissues,
        currentDepth,
        segment.depth,
        descentTime,
        currentGas
      );
      runtime += descentTime;
      
      processedSegments.push({
        depth: segment.depth,
        duration: descentTime,
        gasMix: currentGas,
        segmentType: 'descent'
      });
    } else if (segment.depth < currentDepth) {
      // Ascending between segments (unusual but possible)
      const ascentTime = (currentDepth - segment.depth) / ascentRate;
      updateTissuesChangingDepth(
        tissues,
        currentDepth,
        segment.depth,
        ascentTime,
        currentGas
      );
      runtime += ascentTime;
      
      processedSegments.push({
        depth: segment.depth,
        duration: ascentTime,
        gasMix: currentGas,
        segmentType: 'ascent'
      });
    }
    
    // Stay at segment depth for specified duration
    updateTissuesConstantDepth(tissues, segment.depth, segment.duration, currentGas);
    runtime += segment.duration;
    totalDepthTime += segment.depth * segment.duration;
    
    processedSegments.push({
      depth: segment.depth,
      duration: segment.duration,
      gasMix: currentGas,
      segmentType: 'bottom'
    });
    
    currentDepth = segment.depth;
    maxDepth = Math.max(maxDepth, segment.depth);
  }
  
  // Calculate average depth
  const totalBottomTime = segments.reduce((sum, seg) => sum + seg.duration, 0);
  const averageDepth = totalBottomTime > 0 ? totalDepthTime / totalBottomTime : 0;
  
  // Find first stop depth
  const controlling = findControllingTissue(tissues, gradientFactorLow, gradientFactorHigh, maxDepth);
  let firstStopDepth = Math.ceil(controlling.ceiling / 3) * 3;
  
  // Ascend with gas switching
  if (firstStopDepth > 0) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Decompression required',
      details: `This dive exceeds no-decompression limits. Mandatory decompression stops required.`
    });
    
    // Ascend to first stop
    const ascentTime = (currentDepth - firstStopDepth) / ascentRate;
    updateTissuesChangingDepth(tissues, currentDepth, firstStopDepth, ascentTime, currentGas);
    runtime += ascentTime;
    currentDepth = firstStopDepth;
  } else {
    firstStopDepth = 0;
  }
  
  // Calculate decompression stops with automatic gas switching
  const maxIterations = 1000;
  let iterations = 0;
  
  while (currentDepth > 0 && iterations < maxIterations) {
    iterations++;
    
    // Check for optimal gas switch
    const bestGas = selectBestGas(currentDepth, gasInventory, true);
    if (!areGasesEqual(bestGas, currentGas)) {
      // Check if switch is worthwhile
      const estimatedRemainingTime = stops.length > 0 ? 5 : 10; // Rough estimate
      if (isGasSwitchWorthwhile(currentGas, bestGas, currentDepth, estimatedRemainingTime)) {
        // Perform gas switch
        const gasSwitch: GasSwitch = {
          depth: currentDepth,
          fromGas: currentGas,
          toGas: bestGas,
          reason: 'optimal'
        };
        gasSwitches.push(gasSwitch);
        
        // Spend time switching gas
        updateTissuesConstantDepth(tissues, currentDepth, GAS_SWITCH_TIME, currentGas);
        runtime += GAS_SWITCH_TIME;
        
        currentGas = bestGas;
        
        warnings.push({
          level: WarningLevel.INFO,
          message: `Gas switch at ${currentDepth}m`,
          details: `Switching from ${formatGasMix(gasSwitch.fromGas)} to ${formatGasMix(gasSwitch.toGas)}`
        });
      }
    }
    
    const controlling = findControllingTissue(tissues, gradientFactorLow, gradientFactorHigh, firstStopDepth);
    const nextDepth = Math.max(0, currentDepth - 3);
    
    if (isAscentSafe(tissues, nextDepth, gradientFactorLow, gradientFactorHigh, firstStopDepth)) {
      // Can ascend
      if (currentDepth === SAFETY_STOP_DEPTH + 3 && nextDepth < SAFETY_STOP_DEPTH) {
        // Add safety stop
        stops.push({
          depth: SAFETY_STOP_DEPTH,
          duration: SAFETY_STOP_TIME,
          runtime: runtime + SAFETY_STOP_TIME,
          gasMix: currentGas
        });
        
        updateTissuesConstantDepth(tissues, SAFETY_STOP_DEPTH, SAFETY_STOP_TIME, currentGas);
        runtime += SAFETY_STOP_TIME;
        currentDepth = SAFETY_STOP_DEPTH;
      } else {
        // Normal ascent
        const ascentTime = (currentDepth - nextDepth) / ascentRate;
        updateTissuesChangingDepth(tissues, currentDepth, nextDepth, ascentTime, currentGas);
        runtime += ascentTime;
        currentDepth = nextDepth;
      }
    } else {
      // Must stay at current depth
      const stopTime = 1;
      
      const lastStop = stops[stops.length - 1];
      if (lastStop && lastStop.depth === currentDepth && areGasesEqual(lastStop.gasMix, currentGas)) {
        lastStop.duration += stopTime;
        lastStop.runtime += stopTime;
      } else {
        const newStop: DecompressionStop = {
          depth: currentDepth,
          duration: stopTime,
          runtime: runtime + stopTime,
          gasMix: currentGas
        };
        
        // Add gas switch info if this is the first stop with new gas
        if (gasSwitches.length > 0) {
          const lastSwitch = gasSwitches[gasSwitches.length - 1];
          if (lastSwitch && lastSwitch.depth === currentDepth && !lastStop) {
            newStop.gasSwitch = lastSwitch;
          }
        }
        
        stops.push(newStop);
      }
      
      updateTissuesConstantDepth(tissues, currentDepth, stopTime, currentGas);
      runtime += stopTime;
    }
  }
  
  if (iterations >= maxIterations) {
    warnings.push({
      level: WarningLevel.DANGER,
      message: 'Calculation error',
      details: 'Unable to calculate safe decompression schedule. Dive may be too extreme.'
    });
  }
  
  // Add decompression stops as segments for air consumption calculation
  stops.forEach(stop => {
    processedSegments.push({
      depth: stop.depth,
      duration: stop.duration,
      gasMix: stop.gasMix,
      segmentType: 'deco'
    });
  });
  
  const totalDecoTime = stops.reduce((sum, stop) => sum + stop.duration, 0);
  const ndl = calculateNDL(maxDepth, gasInventory.bottomGas, gradientFactorHigh);
  
  return {
    parameters,
    decompressionStops: stops,
    totalDecompressionTime: totalDecoTime,
    totalDiveTime: runtime,
    noDecompressionLimit: ndl,
    tissueCompartments: tissues,
    warnings,
    maxDepth,
    averageDepth,
    gasSwitches,
    segments: processedSegments
  };
}

/**
 * Create empty profile for error cases
 */
function createEmptyProfile(
  parameters: MultiLevelDiveParameters,
  warnings: Warning[]
): DiveProfile {
  return {
    parameters,
    decompressionStops: [],
    totalDecompressionTime: 0,
    totalDiveTime: 0,
    noDecompressionLimit: 0,
    tissueCompartments: initializeTissues(),
    warnings,
    maxDepth: 0,
    averageDepth: 0,
    gasSwitches: [],
    segments: []
  };
}


// Made with Bob
