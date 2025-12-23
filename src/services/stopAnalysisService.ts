/**
 * Stop Analysis Service
 * 
 * Service for analyzing decompression stops and identifying limiting tissue compartments
 */

import type { TissueCompartment } from '../types';
import type {
  StopAnalysisParameters,
  StopAnalysisResult,
  CompartmentAnalysis,
  CompartmentStatus,
  DepthPoint
} from '../types/stopAnalysis';
import {
  calculateCeiling,
  calculateSupersaturation,
  calculateCurrentGF,
  calculateToleratedPressure
} from '../utils/buhlmann/gradientFactors';
import {
  getTotalInertPressure,
  calculateCombinedMValueParams
} from '../utils/buhlmann/tissueLoading';
import { depthToPressure } from '../utils/conversions';

/**
 * Analyze tissue compartments at a specific depth
 * 
 * @param parameters - Analysis parameters
 * @returns Complete analysis result
 */
export function analyzeDepth(parameters: StopAnalysisParameters): StopAnalysisResult {
  const {
    tissues,
    targetDepth,
    gfLow,
    gfHigh,
    firstStopDepth,
    maxDepth
  } = parameters;

  // Calculate current gradient factor at target depth
  const currentGF = calculateCurrentGF(targetDepth, firstStopDepth, gfLow, gfHigh);
  
  // Analyze each compartment
  const compartments: CompartmentAnalysis[] = tissues.map((tissue, index) => 
    analyzeCompartment(tissue, targetDepth, gfLow, gfHigh, firstStopDepth)
  );

  // Find limiting compartment (highest ceiling)
  const limitingCompartment = compartments.reduce((max, current) => 
    current.ceiling > max.ceiling ? current : max
  );

  // Mark the limiting compartment
  compartments.forEach(comp => {
    comp.isLimiting = comp.compartmentNumber === limitingCompartment.compartmentNumber;
  });

  // Determine if ascent is safe
  const isAscentSafe = limitingCompartment.ceiling <= targetDepth;
  const canAscendTo = Math.max(0, limitingCompartment.ceiling);

  // Generate explanation
  const explanation = generateExplanation(
    targetDepth,
    limitingCompartment,
    isAscentSafe,
    canAscendTo
  );

  return {
    selectedDepth: targetDepth,
    compartments,
    limitingCompartment,
    canAscendTo,
    isAscentSafe,
    explanation,
    currentGradientFactor: currentGF
  };
}

/**
 * Analyze a single tissue compartment at a specific depth
 * 
 * @param tissue - Tissue compartment
 * @param targetDepth - Target depth in meters
 * @param gfLow - Gradient factor low
 * @param gfHigh - Gradient factor high
 * @param firstStopDepth - First stop depth
 * @returns Compartment analysis
 */
function analyzeCompartment(
  tissue: TissueCompartment,
  targetDepth: number,
  gfLow: number,
  gfHigh: number,
  firstStopDepth: number
): CompartmentAnalysis {
  // Get tissue pressure
  const tissuePressure = getTotalInertPressure(tissue);
  
  // Get M-value parameters
  const { a, b } = calculateCombinedMValueParams(tissue);
  
  // Calculate tolerated pressure (M-value adjusted by GF)
  const rawToleratedPressure = calculateToleratedPressure(tissuePressure, a, b);
  
  // Apply gradient factor
  const currentGF = calculateCurrentGF(targetDepth, firstStopDepth, gfLow, gfHigh);
  const surfacePressure = 1.01325; // bar
  const toleratedPressure = surfacePressure + 
    (rawToleratedPressure - surfacePressure) * (currentGF / 100);
  
  // Calculate ambient pressure at target depth
  const ambientPressure = depthToPressure(targetDepth);
  
  // Calculate margins
  const marginBar = toleratedPressure - ambientPressure;
  const marginPercent = ambientPressure > 0 
    ? (marginBar / ambientPressure) * 100 
    : 0;
  
  // Calculate ceiling
  const ceiling = calculateCeiling(tissue, gfLow, gfHigh, firstStopDepth);
  
  // Calculate saturation percentage
  const saturationPercent = calculateSupersaturation(tissue, targetDepth);
  
  // Determine status
  const status = getCompartmentStatus(saturationPercent);

  return {
    compartmentNumber: tissue.number,
    n2HalfTime: tissue.n2HalfTime,
    heHalfTime: tissue.heHalfTime,
    tissuePressure,
    toleratedPressure,
    ambientPressure,
    marginBar,
    marginPercent,
    ceiling,
    isLimiting: false, // Will be set later
    status,
    saturationPercent
  };
}

