/**
 * Repetitive Dive Service
 * 
 * Handles calculations for multiple dives per day including:
 * - Residual nitrogen tracking
 * - Surface interval calculations
 * - Pressure group assignments
 * - No-fly time calculations
 * - Dive sequence validation
 */

import type {
  RepetitiveDive,
  DiveDayPlan,
  SurfaceIntervalResult,
  DesaturationPoint,
  RepetitiveDiveValidation,
  DiveSequenceValidation,
  NoFlyTimeResult,
  RepetitiveDiveRules,
  PressureGroup
} from '../types/repetitiveDive';
import type { TissueCompartment, DiveProfile, DiveParameters, Warning, GasMix } from '../types';
import { WarningLevel } from '../types';
import { PRESSURE_GROUP_THRESHOLDS, DEFAULT_REPETITIVE_RULES } from '../types/repetitiveDive';
import { cloneTissues, updateTissuesConstantDepth } from '../utils/buhlmann/tissueLoading';
import { calculateDiveProfile } from '../utils/buhlmann/decompression';
import { SURFACE_PRESSURE } from '../utils/buhlmann/constants';
import { inspiredPressure } from '../utils/gasMix';

/**
 * Calculate pressure group based on tissue loading
 */
export function calculatePressureGroup(tissues: TissueCompartment[]): PressureGroup {
  // Find maximum tissue loading as percentage of M-value
  let maxLoading = 0;
  
  for (const tissue of tissues) {
    const totalInert = tissue.n2Pressure + tissue.hePressure;
    const loading = totalInert / tissue.mValue;
    maxLoading = Math.max(maxLoading, loading);
  }
  
  // Map to pressure group
  const groups: PressureGroup[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]!;
    if (maxLoading >= PRESSURE_GROUP_THRESHOLDS[group]) {
      return group;
    }
  }
  
  return 'A'; // Minimal loading
}

/**
 * Calculate residual nitrogen after surface interval
 */
export function calculateResidualNitrogen(
  tissues: TissueCompartment[],
  surfaceInterval: number,
  surfaceGas: GasMix = { oxygen: 0.21, nitrogen: 0.79, helium: 0 }
): TissueCompartment[] {
  const residualTissues = cloneTissues(tissues);
  
  // Off-gas at surface for the interval duration
  updateTissuesConstantDepth(residualTissues, 0, surfaceInterval, surfaceGas);
  
  return residualTissues;
}

/**
 * Calculate surface interval needed to reach target pressure group
 */
