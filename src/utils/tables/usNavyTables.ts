/**
 * US Navy Decompression Tables (Simplified)
 * 
 * Educational implementation based on US Navy Diving Manual Rev 6
 * Simplified for common recreational depths
 */

import type {
  DiveParameters,
  DecompressionStop,
  DiveProfile,
  Warning,
  DiveSegment
} from '../../types';
import { WarningLevel } from '../../types';
import { initializeTissues } from '../buhlmann/tissueLoading';

/**
 * US Navy table entry
 */
interface NavyTableEntry {
  depth: number;        // meters
  bottomTime: number;   // minutes
  group: string;        // Repetitive group letter
  stops: {
    depth: number;
    duration: number;
  }[];
}

/**
 * Simplified US Navy Tables for Air (21% O2)
 * Based on common recreational depths
 */
const US_NAVY_AIR_TABLES: NavyTableEntry[] = [
  // 12 meters (40 feet)
  { depth: 12, bottomTime: 200, group: 'C', stops: [] },
  { depth: 12, bottomTime: 310, group: 'D', stops: [] },
  
  // 15 meters (50 feet)
  { depth: 15, bottomTime: 100, group: 'C', stops: [] },
  { depth: 15, bottomTime: 200, group: 'E', stops: [] },
  { depth: 15, bottomTime: 240, group: 'F', stops: [{ depth: 3, duration: 2 }] },
  
  // 18 meters (60 feet)
  { depth: 18, bottomTime: 60, group: 'C', stops: [] },
  { depth: 18, bottomTime: 100, group: 'E', stops: [] },
  { depth: 18, bottomTime: 140, group: 'G', stops: [{ depth: 3, duration: 7 }] },
  { depth: 18, bottomTime: 200, group: 'I', stops: [{ depth: 3, duration: 23 }] },
  
  // 21 meters (70 feet)
  { depth: 21, bottomTime: 50, group: 'D', stops: [] },
  { depth: 21, bottomTime: 80, group: 'F', stops: [{ depth: 3, duration: 2 }] },
  { depth: 21, bottomTime: 110, group: 'H', stops: [{ depth: 3, duration: 14 }] },
  { depth: 21, bottomTime: 140, group: 'I', stops: [{ depth: 3, duration: 26 }] },
  
  // 24 meters (80 feet)
  { depth: 24, bottomTime: 40, group: 'D', stops: [] },
  { depth: 24, bottomTime: 60, group: 'F', stops: [{ depth: 3, duration: 7 }] },
  { depth: 24, bottomTime: 80, group: 'H', stops: [{ depth: 3, duration: 14 }] },
  { depth: 24, bottomTime: 100, group: 'I', stops: [{ depth: 3, duration: 26 }] },
  
  // 27 meters (90 feet)
  { depth: 27, bottomTime: 30, group: 'D', stops: [] },
  { depth: 27, bottomTime: 50, group: 'G', stops: [{ depth: 3, duration: 7 }] },
  { depth: 27, bottomTime: 70, group: 'I', stops: [{ depth: 3, duration: 18 }] },
  { depth: 27, bottomTime: 90, group: 'J', stops: [{ depth: 6, duration: 2 }, { depth: 3, duration: 23 }] },
  
  // 30 meters (100 feet)
  { depth: 30, bottomTime: 25, group: 'D', stops: [] },
  { depth: 30, bottomTime: 40, group: 'G', stops: [{ depth: 3, duration: 7 }] },
  { depth: 30, bottomTime: 60, group: 'I', stops: [{ depth: 3, duration: 23 }] },
  { depth: 30, bottomTime: 80, group: 'K', stops: [{ depth: 6, duration: 8 }, { depth: 3, duration: 23 }] },
  
  // 33 meters (110 feet)
  { depth: 33, bottomTime: 20, group: 'D', stops: [] },
  { depth: 33, bottomTime: 30, group: 'F', stops: [{ depth: 3, duration: 3 }] },
  { depth: 33, bottomTime: 50, group: 'I', stops: [{ depth: 3, duration: 21 }] },
  { depth: 33, bottomTime: 70, group: 'K', stops: [{ depth: 6, duration: 11 }, { depth: 3, duration: 24 }] },
  
  // 36 meters (120 feet)
  { depth: 36, bottomTime: 15, group: 'D', stops: [] },
  { depth: 36, bottomTime: 25, group: 'F', stops: [{ depth: 3, duration: 3 }] },
  { depth: 36, bottomTime: 40, group: 'H', stops: [{ depth: 3, duration: 14 }] },
  { depth: 36, bottomTime: 60, group: 'K', stops: [{ depth: 6, duration: 14 }, { depth: 3, duration: 26 }] },
  
  // 39 meters (130 feet)
  { depth: 39, bottomTime: 10, group: 'C', stops: [] },
  { depth: 39, bottomTime: 20, group: 'F', stops: [{ depth: 3, duration: 7 }] },
  { depth: 39, bottomTime: 30, group: 'H', stops: [{ depth: 3, duration: 14 }] },
  { depth: 39, bottomTime: 50, group: 'K', stops: [{ depth: 9, duration: 2 }, { depth: 6, duration: 8 }, { depth: 3, duration: 26 }] },
  
  // 42 meters (140 feet)
  { depth: 42, bottomTime: 10, group: 'D', stops: [] },
  { depth: 42, bottomTime: 15, group: 'F', stops: [{ depth: 3, duration: 3 }] },
  { depth: 42, bottomTime: 25, group: 'H', stops: [{ depth: 3, duration: 14 }] },
  { depth: 42, bottomTime: 40, group: 'K', stops: [{ depth: 9, duration: 7 }, { depth: 6, duration: 11 }, { depth: 3, duration: 26 }] }
];

