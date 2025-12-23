/**
 * Model Comparison Service
 * 
 * Unified service to compare different decompression models
 */

import type { DiveParameters, DiveProfile } from '../types';
import type {
  DecompressionModel,
  ModelProfile,
  ComparisonResult,
  ModelDifference,
  DifferenceAspect,
  StopComparison
} from '../types/decoModels';
import {
  DecompressionModel as Models,
  MODEL_CHARACTERISTICS,
  calculatePercentageDifference,
  determineSignificance,
  getAllStopDepths,
  createStopComparison
} from '../types/decoModels';
import { calculateDiveProfile } from '../utils/buhlmann/decompression';
import { calculateVPMBProfile } from '../utils/vpmb/decompression';
import { calculateRGBMProfile } from '../utils/rgbm/decompression';
import { calculateUSNavyProfile } from '../utils/tables/usNavyTables';

/**
 * Calculate profile for a specific model
 */
function calculateModelProfile(
  parameters: DiveParameters,
  model: DecompressionModel
): DiveProfile {
  switch (model) {
    case Models.BUHLMANN_ZHL16C:
      return calculateDiveProfile(parameters);
    
    case Models.VPM_B:
      return calculateVPMBProfile(parameters);
    
    case Models.RGBM:
      return calculateRGBMProfile(parameters);
    
    case Models.US_NAVY:
      return calculateUSNavyProfile(parameters);
    
    default:
      throw new Error(`Unknown model: ${model}`);
  }
}

/**
 * Compare multiple decompression models
 * 
 * @param parameters - Dive parameters
 * @param models - Array of models to compare (2-4 models)
 * @returns Comparison result with profiles and analysis
 */
export function compareDecompressionModels(
  parameters: DiveParameters,
  models: DecompressionModel[]
): ComparisonResult {
  // Validate input
  if (models.length < 2) {
    throw new Error('At least 2 models required for comparison');
  }
  
  if (models.length > 4) {
    throw new Error('Maximum 4 models can be compared at once');
  }
  
  // Calculate profiles for each model
  const profiles: ModelProfile[] = models.map(model => ({
    model,
    profile: calculateModelProfile(parameters, model),
    characteristics: MODEL_CHARACTERISTICS[model]
  }));
  
  // Analyze differences
  const differences = analyzeDifferences(profiles);
  
  // Generate recommendations
  const recommendations = generateRecommendations(profiles, differences);
  
  // Generate warnings
  const warnings = generateWarnings(profiles);
  
  return {
    parameters,
    profiles,
    differences,
    recommendations,
    warnings
  };
}

/**
 * Analyze differences between model profiles
 */
