/**
 * Gas Mix Utilities
 *
 * Functions for gas mix calculations and validations
 */

import type { GasMix, GasInventory, Warning } from '../types';
import { WATER_VAPOR_PRESSURE, MAX_PPO2_WORKING, MAX_PPO2_DECO, MIN_DECO_GAS_DEPTH } from './buhlmann/constants';
import { depthToPressure } from './conversions';
import { WarningLevel } from '../types';

/**
 * Calculate inspired inert gas pressure
 * 
 * @param ambientPressure - Ambient pressure in bar
 * @param gasFraction - Fraction of the gas (0-1)
 * @returns Inspired pressure in bar
 */
export function inspiredPressure(ambientPressure: number, gasFraction: number): number {
  return (ambientPressure - WATER_VAPOR_PRESSURE) * gasFraction;
}

/**
 * Calculate partial pressure of oxygen (PPO2)
 * 
 * @param depth - Depth in meters
 * @param gasMix - Gas mix
 * @returns PPO2 in bar
 */
export function calculatePPO2(depth: number, gasMix: GasMix): number {
  const ambientPressure = depthToPressure(depth);
  return ambientPressure * gasMix.oxygen;
}

/**
 * Calculate partial pressure of nitrogen (PPN2)
 * 
 * @param depth - Depth in meters
 * @param gasMix - Gas mix
 * @returns PPN2 in bar
 */
export function calculatePPN2(depth: number, gasMix: GasMix): number {
  const ambientPressure = depthToPressure(depth);
  return inspiredPressure(ambientPressure, gasMix.nitrogen);
}

/**
 * Calculate equivalent narcotic depth (END)
 *
 * Helium is non-narcotic, so END represents the depth on air
 * that would have the same narcotic effect as the current gas at actual depth.
 *
 * Formula: END = (Depth + 10) × (fN₂ + fO₂) - 10
 * where fN₂ and fO₂ are fractions of nitrogen and oxygen
 *
 * @param depth - Actual depth in meters
 * @param gasMix - Gas mix
 * @returns END in meters
 */
export function calculateEND(depth: number, gasMix: GasMix): number {
  // Calculate narcotic fraction (N2 + O2, helium is non-narcotic)
  const narcoticFraction = gasMix.nitrogen + gasMix.oxygen;
  
  // END formula: (depth + 10) × narcotic_fraction - 10
  return (depth + 10) * narcoticFraction - 10;
}

/**
 * Calculate maximum operating depth (MOD) for a gas mix
 * 
 * @param gasMix - Gas mix
 * @param maxPPO2 - Maximum PPO2 (default: 1.4 bar for working dives)
 * @returns MOD in meters
 */
export function calculateMOD(gasMix: GasMix, maxPPO2: number = MAX_PPO2_WORKING): number {
  const maxPressure = maxPPO2 / gasMix.oxygen;
  return (maxPressure - 1.01325) / 0.09985;
}

/**
 * Validate gas mix fractions sum to 1.0
 * 
 * @param gasMix - Gas mix to validate
 * @returns true if valid
 */
export function validateGasMix(gasMix: GasMix): boolean {
  const sum = gasMix.oxygen + gasMix.nitrogen + gasMix.helium;
  return Math.abs(sum - 1.0) < 0.001; // Allow small floating point errors
}

/**
 * Check if oxygen percentage is safe for given depth
 * 
 * @param depth - Depth in meters
 * @param gasMix - Gas mix
 * @param isDeco - Is this a decompression phase?
 * @returns true if safe
 */
export function isOxygenSafe(depth: number, gasMix: GasMix, isDeco: boolean = false): boolean {
  const ppo2 = calculatePPO2(depth, gasMix);
  const maxPPO2 = isDeco ? MAX_PPO2_DECO : MAX_PPO2_WORKING;
  return ppo2 <= maxPPO2;
}

/**
 * Check if nitrogen narcosis is within acceptable limits
 * 
 * @param depth - Depth in meters
 * @param gasMix - Gas mix
 * @param maxEND - Maximum acceptable END (default: 30m)
 * @returns true if acceptable
 */
