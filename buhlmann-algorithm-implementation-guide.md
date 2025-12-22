# Bühlmann ZHL-16C Algorithm Implementation Guide

## Overview

This guide provides detailed implementation instructions for the Bühlmann ZHL-16C decompression algorithm, including all necessary formulas, constants, and calculation steps.

## Algorithm Constants

### ZHL-16C Tissue Compartment Parameters

```typescript
// Nitrogen half-times (minutes) and M-value parameters for each compartment
const ZHL16C_N2_HALFTIMES = [4.0, 8.0, 12.5, 18.5, 27.0, 38.3, 54.3, 77.0, 109.0, 146.0, 187.0, 239.0, 305.0, 390.0, 498.0, 635.0];

// M-value parameters (a and b coefficients)
const ZHL16C_N2_A = [1.2599, 1.0000, 0.8618, 0.7562, 0.6200, 0.5043, 0.4410, 0.4000, 0.3750, 0.3500, 0.3295, 0.3065, 0.2835, 0.2610, 0.2480, 0.2327];

const ZHL16C_N2_B = [0.5050, 0.6514, 0.7222, 0.7825, 0.8126, 0.8434, 0.8693, 0.8910, 0.9092, 0.9222, 0.9319, 0.9403, 0.9477, 0.9544, 0.9602, 0.9653];

// Helium parameters (for future trimix support)
const ZHL16C_HE_HALFTIMES = [1.51, 3.02, 4.72, 6.99, 10.21, 14.48, 20.53, 29.11, 41.20, 55.19, 70.69, 90.34, 115.29, 147.42, 188.24, 240.03];

const ZHL16C_HE_A = [1.7424, 1.3830, 1.1919, 1.0458, 0.9220, 0.8205, 0.7305, 0.6502, 0.5950, 0.5545, 0.5333, 0.5189, 0.5181, 0.5176, 0.5172, 0.5119];

const ZHL16C_HE_B = [0.4245, 0.5747, 0.6527, 0.7223, 0.7582, 0.7957, 0.8279, 0.8553, 0.8757, 0.8903, 0.8997, 0.9073, 0.9122, 0.9171, 0.9217, 0.9267];
```

### Physical Constants

```typescript
const WATER_VAPOR_PRESSURE = 0.0627; // bar at 37°C (body temperature)
const SURFACE_PRESSURE = 1.01325;     // bar (sea level)
const PRESSURE_PER_METER = 0.09985;   // bar/meter (saltwater)
const ASCENT_RATE = 9.0;              // meters/minute (conservative)
const SAFETY_STOP_DEPTH = 5.0;        // meters
const SAFETY_STOP_TIME = 3.0;         // minutes
```

## Core Calculation Functions

### 1. Pressure Calculations

```typescript
/**
 * Convert depth to absolute pressure
 */
function depthToPressure(depth: number): number {
  return SURFACE_PRESSURE + (depth * PRESSURE_PER_METER);
}

/**
 * Convert pressure to depth
 */
function pressureToDepth(pressure: number): number {
  return (pressure - SURFACE_PRESSURE) / PRESSURE_PER_METER;
}

/**
 * Calculate inspired inert gas pressure
 */
function inspiredPressure(ambientPressure: number, gasFraction: number): number {
  return (ambientPressure - WATER_VAPOR_PRESSURE) * gasFraction;
}
```

### 2. Tissue Loading Calculations

The Schreiner equation for tissue loading/unloading:

```typescript
/**
 * Calculate tissue pressure after time t at constant depth
 * 
 * Formula: P_tissue = P_inspired + (P_initial - P_inspired) * e^(-k*t)
 * 
 * Where:
 * - k = ln(2) / half_time
 * - P_inspired = inspired inert gas pressure
 * - P_initial = initial tissue pressure
 * - t = time at depth
 */
function calculateTissuePressure(
  initialPressure: number,
  inspiredPressure: number,
  halfTime: number,
  time: number
): number {
  const k = Math.LN2 / halfTime;
  return inspiredPressure + (initialPressure - inspiredPressure) * Math.exp(-k * time);
}

/**
 * Calculate tissue pressure during ascent/descent (changing depth)
 * 
 * Haldane equation for changing ambient pressure:
 * P_tissue = P_i0 + R * (t - 1/k) - (P_i0 - P_alv - R/k) * e^(-k*t)
 * 
 * Where:
 * - R = rate of change of inspired pressure (bar/min)
 * - P_i0 = initial inspired pressure
 * - P_alv = alveolar pressure
 */
function calculateTissuePressureChangingDepth(
  initialPressure: number,
  initialInspiredPressure: number,
  finalInspiredPressure: number,
  halfTime: number,
  time: number
): number {
  const k = Math.LN2 / halfTime;
  const R = (finalInspiredPressure - initialInspiredPressure) / time;
  
  return initialInspiredPressure + 
         R * (time - 1/k) - 
         (initialInspiredPressure - initialPressure - R/k) * Math.exp(-k * time);
}
```

