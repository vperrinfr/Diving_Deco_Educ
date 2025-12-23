<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ComparisonResult } from '../../types/decoModels';
import { formatModelName } from '../../types/decoModels';

const { t } = useI18n();

const props = defineProps<{
  result: ComparisonResult | null;
}>();

const emit = defineEmits<{
  (e: 'export'): void;
}>();

// Computed
const hasResult = computed(() => props.result !== null);

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const formatDepth = (depth: number): string => {
  return `${depth}m`;
};

const getDifferenceClass = (significance: string): string => {
  switch (significance) {
    case 'major': return 'difference--major';
    case 'moderate': return 'difference--moderate';
    case 'minor': return 'difference--minor';
    default: return '';
  }
};
</script>

<template>
  <div v-if="hasResult" class="comparison-results">
    <!-- Header -->
    <div class="results-header">
      <h2 class="cds--type-heading-03">{{ t('comparison.results.title') }}</h2>
      <button @click="emit('export')" class="export-button">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M15 7h-3V1H8v6H5l5 5 5-5zM4 17v2h12v-2H4z"/>
        </svg>
        <span>{{ t('comparison.export.button') }}</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div
        v-for="profile in result.profiles"
        :key="profile.model"
        class="summary-card"
        :style="{ borderTopColor: profile.characteristics.color }"
      >
        <div class="summary-card__header">
          <h3 class="summary-card__title">
            {{ profile.characteristics.name }}
          </h3>
          <span 
            class="summary-card__badge"
            :class="`badge--${profile.characteristics.conservatism}`"
          >
            {{ t(`comparison.conservatism.${profile.characteristics.conservatism}`) }}
          </span>
        </div>

        <div class="summary-card__metrics">
          <div class="metric">
            <span class="metric__label">{{ t('comparison.metrics.totalTime') }}</span>
            <span class="metric__value">{{ formatTime(profile.profile.totalDiveTime) }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">{{ t('comparison.metrics.decoTime') }}</span>
            <span class="metric__value">{{ formatTime(profile.profile.totalDecompressionTime) }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">{{ t('comparison.metrics.stopCount') }}</span>
            <span class="metric__value">{{ profile.profile.decompressionStops.length }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">{{ t('comparison.metrics.firstStop') }}</span>
            <span class="metric__value">
              {{ profile.profile.decompressionStops[0] ? formatDepth(profile.profile.decompressionStops[0].depth) : '-' }}
            </span>
          </div>
        </div>

        <!-- Stop Schedule -->
        <div class="stop-schedule">
          <h4 class="stop-schedule__title">{{ t('comparison.results.stopSchedule') }}</h4>
          <div v-if="profile.profile.decompressionStops.length > 0" class="stops-list">
            <div
              v-for="(stop, index) in profile.profile.decompressionStops"
              :key="index"
              class="stop-item"
            >
              <span class="stop-item__depth">{{ formatDepth(stop.depth) }}</span>
              <span class="stop-item__duration">{{ stop.duration }} min</span>
            </div>
          </div>
          <p v-else class="no-stops">{{ t('comparison.results.noStops') }}</p>
        </div>
      </div>
    </div>

    <!-- Differences Analysis -->
    <div class="differences-section">
      <h3 class="section-title">{{ t('comparison.results.differences') }}</h3>
      <div class="differences-grid">
        <div
          v-for="diff in result.differences"
          :key="diff.aspect"
          class="difference-card"
          :class="getDifferenceClass(diff.significance)"
        >
          <div class="difference-card__header">
            <h4 class="difference-card__title">{{ diff.label }}</h4>
            <span class="difference-card__badge">{{ diff.significance }}</span>
          </div>
          <div class="difference-card__values">
            <div
              v-for="profile in result.profiles"
              :key="profile.model"
              class="value-item"
            >
              <span 
                class="value-item__indicator"
                :style="{ backgroundColor: profile.characteristics.color }"
              ></span>
              <span class="value-item__model">{{ formatModelName(profile.model, true) }}</span>
              <span class="value-item__value">
                {{ Math.round(diff.values[profile.model] || 0) }} {{ diff.unit }}
              </span>
            </div>
          </div>
          <p v-if="diff.explanation" class="difference-card__explanation">
            {{ diff.explanation }}
          </p>
        </div>
      </div>
    </div>

    <!-- Recommendations -->
    <div class="recommendations-section">
      <h3 class="section-title">{{ t('comparison.results.recommendations') }}</h3>
      <div class="recommendations-list">
        <div
          v-for="(recommendation, index) in result.recommendations"
          :key="index"
          class="recommendation-item"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="recommendation-icon">
            <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H9v-2h2v2zm0-3H9c0-3.3 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.8-3 2.8-3 5z"/>
          </svg>
          <p class="recommendation-text">{{ recommendation }}</p>
        </div>
      </div>
    </div>

    <!-- Warnings -->
    <div v-if="result.warnings.length > 0" class="warnings-section">
      <div
        v-for="(warning, index) in result.warnings"
        :key="index"
        class="warning-item"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2L2 18h16L10 2zm0 4l5 10H5l5-10zm-1 7h2v2H9v-2zm0-5h2v4H9V8z"/>
        </svg>
        <span>{{ warning }}</span>
      </div>
    </div>
  </div>

  <div v-else class="no-results">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor">
      <rect x="8" y="8" width="48" height="48" rx="4" stroke-width="2"/>
      <line x1="20" y1="24" x2="44" y2="24" stroke-width="2"/>
      <line x1="20" y1="32" x2="44" y2="32" stroke-width="2"/>
      <line x1="20" y1="40" x2="36" y2="40" stroke-width="2"/>
    </svg>
    <p class="no-results__text">{{ t('comparison.selectAtLeastTwo') }}</p>
  </div>
</template>

<style scoped>
.comparison-results {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.results-header h2 {
  margin: 0;
  color: #161616;
}

.export-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #0f62fe;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-button:hover {
  background-color: #0353e9;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.summary-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-top: 4px solid;
  border-radius: 4px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.summary-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.summary-card__badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.badge--conservative {
  background-color: #d2f4ea;
  color: #0e6027;
}

.badge--moderate {
  background-color: #fcf4d6;
  color: #8e6a00;
}

.badge--liberal {
  background-color: #ffd7d9;
  color: #750e13;
}

.summary-card__metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric__label {
  font-size: 0.75rem;
  color: #525252;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric__value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #161616;
}

.stop-schedule {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.stop-schedule__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #161616;
  margin: 0 0 0.75rem 0;
}

.stops-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stop-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background-color: #f4f4f4;
  border-radius: 4px;
}

.stop-item__depth {
  font-weight: 600;
  color: #161616;
}

.stop-item__duration {
  color: #525252;
}

.no-stops {
  font-size: 0.875rem;
  color: #525252;
  font-style: italic;
  margin: 0;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #161616;
  margin: 0 0 1rem 0;
}

.differences-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.difference-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #8d8d8d;
  border-radius: 4px;
  padding: 1rem;
}

.difference-card.difference--major {
  border-left-color: #fa4d56;
}

.difference-card.difference--moderate {
  border-left-color: #f1c21b;
}

.difference-card.difference--minor {
  border-left-color: #24a148;
}

.difference-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.difference-card__title {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.difference-card__badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background-color: #f4f4f4;
  border-radius: 12px;
  text-transform: capitalize;
}

.difference-card__values {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.value-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.value-item__indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.value-item__model {
  flex: 1;
  font-size: 0.875rem;
  color: #525252;
}

.value-item__value {
  font-weight: 600;
  color: #161616;
}

.difference-card__explanation {
  font-size: 0.875rem;
  color: #525252;
  margin: 0;
  padding-top: 0.75rem;
  border-top: 1px solid #e0e0e0;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recommendation-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #e8f4ff;
  border-left: 4px solid #0f62fe;
  border-radius: 4px;
}

.recommendation-icon {
  flex-shrink: 0;
  color: #0f62fe;
}

.recommendation-text {
  margin: 0;
  color: #161616;
  line-height: 1.5;
}

.warnings-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.warning-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #fff1f1;
  border-left: 4px solid #fa4d56;
  border-radius: 4px;
  color: #750e13;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  color: #8d8d8d;
}

.no-results svg {
  margin-bottom: 1rem;
}

.no-results__text {
  font-size: 1.125rem;
  margin: 0;
}
</style>

<!-- Made with Bob -->