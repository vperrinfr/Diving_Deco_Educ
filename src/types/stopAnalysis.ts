/**
 * Stop Analysis Types
 * 
 * Types for analyzing decompression stops and tissue compartment limitations
 */

import type { TissueCompartment } from './index';

/**
 * Status of a tissue compartment relative to its M-value
 */
export type CompartmentStatus = 'safe' | 'caution' | 'danger';

/**
 * Detailed analysis of a single tissue compartment at a specific depth
 */
export interface CompartmentAnalysis {
  /** Compartment number (1-16) */
  compartmentNumber: number;
  
  /** Nitrogen half-time in minutes */
  n2HalfTime: number;
  
  /** Helium half-time in minutes */
  heHalfTime: number;
  
  /** Current tissue inert gas pressure (N2 + He) in bar */
  tissuePressure: number;
  
  /** Maximum tolerated ambient pressure (M-value adjusted by GF) in bar */
  toleratedPressure: number;
  
  /** Current ambient pressure at selected depth in bar */
  ambientPressure: number;
  
  /** Safety margin in bar (toleratedPressure - ambientPressure) */
  marginBar: number;
  
  /** Safety margin as percentage of tolerated pressure */
  marginPercent: number;
  
  /** Ceiling depth for this compartment in meters */
  ceiling: number;
  
  /** Whether this is the limiting (controlling) compartment */
  isLimiting: boolean;
  
  /** Safety status based on saturation level */
  status: CompartmentStatus;
  
  /** Saturation percentage relative to M-value (0-100+) */
  saturationPercent: number;
}

/**
 * Complete analysis result for a selected depth
 */
export interface StopAnalysisResult {
  /** Selected depth for analysis in meters */
  selectedDepth: number;
  
  /** Analysis for all 16 tissue compartments */
  compartments: CompartmentAnalysis[];
  
  /** The compartment with the highest ceiling (most limiting) */
  limitingCompartment: CompartmentAnalysis;
  
  /** Minimum safe depth (ceiling of limiting compartment) in meters */
  canAscendTo: number;
  
  /** Whether ascent to selected depth is safe */
  isAscentSafe: boolean;
  
  /** Human-readable explanation of the limitation */
  explanation: string;
  
  /** Gradient factor being applied at this depth */
  currentGradientFactor: number;
}

/**
 * Parameters for stop analysis
 */
export interface StopAnalysisParameters {
  /** Current tissue compartments state */
  tissues: TissueCompartment[];
  
  /** Target depth to analyze in meters */
  targetDepth: number;
  
  /** Gradient factor low (0-100) */
  gfLow: number;
  
  /** Gradient factor high (0-100) */
  gfHigh: number;
  
  /** Depth of first decompression stop in meters */
  firstStopDepth: number;
  
  /** Maximum depth of the dive in meters */
  maxDepth: number;
  
  /** Unit system for display */
  units: 'metric' | 'imperial';
}

/**
 * Depth point for analysis (used in depth selector)
 */
export interface DepthPoint {
  /** Depth in meters */
  depth: number;
  
  /** Type of depth point */
  type: 'surface' | 'stop' | 'intermediate' | 'max';
  
  /** Label for display */
  label: string;
  
  /** Whether this is a decompression stop */
  isDecoStop: boolean;
}

// Made with Bob