### 3. M-value Calculations

```typescript
/**
 * Calculate M-value for a tissue compartment at given ambient pressure
 * 
 * Formula: M-value = (P_amb / b) - a/b
 * 
 * Or equivalently: M-value = a + (P_amb * b)
 */
function calculateMValue(
  ambientPressure: number,
  a: number,
  b: number
): number {
  return (ambientPressure / b) - (a / b);
}

/**
 * Calculate tolerated ambient pressure for given tissue pressure
 * 
 * Formula: P_amb_tol = (P_tissue - a) * b
 */
function calculateToleratedPressure(
  tissuePressure: number,
  a: number,
  b: number
): number {
  return (tissuePressure - a) * b;
}
```

### 4. Gradient Factor Implementation

```typescript
/**
 * Apply gradient factors to M-value
 * 
 * GF interpolates between GF_low (at first stop) and GF_high (at surface)
 */
function applyGradientFactor(
  mValue: number,
  currentDepth: number,
  firstStopDepth: number,
  gfLow: number,
  gfHigh: number
): number {
  if (currentDepth >= firstStopDepth) {
    // Below first stop, use GF_low
    return mValue * (gfLow / 100);
  }
  
  // Interpolate between GF_low and GF_high
  const depthFraction = currentDepth / firstStopDepth;
  const gf = gfHigh + (gfLow - gfHigh) * depthFraction;
  
  return mValue * (gf / 100);
}

/**
 * Calculate ceiling depth for a tissue compartment
 * 
 * The ceiling is the shallowest depth where tissue pressure equals M-value
 */
function calculateCeiling(
  tissuePressure: number,
  a: number,
  b: number,
  gfLow: number,
  gfHigh: number,
  firstStopDepth: number
): number {
  // Calculate tolerated ambient pressure
  const toleratedPressure = (tissuePressure - a) * b;
  
  // Apply gradient factor
  const surfacePressure = SURFACE_PRESSURE;
  const gf = gfHigh / 100; // At surface, use GF_high
  const adjustedPressure = surfacePressure + (toleratedPressure - surfacePressure) * gf;
  
  // Convert to depth
  const ceiling = pressureToDepth(adjustedPressure);
  
  return Math.max(0, ceiling);
}
```

## Complete Dive Profile Calculation

### Step-by-Step Algorithm

