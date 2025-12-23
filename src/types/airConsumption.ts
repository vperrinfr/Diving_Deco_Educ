export interface CylinderConfig {
  id: string;
  name: string;
  volume: number; // Litres
  workingPressure: number; // Bar
  material: 'steel' | 'aluminum';
  weight: number; // kg (empty)
}

export interface AirConsumptionData {
  surfaceAirConsumptionRate: number; // SAC rate in L/min
  cylinders: CylinderSelection[];
  reservePressure: number; // Bar (minimum pressure to keep)
}

export interface CylinderSelection {
  cylinderId: string;
  startPressure: number; // Bar
  gasType: 'bottom' | 'deco' | 'bailout';
}

export interface AirConsumptionResult {
  totalAirNeeded: number; // Litres at surface
  cylinderUsage: CylinderUsage[];
  warnings: string[];
  isSufficient: boolean;
}

export interface CylinderUsage {
  cylinderId: string;
  startPressure: number;
  endPressure: number;
  volumeUsed: number; // Litres at surface
  percentageUsed: number;
}

// Predefined cylinder configurations
export const STANDARD_CYLINDERS: CylinderConfig[] = [
  {
    id: 'steel-12l-200',
    name: '12L Steel 200 bar',
    volume: 12,
    workingPressure: 200,
    material: 'steel',
    weight: 14.5
  },
  {
    id: 'steel-15l-200',
    name: '15L Steel 200 bar',
    volume: 15,
    workingPressure: 200,
    material: 'steel',
    weight: 18
  },
  {
    id: 'steel-18l-200',
    name: '18L Steel 200 bar',
    volume: 18,
    workingPressure: 200,
    material: 'steel',
    weight: 21
  },
  {
    id: 'aluminum-11l-207',
    name: '11L Aluminum 207 bar (AL80)',
    volume: 11,
    workingPressure: 207,
    material: 'aluminum',
    weight: 14.2
  },
  {
    id: 'steel-10l-300',
    name: '10L Steel 300 bar',
    volume: 10,
    workingPressure: 300,
    material: 'steel',
    weight: 14
  },
  {
    id: 'steel-7l-300',
    name: '7L Steel 300 bar (Stage/Deco)',
    volume: 7,
    workingPressure: 300,
    material: 'steel',
    weight: 9.5
  },
  {
    id: 'aluminum-6l-207',
    name: '6L Aluminum 207 bar (AL40)',
    volume: 6,
    workingPressure: 207,
    material: 'aluminum',
    weight: 6.8
  }
];

// Made with Bob
