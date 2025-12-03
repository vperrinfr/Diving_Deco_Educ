/**
 * Bühlmann ZHL-16C Algorithm Constants
 * 
 * These constants define the tissue compartment parameters for the
 * Bühlmann ZHL-16C decompression algorithm.
 */

// Physical Constants
export const WATER_VAPOR_PRESSURE = 0.0627; // bar at 37°C (body temperature)
export const SURFACE_PRESSURE = 1.01325;     // bar (sea level)
export const PRESSURE_PER_METER = 0.09985;   // bar/meter (saltwater)

// Dive Rate Constants
export const DESCENT_RATE = 20.0;            // meters/minute (standard descent)
export const ASCENT_RATE = 9.0;              // meters/minute (conservative)
export const SAFETY_STOP_DEPTH = 5.0;        // meters
export const SAFETY_STOP_TIME = 3.0;         // minutes
export const MAX_RECREATIONAL_DEPTH = 40.0;  // meters

// Multi-Level Dive Constants
export const MAX_DIVE_SEGMENTS = 5;          // Maximum number of dive segments
export const GAS_SWITCH_TIME = 1.0;          // minutes for gas switch
export const MIN_DECO_GAS_DEPTH = 6.0;       // meters (don't switch too shallow)

// Nitrogen half-times for each of the 16 tissue compartments (minutes)
export const ZHL16C_N2_HALFTIMES = [
  4.0,    // Compartment 1
  8.0,    // Compartment 2
  12.5,   // Compartment 3
  18.5,   // Compartment 4
  27.0,   // Compartment 5
  38.3,   // Compartment 6
  54.3,   // Compartment 7
  77.0,   // Compartment 8
  109.0,  // Compartment 9
  146.0,  // Compartment 10
  187.0,  // Compartment 11
  239.0,  // Compartment 12
  305.0,  // Compartment 13
  390.0,  // Compartment 14
  498.0,  // Compartment 15
  635.0   // Compartment 16
] as const;

// Helium half-times for each of the 16 tissue compartments (minutes)
export const ZHL16C_HE_HALFTIMES = [
  1.51,    // Compartment 1
  3.02,    // Compartment 2
  4.72,    // Compartment 3
  6.99,    // Compartment 4
  10.21,   // Compartment 5
  14.48,   // Compartment 6
  20.53,   // Compartment 7
  29.11,   // Compartment 8
  41.20,   // Compartment 9
  55.19,   // Compartment 10
  70.69,   // Compartment 11
  90.34,   // Compartment 12
  115.29,  // Compartment 13
  147.42,  // Compartment 14
  188.24,  // Compartment 15
  240.03   // Compartment 16
] as const;

// Nitrogen M-value parameters (a coefficients)
export const ZHL16C_N2_A = [
  1.2599,  // Compartment 1
  1.0000,  // Compartment 2
  0.8618,  // Compartment 3
  0.7562,  // Compartment 4
  0.6200,  // Compartment 5
  0.5043,  // Compartment 6
  0.4410,  // Compartment 7
  0.4000,  // Compartment 8
  0.3750,  // Compartment 9
  0.3500,  // Compartment 10
  0.3295,  // Compartment 11
  0.3065,  // Compartment 12
  0.2835,  // Compartment 13
  0.2610,  // Compartment 14
  0.2480,  // Compartment 15
  0.2327   // Compartment 16
] as const;

// Nitrogen M-value parameters (b coefficients)
export const ZHL16C_N2_B = [
  0.5050,  // Compartment 1
  0.6514,  // Compartment 2
  0.7222,  // Compartment 3
  0.7825,  // Compartment 4
  0.8126,  // Compartment 5
  0.8434,  // Compartment 6
  0.8693,  // Compartment 7
  0.8910,  // Compartment 8
  0.9092,  // Compartment 9
  0.9222,  // Compartment 10
  0.9319,  // Compartment 11
  0.9403,  // Compartment 12
  0.9477,  // Compartment 13
  0.9544,  // Compartment 14
  0.9602,  // Compartment 15
  0.9653   // Compartment 16
] as const;

// Helium M-value parameters (a coefficients)
export const ZHL16C_HE_A = [
  1.7424,  // Compartment 1
  1.3830,  // Compartment 2
  1.1919,  // Compartment 3
  1.0458,  // Compartment 4
  0.9220,  // Compartment 5
  0.8205,  // Compartment 6
  0.7305,  // Compartment 7
  0.6502,  // Compartment 8
  0.5950,  // Compartment 9
  0.5545,  // Compartment 10
  0.5333,  // Compartment 11
  0.5189,  // Compartment 12
  0.5181,  // Compartment 13
  0.5176,  // Compartment 14
  0.5172,  // Compartment 15
  0.5119   // Compartment 16
] as const;

// Helium M-value parameters (b coefficients)
export const ZHL16C_HE_B = [
  0.4245,  // Compartment 1
  0.5747,  // Compartment 2
  0.6527,  // Compartment 3
  0.7223,  // Compartment 4
  0.7582,  // Compartment 5
  0.7957,  // Compartment 6
  0.8279,  // Compartment 7
  0.8553,  // Compartment 8
  0.8757,  // Compartment 9
  0.8903,  // Compartment 10
  0.8997,  // Compartment 11
  0.9073,  // Compartment 12
  0.9122,  // Compartment 13
  0.9171,  // Compartment 14
  0.9217,  // Compartment 15
  0.9267   // Compartment 16
] as const;

// Default gradient factors
export const DEFAULT_GF_LOW = 30;   // Conservative
export const DEFAULT_GF_HIGH = 85;  // Conservative

// Safety limits
export const MAX_PPO2_WORKING = 1.4;  // bar (working dives)
export const MAX_PPO2_DECO = 1.6;     // bar (decompression)
export const MAX_END = 30.0;          // meters (equivalent narcotic depth)

// Compartment count
export const COMPARTMENT_COUNT = 16;

// Made with Bob
