// Gas Mix Types
export interface GasMix {
  oxygen: number;    // fraction (0-1)
  nitrogen: number;  // fraction (0-1)
  helium: number;    // fraction (0-1)
  name?: string;     // e.g., "Air", "EAN32"
}

// Tissue Compartment Types
export interface TissueCompartment {
  number: number;
  n2Pressure: number;
  hePressure: number;
  n2HalfTime: number;
  heHalfTime: number;
  a: number;
  b: number;
  ceiling: number;
  mValue: number;
}

// Gas Inventory for multi-gas dives
export interface GasInventory {
  bottomGas: GasMix;
  decoGases: GasMix[];
}

// Gas Switch Information
export interface GasSwitch {
  depth: number;
  fromGas: GasMix;
  toGas: GasMix;
  reason: 'optimal' | 'mod_limit' | 'deco';
}

// Dive Segment (for multi-level dives)
export interface DiveSegment {
  depth: number;
  duration: number;
  gasMix: GasMix;
  segmentType: 'descent' | 'bottom' | 'ascent' | 'deco';
}

// Simple Dive Parameters (backward compatible)
export interface DiveParameters {
  depth: number;              // meters
  bottomTime: number;         // minutes
  gasMix: GasMix;
  gradientFactorLow: number;  // 0-100
  gradientFactorHigh: number; // 0-100
  units: 'metric' | 'imperial';
}

// Multi-Level Dive Parameters
export interface MultiLevelDiveParameters {
  segments: DiveSegment[];
  gasInventory: GasInventory;
  gradientFactorLow: number;
  gradientFactorHigh: number;
  descentRate: number;
  ascentRate: number;
  units: 'metric' | 'imperial';
}

// Decompression Stop
export interface DecompressionStop {
  depth: number;
  duration: number;
  runtime: number;
  gasMix: GasMix;
  gasSwitch?: GasSwitch;  // If gas switch occurs at this stop
}

// Warning Types
export const WarningLevel = {
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger'
} as const;

export type WarningLevelType = typeof WarningLevel[keyof typeof WarningLevel];

export interface Warning {
  level: WarningLevelType;
  message: string;
  details?: string;
}

// Dive Profile
export interface DiveProfile {
  parameters: DiveParameters | MultiLevelDiveParameters;
  decompressionStops: DecompressionStop[];
  totalDecompressionTime: number;
  totalDiveTime: number;
  noDecompressionLimit: number;
  tissueCompartments: TissueCompartment[];
  warnings: Warning[];
  maxDepth: number;
  averageDepth: number;
  gasSwitches?: GasSwitch[];  // Track all gas switches in the dive
  segments?: DiveSegment[];   // Track all segments for multi-level dives
}

// Chart Data Point
export interface ChartDataPoint {
  x: number;  // time in minutes
  y: number;  // depth in meters
}

// Predefined Gas Mixes
export const PREDEFINED_GASES: Record<string, GasMix> = {
  AIR: {
    oxygen: 0.21,
    nitrogen: 0.79,
    helium: 0,
    name: 'Air'
  },
  EAN32: {
    oxygen: 0.32,
    nitrogen: 0.68,
    helium: 0,
    name: 'EAN32'
  },
  EAN36: {
    oxygen: 0.36,
    nitrogen: 0.64,
    helium: 0,
    name: 'EAN36'
  },
  EAN40: {
    oxygen: 0.40,
    nitrogen: 0.60,
    helium: 0,
    name: 'EAN40'
  },
  EAN50: {
    oxygen: 0.50,
    nitrogen: 0.50,
    helium: 0,
    name: 'EAN50'
  },
  EAN80: {
    oxygen: 0.80,
    nitrogen: 0.20,
    helium: 0,
    name: 'EAN80'
  },
  OXYGEN: {
    oxygen: 1.0,
    nitrogen: 0,
    helium: 0,
    name: 'Oxygen'
  },
  TRIMIX_18_45: {
    oxygen: 0.18,
    nitrogen: 0.37,
    helium: 0.45,
    name: 'Trimix 18/45'
  },
  TRIMIX_21_35: {
    oxygen: 0.21,
    nitrogen: 0.44,
    helium: 0.35,
    name: 'Trimix 21/35'
  }
};

// Helper function to check if parameters are multi-level
export function isMultiLevelDive(
  params: DiveParameters | MultiLevelDiveParameters
): params is MultiLevelDiveParameters {
  return 'segments' in params;
}

// Unit Conversion Types
export type UnitSystem = 'metric' | 'imperial';

export interface UnitConversion {
  depth: {
    from: number;
    to: number;
    unit: string;
  };
  pressure: {
    from: number;
    to: number;
    unit: string;
  };
}

// Made with Bob