/**
 * Determine compartment status based on saturation
 * 
 * @param saturationPercent - Saturation percentage
 * @returns Status level
 */
function getCompartmentStatus(saturationPercent: number): CompartmentStatus {
  if (saturationPercent < 70) return 'safe';
  if (saturationPercent < 90) return 'caution';
  return 'danger';
}

/**
 * Generate human-readable explanation
 * 
 * @param targetDepth - Target depth
 * @param limitingCompartment - Limiting compartment
 * @param isAscentSafe - Whether ascent is safe
 * @param canAscendTo - Minimum safe depth
 * @returns Explanation text
 */
function generateExplanation(
  targetDepth: number,
  limitingCompartment: CompartmentAnalysis,
  isAscentSafe: boolean,
  canAscendTo: number
): string {
  const compartmentNum = limitingCompartment.compartmentNumber;
  const halfTime = limitingCompartment.n2HalfTime.toFixed(1);
  
  if (isAscentSafe) {
    if (targetDepth === 0) {
      return `Ascent to surface is safe. Compartment #${compartmentNum} (${halfTime} min half-time) is the most saturated but within safe limits.`;
    }
    return `Ascent to ${targetDepth}m is safe. Compartment #${compartmentNum} (${halfTime} min half-time) is the most saturated but within safe limits.`;
  }
  
  const ceilingDepth = Math.ceil(canAscendTo);
  return `Cannot ascend above ${ceilingDepth}m. Compartment #${compartmentNum} (${halfTime} min half-time) would exceed its tolerated pressure limit. Current margin: ${limitingCompartment.marginBar.toFixed(2)} bar (${limitingCompartment.marginPercent.toFixed(1)}%).`;
}

/**
 * Generate depth points for selector
 * 
 * @param maxDepth - Maximum dive depth
 * @param decoStops - Array of decompression stop depths
 * @returns Array of depth points
 */
export function generateDepthPoints(
  maxDepth: number,
  decoStops: number[]
): DepthPoint[] {
  const points: DepthPoint[] = [];
  
  // Add surface
  points.push({
    depth: 0,
    type: 'surface',
    label: 'Surface (0m)',
    isDecoStop: false
  });
  
  // Add decompression stops
  const uniqueStops = [...new Set(decoStops)].sort((a, b) => a - b);
  uniqueStops.forEach(depth => {
    points.push({
      depth,
      type: 'stop',
      label: `Stop ${depth}m`,
      isDecoStop: true
    });
  });
  
  // Add max depth
  if (maxDepth > 0 && !uniqueStops.includes(maxDepth)) {
    points.push({
      depth: maxDepth,
      type: 'max',
      label: `Max depth (${maxDepth}m)`,
      isDecoStop: false
    });
  }
  
  return points.sort((a, b) => a.depth - b.depth);
}

/**
 * Get color for compartment status
 * 
 * @param status - Compartment status
 * @returns CSS color class or hex color
 */
export function getStatusColor(status: CompartmentStatus): string {
  switch (status) {
    case 'safe':
      return '#24a148'; // Green
    case 'caution':
      return '#f1c21b'; // Yellow/Orange
    case 'danger':
      return '#da1e28'; // Red
    default:
      return '#8d8d8d'; // Gray
  }
}

/**
 * Format pressure value for display
 * 
 * @param pressure - Pressure in bar
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatPressure(pressure: number, decimals: number = 2): string {
  return `${pressure.toFixed(decimals)} bar`;
}

/**
 * Format percentage for display
 * 
 * @param percent - Percentage value
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatPercent(percent: number, decimals: number = 1): string {
  return `${percent.toFixed(decimals)}%`;
}

/**
 * Get compartment display name
 * 
 * @param compartmentNumber - Compartment number (1-16)
 * @param halfTime - Half-time in minutes
 * @returns Display name
 */
export function getCompartmentDisplayName(
  compartmentNumber: number,
  halfTime: number
): string {
  return `#${compartmentNumber} (${halfTime.toFixed(1)}min)`;
}

// Made with Bob