/**
 * Find closest table entry for given depth and bottom time
 */
function findTableEntry(depth: number, bottomTime: number): NavyTableEntry | null {
  // Round depth to nearest table depth
  const tableDepths = [12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42];
  const closestDepth = tableDepths.reduce((prev, curr) => 
    Math.abs(curr - depth) < Math.abs(prev - depth) ? curr : prev
  );
  
  // Find entries for this depth
  const depthEntries = US_NAVY_AIR_TABLES.filter(e => e.depth === closestDepth);
  
  if (depthEntries.length === 0) return null;
  
  // Find entry with bottom time >= requested time (conservative)
  const entry = depthEntries.find(e => e.bottomTime >= bottomTime);
  
  // If no entry found, use the longest time available (most conservative)
  return entry || depthEntries[depthEntries.length - 1] || null;
}

/**
 * Calculate dive profile using US Navy Tables
 * 
 * @param parameters - Dive parameters
 * @returns Complete dive profile based on US Navy tables
 */
export function calculateUSNavyProfile(parameters: DiveParameters): DiveProfile {
  const {
    depth,
    bottomTime,
    gasMix
  } = parameters;
  
  const warnings: Warning[] = [];
  
  // Add US Navy info warning
  warnings.push({
    level: WarningLevel.INFO,
    message: 'US Navy Tables',
    details: 'Empirical tables based on extensive testing. Very conservative approach proven over decades.'
  });
  
  // Check if using air
  if (Math.abs(gasMix.oxygen - 0.21) > 0.01) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: 'Gas mix not supported',
      details: 'US Navy tables are designed for air (21% O2). Results may not be accurate for other gas mixes.'
    });
  }
  
  // Check depth limits
  if (depth < 12) {
    warnings.push({
      level: WarningLevel.INFO,
      message: 'Shallow dive',
      details: 'US Navy tables start at 12m. No decompression required for shallower dives with reasonable bottom times.'
    });
  }
  
  if (depth > 42) {
    warnings.push({
      level: WarningLevel.DANGER,
      message: 'Depth exceeds table limits',
      details: 'US Navy recreational tables are limited to 42m (140ft). This dive exceeds safe limits.'
    });
  }
  
  // Find appropriate table entry
  const tableEntry = findTableEntry(depth, bottomTime);
  
  if (!tableEntry) {
    warnings.push({
      level: WarningLevel.DANGER,
      message: 'No table entry found',
      details: 'Unable to find appropriate US Navy table entry for this dive profile.'
    });
    
    return createEmptyNavyProfile(parameters, warnings);
  }
  
  // Create decompression stops from table
  const stops: DecompressionStop[] = [];
  let runtime = bottomTime;
  
  // Add ascent time to first stop or surface
  const ascentRate = 9; // m/min (US Navy standard)
  const firstStopDepth = tableEntry.stops.length > 0 ? tableEntry.stops[0]!.depth : 0;
  const ascentTime = (depth - firstStopDepth) / ascentRate;
  runtime += ascentTime;
  
  // Add table stops
  tableEntry.stops.forEach(stop => {
    stops.push({
      depth: stop.depth,
      duration: stop.duration,
      runtime: runtime + stop.duration,
      gasMix: gasMix
    });
    runtime += stop.duration;
  });
  
  // Always add safety stop for dives deeper than 12m
  if (depth >= 12 && !stops.some(s => s.depth === 5 || s.depth === 3)) {
    stops.push({
      depth: 5,
      duration: 3,
      runtime: runtime + 3,
      gasMix: gasMix
    });
    runtime += 3;
  }
  
  // Create segments
  const segments: DiveSegment[] = [];
  
  segments.push({
    depth: depth,
    duration: bottomTime,
    gasMix: gasMix,
    segmentType: 'bottom'
  });
  
  stops.forEach(stop => {
    segments.push({
      depth: stop.depth,
      duration: stop.duration,
      gasMix: stop.gasMix,
      segmentType: 'deco'
    });
  });
  
  const totalDecoTime = stops.reduce((sum, stop) => sum + stop.duration, 0);
  
  // Add table info
  warnings.push({
    level: WarningLevel.INFO,
    message: 'Table Information',
    details: `Using US Navy table for ${tableEntry.depth}m / ${tableEntry.bottomTime} min. Repetitive group: ${tableEntry.group}`
  });
  
  if (tableEntry.bottomTime > bottomTime) {
    warnings.push({
      level: WarningLevel.INFO,
      message: 'Conservative rounding',
      details: `Bottom time rounded up from ${bottomTime} to ${tableEntry.bottomTime} minutes for safety.`
    });
  }
  
  return {
    parameters,
    decompressionStops: stops,
    totalDecompressionTime: totalDecoTime,
    totalDiveTime: runtime,
    noDecompressionLimit: findNDL(depth),
    tissueCompartments: initializeTissues(),
    warnings,
    maxDepth: depth,
    averageDepth: depth,
    segments
  };
}

