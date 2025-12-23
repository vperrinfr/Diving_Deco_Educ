<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DiveProfile } from '../../types';
import type { StopAnalysisResult, DepthPoint } from '../../types/stopAnalysis';
import { analyzeDepth, generateDepthPoints } from '../../services/stopAnalysisService';
import DepthSelector from './DepthSelector.vue';
import PressureMargins from './PressureMargins.vue';
import CompartmentChart from './CompartmentChart.vue';
import CompartmentTable from './CompartmentTable.vue';

const { t } = useI18n();

const props = defineProps<{
  profile: DiveProfile | null;
}>();

// State
const selectedDepth = ref(0);
const analysisResult = ref<StopAnalysisResult | null>(null);
const depthPoints = ref<DepthPoint[]>([]);
const showTable = ref(false);

// Computed
const hasProfile = computed(() => props.profile !== null);

const units = computed(() => {
  return props.profile?.parameters.units || 'metric';
});

// Initialize when profile changes
watch(() => props.profile, (newProfile) => {
  if (newProfile) {
    // Generate depth points
    const stopDepths = newProfile.decompressionStops.map(stop => stop.depth);
    depthPoints.value = generateDepthPoints(newProfile.maxDepth, stopDepths);
    
    // Set initial depth to first stop or surface
    if (stopDepths.length > 0) {
      selectedDepth.value = stopDepths[0]!;
    } else {
      selectedDepth.value = 0;
    }
    
    // Perform initial analysis
    performAnalysis();
  }
}, { immediate: true });

// Watch for depth changes
watch(selectedDepth, () => {
  if (props.profile) {
    performAnalysis();
  }
});

// Perform analysis
const performAnalysis = () => {
  if (!props.profile) return;
  
  const params = props.profile.parameters;
  
  analysisResult.value = analyzeDepth({
    tissues: props.profile.tissueCompartments,
    targetDepth: selectedDepth.value,
    gfLow: params.gradientFactorLow,
    gfHigh: params.gradientFactorHigh,
    firstStopDepth: props.profile.decompressionStops.length > 0 
      ? props.profile.decompressionStops[0]!.depth 
      : 0,
    maxDepth: props.profile.maxDepth,
    units: params.units
  });
};

// Handle depth update
const handleDepthUpdate = (depth: number) => {
  selectedDepth.value = depth;
};

// Toggle table visibility
const toggleTable = () => {
  showTable.value = !showTable.value;
};
</script>

<template>
  <div class="stop-analysis">
    <!-- Empty State -->
    <div v-if="!hasProfile" class="empty-state">
      <svg class="empty-state__icon" width="80" height="80" viewBox="0 0 32 32">
        <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm0 26c-6.6 0-12-5.4-12-12S9.4 4 16 4s12 5.4 12 12-5.4 12-12 12z" fill="currentColor"/>
        <path d="M16 8c-.6 0-1 .4-1 1v7c0 .6.4 1 1 1s1-.4 1-1V9c0-.6-.4-1-1-1zm0 10c-.6 0-1 .4-1 1v2c0 .6.4 1 1 1s1-.4 1-1v-2c0-.6-.4-1-1-1z" fill="currentColor"/>
      </svg>
      <h3 class="empty-state__title">{{ t('analysis.empty.title') }}</h3>
      <p class="empty-state__message">{{ t('analysis.empty.message') }}</p>
    </div>

    <!-- Analysis Content -->
    <div v-else-if="analysisResult" class="analysis-content">
      <!-- Depth Selector -->
      <DepthSelector
        :max-depth="profile!.maxDepth"
        :current-depth="selectedDepth"
        :depth-points="depthPoints"
        :units="units"
        @update:depth="handleDepthUpdate"
      />

      <!-- Pressure Margins -->
      <PressureMargins
        :limiting-compartment="analysisResult.limitingCompartment"
        :selected-depth="analysisResult.selectedDepth"
        :can-ascend-to="analysisResult.canAscendTo"
        :is-ascent-safe="analysisResult.isAscentSafe"
        :explanation="analysisResult.explanation"
        :units="units"
      />

      <!-- Compartment Chart -->
      <CompartmentChart
        :compartments="analysisResult.compartments"
      />

      <!-- Toggle Table Button -->
      <div class="table-toggle">
        <button
          @click="toggleTable"
          class="toggle-button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path v-if="!showTable" d="M2 2h16v2H2V2zm0 4h16v2H2V6zm0 4h16v2H2v-2zm0 4h16v2H2v-2z"/>
            <path v-else d="M2 2h16v2H2V2zm0 4h16v2H2V6zm0 4h16v2H2v-2zm0 4h8v2H2v-2z"/>
          </svg>
          <span>{{ showTable ? t('analysis.hideTable') : t('analysis.showTable') }}</span>
        </button>
      </div>

      <!-- Compartment Table (Collapsible) -->
      <transition name="slide">
        <CompartmentTable
          v-if="showTable"
          :compartments="analysisResult.compartments"
          :units="units"
        />
      </transition>

      <!-- Info Box -->
      <div class="info-box">
        <div class="info-box__header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H9v-2h2v2zm0-3H9c0-3.3 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.8-3 2.8-3 5z"/>
          </svg>
          <h4>{{ t('analysis.info.title') }}</h4>
        </div>
        <div class="info-box__content">
          <p>{{ t('analysis.info.description') }}</p>
          <ul class="info-list">
            <li>{{ t('analysis.info.point1') }}</li>
            <li>{{ t('analysis.info.point2') }}</li>
            <li>{{ t('analysis.info.point3') }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stop-analysis {
  min-height: 400px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #f4f4f4;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.empty-state__icon {
  color: #8d8d8d;
  margin-bottom: 1.5rem;
}

.empty-state__title {
  font-size: 1.25rem;
  font-weight: 400;
  color: #161616;
  margin: 0 0 0.5rem 0;
}

.empty-state__message {
  font-size: 0.875rem;
  color: #525252;
  margin: 0;
}

/* Analysis Content */
.analysis-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Table Toggle */
.table-toggle {
  margin-bottom: 1rem;
}

.toggle-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #161616;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background: #f4f4f4;
  border-color: #c6c6c6;
}

.toggle-button svg {
  flex-shrink: 0;
}

/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 2000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}

/* Info Box */
.info-box {
  background: #e8f4ff;
  border: 1px solid #0f62fe;
  border-left: 4px solid #0f62fe;
  padding: 1.5rem;
  border-radius: 4px;
  margin-top: 1rem;
}

.info-box__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  color: #0043ce;
}

.info-box__header h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.info-box__content {
  color: #161616;
}

.info-box__content p {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
}

.info-list {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.71429;
}

.info-list li {
  margin-bottom: 0.5rem;
}

.info-list li:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .empty-state {
    padding: 3rem 1rem;
  }

  .info-box {
    padding: 1rem;
  }
}
</style>