```typescript
interface TissueCompartment {
  number: number;
  n2Pressure: number;
  hePressure: number;
  n2HalfTime: number;
  heHalfTime: number;
  a: number;
  b: number;
  ceiling: number;
}

interface DiveSegment {
  depth: number;
  duration: number;
  gasMix: GasMix;
}

interface GasMix {
  oxygen: number;    // fraction (0-1)
  nitrogen: number;  // fraction (0-1)
  helium: number;    // fraction (0-1)
}

/**
 * Initialize tissue compartments at surface
 */
function initializeTissues(): TissueCompartment[] {
  const tissues: TissueCompartment[] = [];
  const surfaceN2Pressure = inspiredPressure(SURFACE_PRESSURE, 0.79); // Air at surface
  
  for (let i = 0; i < 16; i++) {
    tissues.push({
      number: i + 1,
      n2Pressure: surfaceN2Pressure,
      hePressure: 0,
      n2HalfTime: ZHL16C_N2_HALFTIMES[i],
      heHalfTime: ZHL16C_HE_HALFTIMES[i],
      a: ZHL16C_N2_A[i],
      b: ZHL16C_N2_B[i],
      ceiling: 0
    });
  }
  
  return tissues;
}

/**
 * Update tissues for a dive segment at constant depth
 */
function updateTissuesConstantDepth(
  tissues: TissueCompartment[],
  depth: number,
  duration: number,
  gasMix: GasMix
): void {
  const ambientPressure = depthToPressure(depth);
  const inspiredN2 = inspiredPressure(ambientPressure, gasMix.nitrogen);
  const inspiredHe = inspiredPressure(ambientPressure, gasMix.helium);
  
  for (const tissue of tissues) {
    // Update nitrogen loading
    tissue.n2Pressure = calculateTissuePressure(
      tissue.n2Pressure,
      inspiredN2,
      tissue.n2HalfTime,
      duration
    );
    
    // Update helium loading (if present)
    if (gasMix.helium > 0) {
      tissue.hePressure = calculateTissuePressure(
        tissue.hePressure,
        inspiredHe,
        tissue.heHalfTime,
        duration
      );
    }
  }
}

/**
 * Calculate controlling tissue (highest ceiling)
 */
function findControllingTissue(
  tissues: TissueCompartment[],
  gfLow: number,
  gfHigh: number,
  firstStopDepth: number
): TissueCompartment {
  let maxCeiling = 0;
  let controllingTissue = tissues[0];
  
  for (const tissue of tissues) {
    const totalPressure = tissue.n2Pressure + tissue.hePressure;
    const ceiling = calculateCeiling(
      totalPressure,
      tissue.a,
      tissue.b,
      gfLow,
      gfHigh,
      firstStopDepth
    );
    
    tissue.ceiling = ceiling;
    
    if (ceiling > maxCeiling) {
      maxCeiling = ceiling;
      controllingTissue = tissue;
    }
  }
  
  return controllingTissue;
}

/**
 * Calculate decompression schedule
 */
function calculateDecompressionSchedule(
  depth: number,
  bottomTime: number,
  gasMix: GasMix,
  gfLow: number,
  gfHigh: number
): DecompressionStop[] {
  const tissues = initializeTissues();
  const stops: DecompressionStop[] = [];
  
  // 1. Bottom phase
  updateTissuesConstantDepth(tissues, depth, bottomTime, gasMix);
  
  // 2. Find first stop depth
  const controllingTissue = findControllingTissue(tissues, gfLow, gfHigh, depth);
  let currentDepth = depth;
  let firstStopDepth = Math.ceil(controllingTissue.ceiling / 3) * 3; // Round to 3m
  
  // 3. Ascend to first stop
  if (firstStopDepth > 0) {
    const ascentTime = (currentDepth - firstStopDepth) / ASCENT_RATE;
    updateTissuesChangingDepth(tissues, currentDepth, firstStopDepth, ascentTime, gasMix);
    currentDepth = firstStopDepth;
  }
  
  // 4. Calculate decompression stops
  while (currentDepth > 0) {
    const controlling = findControllingTissue(tissues, gfLow, gfHigh, firstStopDepth);
    
    if (controlling.ceiling < currentDepth - 3) {
      // Can ascend to next stop
      const nextDepth = Math.max(0, currentDepth - 3);
      
      if (nextDepth === SAFETY_STOP_DEPTH && currentDepth > SAFETY_STOP_DEPTH) {
        // Add safety stop
        stops.push({
          depth: SAFETY_STOP_DEPTH,
          duration: SAFETY_STOP_TIME,
          runtime: 0, // Will be calculated later
          gasMix: gasMix
        });
        updateTissuesConstantDepth(tissues, SAFETY_STOP_DEPTH, SAFETY_STOP_TIME, gasMix);
      }
      
      const ascentTime = (currentDepth - nextDepth) / ASCENT_RATE;
      updateTissuesChangingDepth(tissues, currentDepth, nextDepth, ascentTime, gasMix);
      currentDepth = nextDepth;
    } else {
      // Must stay at current depth
      const stopTime = 1; // 1 minute increment
      stops.push({
        depth: currentDepth,
        duration: stopTime,
        runtime: 0,
        gasMix: gasMix
      });
      updateTissuesConstantDepth(tissues, currentDepth, stopTime, gasMix);
    }
  }
  
  // 5. Calculate runtimes
  let runtime = bottomTime;
  for (const stop of stops) {
    runtime += stop.duration;
    stop.runtime = runtime;
  }
  
  return stops;
}

/**
 * Update tissues during depth change (ascent/descent)
 */
function updateTissuesChangingDepth(
  tissues: TissueCompartment[],
  startDepth: number,
  endDepth: number,
  duration: number,
  gasMix: GasMix
): void {
  const startPressure = depthToPressure(startDepth);
  const endPressure = depthToPressure(endDepth);
  
  const startInspiredN2 = inspiredPressure(startPressure, gasMix.nitrogen);
  const endInspiredN2 = inspiredPressure(endPressure, gasMix.nitrogen);
  
  const startInspiredHe = inspiredPressure(startPressure, gasMix.helium);
  const endInspiredHe = inspiredPressure(endPressure, gasMix.helium);
  
  for (const tissue of tissues) {
    tissue.n2Pressure = calculateTissuePressureChangingDepth(
      tissue.n2Pressure,
      startInspiredN2,
      endInspiredN2,
      tissue.n2HalfTime,
      duration
    );
    
    if (gasMix.helium > 0) {
      tissue.hePressure = calculateTissuePressureChangingDepth(
        tissue.hePressure,
        startInspiredHe,
        endInspiredHe,
        tissue.heHalfTime,
        duration
      );
    }
  }
}
```