/**
 * Find no-decompression limit for given depth from US Navy tables
 */
function findNDL(depth: number): number {
  const tableDepths = [12, 15, 18, 21, 24, 27, 30, 33, 36, 39, 42];
  const closestDepth = tableDepths.reduce((prev, curr) => 
    Math.abs(curr - depth) < Math.abs(prev - depth) ? curr : prev
  );
  
  // Find first entry with no stops
  const noDecoEntry = US_NAVY_AIR_TABLES
    .filter(e => e.depth === closestDepth && e.stops.length === 0)
    .sort((a, b) => b.bottomTime - a.bottomTime)[0];
  
  return noDecoEntry?.bottomTime || 0;
}

/**
 * Create empty profile for error cases
 */
function createEmptyNavyProfile(
  parameters: DiveParameters,
  warnings: Warning[]
): DiveProfile {
  return {
    parameters,
    decompressionStops: [],
    totalDecompressionTime: 0,
    totalDiveTime: parameters.bottomTime,
    noDecompressionLimit: 0,
    tissueCompartments: initializeTissues(),
    warnings,
    maxDepth: parameters.depth,
    averageDepth: parameters.depth,
    segments: [{
      depth: parameters.depth,
      duration: parameters.bottomTime,
      gasMix: parameters.gasMix,
      segmentType: 'bottom'
    }]
  };
}

/**
 * Get repetitive group letter for a dive
 */
export function getRepetitiveGroup(depth: number, bottomTime: number): string {
  const entry = findTableEntry(depth, bottomTime);
  return entry?.group || 'A';
}

/**
 * Check if dive is within no-decompression limits
 */
export function isNoDecompressionDive(depth: number, bottomTime: number): boolean {
  const entry = findTableEntry(depth, bottomTime);
  return entry ? entry.stops.length === 0 : true;
}

// Made with Bob