export function isNarcosisAcceptable(depth: number, gasMix: GasMix, maxEND: number = 30): boolean {
  const end = calculateEND(depth, gasMix);
  return end <= maxEND;
}

/**
 * Create a gas mix from oxygen percentage
 * 
 * @param oxygenPercent - Oxygen percentage (21-100)
 * @param heliumPercent - Helium percentage (0-79, default: 0)
 * @returns Gas mix object
 */
export function createGasMix(oxygenPercent: number, heliumPercent: number = 0): GasMix {
  const oxygen = oxygenPercent / 100;
  const helium = heliumPercent / 100;
  const nitrogen = 1 - oxygen - helium;
  
  return {
    oxygen,
    nitrogen,
    helium,
    name: heliumPercent > 0 
      ? `Trimix ${oxygenPercent}/${heliumPercent}`
      : oxygenPercent === 21 
        ? 'Air' 
        : `EAN${oxygenPercent}`
  };
}

/**
 * Get best gas mix for a given depth
 * 
 * @param depth - Target depth in meters
 * @param maxPPO2 - Maximum PPO2 (default: 1.4)
 * @returns Recommended oxygen percentage
 */
export function getBestMix(depth: number, maxPPO2: number = MAX_PPO2_WORKING): number {
  const ambientPressure = depthToPressure(depth);
  const oxygenFraction = maxPPO2 / ambientPressure;
  const oxygenPercent = Math.floor(oxygenFraction * 100);
  
  // Ensure it's within reasonable bounds
  return Math.max(21, Math.min(40, oxygenPercent));
}

/**
 * Format gas mix as string
 * 
 * @param gasMix - Gas mix
 * @returns Formatted string (e.g., "Air", "EAN32", "Trimix 21/35")
 */
export function formatGasMix(gasMix: GasMix): string {
  if (gasMix.name) {
    return gasMix.name;
  }
  
  const o2 = Math.round(gasMix.oxygen * 100);
  const he = Math.round(gasMix.helium * 100);
  
  if (he > 0) {
    return `Trimix ${o2}/${he}`;
  }
  
  if (o2 === 21) {
    return 'Air';
  }
  
  return `EAN${o2}`;
}

/**
 * Calculate minimum safe depth for a gas mix (hypoxia check)
 *
 * @param gasMix - Gas mix
 * @param minPPO2 - Minimum PPO2 (default: 0.16 bar)
 * @returns Minimum depth in meters
 */
export function calculateMinDepth(gasMix: GasMix, minPPO2: number = 0.16): number {
  if (gasMix.oxygen >= minPPO2) {
    return 0; // Safe at surface
  }
  const minPressure = minPPO2 / gasMix.oxygen;
  return Math.max(0, (minPressure - 1.01325) / 0.09985);
}

/**
 * Select best gas for current depth from available inventory
 *
 * @param depth - Current depth in meters
 * @param gasInventory - Available gases
 * @param isDeco - Whether in decompression phase
 * @returns Best gas mix for this depth
 */
export function selectBestGas(
  depth: number,
  gasInventory: GasInventory,
  isDeco: boolean = false
): GasMix {
  const maxPPO2 = isDeco ? MAX_PPO2_DECO : MAX_PPO2_WORKING;
  
  // Collect all available gases
  const allGases = [gasInventory.bottomGas, ...gasInventory.decoGases];
  
  // Filter gases that are safe at this depth
  const safeGases = allGases.filter(gas => {
    const mod = calculateMOD(gas, maxPPO2);
    const minDepth = calculateMinDepth(gas);
    return depth <= mod && depth >= minDepth;
  });
  
  if (safeGases.length === 0) {
    // No safe gas found, return bottom gas as fallback
    return gasInventory.bottomGas;
  }
  
  // Select gas with highest O2 content (best for deco)
  return safeGases.reduce((best, current) =>
    current.oxygen > best.oxygen ? current : best
  );
}

/**
 * Validate gas is safe at given depth
 *
 * @param gasMix - Gas to validate
 * @param depth - Depth in meters
 * @param isDeco - Whether in decompression phase
 * @returns Validation result with warnings
 */
