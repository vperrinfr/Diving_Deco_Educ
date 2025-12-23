<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CompartmentAnalysis } from '../../types/stopAnalysis';
import { formatPressure, formatPercent, getStatusColor } from '../../services/stopAnalysisService';

const { t } = useI18n();

const props = defineProps<{
  limitingCompartment: CompartmentAnalysis;
  selectedDepth: number;
  canAscendTo: number;
  isAscentSafe: boolean;
  explanation: string;
  units: 'metric' | 'imperial';
}>();

// Format depth for display
const formatDepth = (depth: number): string => {
  if (props.units === 'imperial') {
    return `${Math.round(depth * 3.28084)}ft`;
  }
  return `${depth}m`;
};

// Get margin status color
const marginColor = computed(() => {
  return getStatusColor(props.limitingCompartment.status);
});

// Get margin status icon
const marginIcon = computed(() => {
  switch (props.limitingCompartment.status) {
    case 'safe':
      return '✓';
    case 'caution':
      return '⚠';
    case 'danger':
      return '⚠';
    default:
      return '•';
  }
});

// Calculate margin percentage for visual bar
const marginBarWidth = computed(() => {
  const percent = props.limitingCompartment.marginPercent;
  return Math.max(0, Math.min(100, percent));
});
</script>

<template>
  <div class="pressure-margins">
    <div class="margins-header">
      <div class="header-icon" :style="{ background: marginColor }">
        <span class="icon">{{ marginIcon }}</span>
      </div>
      <div class="header-content">
        <h4 class="header-title">{{ t('analysis.margins.title') }}</h4>
        <p class="header-subtitle">
          {{ t('analysis.margins.compartment') }} #{{ limitingCompartment.compartmentNumber }}
          ({{ limitingCompartment.n2HalfTime.toFixed(1) }} min)
        </p>
      </div>
    </div>

    <div class="margins-grid">
      <!-- Tolerated Pressure -->
      <div class="margin-card">
        <div class="card-label">{{ t('analysis.margins.toleratedPressure') }}</div>
        <div class="card-value card-value--primary">
          {{ formatPressure(limitingCompartment.toleratedPressure) }}
        </div>
        <div class="card-description">{{ t('analysis.margins.toleratedDescription') }}</div>
      </div>

      <!-- Ambient Pressure -->
      <div class="margin-card">
        <div class="card-label">{{ t('analysis.margins.ambientPressure') }}</div>
        <div class="card-value">
          {{ formatPressure(limitingCompartment.ambientPressure) }}
        </div>
        <div class="card-description">
          {{ t('analysis.margins.atDepth', { depth: formatDepth(selectedDepth) }) }}
        </div>
      </div>

      <!-- Margin -->
      <div class="margin-card margin-card--highlight">
        <div class="card-label">{{ t('analysis.margins.margin') }}</div>
        <div class="card-value card-value--large" :style="{ color: marginColor }">
          {{ formatPressure(limitingCompartment.marginBar) }}
        </div>
        <div class="card-value-secondary" :style="{ color: marginColor }">
          {{ formatPercent(limitingCompartment.marginPercent) }}
        </div>
        <div class="margin-bar-container">
          <div 
            class="margin-bar"
            :style="{ 
              width: `${marginBarWidth}%`,
              background: marginColor
            }"
          ></div>
        </div>
      </div>

      <!-- Ceiling -->
      <div class="margin-card">
        <div class="card-label">{{ t('analysis.margins.ceiling') }}</div>
        <div class="card-value card-value--accent">
          {{ formatDepth(canAscendTo) }}
        </div>
        <div class="card-description">{{ t('analysis.margins.ceilingDescription') }}</div>
      </div>
    </div>

    <!-- Explanation -->
    <div 
      class="explanation-box"
      :class="{
        'explanation-box--safe': isAscentSafe,
        'explanation-box--warning': !isAscentSafe
      }"
    >
      <div class="explanation-icon">
        <svg v-if="isAscentSafe" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
      </div>
      <div class="explanation-content">
        <p class="explanation-title">
          {{ isAscentSafe ? t('analysis.margins.safeTitle') : t('analysis.margins.warningTitle') }}
        </p>
        <p class="explanation-text">{{ explanation }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pressure-margins {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.margins-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon {
  font-size: 1.5rem;
  color: #ffffff;
}

.header-content {
  flex: 1;
}

.header-title {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin: 0 0 0.25rem 0;
}

.header-subtitle {
  font-size: 0.875rem;
  color: #525252;
  margin: 0;
}

.margins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.margin-card {
  background: #f4f4f4;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.margin-card--highlight {
  background: linear-gradient(135deg, #f4f4f4 0%, #e8e8e8 100%);
  border: 2px solid #0f62fe;
}

.card-label {
  font-size: 0.75rem;
  color: #525252;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 300;
  color: #161616;
  margin-bottom: 0.25rem;
}

.card-value--primary {
  color: #0f62fe;
}

.card-value--accent {
  color: #da1e28;
}

.card-value--large {
  font-size: 2rem;
}

.card-value-secondary {
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.card-description {
  font-size: 0.75rem;
  color: #6f6f6f;
  line-height: 1.4;
}

.margin-bar-container {
  margin-top: 0.75rem;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.margin-bar {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.explanation-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.explanation-box--safe {
  background: #defbe6;
  border-color: #24a148;
}

.explanation-box--warning {
  background: #fff1f1;
  border-color: #da1e28;
}

.explanation-icon {
  flex-shrink: 0;
}

.explanation-box--safe .explanation-icon {
  color: #24a148;
}

.explanation-box--warning .explanation-icon {
  color: #da1e28;
}

.explanation-content {
  flex: 1;
}

.explanation-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
}

.explanation-box--safe .explanation-title {
  color: #0e6027;
}

.explanation-box--warning .explanation-title {
  color: #750e13;
}

.explanation-text {
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0;
}

.explanation-box--safe .explanation-text {
  color: #0e6027;
}

.explanation-box--warning .explanation-text {
  color: #750e13;
}

@media (max-width: 768px) {
  .pressure-margins {
    padding: 1rem;
  }

  .margins-grid {
    grid-template-columns: 1fr;
  }

  .margins-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .explanation-box {
    flex-direction: column;
  }
}
</style>