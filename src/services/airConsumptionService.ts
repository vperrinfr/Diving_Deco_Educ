import type {
  AirConsumptionData,
  AirConsumptionResult,
  CylinderConfig,
  CylinderUsage,
  CylinderSelection
} from '../types/airConsumption';
import type { DiveSegment, GasMix } from '../types';
import { areGasesEqual } from '../utils/gasMix';

/**
 * Calculate air consumption for a dive profile
 */
export function calculateAirConsumption(
  segments: DiveSegment[],
  consumptionData: AirConsumptionData,
  cylinders: CylinderConfig[]
): AirConsumptionResult {
  const warnings: string[] = [];
  
  // Calculate air needed per segment with gas tracking
  const segmentConsumption = calculateSegmentConsumption(segments, consumptionData.surfaceAirConsumptionRate);
  
  // Calculate cylinder usage based on gas type matching
  const cylinderUsage = calculateCylinderUsageByGas(
    consumptionData.cylinders,
    cylinders,
    segmentConsumption,
    consumptionData.reservePressure
  );
  
  // Calculate total air needed
  const totalAirNeeded = segmentConsumption.reduce((sum, seg) => sum + seg.airNeeded, 0);
  
  // Check if air supply is sufficient
  const totalAvailable = cylinderUsage.reduce((sum, usage) => sum + usage.volumeUsed, 0);
  const isSufficient = totalAvailable >= totalAirNeeded;
  
  // Generate warnings
  if (!isSufficient) {
    warnings.push(`Insufficient air supply: ${totalAirNeeded.toFixed(0)}L needed, ${totalAvailable.toFixed(0)}L available`);
  }
  
  cylinderUsage.forEach(usage => {
    const cylinder = cylinders.find(c => c.id === usage.cylinderId);
    const cylinderName = cylinder?.name || usage.cylinderId;
    
    if (usage.percentageUsed > 90) {
      warnings.push(`Cylinder ${cylinderName} usage exceeds 90%`);
    }
    if (usage.endPressure < consumptionData.reservePressure) {
      warnings.push(`Cylinder ${cylinderName} ends below reserve pressure`);
    }
  });
  
  return {
    totalAirNeeded,
    cylinderUsage,
    warnings,
    isSufficient
  };
}

/**
 * Calculate air consumption per segment with gas information
 */
function calculateSegmentConsumption(
  segments: DiveSegment[],
  sacRate: number
): Array<{ segment: DiveSegment; airNeeded: number }> {
  return segments.map(segment => {
    const avgDepth = segment.depth;
    const duration = segment.duration;
    
    // Calculate absolute pressure (bar) = (depth / 10) + 1
    const absolutePressure = (avgDepth / 10) + 1;
    
    // Air consumption = SAC rate × absolute pressure × time
    const airNeeded = sacRate * absolutePressure * duration;
    
    return { segment, airNeeded };
  });
}

/**
 * Calculate usage for each cylinder based on gas type and segments
 */
function calculateCylinderUsageByGas(
  selections: CylinderSelection[],
  cylinders: CylinderConfig[],
  segmentConsumption: Array<{ segment: DiveSegment; airNeeded: number }>,
  reservePressure: number
): CylinderUsage[] {
  const usage: CylinderUsage[] = [];
  
  // Initialize usage tracking for each cylinder
  const cylinderTracking = new Map<string, {
    selection: CylinderSelection;
    cylinder: CylinderConfig;
    airUsed: number;
  }>();
  
  selections.forEach(selection => {
    const cylinder = cylinders.find(c => c.id === selection.cylinderId);
    if (cylinder) {
      cylinderTracking.set(selection.cylinderId, {
        selection,
        cylinder,
        airUsed: 0
      });
    }
  });
  
  // Allocate air consumption to cylinders based on gas type
  for (const { segment, airNeeded } of segmentConsumption) {
    // Find matching cylinder for this segment's gas
    let matchingCylinder: { selection: CylinderSelection; cylinder: CylinderConfig; airUsed: number } | null = null;
    
    // First, try to find a cylinder with matching gas type
    for (const [cylinderId, tracking] of cylinderTracking) {
      // For deco segments, prefer deco cylinders
      if (segment.segmentType === 'deco' && tracking.selection.gasType === 'deco') {
        matchingCylinder = tracking;
        break;
      }
      // For bottom segments, prefer bottom cylinders
      if (segment.segmentType === 'bottom' && tracking.selection.gasType === 'bottom') {
        matchingCylinder = tracking;
        break;
      }
    }
    
    // If no specific match, use bottom gas as fallback
    if (!matchingCylinder) {
      for (const [cylinderId, tracking] of cylinderTracking) {
        if (tracking.selection.gasType === 'bottom') {
          matchingCylinder = tracking;
          break;
        }
      }
    }
    
    // If still no match, use first available cylinder
    if (!matchingCylinder && cylinderTracking.size > 0) {
      const firstCylinder = Array.from(cylinderTracking.values())[0];
      if (firstCylinder) {
        matchingCylinder = firstCylinder;
      }
    }
    
    if (matchingCylinder) {
      matchingCylinder.airUsed += airNeeded;
    }
  }
  
  // Calculate final usage for each cylinder
  for (const [cylinderId, tracking] of cylinderTracking) {
    const { selection, cylinder, airUsed } = tracking;
    
    const usablePressure = selection.startPressure - reservePressure;
    const availableAir = cylinder.volume * usablePressure;
    
    const actualAirUsed = Math.min(airUsed, availableAir);
    const pressureUsed = actualAirUsed / cylinder.volume;
    const endPressure = selection.startPressure - pressureUsed;
    const percentageUsed = (pressureUsed / selection.startPressure) * 100;
    
    usage.push({
      cylinderId: selection.cylinderId,
      startPressure: selection.startPressure,
      endPressure: Math.max(endPressure, reservePressure),
      volumeUsed: actualAirUsed,
      percentageUsed
    });
  }
  
  return usage;
}

/**
 * Calculate Surface Air Consumption (SAC) rate from actual dive data
 */
export function calculateSACRate(
  depth: number,
  duration: number,
  airUsed: number
): number {
  const absolutePressure = (depth / 10) + 1;
  return airUsed / (absolutePressure * duration);
}

/**
 * Calculate Respiratory Minute Volume (RMV) - same as SAC but different terminology
 */
export function calculateRMV(
  depth: number,
  duration: number,
  airUsed: number
): number {
  return calculateSACRate(depth, duration, airUsed);
}

/**
 * Estimate air consumption based on activity level
 */
export function estimateSACRate(activityLevel: 'resting' | 'light' | 'moderate' | 'heavy'): number {
  const rates = {
    resting: 15,   // L/min
    light: 20,     // L/min (easy swimming)
    moderate: 25,  // L/min (normal diving)
    heavy: 30      // L/min (working hard, stress)
  };
  
  return rates[activityLevel];
}

/**
 * Calculate turn pressure (when to turn back) for a dive
 */
export function calculateTurnPressure(
  cylinder: CylinderConfig,
  startPressure: number,
  reservePressure: number,
  rule: 'thirds' | 'halves' | 'custom',
  customFraction?: number
): number {
  const usablePressure = startPressure - reservePressure;
  
  let fraction: number;
  switch (rule) {
    case 'thirds':
      fraction = 1/3;
      break;
    case 'halves':
      fraction = 1/2;
      break;
    case 'custom':
      fraction = customFraction || 1/3;
      break;
  }
  
  return startPressure - (usablePressure * fraction);
}

// Made with Bob