export function calculateSurfaceInterval(
  tissues: TissueCompartment[],
  targetPressureGroup: PressureGroup = 'D',
  rules: RepetitiveDiveRules = DEFAULT_REPETITIVE_RULES
): SurfaceIntervalResult {
  const warnings: Warning[] = [];
  const surfaceGas: GasMix = { oxygen: 0.21, nitrogen: 0.79, helium: 0 };
  
  // Calculate minimum interval (to reach safe levels)
  let minInterval = 0;
  let currentTissues = cloneTissues(tissues);
  const timeStep = 5; // 5-minute increments
  const maxTime = 1440; // 24 hours max
  
  // Find minimum time to reach target pressure group
  while (minInterval < maxTime) {
    const currentGroup = calculatePressureGroup(currentTissues);
    const currentGroupIndex = Object.keys(PRESSURE_GROUP_THRESHOLDS).indexOf(currentGroup);
    const targetGroupIndex = Object.keys(PRESSURE_GROUP_THRESHOLDS).indexOf(targetPressureGroup);
    
    if (currentGroupIndex <= targetGroupIndex) {
      break;
    }
    
    updateTissuesConstantDepth(currentTissues, 0, timeStep, surfaceGas);
    minInterval += timeStep;
  }
  
  // Apply rules
  const absoluteMin = Math.max(minInterval, rules.minSurfaceInterval);
  const recommended = Math.max(absoluteMin, rules.recommendedSurfaceInterval);
  
  // Calculate optimal (50% desaturation of slowest tissue)
  const slowestTissue = tissues[tissues.length - 1]!;
  const surfaceN2 = inspiredPressure(SURFACE_PRESSURE, surfaceGas.nitrogen);
  const currentN2 = slowestTissue.n2Pressure;
  const targetN2 = surfaceN2 + (currentN2 - surfaceN2) * 0.5;
  
  const ratio = (currentN2 - surfaceN2) / (targetN2 - surfaceN2);
  const halfTimes = Math.log(ratio) / Math.LN2;
  const optimal = Math.ceil(halfTimes * slowestTissue.n2HalfTime);
  
  // Calculate desaturation percentage
  const residualTissues = calculateResidualNitrogen(tissues, recommended, surfaceGas);
  const initialLoad = calculateMaxTissueLoading(tissues);
  const finalLoad = calculateMaxTissueLoading(residualTissues);
  const desaturation = 1 - (finalLoad / initialLoad);
  
  // Add warnings
  if (absoluteMin < rules.minSurfaceInterval) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Short surface interval',
      details: `Minimum recommended surface interval is ${rules.minSurfaceInterval} minutes.`
    });
  }
  
  if (minInterval > 360) {
    warnings.push({
      level: WarningLevel.INFO,
      message: 'Extended surface interval required',
      details: `Significant residual nitrogen requires ${Math.round(minInterval / 60)} hours surface interval.`
    });
  }
  
  return {
    minimumInterval: absoluteMin,
    recommendedInterval: recommended,
    optimalInterval: Math.max(optimal, recommended),
    currentDesaturation: desaturation,
    pressureGroupAfterInterval: calculatePressureGroup(residualTissues),
    residualTissues,
    warnings
  };
}

/**
 * Calculate desaturation curve over time
 */
export function calculateDesaturationCurve(
  tissues: TissueCompartment[],
  duration: number = 360 // 6 hours default
): DesaturationPoint[] {
  const points: DesaturationPoint[] = [];
  const surfaceGas: GasMix = { oxygen: 0.21, nitrogen: 0.79, helium: 0 };
  const timeStep = 5; // 5-minute intervals
  
  let currentTissues = cloneTissues(tissues);
  const initialLoad = calculateMaxTissueLoading(tissues);
  
  for (let time = 0; time <= duration; time += timeStep) {
    const currentLoad = calculateMaxTissueLoading(currentTissues);
    const controllingTissue = findControllingTissueNumber(currentTissues);
    
    points.push({
      time,
      nitrogenLoad: currentLoad / initialLoad,
      pressureGroup: calculatePressureGroup(currentTissues),
      controllingTissue
    });
    
    if (time < duration) {
      updateTissuesConstantDepth(currentTissues, 0, timeStep, surfaceGas);
    }
  }
  
  return points;
}

/**
 * Validate a repetitive dive
 */
