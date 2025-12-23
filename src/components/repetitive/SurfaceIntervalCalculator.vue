<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TissueCompartment, PressureGroup } from '../../types/repetitiveDive';
import { calculateSurfaceInterval, calculatePressureGroup } from '../../services/repetitiveDiveService';
import { DEFAULT_REPETITIVE_RULES } from '../../types/repetitiveDive';

const props = defineProps<{
  tissues: TissueCompartment[];
  targetGroup?: PressureGroup;
}>();

const { t } = useI18n();

const selectedTargetGroup = ref<PressureGroup>(props.targetGroup || 'D');
const result = ref(calculateSurfaceInterval(props.tissues, selectedTargetGroup.value));

const currentPressureGroup = computed(() => calculatePressureGroup(props.tissues));

const pressureGroups: PressureGroup[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const recalculate = () => {
  result.value = calculateSurfaceInterval(props.tissues, selectedTargetGroup.value);
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

const getLoadColor = (load: number): string => {
  if (load < 0.7) return 'bg-green-500';
  if (load < 0.85) return 'bg-yellow-500';
  return 'bg-red-500';
};
</script>

<template>
  <div class="cds--tile surface-interval-calculator">
    <!-- Header -->
    <div class="calculator-header">
      <h3 class="cds--type-heading-03">
        {{ t('repetitiveDive.surfaceInterval.title') }}
      </h3>
      <p class="cds--type-body-01 calculator-description">
        {{ t('repetitiveDive.surfaceInterval.description') }}
      </p>
    </div>

    <!-- Current Status Cards -->
    <div class="status-cards">
      <!-- Nitrogen Load Card -->
      <div class="status-card nitrogen-card">
        <div class="status-card-content">
          <div class="status-label">
            {{ t('repetitiveDive.surfaceInterval.currentLoad') }}
          </div>
          <div class="status-value">
            {{ (result.currentDesaturation * 100).toFixed(0) }}<span class="status-unit">%</span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :class="getLoadColor(result.currentDesaturation)"
              :style="{ width: `${result.currentDesaturation * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Pressure Group Card -->
      <div class="status-card pressure-card">
        <div class="status-card-content">
          <div class="status-label">
            {{ t('repetitiveDive.currentPlan.pressureGroup') }}
          </div>
          <div class="pressure-group-display">
            {{ currentPressureGroup }}
          </div>
        </div>
      </div>
    </div>

    <!-- Target Group Selector -->
    <div class="cds--form-item target-selector">
      <label class="cds--label">
        {{ t('repetitiveDive.surfaceInterval.targetGroup') }}
      </label>
      <select
        v-model="selectedTargetGroup"
        @change="recalculate"
        class="cds--select-input"
      >
        <option v-for="group in pressureGroups" :key="group" :value="group">
          {{ t('repetitiveDive.currentPlan.pressureGroup') }} {{ group }}
        </option>
      </select>
    </div>

    <!-- Results Section -->
    <div class="results-section">
      <h4 class="cds--type-heading-02 results-title">
        {{ t('repetitiveDive.surfaceInterval.results.title') }}
      </h4>

      <!-- Minimum Interval -->
      <div class="result-card minimum-card">
        <div class="result-content">
          <div class="result-label">
            <span class="result-indicator minimum"></span>
            {{ t('repetitiveDive.surfaceInterval.results.minimum') }}
          </div>
          <div class="result-value">
            {{ formatTime(result.minimumInterval) }}
          </div>
        </div>
      </div>

      <!-- Recommended Interval -->
      <div class="result-card recommended-card">
        <div class="result-content">
          <div class="result-label">
            <span class="result-indicator recommended"></span>
            {{ t('repetitiveDive.surfaceInterval.results.recommended') }}
          </div>
          <div class="result-value">
            {{ formatTime(result.recommendedInterval) }}
          </div>
        </div>
      </div>

      <!-- Optimal Interval -->
      <div class="result-card optimal-card">
        <div class="result-content">
          <div class="result-label">
            <span class="result-indicator optimal"></span>
            {{ t('repetitiveDive.surfaceInterval.results.optimal') }}
          </div>
          <div class="result-value">
            {{ formatTime(result.optimalInterval) }}
          </div>
        </div>
      </div>

      <!-- After Interval Info -->
      <div class="after-interval-card">
        <div class="after-interval-label">
          {{ t('repetitiveDive.surfaceInterval.results.afterInterval') }}
        </div>
        <div class="after-interval-grid">
          <div class="after-interval-item">
            <div class="after-interval-icon pressure-icon">
              {{ result.pressureGroupAfterInterval }}
            </div>
            <div class="after-interval-info">
              <div class="after-interval-sublabel">{{ t('repetitiveDive.surfaceInterval.results.pressureGroup') }}</div>
              <div class="after-interval-value">{{ result.pressureGroupAfterInterval }}</div>
            </div>
          </div>
          <div class="after-interval-item">
            <div class="after-interval-icon desat-icon">
              {{ (result.currentDesaturation * 100).toFixed(0) }}%
            </div>
            <div class="after-interval-info">
              <div class="after-interval-sublabel">{{ t('repetitiveDive.surfaceInterval.results.desaturation') }}</div>
              <div class="after-interval-value">{{ (result.currentDesaturation * 100).toFixed(0) }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="result.warnings.length > 0" class="warnings-section">
        <div
          v-for="(warning, idx) in result.warnings"
          :key="idx"
          class="cds--inline-notification"
          :class="{
            'cds--inline-notification--error': warning.level === 'danger',
            'cds--inline-notification--warning': warning.level === 'warning',
            'cds--inline-notification--info': warning.level === 'info'
          }"
        >
          <div class="cds--inline-notification__details">
            <svg class="cds--inline-notification__icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path v-if="warning.level === 'danger'" d="M10 1L1 17h18L10 1zm0 3.5L16.5 16h-13L10 4.5zM9 13v2h2v-2H9zm0-6v4h2V7H9z"/>
              <path v-else-if="warning.level === 'warning'" d="M10 1L1 17h18L10 1zm0 3.5L16.5 16h-13L10 4.5zM9 13v2h2v-2H9zm0-6v4h2V7H9z"/>
              <path v-else d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H9v-2h2v2zm0-3H9V7h2v5z"/>
            </svg>
            <div class="cds--inline-notification__text-wrapper">
              <p class="cds--inline-notification__title">{{ warning.message }}</p>
              <p v-if="warning.details" class="cds--inline-notification__subtitle">{{ warning.details }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.surface-interval-calculator {
  margin-top: 1rem;
}

.calculator-header {
  margin-bottom: 2rem;
}

.calculator-description {
  color: var(--cds-text-02);
  margin-top: 0.5rem;
}

/* Status Cards */
.status-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.status-card {
  background: var(--cds-ui-01);
  border: 1px solid var(--cds-ui-03);
  border-radius: 4px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}

.status-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.nitrogen-card {
  border-left: 4px solid var(--cds-support-02);
}

.pressure-card {
  border-left: 4px solid var(--cds-interactive-01);
}

.status-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--cds-text-02);
  margin-bottom: 0.75rem;
}

.status-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--cds-text-01);
  line-height: 1;
}

