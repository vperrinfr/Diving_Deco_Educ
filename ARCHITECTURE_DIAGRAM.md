# Multi-Level Multi-Gas Architecture Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[DiveCalculatorInput.vue]
        SM[SegmentManager.vue]
        GM[GasManager.vue]
        RC[RateConfig.vue]
    end
    
    subgraph "Presentation Layer"
        PR[DiveProfileResults.vue]
        PC[DiveProfileChart.vue]
        WD[WarningsDisplay.vue]
    end
    
    subgraph "Business Logic Layer"
        DC[calculateMultiLevelDiveProfile]
        GS[Gas Switching Logic]
        TL[Tissue Loading]
        GF[Gradient Factors]
    end
    
    subgraph "Utility Layer"
        GM_UTIL[Gas Mix Utils]
        MOD[MOD Calculator]
        VAL[Validators]
        CONV[Unit Converters]
    end
    
    subgraph "Data Layer"
        TYPES[Type Definitions]
        CONST[Constants]
    end
    
    UI --> SM
    UI --> GM
    UI --> RC
    
    SM --> DC
    GM --> DC
    RC --> DC
    
    DC --> GS
    DC --> TL
    DC --> GF
    
    GS --> GM_UTIL
    GS --> MOD
    TL --> GM_UTIL
    
    DC --> PR
    DC --> PC
    DC --> WD
    
    GM_UTIL --> TYPES
    MOD --> CONST
    VAL --> TYPES
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant UI as DiveCalculatorInput
    participant SM as SegmentManager
    participant GM as GasManager
    participant Algo as Decompression Algorithm
    participant GS as Gas Switcher
    participant Results as Results Display
    
    User->>UI: Configure dive
    User->>SM: Add segments (depth/time)
    SM->>UI: Segments array
    User->>GM: Select gases
    GM->>GM: Calculate MODs
    GM->>UI: Gas inventory
    
    User->>UI: Click Calculate
    UI->>Algo: MultiLevelDiveParameters
    
    loop For each segment
        Algo->>Algo: Descend to depth
        Algo->>Algo: Load tissues
        Algo->>Algo: Validate gas safety
    end
    
    Algo->>Algo: Calculate first stop
    
    loop Ascent with deco
        Algo->>GS: Check for better gas
        GS->>GS: Evaluate available gases
        GS-->>Algo: Best gas for depth
        Algo->>Algo: Switch gas if optimal
        Algo->>Algo: Continue ascent
        Algo->>Algo: Add deco stops
    end
    
    Algo->>Results: DiveProfile with gas switches
    Results->>User: Display results
```

## Component Hierarchy

```mermaid
graph TD
    App[App.vue]
    
    App --> Input[DiveCalculatorInput.vue]
    App --> Results[DiveProfileResults.vue]
    App --> Chart[DiveProfileChart.vue]
    App --> Warnings[WarningsDisplay.vue]
    
    Input --> SegMgr[SegmentManager.vue]
    Input --> GasMgr[GasManager.vue]
    Input --> RateCfg[RateConfiguration.vue]
    
    SegMgr --> SegItem[SegmentItem.vue]
    GasMgr --> GasItem[GasItem.vue]
    
    Results --> SegTable[SegmentTable.vue]
    Results --> GasSwitch[GasSwitchTable.vue]
    Results --> DecoTable[DecoStopTable.vue]
```

## Gas Selection Algorithm Flow

```mermaid
flowchart TD
    Start([Start: At depth D])
    
    Start --> CheckPhase{In deco phase?}
    
    CheckPhase -->|Yes| GetDeco[Get deco gases]
    CheckPhase -->|No| GetBottom[Use bottom gas]
    
    GetDeco --> FilterMOD[Filter by MOD >= D]
    FilterMOD --> HasGases{Any gases available?}
    
    HasGases -->|No| UseBottom[Use bottom gas]
    HasGases -->|Yes| CalcPPO2[Calculate PPO2 for each]
    
    CalcPPO2 --> FindBest[Find highest O2 within limits]
    FindBest --> ValidateSwitch{Worth switching?}
    
    ValidateSwitch -->|Yes| SwitchGas[Switch to new gas]
    ValidateSwitch -->|No| KeepCurrent[Keep current gas]
    
    GetBottom --> End([Return gas])
    UseBottom --> End
    SwitchGas --> End
    KeepCurrent --> End
```

## Multi-Level Segment Processing

```mermaid
flowchart TD
    Start([Start: Process Segments])
    
    Start --> Init[Initialize tissues at surface]
    Init --> GetSeg[Get next segment]
    
    GetSeg --> HasSeg{More segments?}
    HasSeg -->|No| CalcAscent[Calculate ascent]
    
    HasSeg -->|Yes| Descend[Descend to segment depth]
    Descend --> LoadTissue[Load tissues for duration]
    LoadTissue --> ValidateGas[Validate gas at depth]
    
    ValidateGas --> Safe{Gas safe?}
    Safe -->|No| AddWarning[Add warning]
    Safe -->|Yes| NextSeg[Move to next segment]
    
    AddWarning --> NextSeg
    NextSeg --> GetSeg
    
    CalcAscent --> FindStop[Find first stop depth]
    FindStop --> AscentLoop[Ascent with gas switching]
    AscentLoop --> End([Return profile])
