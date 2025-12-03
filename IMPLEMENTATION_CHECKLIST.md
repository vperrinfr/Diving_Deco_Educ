# Multi-Level Multi-Gas Implementation Checklist

## Quick Reference Guide

This checklist provides a step-by-step guide for implementing the multi-level, multi-gas dive calculator feature.

---

## Phase 1: Foundation (Type System & Constants)

### 1.1 Update Type Definitions (`src/types/index.ts`)

- [ ] Add `GasInventory` interface
  ```typescript
  export interface GasInventory {
    bottomGas: GasMix;
    decoGases: GasMix[];
  }
  ```

- [ ] Enhance `DiveSegment` interface
  ```typescript
  export interface DiveSegment {
    depth: number;
    duration: number;
    gasMix: GasMix;
    segmentType: 'descent' | 'bottom' | 'ascent' | 'deco';
  }
  ```

- [ ] Add `GasSwitch` interface
  ```typescript
  export interface GasSwitch {
    depth: number;
    fromGas: GasMix;
    toGas: GasMix;
    reason: 'optimal' | 'mod_limit' | 'deco';
  }
  ```

- [ ] Create `MultiLevelDiveParameters` interface
  ```typescript
  export interface MultiLevelDiveParameters {
    segments: DiveSegment[];
    gasInventory: GasInventory;
    gradientFactorLow: number;
    gradientFactorHigh: number;
    descentRate: number;
    ascentRate: number;
    units: 'metric' | 'imperial';
  }
  ```

- [ ] Update `DecompressionStop` to include gas switches
- [ ] Update `DiveProfile` to include gas switches array
- [ ] Add predefined deco gases (EAN50, O2, etc.)

### 1.2 Update Constants (`src/utils/buhlmann/constants.ts`)

- [ ] Add `DESCENT_RATE = 20.0` (m/min)
- [ ] Update `ASCENT_RATE = 9.0` (m/min)
- [ ] Add `MAX_DIVE_SEGMENTS = 5`
- [ ] Add `GAS_SWITCH_TIME = 1.0` (minutes)
- [ ] Add `MIN_DECO_GAS_DEPTH = 6.0` (meters)
- [ ] Add `MAX_PPO2_DECO = 1.6` (bar)

---

## Phase 2: Gas Management Utilities

### 2.1 MOD Calculations (`src/utils/gasMix.ts`)

- [ ] Implement `calculateMOD(gasMix, maxPPO2)`
  - Formula: `MOD = ((maxPPO2 / fO2) - 1) * 10`
  - Return depth in meters
  - Handle edge cases (100% O2, etc.)

- [ ] Implement `calculateMinDepth(gasMix)`
  - Calculate minimum safe depth (hypoxia check)
  - Formula: `MinDepth = ((0.16 / fO2) - 1) * 10`

### 2.2 Gas Selection Algorithm (`src/utils/gasMix.ts`)

- [ ] Implement `selectBestGas(depth, gasInventory, isDeco)`
  - Filter gases by MOD >= current depth
  - Calculate PPO2 for each gas at depth
  - Select highest O2 within safe limits
  - Return best gas or current gas if no better option

- [ ] Implement `validateGasAtDepth(gasMix, depth)`
  - Check PPO2 within limits (1.4 working, 1.6 deco)
  - Check for hypoxia (PPO2 > 0.16)
  - Check narcosis (END calculation)
  - Return validation result with warnings

- [ ] Implement `calculateSwitchDepth(fromGas, toGas)`
  - Calculate optimal switch depth
  - Consider MOD of target gas
  - Add safety margin (e.g., 1m deeper than MOD)

### 2.3 Gas Utilities

- [ ] Implement `sortGasesByO2(gases)`
  - Sort gases by O2 percentage (ascending)
  - Used for optimal gas selection

- [ ] Implement `isGasSwitchWorthwhile(currentGas, newGas, depth)`
  - Calculate O2 benefit
  - Consider switch time cost
  - Return boolean decision

---

## Phase 3: Core Algorithm Updates

### 3.1 Multi-Segment Processing (`src/utils/buhlmann/decompression.ts`)

- [ ] Create `calculateMultiLevelDiveProfile(parameters)`
  - Main entry point for multi-level dives
  - Process each segment sequentially
  - Track tissue loading across segments
  - Return complete profile