## No-Decompression Limit Calculation

```typescript
/**
 * Calculate no-decompression limit for a given depth and gas mix
 */
function calculateNDL(
  depth: number,
  gasMix: GasMix,
  gfHigh: number
): number {
  const tissues = initializeTissues();
  const ambientPressure = depthToPressure(depth);
  
  let time = 0;
  const timeStep = 1; // 1 minute increments
  
  while (time < 300) { // Max 5 hours
    // Update tissues
    updateTissuesConstantDepth(tissues, depth, timeStep, gasMix);
    time += timeStep;
    
    // Check if any tissue exceeds M-value
    for (const tissue of tissues) {
      const totalPressure = tissue.n2Pressure + tissue.hePressure;
      const mValue = calculateMValue(SURFACE_PRESSURE, tissue.a, tissue.b);
      const adjustedMValue = mValue * (gfHigh / 100);
      
      if (totalPressure > adjustedMValue) {
        return time - timeStep; // Return last safe time
      }
    }
  }
  
  return 300; // Max NDL
}
```

## Safety Checks

```typescript
/**
 * Check for oxygen toxicity
 */
function checkOxygenToxicity(depth: number, gasMix: GasMix): boolean {
  const ambientPressure = depthToPressure(depth);
  const ppo2 = ambientPressure * gasMix.oxygen;
  
  return ppo2 > 1.4; // Conservative limit for working dives
}

/**
 * Check for nitrogen narcosis risk
 */
function checkNitrogenNarcosis(depth: number, gasMix: GasMix): boolean {
  const ambientPressure = depthToPressure(depth);
  const ppn2 = ambientPressure * gasMix.nitrogen;
  
  // Equivalent narcotic depth > 30m is considered risky
  return ppn2 > 3.95;
}

/**
 * Validate ascent rate
 */
function validateAscentRate(
  startDepth: number,
  endDepth: number,
  duration: number
): boolean {
  const rate = (startDepth - endDepth) / duration;
  return rate <= ASCENT_RATE;
}
```

## Testing and Validation

### Test Cases

1. **Simple Air Dive**
   - Depth: 18m
   - Time: 40 minutes
   - Gas: Air (21% O2)
   - Expected: No decompression required, safety stop only

2. **Decompression Dive**
   - Depth: 30m
   - Time: 30 minutes
   - Gas: Air
   - Expected: Multiple decompression stops

3. **Nitrox Dive**
   - Depth: 25m
   - Time: 45 minutes
   - Gas: EAN32 (32% O2)
   - Expected: Reduced decompression obligation vs air

4. **Gradient Factor Comparison**
   - Same dive with GF 30/70 vs 40/85
   - Expected: Conservative GF requires longer decompression

### Validation Against Published Tables

Compare results with:
- PADI RDP (Recreational Dive Planner)
- NAUI dive tables
- Subsurface dive computer software
- MultiDeco software

## References

1. Bühlmann, A.A. (1984). "Decompression-Decompression Sickness"
2. Baker, Erik C. (1998). "Understanding M-values"
3. Baker, Erik C. (1999). "Clearing Up The Confusion About Deep Stops"
4. Wienke, Bruce R. (1990). "Basic Decompression Theory and Application"

## Implementation Notes

- All pressures in bar (absolute)
- All depths in meters
- All times in minutes
- Temperature assumed constant at 37°C (body temperature)
- Saltwater density used (1.03 kg/L)
- Conservative ascent rate of 9 m/min
- Safety stop always included for dives deeper than 10m