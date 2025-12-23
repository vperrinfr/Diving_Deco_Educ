/**
 * Types for Repetitive Dive Planning
 * 
 * Handles multiple dives per day with surface intervals,
 * residual nitrogen tracking, and safety validations
 */

import type { TissueCompartment, DiveProfile, Warning, GasMix } from './index';

/**
 * Pressure group letter (A-Z) based on residual nitrogen
 * Compatible with PADI/SSI tables
 */
export type PressureGroup = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

/**
 * Single dive in a repetitive dive sequence
 */
export interface RepetitiveDive {
  id: string;
  diveNumber: number;
  profile: DiveProfile;
  startTime: Date;
  endTime: Date;
  surfaceIntervalAfter?: number; // minutes until next dive
  residualNitrogenBefore: TissueCompartment[];
  residualNitrogenAfter: TissueCompartment[];
  pressureGroupBefore: PressureGroup;
  pressureGroupAfter: PressureGroup;
  adjustedNDL?: number; // Adjusted no-decompression limit
  warnings: Warning[];
}

/**
 * Complete dive day plan with multiple dives
 */
export interface DiveDayPlan {
  id: string;
  date: Date;
  dives: RepetitiveDive[];
  surfaceIntervals: number[]; // minutes between dives
  totalNitrogenLoad: number; // 0-1 scale
  totalBottomTime: number; // minutes
  totalDecompressionTime: number; // minutes
  maxDepth: number; // meters
  noFlyTime: number; // minutes until safe to fly
  recommendations: Warning[];
  isComplete: boolean;
}

/**
 * Surface interval calculation result
 */
export interface SurfaceIntervalResult {
  minimumInterval: number; // minutes - absolute minimum
  recommendedInterval: number; // minutes - recommended safe interval
  optimalInterval: number; // minutes - optimal for desaturation
  currentDesaturation: number; // 0-1 scale
  pressureGroupAfterInterval: PressureGroup;
  residualTissues: TissueCompartment[];
  warnings: Warning[];
}

/**
 * Desaturation tracking data point
 */
export interface DesaturationPoint {
  time: number; // minutes from start of surface interval
  nitrogenLoad: number; // 0-1 scale
  pressureGroup: PressureGroup;
  controllingTissue: number; // compartment number
}

/**
 * Repetitive dive validation result
 */
export interface RepetitiveDiveValidation {
  isValid: boolean;
  canProceed: boolean;
  warnings: Warning[];
  adjustedNDL?: number;
  recommendedMaxDepth?: number;
  minimumSurfaceInterval?: number;
}

/**
 * Dive sequence validation
 */
export interface DiveSequenceValidation {
  isValid: boolean;
  violations: string[];
  warnings: Warning[];
  recommendations: string[];
}

/**
 * No-fly time calculation
 */
export interface NoFlyTimeResult {
  noFlyTime: number; // minutes
  safeToFlyAt: Date;
  controllingTissue: number;
  residualNitrogen: number; // bar
  warnings: Warning[];
}

/**
 * Repetitive dive rules and limits
 */
export interface RepetitiveDiveRules {
  minSurfaceInterval: number; // minutes
  recommendedSurfaceInterval: number; // minutes
  maxDivesPerDay: number;
  minIntervalAfterMultipleDives: number; // minutes after 3+ dives
  maxDepthReduction: number; // meters for subsequent dives
  noFlyTimeSingleDive: number; // minutes
  noFlyTimeMultipleDives: number; // minutes
  maxNitrogenLoad: number; // 0-1 scale
  conservativeFactor: number; // 1.0 = standard, >1.0 = more conservative
}

/**
 * Default repetitive dive rules (conservative)
 */
export const DEFAULT_REPETITIVE_RULES: RepetitiveDiveRules = {
  minSurfaceInterval: 60, // 1 hour
  recommendedSurfaceInterval: 120, // 2 hours
  maxDivesPerDay: 4,
  minIntervalAfterMultipleDives: 180, // 3 hours after 3+ dives
  maxDepthReduction: 5, // 5m shallower than previous
  noFlyTimeSingleDive: 720, // 12 hours
  noFlyTimeMultipleDives: 1080, // 18 hours
  maxNitrogenLoad: 0.85, // 85% of limit
  conservativeFactor: 1.2
};

/**
 * Dive day template for common scenarios
 */
export interface DiveDayTemplate {
  name: string;
  description: string;
  dives: Array<{
    depth: number;
    bottomTime: number;
    gasMix: GasMix;
    surfaceInterval?: number;
  }>;
  category: 'recreational' | 'technical' | 'training' | 'custom';
}

/**
 * Common dive day templates
 */
export const DIVE_DAY_TEMPLATES: DiveDayTemplate[] = [
  {
    name: 'Recreational Double Dive',
    description: 'Two recreational dives with 2-hour surface interval',
    category: 'recreational',
    dives: [
      { depth: 30, bottomTime: 25, gasMix: { oxygen: 0.21, nitrogen: 0.79, helium: 0 }, surfaceInterval: 120 },
      { depth: 25, bottomTime: 35, gasMix: { oxygen: 0.21, nitrogen: 0.79, helium: 0 } }
    ]
  },
  {
    name: 'Nitrox Double Dive',
    description: 'Two nitrox dives for extended bottom time',
    category: 'recreational',
    dives: [
      { depth: 25, bottomTime: 40, gasMix: { oxygen: 0.32, nitrogen: 0.68, helium: 0 }, surfaceInterval: 120 },
      { depth: 20, bottomTime: 50, gasMix: { oxygen: 0.32, nitrogen: 0.68, helium: 0 } }
    ]
  },
  {
    name: 'Training Day',
    description: 'Multiple shallow training dives',
    category: 'training',
    dives: [
      { depth: 12, bottomTime: 45, gasMix: { oxygen: 0.21, nitrogen: 0.79, helium: 0 }, surfaceInterval: 60 },
      { depth: 12, bottomTime: 45, gasMix: { oxygen: 0.21, nitrogen: 0.79, helium: 0 }, surfaceInterval: 60 },
      { depth: 12, bottomTime: 45, gasMix: { oxygen: 0.21, nitrogen: 0.79, helium: 0 } }
    ]
  },
  {
    name: 'Technical Double Dive',
    description: 'Two technical dives with extended surface interval',
    category: 'technical',
    dives: [
      { depth: 45, bottomTime: 20, gasMix: { oxygen: 0.18, nitrogen: 0.37, helium: 0.45 }, surfaceInterval: 240 },
      { depth: 35, bottomTime: 25, gasMix: { oxygen: 0.21, nitrogen: 0.44, helium: 0.35 } }
    ]
  }
];

/**
 * Pressure group thresholds (simplified)
 * Based on maximum tissue loading percentage
 */
export const PRESSURE_GROUP_THRESHOLDS: Record<PressureGroup, number> = {
  'A': 0.05, 'B': 0.10, 'C': 0.15, 'D': 0.20, 'E': 0.25,
  'F': 0.30, 'G': 0.35, 'H': 0.40, 'I': 0.45, 'J': 0.50,
  'K': 0.55, 'L': 0.60, 'M': 0.65, 'N': 0.70, 'O': 0.75,
  'P': 0.78, 'Q': 0.81, 'R': 0.84, 'S': 0.87, 'T': 0.90,
  'U': 0.92, 'V': 0.94, 'W': 0.96, 'X': 0.97, 'Y': 0.98, 'Z': 0.99
};

// Made with Bob