function analyzeDifferences(profiles: ModelProfile[]): ModelDifference[] {
  const differences: ModelDifference[] = [];
  
  // Total dive time comparison
  const totalTimes: Record<string, number> = {};
  profiles.forEach(p => {
    totalTimes[p.model] = p.profile.totalDiveTime;
  });
  
  const avgTotalTime = Object.values(totalTimes).reduce((a, b) => a + b, 0) / profiles.length;
  const maxTimeDiff = Math.max(...Object.values(totalTimes).map(t => 
    Math.abs(calculatePercentageDifference(avgTotalTime, t))
  ));
  
  differences.push({
    aspect: 'totalTime',
    label: 'Total Dive Time',
    values: totalTimes as any,
    unit: 'minutes',
    significance: determineSignificance(maxTimeDiff),
    explanation: 'Total time from start to surface, including decompression'
  });
  
  // Decompression time comparison
  const decoTimes: Record<string, number> = {};
  profiles.forEach(p => {
    decoTimes[p.model] = p.profile.totalDecompressionTime;
  });
  
  const avgDecoTime = Object.values(decoTimes).reduce((a, b) => a + b, 0) / profiles.length;
  const maxDecoTimeDiff = Math.max(...Object.values(decoTimes).map(t => 
    Math.abs(calculatePercentageDifference(avgDecoTime, t))
  ));
  
  differences.push({
    aspect: 'decoTime',
    label: 'Decompression Time',
    values: decoTimes as any,
    unit: 'minutes',
    significance: determineSignificance(maxDecoTimeDiff),
    explanation: 'Time spent at decompression stops'
  });
  
  // First stop depth comparison
  const firstStopDepths: Record<string, number> = {};
  profiles.forEach(p => {
    const firstStop = p.profile.decompressionStops[0];
    firstStopDepths[p.model] = firstStop?.depth || 0;
  });
  
  differences.push({
    aspect: 'firstStop',
    label: 'First Stop Depth',
    values: firstStopDepths as any,
    unit: 'meters',
    significance: 'moderate',
    explanation: 'Depth of the first decompression stop'
  });
  
  // Number of stops comparison
  const stopCounts: Record<string, number> = {};
  profiles.forEach(p => {
    stopCounts[p.model] = p.profile.decompressionStops.length;
  });
  
  differences.push({
    aspect: 'stopCount',
    label: 'Number of Stops',
    values: stopCounts as any,
    unit: 'stops',
    significance: 'minor',
    explanation: 'Total number of decompression stops'
  });
  
  // Deep stops comparison (>9m)
  const deepStopTimes: Record<string, number> = {};
  profiles.forEach(p => {
    const deepTime = p.profile.decompressionStops
      .filter(s => s.depth > 9)
      .reduce((sum, s) => sum + s.duration, 0);
    deepStopTimes[p.model] = deepTime;
  });
  
  differences.push({
    aspect: 'deepStops',
    label: 'Deep Stop Time (>9m)',
    values: deepStopTimes as any,
    unit: 'minutes',
    significance: 'moderate',
    explanation: 'Time spent at stops deeper than 9 meters'
  });
  
  // Shallow stops comparison (≤9m)
  const shallowStopTimes: Record<string, number> = {};
  profiles.forEach(p => {
    const shallowTime = p.profile.decompressionStops
      .filter(s => s.depth <= 9)
      .reduce((sum, s) => sum + s.duration, 0);
    shallowStopTimes[p.model] = shallowTime;
  });
  
  differences.push({
    aspect: 'shallowStops',
    label: 'Shallow Stop Time (≤9m)',
    values: shallowStopTimes as any,
    unit: 'minutes',
    significance: 'moderate',
    explanation: 'Time spent at stops 9 meters or shallower'
  });
  
  return differences;
}

/**
 * Generate recommendations based on comparison
 */
function generateRecommendations(
  profiles: ModelProfile[],
  differences: ModelDifference[]
): string[] {
  const recommendations: string[] = [];
  const params = profiles[0]!.profile.parameters as DiveParameters;
  
  // Depth-based recommendations
  if (params.depth > 30) {
    const bubbleModels = profiles.filter(p => p.characteristics.bubbleModel);
    if (bubbleModels.length > 0) {
      recommendations.push(
        `For deep dives (>${params.depth}m), bubble models (${bubbleModels.map(p => p.characteristics.shortName).join(', ')}) may provide better protection against DCS.`
      );
    }
  } else {
    const buhlmann = profiles.find(p => p.model === Models.BUHLMANN_ZHL16C);
    if (buhlmann) {
      recommendations.push(
        `For recreational depths (<30m), Bühlmann ZHL-16C is widely used and well-tested in dive computers.`
      );
    }
  }
  
  // Conservatism recommendations
  const conservative = profiles.filter(p => p.characteristics.conservatism === 'conservative');
  if (conservative.length > 0) {
    recommendations.push(
      `Most conservative: ${conservative.map(p => p.characteristics.shortName).join(', ')}. Consider for first dives, cold water, or after long breaks.`
    );
  }
  
  // Deep stop recommendations
  const deepStopDiff = differences.find(d => d.aspect === 'deepStops');
  if (deepStopDiff) {
    const maxDeepTime = Math.max(...Object.values(deepStopDiff.values));
    const minDeepTime = Math.min(...Object.values(deepStopDiff.values));
    if (maxDeepTime - minDeepTime > 5) {
      recommendations.push(
        `Significant difference in deep stop time. Bubble models emphasize deeper stops to limit bubble growth.`
      );
    }
  }
  
  // Time efficiency
  const totalTimeDiff = differences.find(d => d.aspect === 'totalTime');
  if (totalTimeDiff) {
    const fastest = Object.entries(totalTimeDiff.values)
      .sort(([, a], [, b]) => a - b)[0];
    if (fastest) {
      const [model, time] = fastest;
      recommendations.push(
        `Shortest total time: ${MODEL_CHARACTERISTICS[model as DecompressionModel].shortName} (${Math.round(time)} min). However, shorter ≠ safer.`
      );
    }
  }
  
  // Educational note
  recommendations.push(
    `Remember: All models are approximations. No model guarantees DCS prevention. Always dive conservatively.`
  );
  
  return recommendations;
}

