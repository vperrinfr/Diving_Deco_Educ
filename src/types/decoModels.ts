/**
 * Decompression Models Comparison Types
 * 
 * Types for comparing different decompression algorithms:
 * - Bühlmann ZHL-16C (dissolved gas model)
 * - VPM-B (bubble model with varying permeability)
 * - RGBM (reduced gradient bubble model)
 * - US Navy Tables (empirical tables)
 */

import type { DiveProfile, DiveParameters, DecompressionStop } from './index';

/**
 * Available decompression models
 */
export const DecompressionModel = {
  BUHLMANN_ZHL16C: 'buhlmann',
  VPM_B: 'vpmb',
  RGBM: 'rgbm',
  US_NAVY: 'usnavy'
} as const;

export type DecompressionModel = typeof DecompressionModel[keyof typeof DecompressionModel];

/**
 * Model conservatism level
 */
export type ConservatismLevel = 'conservative' | 'moderate' | 'liberal';

/**
 * Characteristics of a decompression model
 */
export interface ModelCharacteristics {
  name: string;
  shortName: string;
  description: string;
  conservatism: ConservatismLevel;
  bubbleModel: boolean;
  dissolvedGasModel: boolean;
  deepStops: boolean;
  empirical: boolean;
  color: string; // For chart visualization
}

/**
 * Profile calculated with a specific model
 */
export interface ModelProfile {
  model: DecompressionModel;
  profile: DiveProfile;
  characteristics: ModelCharacteristics;
}

/**
 * Type of difference between models
 */
export type DifferenceAspect = 
  | 'totalTime' 
  | 'decoTime'
  | 'deepStops' 
  | 'shallowStops' 
  | 'firstStop'
  | 'stopCount';

/**
 * Significance level of a difference
 */
export type SignificanceLevel = 'major' | 'moderate' | 'minor';

/**
 * Difference between models for a specific aspect
 */
export interface ModelDifference {
  aspect: DifferenceAspect;
  label: string;
  values: Record<DecompressionModel, number>;
  unit: string;
  significance: SignificanceLevel;
  explanation?: string;
}

/**
 * Comparison result for multiple models
 */
export interface ComparisonResult {
  parameters: DiveParameters;
  profiles: ModelProfile[];
  differences: ModelDifference[];
  recommendations: string[];
  warnings: string[];
}

/**
 * Stop comparison data for visualization
 */
export interface StopComparison {
  depth: number;
  durations: Record<DecompressionModel, number>;
}

/**
 * Model characteristics database
 */
export const MODEL_CHARACTERISTICS: Record<DecompressionModel, ModelCharacteristics> = {
  [DecompressionModel.BUHLMANN_ZHL16C]: {
    name: 'Bühlmann ZHL-16C',
    shortName: 'Bühlmann',
    description: 'Dissolved gas model with 16 tissue compartments. Standard in modern dive computers.',
    conservatism: 'moderate',
    bubbleModel: false,
    dissolvedGasModel: true,
    deepStops: false,
    empirical: false,
    color: '#0f62fe' // IBM Blue
  },
  [DecompressionModel.VPM_B]: {
    name: 'VPM-B',
    shortName: 'VPM-B',
    description: 'Varying Permeability Model. Bubble model favoring deeper stops to limit bubble growth.',
    conservatism: 'conservative',
    bubbleModel: true,
    dissolvedGasModel: false,
    deepStops: true,
    empirical: false,
    color: '#24a148' // IBM Green
  },
  [DecompressionModel.RGBM]: {
    name: 'RGBM',
    shortName: 'RGBM',
    description: 'Reduced Gradient Bubble Model. Hybrid model combining dissolved gas and bubble mechanics.',
    conservatism: 'conservative',
    bubbleModel: true,
    dissolvedGasModel: true,
    deepStops: true,
    empirical: false,
    color: '#8a3ffc' // IBM Purple
  },
  [DecompressionModel.US_NAVY]: {
    name: 'US Navy Tables',
    shortName: 'US Navy',
    description: 'Empirical tables based on extensive testing. Conservative approach proven over decades.',
    conservatism: 'conservative',
    bubbleModel: false,
    dissolvedGasModel: false,
    deepStops: false,
    empirical: true,
    color: '#fa4d56' // IBM Red
  }
};

/**
 * Helper function to get model characteristics
 */
export function getModelCharacteristics(model: DecompressionModel): ModelCharacteristics {
  return MODEL_CHARACTERISTICS[model];
}

/**
 * Helper function to format model name
 */
export function formatModelName(model: DecompressionModel, short: boolean = false): string {
  const chars = MODEL_CHARACTERISTICS[model];
  return short ? chars.shortName : chars.name;
}

/**
 * Helper function to get conservatism color
 */
export function getConservatismColor(level: ConservatismLevel): string {
  switch (level) {
    case 'conservative':
      return '#24a148'; // Green
    case 'moderate':
      return '#f1c21b'; // Yellow
    case 'liberal':
      return '#fa4d56'; // Red
  }
}

/**
 * Helper function to calculate percentage difference
 */
export function calculatePercentageDifference(value1: number, value2: number): number {
  if (value1 === 0) return 0;
  return ((value2 - value1) / value1) * 100;
}

/**
 * Helper function to determine significance level
 */
export function determineSignificance(percentageDiff: number): SignificanceLevel {
  const absDiff = Math.abs(percentageDiff);
  if (absDiff >= 20) return 'major';
  if (absDiff >= 10) return 'moderate';
  return 'minor';
}

/**
 * Helper function to compare stops at same depth
 */
export function compareStopsAtDepth(
  stops1: DecompressionStop[],
  stops2: DecompressionStop[],
  depth: number
): { duration1: number; duration2: number } {
  const stop1 = stops1.find(s => s.depth === depth);
  const stop2 = stops2.find(s => s.depth === depth);
  
  return {
    duration1: stop1?.duration || 0,
    duration2: stop2?.duration || 0
  };
}

/**
 * Helper function to get all unique stop depths from multiple profiles
 */
export function getAllStopDepths(profiles: ModelProfile[]): number[] {
  const depths = new Set<number>();
  
  profiles.forEach(profile => {
    profile.profile.decompressionStops.forEach(stop => {
      depths.add(stop.depth);
    });
  });
  
  return Array.from(depths).sort((a, b) => b - a); // Sort descending
}

/**
 * Helper function to create stop comparison data
 */
export function createStopComparison(
  profiles: ModelProfile[],
  depth: number
): StopComparison {
  const durations: Record<DecompressionModel, number> = {} as any;
  
  profiles.forEach(profile => {
    const stop = profile.profile.decompressionStops.find(s => s.depth === depth);
    durations[profile.model] = stop?.duration || 0;
  });
  
  return { depth, durations };
}

// Made with Bob