export function validateRepetitiveDive(
  previousDive: DiveProfile,
  nextDiveParams: DiveParameters,
  surfaceInterval: number,
  rules: RepetitiveDiveRules = DEFAULT_REPETITIVE_RULES
): RepetitiveDiveValidation {
  const warnings: Warning[] = [];
  let canProceed = true;
  
  // Check surface interval
  if (surfaceInterval < rules.minSurfaceInterval) {
    warnings.push({
      level: WarningLevel.DANGER,
      message: 'Surface interval too short',
      details: `Minimum surface interval is ${rules.minSurfaceInterval} minutes. Current: ${surfaceInterval} minutes.`
    });
    canProceed = false;
  }
  
  // Check depth progression (should dive shallower)
  if (nextDiveParams.depth > previousDive.maxDepth) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Reverse dive profile',
      details: 'Diving deeper on subsequent dives increases decompression risk. Consider diving shallower.'
    });
  }
  
  // Calculate residual nitrogen
  const residualTissues = calculateResidualNitrogen(
    previousDive.tissueCompartments,
    surfaceInterval
  );
  
  // Check nitrogen loading
  const nitrogenLoad = calculateMaxTissueLoading(residualTissues);
  if (nitrogenLoad > rules.maxNitrogenLoad) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'High residual nitrogen',
      details: `Residual nitrogen loading is ${(nitrogenLoad * 100).toFixed(0)}%. Consider longer surface interval.`
    });
  }
  
  // Calculate adjusted NDL (simplified - would need full calculation)
  const adjustedNDL = Math.round(previousDive.noDecompressionLimit * (1 - nitrogenLoad));
  
  // Recommend max depth
  const recommendedMaxDepth = Math.max(
    previousDive.maxDepth - rules.maxDepthReduction,
    nextDiveParams.depth
  );
  
  if (nextDiveParams.depth > recommendedMaxDepth) {
    warnings.push({
      level: WarningLevel.INFO,
      message: 'Depth recommendation',
      details: `Recommended maximum depth for this dive: ${recommendedMaxDepth}m`
    });
  }
  
  return {
    isValid: warnings.filter(w => w.level === WarningLevel.DANGER).length === 0,
    canProceed,
    warnings,
    adjustedNDL,
    recommendedMaxDepth
  };
}

/**
 * Validate entire dive sequence
 */
export function validateDiveSequence(
  dives: DiveProfile[],
  surfaceIntervals: number[],
  rules: RepetitiveDiveRules = DEFAULT_REPETITIVE_RULES
): DiveSequenceValidation {
  const violations: string[] = [];
  const warnings: Warning[] = [];
  const recommendations: string[] = [];
  
  // Check number of dives
  if (dives.length > rules.maxDivesPerDay) {
    violations.push(`Exceeds maximum dives per day (${rules.maxDivesPerDay})`);
  }
  
  // Check depth progression
  for (let i = 1; i < dives.length; i++) {
    if (dives[i]!.maxDepth > dives[i - 1]!.maxDepth) {
      warnings.push({
        level: WarningLevel.WARNING,
        message: `Dive ${i + 1}: Reverse profile`,
        details: 'Diving deeper than previous dive'
      });
    }
  }
  
  // Check surface intervals
  for (let i = 0; i < surfaceIntervals.length; i++) {
    if (surfaceIntervals[i]! < rules.minSurfaceInterval) {
      violations.push(`Surface interval ${i + 1} too short: ${surfaceIntervals[i]}min`);
    }
    
    // After 3+ dives, require longer interval
    if (i >= 2 && surfaceIntervals[i]! < rules.minIntervalAfterMultipleDives) {
      warnings.push({
        level: WarningLevel.WARNING,
        message: `After ${i + 1} dives`,
        details: `Recommended surface interval: ${rules.minIntervalAfterMultipleDives} minutes`
      });
    }
  }
  
  // Check total nitrogen load
  if (dives.length > 0) {
    const lastDive = dives[dives.length - 1]!;
    const totalLoad = calculateMaxTissueLoading(lastDive.tissueCompartments);
    
    if (totalLoad > rules.maxNitrogenLoad) {
      warnings.push({
        level: WarningLevel.WARNING,
        message: 'High cumulative nitrogen load',
        details: `Total loading: ${(totalLoad * 100).toFixed(0)}%. Consider ending dive day.`
      });
    }
  }
  
  // Add recommendations
  if (dives.length >= 3) {
    recommendations.push('Consider taking a rest day tomorrow');
  }
  
  if (dives.some(d => d.maxDepth > 30)) {
    recommendations.push('Deep dives performed - ensure adequate surface intervals');
  }
  
  return {
    isValid: violations.length === 0,
    violations,
    warnings,
    recommendations
  };
}

/**
 * Calculate no-fly time after dive(s)
 */