.status-unit {
  font-size: 1.5rem;
  color: var(--cds-text-02);
  margin-left: 0.25rem;
}

.progress-bar {
  height: 8px;
  background: var(--cds-ui-03);
  border-radius: 4px;
  overflow: hidden;
  margin-top: 1rem;
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 4px;
}

.progress-fill.bg-green-500 {
  background: var(--cds-support-02);
}

.progress-fill.bg-yellow-500 {
  background: var(--cds-support-03);
}

.progress-fill.bg-red-500 {
  background: var(--cds-support-01);
}

.pressure-group-display {
  font-size: 3.5rem;
  font-weight: 900;
  color: var(--cds-interactive-01);
  line-height: 1;
  margin-top: 0.5rem;
}

/* Target Selector */
.target-selector {
  margin-bottom: 2rem;
}

/* Results Section */
.results-section {
  margin-top: 2rem;
}

.results-title {
  margin-bottom: 1.5rem;
  color: var(--cds-text-01);
}

.result-card {
  background: var(--cds-ui-01);
  border: 1px solid var(--cds-ui-03);
  border-radius: 4px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  transition: all 0.2s ease;
}

.result-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.minimum-card {
  border-left: 4px solid var(--cds-support-01);
}

.recommended-card {
  border-left: 4px solid var(--cds-support-03);
}

.optimal-card {
  border-left: 4px solid var(--cds-support-02);
}

.result-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--cds-text-02);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.result-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.result-indicator.minimum {
  background: var(--cds-support-01);
  animation: pulse 2s infinite;
}

.result-indicator.recommended {
  background: var(--cds-support-03);
}

.result-indicator.optimal {
  background: var(--cds-support-02);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.result-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--cds-text-01);
}

/* After Interval Card */
.after-interval-card {
  background: var(--cds-ui-02);
  border: 1px solid var(--cds-ui-03);
  border-radius: 4px;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.after-interval-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--cds-text-02);
  margin-bottom: 1rem;
}

.after-interval-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.after-interval-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.after-interval-icon {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  flex-shrink: 0;
}

.pressure-icon {
  background: var(--cds-interactive-01);
  color: white;
}

.desat-icon {
  background: var(--cds-ui-03);
  color: var(--cds-text-01);
  font-size: 0.875rem;
}

.after-interval-info {
  flex: 1;
}

.after-interval-sublabel {
  font-size: 0.75rem;
  color: var(--cds-text-02);
  margin-bottom: 0.25rem;
}

.after-interval-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--cds-text-01);
}

/* Warnings */
.warnings-section {
  margin-top: 1.5rem;
}

.cds--inline-notification {
  margin-bottom: 0.75rem;
}
</style>

<!-- Made with Bob -->