/**
 * Generate warnings based on comparison
 */
function generateWarnings(profiles: ModelProfile[]): string[] {
  const warnings: string[] = [];
  const params = profiles[0]!.profile.parameters as DiveParameters;
  
  // Check for extreme differences
  const times = profiles.map(p => p.profile.totalDiveTime);
  const maxTime = Math.max(...times);
  const minTime = Math.min(...times);
  const timeDiff = ((maxTime - minTime) / minTime) * 100;
  
  if (timeDiff > 30) {
    warnings.push(
      `⚠️ Large difference in total dive time (${Math.round(timeDiff)}%). Models show significant disagreement.`
    );
  }
  
  // Check depth limits
  if (params.depth > 40) {
    warnings.push(
      `⚠️ Depth exceeds recreational limits. Some models may not be accurate at this depth.`
    );
  }
  
  // Check for very long dives
  if (params.bottomTime > 60) {
    warnings.push(
      `⚠️ Extended bottom time. Ensure adequate gas supply and consider repetitive dive penalties.`
    );
  }
  
  return warnings;
}

/**
 * Get stop-by-stop comparison data
 */
export function getStopComparison(profiles: ModelProfile[]): StopComparison[] {
  const depths = getAllStopDepths(profiles);
  return depths.map(depth => createStopComparison(profiles, depth));
}

/**
 * Export comparison to text format
 */
export function exportComparisonText(result: ComparisonResult): string {
  let text = '=== DECOMPRESSION MODEL COMPARISON ===\n\n';
  
  // Parameters
  const params = result.parameters;
  text += `Dive Parameters:\n`;
  text += `- Depth: ${params.depth}m\n`;
  text += `- Bottom Time: ${params.bottomTime} min\n`;
  text += `- Gas: ${Math.round(params.gasMix.oxygen * 100)}% O2\n`;
  text += `- GF: ${params.gradientFactorLow}/${params.gradientFactorHigh}\n\n`;
  
  // Models
  text += `Models Compared:\n`;
  result.profiles.forEach(p => {
    text += `- ${p.characteristics.name} (${p.characteristics.conservatism})\n`;
  });
  text += '\n';
  
  // Results
  text += `Results:\n`;
  result.profiles.forEach(p => {
    text += `\n${p.characteristics.name}:\n`;
    text += `  Total Time: ${Math.round(p.profile.totalDiveTime)} min\n`;
    text += `  Deco Time: ${Math.round(p.profile.totalDecompressionTime)} min\n`;
    text += `  Stops: ${p.profile.decompressionStops.length}\n`;
    if (p.profile.decompressionStops.length > 0) {
      text += `  Stop Schedule:\n`;
      p.profile.decompressionStops.forEach(stop => {
        text += `    ${stop.depth}m for ${stop.duration} min\n`;
      });
    }
  });
  
  // Recommendations
  text += `\nRecommendations:\n`;
  result.recommendations.forEach(rec => {
    text += `- ${rec}\n`;
  });
  
  return text;
}

// Made with Bob