export function validateGasAtDepth(
  gasMix: GasMix,
  depth: number,
  isDeco: boolean = false
): { safe: boolean; warnings: Warning[] } {
  const warnings: Warning[] = [];
  let safe = true;
  
  // Check PPO2
  const ppo2 = calculatePPO2(depth, gasMix);
  const maxPPO2 = isDeco ? MAX_PPO2_DECO : MAX_PPO2_WORKING;
  
  if (ppo2 > maxPPO2) {
    safe = false;
    warnings.push({
      level: WarningLevel.DANGER,
      message: `PPO2 too high: ${ppo2.toFixed(2)} bar at ${depth}m`,
      details: `Maximum allowed: ${maxPPO2} bar`
    });
  }
  
  // Check hypoxia
  if (ppo2 < 0.16) {
    safe = false;
    warnings.push({
      level: WarningLevel.DANGER,
      message: `PPO2 too low: ${ppo2.toFixed(2)} bar at ${depth}m`,
      details: 'Risk of hypoxia (minimum: 0.16 bar)'
    });
  }
  
  // Check narcosis
  const end = calculateEND(depth, gasMix);
  if (end > 30) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: `High narcosis risk: END ${end.toFixed(1)}m`,
      details: 'Consider using helium mix'
    });
  }
  
  // Check if approaching MOD
  const mod = calculateMOD(gasMix, maxPPO2);
  if (depth > mod * 0.9) {
    warnings.push({
      level: WarningLevel.WARNING,
      message: `Approaching MOD: ${mod.toFixed(1)}m`,
      details: `Current depth: ${depth}m`
    });
  }
  
  return { safe, warnings };
}

/**
 * Calculate optimal gas switch depth
 *
 * @param fromGas - Current gas
 * @param toGas - Target gas
 * @param maxPPO2 - Maximum PPO2 for target gas (default: 1.6 for deco)
 * @returns Optimal switch depth in meters
 */
export function calculateSwitchDepth(
  fromGas: GasMix,
  toGas: GasMix,
  maxPPO2: number = MAX_PPO2_DECO
): number {
  // Calculate MOD of target gas
  const mod = calculateMOD(toGas, maxPPO2);
  
  // Add 1m safety margin (switch slightly deeper than MOD)
  return Math.max(MIN_DECO_GAS_DEPTH, Math.floor(mod) - 1);
}

/**
 * Sort gases by O2 percentage (ascending)
 *
 * @param gases - Array of gas mixes
 * @returns Sorted array (lowest O2 first)
 */
export function sortGasesByO2(gases: GasMix[]): GasMix[] {
  return [...gases].sort((a, b) => a.oxygen - b.oxygen);
}

/**
 * Check if gas switch is worthwhile
 *
 * @param currentGas - Current gas
 * @param newGas - Potential new gas
 * @param depth - Current depth
 * @param remainingTime - Estimated remaining time at this depth (minutes)
 * @returns Whether switch is beneficial
 */
export function isGasSwitchWorthwhile(
  currentGas: GasMix,
  newGas: GasMix,
  depth: number,
  remainingTime: number = 5
): boolean {
  // Don't switch if O2 increase is minimal
  const o2Increase = newGas.oxygen - currentGas.oxygen;
  if (o2Increase < 0.05) { // Less than 5% increase
    return false;
  }
  
  // Don't switch if remaining time is very short
  if (remainingTime < 2) {
    return false;
  }
  
  // Check if new gas is safe at this depth
  const validation = validateGasAtDepth(newGas, depth, true);
  if (!validation.safe) {
    return false;
  }
  
  return true;
}

/**
 * Compare two gas mixes for equality
 *
 * @param gas1 - First gas mix
 * @param gas2 - Second gas mix
 * @returns true if gases are the same
 */
export function areGasesEqual(gas1: GasMix, gas2: GasMix): boolean {
  const tolerance = 0.001;
  return (
    Math.abs(gas1.oxygen - gas2.oxygen) < tolerance &&
    Math.abs(gas1.nitrogen - gas2.nitrogen) < tolerance &&
    Math.abs(gas1.helium - gas2.helium) < tolerance
  );
}

// Made with Bob
