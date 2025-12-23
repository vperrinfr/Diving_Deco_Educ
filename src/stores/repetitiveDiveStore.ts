/**
 * Repetitive Dive Store
 * 
 * Manages state for repetitive dive planning including:
 * - Current dive day plan
 * - Dive history
 * - Surface intervals
 * - Residual nitrogen tracking
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  DiveDayPlan,
  RepetitiveDive,
  RepetitiveDiveRules,
  DiveDayTemplate
} from '../types/repetitiveDive';
import type { DiveProfile, DiveParameters, TissueCompartment } from '../types';
import { DEFAULT_REPETITIVE_RULES, DIVE_DAY_TEMPLATES } from '../types/repetitiveDive';
import {
  calculatePressureGroup,
  calculateResidualNitrogen,
  calculateSurfaceInterval,
  validateRepetitiveDive,
  validateDiveSequence,
  calculateNoFlyTime,
  createRepetitiveDive
} from '../services/repetitiveDiveService';
import { calculateDiveProfile } from '../utils/buhlmann/decompression';
import { initializeTissues } from '../utils/buhlmann/tissueLoading';

export const useRepetitiveDiveStore = defineStore('repetitiveDive', () => {
  // State
  const currentPlan = ref<DiveDayPlan | null>(null);
  const divePlans = ref<DiveDayPlan[]>([]);
  const rules = ref<RepetitiveDiveRules>(DEFAULT_REPETITIVE_RULES);
  const templates = ref<DiveDayTemplate[]>(DIVE_DAY_TEMPLATES);
  
  // Computed
  const hasDives = computed(() => {
    return currentPlan.value !== null && currentPlan.value.dives.length > 0;
  });
  
  const canAddDive = computed(() => {
    if (!currentPlan.value) return true;
    return currentPlan.value.dives.length < rules.value.maxDivesPerDay;
  });
  
  const lastDive = computed(() => {
    if (!currentPlan.value || currentPlan.value.dives.length === 0) return null;
    return currentPlan.value.dives[currentPlan.value.dives.length - 1]!;
  });
  
  const totalBottomTime = computed(() => {
    if (!currentPlan.value) return 0;
    return currentPlan.value.dives.reduce((sum, dive) => {
      return sum + (dive.profile.totalDiveTime - dive.profile.totalDecompressionTime);
    }, 0);
  });
  
  const totalDecompressionTime = computed(() => {
    if (!currentPlan.value) return 0;
    return currentPlan.value.dives.reduce((sum, dive) => {
      return sum + dive.profile.totalDecompressionTime;
    }, 0);
  });
  
  const currentNitrogenLoad = computed(() => {
    if (!lastDive.value) return 0;
    
    const tissues = lastDive.value.residualNitrogenAfter;
    let maxLoading = 0;
    
    for (const tissue of tissues) {
      const totalInert = tissue.n2Pressure + tissue.hePressure;
      const loading = totalInert / tissue.mValue;
      maxLoading = Math.max(maxLoading, loading);
    }
    
    return maxLoading;
  });
  
  const currentPressureGroup = computed(() => {
    if (!lastDive.value) return 'A';
    return lastDive.value.pressureGroupAfter;
  });
  
  const noFlyTimeRemaining = computed(() => {
    if (!currentPlan.value) return 0;
    return currentPlan.value.noFlyTime;
  });
  
  // Actions
  function createNewPlan(date: Date = new Date()): void {
    currentPlan.value = {
      id: `plan-${Date.now()}`,
      date,
      dives: [],
      surfaceIntervals: [],
      totalNitrogenLoad: 0,
      totalBottomTime: 0,
      totalDecompressionTime: 0,
      maxDepth: 0,
      noFlyTime: 0,
      recommendations: [],
      isComplete: false
    };
  }
  
  function addDive(parameters: DiveParameters, surfaceInterval?: number): RepetitiveDive | null {
    if (!currentPlan.value) {
      createNewPlan();
    }
    
    const plan = currentPlan.value!;
    const diveNumber = plan.dives.length + 1;
    
    // Get residual nitrogen from previous dive
    let residualTissues: TissueCompartment[];
    
    if (plan.dives.length === 0) {
      // First dive - start with clean tissues
      residualTissues = initializeTissues();
    } else {
      // Calculate residual nitrogen after surface interval
      const previousDive = plan.dives[plan.dives.length - 1]!;
      const interval = surfaceInterval || rules.value.recommendedSurfaceInterval;
      
      // Validate the dive
      const validation = validateRepetitiveDive(
        previousDive.profile,
        parameters,
        interval,
        rules.value
      );
      
      if (!validation.canProceed) {
        console.error('Cannot add dive:', validation.warnings);
        return null;
      }
      
      residualTissues = calculateResidualNitrogen(
        previousDive.residualNitrogenAfter,
        interval
      );
      
      plan.surfaceIntervals.push(interval);
    }
    
    // Calculate dive profile with residual nitrogen
    // Note: This is simplified - ideally we'd pass residual tissues to the calculator
    const profile = calculateDiveProfile(parameters);
    
    // Create repetitive dive
    const dive = createRepetitiveDive(
      profile,
      diveNumber,
      residualTissues,
      surfaceInterval
    );
    
    // Add to plan
    plan.dives.push(dive);
    
    // Update plan statistics
    updatePlanStatistics();
    
    return dive;
  }
  
  function removeDive(diveId: string): void {
    if (!currentPlan.value) return;
    
    const index = currentPlan.value.dives.findIndex(d => d.id === diveId);
    if (index === -1) return;
    
    currentPlan.value.dives.splice(index, 1);
    
    // Remove corresponding surface interval
    if (index < currentPlan.value.surfaceIntervals.length) {
      currentPlan.value.surfaceIntervals.splice(index, 1);
    }
    
    // Renumber remaining dives
    currentPlan.value.dives.forEach((dive, i) => {
      dive.diveNumber = i + 1;
    });
    
    updatePlanStatistics();
  }
  
  function updateSurfaceInterval(diveIndex: number, interval: number): void {
    if (!currentPlan.value) return;
    if (diveIndex >= currentPlan.value.surfaceIntervals.length) return;
    
    currentPlan.value.surfaceIntervals[diveIndex] = interval;
    
    // Recalculate subsequent dives with new residual nitrogen
    recalculateFromDive(diveIndex + 1);
  }
  
  function recalculateFromDive(startIndex: number): void {
    if (!currentPlan.value) return;
    if (startIndex >= currentPlan.value.dives.length) return;
    
    for (let i = startIndex; i < currentPlan.value.dives.length; i++) {
      const dive = currentPlan.value.dives[i]!;
      const previousDive = currentPlan.value.dives[i - 1]!;
      const interval = currentPlan.value.surfaceIntervals[i - 1] || rules.value.recommendedSurfaceInterval;
      
      // Calculate new residual nitrogen
      const residualTissues = calculateResidualNitrogen(
        previousDive.residualNitrogenAfter,
        interval
      );
      
      dive.residualNitrogenBefore = residualTissues;
      dive.pressureGroupBefore = calculatePressureGroup(residualTissues);
    }
    
    updatePlanStatistics();
  }
  
  function updatePlanStatistics(): void {
    if (!currentPlan.value) return;
    
    const plan = currentPlan.value;
    
    // Calculate totals
    plan.totalBottomTime = plan.dives.reduce((sum, dive) => {
      return sum + (dive.profile.totalDiveTime - dive.profile.totalDecompressionTime);
    }, 0);
    
    plan.totalDecompressionTime = plan.dives.reduce((sum, dive) => {
      return sum + dive.profile.totalDecompressionTime;
    }, 0);
    
    plan.maxDepth = Math.max(...plan.dives.map(d => d.profile.maxDepth), 0);
    
    // Calculate nitrogen load
    if (plan.dives.length > 0) {
      const lastDive = plan.dives[plan.dives.length - 1]!;
      const tissues = lastDive.residualNitrogenAfter;
      let maxLoading = 0;
      
      for (const tissue of tissues) {
        const totalInert = tissue.n2Pressure + tissue.hePressure;
        const loading = totalInert / tissue.mValue;
        maxLoading = Math.max(maxLoading, loading);
      }
      
      plan.totalNitrogenLoad = maxLoading;
      
      // Calculate no-fly time
      const noFlyResult = calculateNoFlyTime(
        tissues,
        plan.dives.length > 1,
        rules.value
      );
      plan.noFlyTime = noFlyResult.noFlyTime;
    }
    
    // Validate sequence
    const validation = validateDiveSequence(
      plan.dives.map(d => d.profile),
      plan.surfaceIntervals,
      rules.value
    );
    
    plan.recommendations = validation.warnings;
  }
  
  function completePlan(): void {
    if (!currentPlan.value) return;
    
    currentPlan.value.isComplete = true;
    divePlans.value.push({ ...currentPlan.value });
    
    // Save to localStorage
    savePlansToStorage();
  }
  
  function loadTemplate(templateId: string): void {
    // Find template by ID or name
    const template = templates.value.find(t =>
      t.name.toLowerCase().includes(templateId.toLowerCase()) ||
      t.category === templateId
    );
    
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return;
    }
    
    createNewPlan();
    
    for (let i = 0; i < template.dives.length; i++) {
      const diveDef = template.dives[i]!;
      
      const parameters: DiveParameters = {
        depth: diveDef.depth,
        bottomTime: diveDef.bottomTime,
        gasMix: diveDef.gasMix,
        gradientFactorLow: 30,
        gradientFactorHigh: 85,
        units: 'metric'
      };
      
      addDive(parameters, diveDef.surfaceInterval);
    }
  }
  
  function clearCurrentPlan(): void {
    currentPlan.value = null;
  }
  
  function updateRules(newRules: Partial<RepetitiveDiveRules>): void {
    rules.value = { ...rules.value, ...newRules };
    
    // Recalculate current plan with new rules
    if (currentPlan.value && currentPlan.value.dives.length > 0) {
      recalculateFromDive(0);
    }
  }
  
  function savePlansToStorage(): void {
    try {
      localStorage.setItem('divePlans', JSON.stringify(divePlans.value));
    } catch (error) {
      console.error('Failed to save dive plans:', error);
    }
  }
  
  function loadPlansFromStorage(): void {
    try {
      const stored = localStorage.getItem('divePlans');
      if (stored) {
        divePlans.value = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load dive plans:', error);
    }
  }
  
  function deletePlan(planId: string): void {
    const index = divePlans.value.findIndex(p => p.id === planId);
    if (index !== -1) {
      divePlans.value.splice(index, 1);
      savePlansToStorage();
    }
  }
  
  function getSurfaceIntervalRecommendation(nextDiveParams: DiveParameters): number {
    if (!lastDive.value) return rules.value.recommendedSurfaceInterval;
    
    const result = calculateSurfaceInterval(
      lastDive.value.residualNitrogenAfter,
      'D', // Target pressure group
      rules.value
    );
    
    return result.recommendedInterval;
  }
  
  // Initialize
  loadPlansFromStorage();
  
  return {
    // State
    currentPlan,
    divePlans,
    rules,
    templates,
    
    // Computed
    hasDives,
    canAddDive,
    lastDive,
    totalBottomTime,
    totalDecompressionTime,
    currentNitrogenLoad,
    currentPressureGroup,
    noFlyTimeRemaining,
    
    // Actions
    createNewPlan,
    addDive,
    removeDive,
    updateSurfaceInterval,
    completePlan,
    loadTemplate,
    clearCurrentPlan,
    updateRules,
    deletePlan,
    getSurfaceIntervalRecommendation
  };
});

// Made with Bob