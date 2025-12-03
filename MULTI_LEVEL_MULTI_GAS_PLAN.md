# Multi-Level & Multi-Gas Dive Implementation Plan

## Overview
This document outlines the implementation plan for adding multi-level dive profiles and multi-gas support to the Decompression Calculator.

## Requirements Summary
- **Descent Rate**: 20 m/min (configurable)
- **Ascent Rate**: 9 m/min (existing, configurable)
- **Gas Switching**: Automatic based on best mix for depth
- **Dive Segments**: Maximum 5 segments (depth + time pairs)
- **Gas Support**: 1 bottom gas + multiple deco gases
- **MOD Calculation**: Automatic Maximum Operating Depth for each gas

## Current Architecture Analysis

### Existing Structure
```
Current Single-Level Dive Flow:
1. User inputs: depth, bottom time, single gas mix, GF
2. Algorithm: Descent → Bottom phase → Ascent with deco stops
3. Output: Decompression schedule with single gas
```

### Limitations
- Only supports single depth/time
- Single gas mix throughout dive
- No gas switching capability
- Fixed descent rate (not configurable)

## New Architecture Design

### 1. Type Definitions (`src/types/index.ts`)

#### New Interfaces

```typescript
// Enhanced Dive Segment (already exists but needs expansion)
export interface DiveSegment {
  depth: number;           // meters
  duration: number;        // minutes
  gasMix: GasMix;         // gas used during this segment
  segmentType: 'descent' | 'bottom' | 'ascent' | 'deco';
}

// Gas Inventory
export interface GasInventory {
  bottomGas: GasMix;
  decoGases: GasMix[];     // Array of deco gases
}

// Enhanced Dive Parameters
export interface MultiLevelDiveParameters {
  segments: DiveSegment[];           // Max 5 segments
  gasInventory: GasInventory;        // All available gases
  gradientFactorLow: number;
  gradientFactorHigh: number;
  descentRate: number;               // m/min (default: 20)
  ascentRate: number;                // m/min (default: 9)
  units: 'metric' | 'imperial';
}

// Gas Switch Point
export interface GasSwitch {
  depth: number;
  fromGas: GasMix;
  toGas: GasMix;
  reason: 'optimal' | 'mod_limit' | 'deco';
}

// Enhanced Decompression Stop
export interface DecompressionStop {
  depth: number;
  duration: number;
  runtime: number;
  gasMix: GasMix;
  gasSwitch?: GasSwitch;  // If gas switch occurs at this stop
}
```

### 2. Constants Updates (`src/utils/buhlmann/constants.ts`)

```typescript
// Add new constants
export const DESCENT_RATE = 20.0;              // meters/minute
export const ASCENT_RATE = 9.0;                // meters/minute (update existing)
export const MAX_DIVE_SEGMENTS = 5;            // Maximum number of segments
export const GAS_SWITCH_TIME = 1.0;            // minutes for gas switch
export const MIN_DECO_GAS_DEPTH = 6.0;         // meters (don't switch too shallow)
```

### 3. Gas Management Utilities (`src/utils/gasMix.ts`)

#### New Functions Needed

```typescript
/**
 * Calculate Maximum Operating Depth for a gas mix
 * @param gasMix - Gas mixture
 * @param maxPPO2 - Maximum partial pressure (default: 1.4 for working, 1.6 for deco)
 * @returns MOD in meters
 */
export function calculateMOD(gasMix: GasMix, maxPPO2: number = 1.4): number

/**
 * Select best gas for current depth from available inventory
 * @param depth - Current depth in meters
 * @param gasInventory - Available gases
 * @param isDeco - Whether in decompression phase
 * @returns Best gas mix for this depth
 */
export function selectBestGas(
  depth: number, 
  gasInventory: GasInventory, 
  isDeco: boolean
): GasMix

/**
 * Validate gas is safe at given depth
 * @param gasMix - Gas to validate
 * @param depth - Depth in meters
 * @returns Validation result with warnings
 */
export function validateGasAtDepth(gasMix: GasMix, depth: number): {
  safe: boolean;
  warnings: string[];
}

/**
 * Calculate optimal gas switch depth
 * @param fromGas - Current gas
 * @param toGas - Target gas
 * @returns Optimal switch depth in meters
 */
export function calculateSwitchDepth(fromGas: GasMix, toGas: GasMix): number
```