```

## Type Relationships

```mermaid
classDiagram
    class GasMix {
        +number oxygen
        +number nitrogen
        +number helium
        +string name
    }
    
    class DiveSegment {
        +number depth
        +number duration
        +GasMix gasMix
        +string segmentType
    }
    
    class GasInventory {
        +GasMix bottomGas
        +GasMix[] decoGases
    }
    
    class MultiLevelDiveParameters {
        +DiveSegment[] segments
        +GasInventory gasInventory
        +number gradientFactorLow
        +number gradientFactorHigh
        +number descentRate
        +number ascentRate
        +string units
    }
    
    class GasSwitch {
        +number depth
        +GasMix fromGas
        +GasMix toGas
        +string reason
    }
    
    class DecompressionStop {
        +number depth
        +number duration
        +number runtime
        +GasMix gasMix
        +GasSwitch gasSwitch
    }
    
    class DiveProfile {
        +MultiLevelDiveParameters parameters
        +DecompressionStop[] decompressionStops
        +GasSwitch[] gasSwitches
        +number totalDecompressionTime
        +number totalDiveTime
        +TissueCompartment[] tissueCompartments
        +Warning[] warnings
    }
    
    MultiLevelDiveParameters --> DiveSegment
    MultiLevelDiveParameters --> GasInventory
    GasInventory --> GasMix
    DiveSegment --> GasMix
    DecompressionStop --> GasMix
    DecompressionStop --> GasSwitch
    GasSwitch --> GasMix
    DiveProfile --> MultiLevelDiveParameters
    DiveProfile --> DecompressionStop
    DiveProfile --> GasSwitch
```

## UI Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Decompression Calculator                      │
│                  Bühlmann ZHL-16C with Multi-Gas                │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────────────────────┐
│  INPUT PANEL         │  RESULTS PANEL                           │
│                      │                                          │
│ ┌──────────────────┐ │ ┌──────────────────────────────────────┐ │
│ │ Dive Segments    │ │ │ Warnings & Information               │ │
│ │ ┌──────────────┐ │ │ │ • Decompression required             │ │
│ │ │ Seg 1: 30m   │ │ │ │ • Gas switch at 21m                  │ │
│ │ │ 15min        │ │ │ └──────────────────────────────────────┘ │
│ │ └──────────────┘ │ │                                          │
│ │ ┌──────────────┐ │ │ ┌──────────────────────────────────────┐ │
│ │ │ Seg 2: 25m   │ │ │ │ Dive Segments Summary                │ │
│ │ │ 10min        │ │ │ │ Depth | Time | Runtime | Gas         │ │
│ │ └──────────────┘ │ │ │ 30m   | 15m  | 16.5m   | Air         │ │
│ │ [+ Add Segment]  │ │ │ 25m   | 10m  | 27.0m   | Air         │ │
│ └──────────────────┘ │ └──────────────────────────────────────┘ │
│                      │                                          │
│ ┌──────────────────┐ │ ┌──────────────────────────────────────┐ │
│ │ Gas Configuration│ │ │ Decompression Schedule               │ │
│ │ Bottom: Air      │ │ │ Depth | Time | Runtime | Gas         │ │
│ │ Deco:            │ │ │ 21m   | 2m   | 45m     | Air→EAN50   │ │
│ │ • EAN50 (21m)   │ │ │ 18m   | 3m   | 48m     | EAN50       │ │
│ │ • O2 (6m)       │ │ │ 6m    | 5m   | 53m     | EAN50→O2    │ │
│ │ [+ Add Gas]     │ │ └──────────────────────────────────────┘ │
│ └──────────────────┘ │                                          │
│                      │ ┌──────────────────────────────────────┐ │
│ ┌──────────────────┐ │ │ Dive Profile Chart                   │ │
│ │ Rates            │ │ │                                      │ │
│ │ Descent: 20m/min │ │ │     [Multi-level profile graph]      │ │
│ │ Ascent: 9m/min   │ │ │                                      │ │
│ └──────────────────┘ │ └──────────────────────────────────────┘ │
│                      │                                          │
│ [Calculate Profile]  │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

## Implementation Phases Timeline

```mermaid
gantt
    title Multi-Level Multi-Gas Implementation Timeline
    dateFormat YYYY-MM-DD
    section Phase 1: Types
    Type Definitions           :a1, 2025-11-27, 1d
    Constants Update          :a2, after a1, 1d
    Gas Utilities            :a3, after a2, 1d
    
    section Phase 2: Algorithm
    Multi-Segment Processing  :b1, after a3, 2d
    Gas Switching Logic      :b2, after b1, 2d
    Tissue Loading Updates   :b3, after b2, 1d
    
    section Phase 3: UI
    SegmentManager Component :c1, after b3, 2d
    GasManager Component     :c2, after c1, 2d
    Input Integration        :c3, after c2, 1d
    
    section Phase 4: Display
    Results Enhancement      :d1, after c3, 2d
    Chart Updates           :d2, after d1, 2d
    
    section Phase 5: Testing
    Unit Tests              :e1, after d2, 1d
    Integration Tests       :e2, after e1, 1d
    Documentation          :e3, after e2, 1d
```

---

**Note**: This architecture supports backward compatibility with single-level dives while enabling advanced multi-level, multi-gas capabilities.