export function calculateNoFlyTime(
  tissues: TissueCompartment[],
  multipleDives: boolean = false,
  rules: RepetitiveDiveRules = DEFAULT_REPETITIVE_RULES
): NoFlyTimeResult {
  const warnings: Warning[] = [];
  
  // Base no-fly time
  const baseNoFlyTime = multipleDives 
    ? rules.noFlyTimeMultipleDives 
    : rules.noFlyTimeSingleDive;
  
  // Find controlling tissue (slowest to off-gas)
  const controllingTissueIndex = findControllingTissueNumber(tissues) - 1;
  const controllingTissue = tissues[controllingTissueIndex]!;
  
  // Calculate time for tissue to reach safe level for flying
  // (simplified - actual calculation would be more complex)
  const surfaceN2 = inspiredPressure(SURFACE_PRESSURE, 0.79);
  const currentN2 = controllingTissue.n2Pressure;
  const safeN2 = surfaceN2 * 1.2; // 20% above surface pressure
  
  let calculatedTime = baseNoFlyTime;
  
  if (currentN2 > safeN2) {
    const ratio = (currentN2 - surfaceN2) / (safeN2 - surfaceN2);
    const halfTimes = Math.log(ratio) / Math.LN2;
    calculatedTime = Math.max(
      baseNoFlyTime,
      Math.ceil(halfTimes * controllingTissue.n2HalfTime)
    );
  }
  
  const safeToFlyAt = new Date(Date.now() + calculatedTime * 60000);
  
  // Add warnings
  if (calculatedTime > baseNoFlyTime) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Extended no-fly time',
      details: `Due to residual nitrogen, wait ${Math.round(calculatedTime / 60)} hours before flying.`
    });
  }
  
  warnings.push({
    level: WarningLevel.INFO,
    message: 'No-fly time',
    details: `Wait at least ${Math.round(calculatedTime / 60)} hours before flying to altitude.`
  });
  
  return {
    noFlyTime: calculatedTime,
    safeToFlyAt,
    controllingTissue: controllingTissueIndex + 1,
    residualNitrogen: currentN2,
    warnings
  };
}

/**
 * Helper: Calculate maximum tissue loading
 */
function calculateMaxTissueLoading(tissues: TissueCompartment[]): number {
  let maxLoading = 0;
  
  for (const tissue of tissues) {
    const totalInert = tissue.n2Pressure + tissue.hePressure;
    const loading = totalInert / tissue.mValue;
    maxLoading = Math.max(maxLoading, loading);
  }
  
  return maxLoading;
}

/**
 * Helper: Find controlling tissue number
 */
function findControllingTissueNumber(tissues: TissueCompartment[]): number {
  let maxLoading = 0;
  let controllingNumber = 1;
  
  for (const tissue of tissues) {
    const totalInert = tissue.n2Pressure + tissue.hePressure;
    const loading = totalInert / tissue.mValue;
    
    if (loading > maxLoading) {
      maxLoading = loading;
      controllingNumber = tissue.number;
    }
  }
  
  return controllingNumber;
}

/**
 * Create a repetitive dive from a profile
 */
export function createRepetitiveDive(
  profile: DiveProfile,
  diveNumber: number,
  residualNitrogenBefore: TissueCompartment[],
  surfaceIntervalAfter?: number
): RepetitiveDive {
  const now = new Date();
  const endTime = new Date(now.getTime() + profile.totalDiveTime * 60000);
  
  return {
    id: `dive-${diveNumber}-${Date.now()}`,
    diveNumber,
    profile,
    startTime: now,
    endTime,
    surfaceIntervalAfter,
    residualNitrogenBefore,
    residualNitrogenAfter: profile.tissueCompartments,
    pressureGroupBefore: calculatePressureGroup(residualNitrogenBefore),
    pressureGroupAfter: calculatePressureGroup(profile.tissueCompartments),
    warnings: profile.warnings
  };
}

// Made with Bob