### 4. Core Algorithm Updates (`src/utils/buhlmann/decompression.ts`)

#### New Main Function

```typescript
/**
 * Calculate multi-level dive profile with multiple gases
 * @param parameters - Multi-level dive parameters
 * @returns Complete dive profile with gas switches
 */
export function calculateMultiLevelDiveProfile(
  parameters: MultiLevelDiveParameters
): DiveProfile {
  // 1. Initialize tissues
  // 2. Process each dive segment
  // 3. Calculate ascent with automatic gas switching
  // 4. Generate decompression schedule
  // 5. Return complete profile
}
```

#### Algorithm Flow

```
Multi-Level Dive Calculation Flow:
┌─────────────────────────────────────────┐
│ 1. Initialize Tissues (surface)        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 2. For Each Segment (max 5):           │
│    - Descend to depth (20 m/min)       │
│    - Load tissues at depth/time         │
│    - Validate gas safety                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 3. Calculate First Stop Depth          │
│    - Find controlling tissue            │
│    - Determine ceiling                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 4. Ascent Phase with Gas Switching:    │
│    - Check for better gas at depth      │
│    - Switch if optimal                  │
│    - Continue ascent (9 m/min)          │
│    - Add deco stops as needed           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ 5. Generate Profile & Warnings         │
└─────────────────────────────────────────┘
```

### 5. UI Components

#### A. Segment Manager Component (`src/components/calculator/SegmentManager.vue`)

**Features:**
- Add/remove segments (max 5)
- Set depth and duration for each
- Visual segment list with validation
- Drag to reorder segments
- Total dive time display

**Layout:**
```
┌─────────────────────────────────────┐
│ Dive Segments (3/5)                 │
├─────────────────────────────────────┤
│ Segment 1: 30m for 15min  [Remove] │
│ Segment 2: 25m for 10min  [Remove] │
│ Segment 3: 20m for 8min   [Remove] │
├─────────────────────────────────────┤
│ [+ Add Segment]                     │
│ Total Bottom Time: 33 minutes       │
└─────────────────────────────────────┘
```

#### B. Gas Manager Component (`src/components/calculator/GasManager.vue`)

**Features:**
- Select bottom gas
- Add/remove deco gases
- Display MOD for each gas
- Validate gas combinations
- Show optimal switch depths

**Layout:**
```
┌─────────────────────────────────────┐
│ Gas Configuration                   │
├─────────────────────────────────────┤
│ Bottom Gas: [Air ▼]                │
│ MOD: 56m (PPO2: 1.4)               │
├─────────────────────────────────────┤
│ Deco Gases:                         │
│ • EAN50 (MOD: 21m) [Remove]        │
│ • Oxygen (MOD: 6m)  [Remove]       │
├─────────────────────────────────────┤
│ [+ Add Deco Gas]                    │
└─────────────────────────────────────┘
```

#### C. Rate Configuration Component

**Features:**
- Descent rate slider (10-30 m/min)
- Ascent rate slider (6-12 m/min)
- Presets (Conservative, Standard, Aggressive)

### 6. Validation Rules

#### Segment Validation
- Maximum 5 segments
- Each segment must have depth > 0 and duration > 0
- Segments should generally decrease in depth (warning if not)
- Total dive time reasonable (< 200 minutes)

#### Gas Validation
- At least one bottom gas required
- Each gas must sum to 100% (O2 + N2 + He)
- MOD must be deeper than shallowest segment
- Deco gases must have higher O2 than bottom gas
- No duplicate gases

#### Safety Validation
- PPO2 within limits at all depths
- END (Equivalent Narcotic Depth) acceptable
- Gas switches occur at safe depths
- Sufficient deco gas for calculated stops

### 7. Enhanced Results Display