- [ ] Implement `processSegment(tissues, segment, descentRate)`
  - Descend to segment depth
  - Load tissues for segment duration
  - Validate gas safety at depth
  - Update runtime

- [ ] Implement `processAllSegments(tissues, segments, descentRate)`
  - Loop through all segments
  - Accumulate tissue loading
  - Track total bottom time
  - Generate warnings for unsafe conditions

### 3.2 Gas Switching During Ascent

- [ ] Implement `findOptimalGasSwitch(depth, currentGas, gasInventory)`
  - Check all available gases
  - Calculate best gas for current depth
  - Determine if switch is beneficial
  - Return gas switch decision

- [ ] Implement `executeGasSwitch(tissues, depth, fromGas, toGas)`
  - Spend GAS_SWITCH_TIME at depth
  - Update tissues during switch
  - Create GasSwitch record
  - Update runtime

- [ ] Update `calculateDiveProfile` to support gas switching
  - Check for gas switches during ascent
  - Apply switches at optimal depths
  - Track all switches in profile

### 3.3 Decompression with Multiple Gases

- [ ] Update decompression stop calculation
  - Use best available gas at each stop depth
  - Switch gases automatically when beneficial
  - Track gas used for each stop

- [ ] Implement `optimizeDecoSchedule(stops, gasInventory)`
  - Review all deco stops
  - Apply optimal gas for each depth
  - Minimize total deco time

---

## Phase 4: UI Components

### 4.1 Segment Manager Component (`src/components/calculator/SegmentManager.vue`)

- [ ] Create component structure
  - Template with segment list
  - Add/remove segment buttons
  - Depth and duration inputs for each segment

- [ ] Implement segment management
  - Add segment (max 5)
  - Remove segment
  - Update segment values
  - Validate segment data

- [ ] Add visual feedback
  - Total dive time display
  - Segment count indicator
  - Validation error messages
  - Segment reordering (optional)

- [ ] Emit events
  - `@segments-changed` with updated array
  - `@validation-error` with error details

### 4.2 Gas Manager Component (`src/components/calculator/GasManager.vue`)

- [ ] Create component structure
  - Bottom gas selector
  - Deco gas list
  - Add/remove deco gas buttons

- [ ] Implement gas management
  - Select bottom gas from predefined list
  - Add deco gas (with MOD display)
  - Remove deco gas
  - Custom gas mix option

- [ ] Display MOD for each gas
  - Calculate and show MOD
  - Color-code by safety (green/yellow/red)
  - Show optimal switch depth

- [ ] Emit events
  - `@gas-inventory-changed` with updated inventory
  - `@validation-error` with error details

### 4.3 Rate Configuration Component (`src/components/calculator/RateConfiguration.vue`)

- [ ] Create component structure
  - Descent rate slider (10-30 m/min)
  - Ascent rate slider (6-12 m/min)
  - Preset buttons (Conservative/Standard/Aggressive)

- [ ] Implement rate management
  - Update descent rate
  - Update ascent rate
  - Apply presets

- [ ] Emit events
  - `@rates-changed` with {descentRate, ascentRate}

### 4.4 Update DiveCalculatorInput

- [ ] Add mode toggle (Simple/Advanced)
  - Simple: single depth/time/gas (existing)
  - Advanced: multi-level/multi-gas (new)

- [ ] Integrate new components
  - Add SegmentManager in advanced mode
  - Add GasManager in advanced mode
  - Add RateConfiguration in advanced mode

- [ ] Update calculate handler
  - Build MultiLevelDiveParameters
  - Validate all inputs
  - Emit calculate event

---

## Phase 5: Results Display

### 5.1 Update DiveProfileResults (`src/components/calculator/DiveProfileResults.vue`)

- [ ] Add segment summary table
  - Columns: Depth, Duration, Runtime, Gas
  - Show all dive segments
  - Highlight current segment

- [ ] Add gas switch table
  - Columns: Depth, From→To, Reason
  - Show all gas switches
  - Color-code by gas type

- [ ] Update decompression table
  - Show gas used at each stop
  - Indicate gas switches
  - Display switch time

- [ ] Add gas usage summary
  - List all gases used
  - Show depth ranges for each
  - Display total time on each gas

### 5.2 Update DiveProfileChart (`src/components/visualizations/DiveProfileChart.vue`)

- [ ] Enhance chart for multi-level
  - Different colors for each segment
  - Clear segment boundaries
  - Smooth transitions between segments

- [ ] Add gas switch markers
  - Visual indicators at switch depths
  - Gas labels on chart
  - Color-coded by gas type

- [ ] Update legend
  - Show all gases used
  - Segment color key
  - Gas switch symbols

- [ ] Improve interactivity
  - Hover to see segment details
  - Click to highlight gas switches
  - Zoom to specific segments

---

## Phase 6: Validation & Warnings

### 6.1 Segment Validation

- [ ] Validate segment count (max 5)
- [ ] Validate depth > 0 for all segments
- [ ] Validate duration > 0 for all segments
- [ ] Warn if segments don't decrease in depth
- [ ] Validate total dive time reasonable

### 6.2 Gas Validation

- [ ] Validate at least one bottom gas
- [ ] Validate gas percentages sum to 100%
- [ ] Validate MOD deeper than shallowest segment
- [ ] Validate deco gases have higher O2 than bottom
- [ ] Check for duplicate gases

### 6.3 Safety Warnings

- [ ] PPO2 warnings at all depths
- [ ] Narcosis warnings (END > 30m)
- [ ] Gas switch depth warnings
- [ ] Insufficient deco gas warnings
- [ ] Extreme profile warnings

---

## Phase 7: Testing

### 7.1 Unit Tests

- [ ] Test MOD calculations
- [ ] Test gas selection algorithm
- [ ] Test segment processing
- [ ] Test gas switching logic
- [ ] Test validation functions

### 7.2 Integration Tests

- [ ] Test simple multi-level dive (2 segments)
- [ ] Test complex multi-level dive (5 segments)
- [ ] Test single deco gas scenario
- [ ] Test multiple deco gas scenario
- [ ] Test edge cases (deep dive, long dive, etc.)

### 7.3 Test Scenarios

**Scenario 1: Simple Multi-Level**
```
Segments: 30m/20min, 20m/15min
Gases: Air only
Expected: Proper tissue loading, no gas switches
```

**Scenario 2: Multi-Gas Deco**
```
Segments: 40m/25min
Gases: Air (bottom), EAN50 (deco), O2 (deco)
Expected: Switches at 21m and 6m
```

**Scenario 3: Complex Profile**
```
Segments: 35m/15min, 30m/10min, 25m/8min
Gases: Air (bottom), EAN50 (deco)
Expected: Multi-level with single gas switch
```

---

## Phase 8: Documentation

### 8.1 User Documentation

- [ ] Create user guide for multi-level dives
- [ ] Document gas selection process
- [ ] Explain MOD calculations
- [ ] Provide example dive plans
- [ ] Add safety disclaimers

### 8.2 Developer Documentation

- [ ] Document new type definitions
- [ ] Explain gas switching algorithm
- [ ] Document API changes
- [ ] Add code examples
- [ ] Update README

---

## Backward Compatibility Checklist

- [ ] Existing single-level dives still work
- [ ] Simple mode available for basic users
- [ ] Type guards for parameter detection
- [ ] Graceful fallback for missing data
- [ ] Migration path documented

---

## Success Criteria

✅ All 22 todo items completed
✅ All tests passing
✅ Documentation complete
✅ Code reviewed
✅ User testing successful
✅ Performance acceptable
✅ No regressions in existing features

---

## Estimated Timeline

- **Phase 1-2**: 3-4 days (Foundation & Utilities)
- **Phase 3**: 4-5 days (Core Algorithm)
- **Phase 4**: 5-6 days (UI Components)
- **Phase 5**: 3-4 days (Results Display)
- **Phase 6**: 2-3 days (Validation)
- **Phase 7**: 2-3 days (Testing)
- **Phase 8**: 1-2 days (Documentation)

**Total**: ~20-27 days (3-4 weeks)

---

## Next Steps

1. Review and approve this plan
2. Set up development branch
3. Begin Phase 1 implementation
4. Regular progress reviews
5. Iterative testing throughout

---

**Ready to proceed?** Switch to Code mode to begin implementation!