#### Segment Summary Table
```
┌──────────────────────────────────────────────┐
│ Dive Segments                                │
├────────┬──────────┬──────────┬──────────────┤
│ Depth  │ Duration │ Runtime  │ Gas          │
├────────┼──────────┼──────────┼──────────────┤
│ 30m    │ 15min    │ 16.5min  │ Air          │
│ 25m    │ 10min    │ 27.0min  │ Air          │
│ 20m    │ 8min     │ 35.5min  │ Air          │
└────────┴──────────┴──────────┴──────────────┘
```

#### Gas Switch Indicators
```
┌──────────────────────────────────────────────┐
│ Gas Switches                                 │
├────────┬──────────────┬────────────────────┤
│ Depth  │ From → To    │ Reason             │
├────────┼──────────────┼────────────────────┤
│ 21m    │ Air → EAN50  │ Optimal for deco   │
│ 6m     │ EAN50 → O2   │ Optimal for deco   │
└────────┴──────────────┴────────────────────┘
```

### 8. Chart Enhancements

#### Multi-Level Profile Visualization
- Different colors for each segment
- Gas switch markers
- Segment boundaries clearly marked
- Legend showing gases used

```
Depth
  │
0m├─────────────────────────────────────
  │                              ╱╲ (O2)
6m├─────────────────────────────╱  ╲────
  │                        ╱╲ (EAN50)
21m├───────────────────────╱  ╲──────────
  │              ╱────╲ (Air)
25m├─────────────╱      ╲────────────────
  │        ╱────╲
30m├───────╱      ╲──────────────────────
  │
  └────────────────────────────────> Time
```

## Implementation Phases

### Phase 1: Type System & Constants (2-3 hours)
- Update type definitions
- Add new constants
- Create gas management utilities
- Add MOD calculations

### Phase 2: Core Algorithm (4-5 hours)
- Implement multi-segment processing
- Add automatic gas switching logic
- Update tissue loading for gas switches
- Enhance decompression calculation

### Phase 3: UI Components (5-6 hours)
- Create SegmentManager component
- Create GasManager component
- Add rate configuration
- Update DiveCalculatorInput

### Phase 4: Results & Visualization (3-4 hours)
- Update DiveProfileResults
- Enhance DiveProfileChart
- Add gas switch indicators
- Update warnings display

### Phase 5: Testing & Validation (2-3 hours)
- Test multi-level calculations
- Test gas switching scenarios
- Validate edge cases
- Update documentation

## Testing Scenarios

### Test Case 1: Simple Multi-Level
```
Segments:
- 30m for 20min (Air)
- 20m for 15min (Air)

Expected: Proper tissue loading across segments
```

### Test Case 2: Multi-Gas Deco
```
Segments:
- 40m for 25min (Air)

Gases:
- Bottom: Air
- Deco: EAN50, O2

Expected: Automatic switches at 21m and 6m
```

### Test Case 3: Complex Profile
```
Segments:
- 35m for 15min (Air)
- 30m for 10min (Air)
- 25m for 8min (Air)

Gases:
- Bottom: Air
- Deco: EAN50

Expected: Proper multi-level calculation with gas switch
```

## Migration Strategy

### Backward Compatibility
- Keep existing single-level interface
- Add "Advanced Mode" toggle
- Simple mode: single depth/time/gas
- Advanced mode: multi-level/multi-gas

### Data Structure
```typescript
// Backward compatible parameters
type DiveParameters = SimpleDiveParameters | MultiLevelDiveParameters;

// Detection
function isMultiLevel(params: DiveParameters): params is MultiLevelDiveParameters {
  return 'segments' in params;
}
```

## Success Criteria

✅ Support up to 5 dive segments
✅ Automatic gas switching based on optimal mix
✅ Configurable descent (20 m/min) and ascent (9 m/min) rates
✅ Multiple deco gases supported
✅ Accurate MOD calculations
✅ Clear visualization of multi-level profile
✅ Comprehensive validation and warnings
✅ Backward compatible with existing single-level dives

## Future Enhancements

- Import/export dive plans
- Gas consumption calculations
- Repetitive dive planning
- Surface interval tracking
- Dive plan templates
- Mobile-responsive segment management

---

**Document Version**: 1.0
**Created**: 2025-11-26
**Status**: Ready for Implementation