<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CompartmentAnalysis } from '../../types/stopAnalysis';
import { getStatusColor, getCompartmentDisplayName } from '../../services/stopAnalysisService';

const { t } = useI18n();

const props = defineProps<{
  compartments: CompartmentAnalysis[];
}>();

// Calculate bar width for each compartment
const getBarWidth = (compartment: CompartmentAnalysis): number => {
  return Math.min(100, Math.max(0, compartment.saturationPercent));
};

// Get bar color based on status
const getBarColor = (compartment: CompartmentAnalysis): string => {
  return getStatusColor(compartment.status);
};

// Get compartment label
const getLabel = (compartment: CompartmentAnalysis): string => {
  return getCompartmentDisplayName(compartment.compartmentNumber, compartment.n2HalfTime);
};
</script>

<template>
  <div class="compartment-chart">
    <div class="chart-header">
      <h4 class="chart-title">{{ t('analysis.chart.title') }}</h4>
      <div class="chart-legend">
        <div class="legend-item">
          <span class="legend-color" style="background: #24a148;"></span>
          <span class="legend-label">{{ t('analysis.chart.safe') }} (<70%)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #f1c21b;"></span>
          <span class="legend-label">{{ t('analysis.chart.caution') }} (70-90%)</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #da1e28;"></span>
          <span class="legend-label">{{ t('analysis.chart.danger') }} (>90%)</span>
        </div>
      </div>
    </div>

    <div class="chart-container">
      <div
        v-for="compartment in compartments"
        :key="compartment.compartmentNumber"
        :class="['chart-row', { 'chart-row--limiting': compartment.isLimiting }]"
      >
        <div class="chart-label">
          <span class="compartment-number">{{ getLabel(compartment) }}</span>
          <span v-if="compartment.isLimiting" class="limiting-badge">
            ⚠️ {{ t('analysis.chart.limiting') }}
          </span>
        </div>
        <div class="chart-bar-container">
          <div
            class="chart-bar"
            :style="{
              width: `${getBarWidth(compartment)}%`,
              background: getBarColor(compartment)
            }"
          >
            <span class="chart-bar-label">{{ compartment.saturationPercent.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chart-footer">
      <p class="chart-note">
        {{ t('analysis.chart.note') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.compartment-chart {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.chart-legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #525252;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}

.legend-label {
  white-space: nowrap;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.chart-row:hover {
  background: #f4f4f4;
}

.chart-row--limiting {
  background: #fff1f1;
  border: 2px solid #da1e28;
  padding: 0.5rem;
}

.chart-row--limiting:hover {
  background: #ffe0e0;
}

.chart-label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.compartment-number {
  font-size: 0.875rem;
  font-weight: 500;
  color: #161616;
}

.limiting-badge {
  font-size: 0.75rem;
  color: #da1e28;
  font-weight: 600;
}

.chart-bar-container {
  position: relative;
  height: 32px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.chart-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.5rem;
  transition: width 0.3s ease;
  position: relative;
}

.chart-bar-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

.chart-footer {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.chart-note {
  font-size: 0.75rem;
  color: #6f6f6f;
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .compartment-chart {
    padding: 1rem;
  }

  .chart-header {
    flex-direction: column;
  }

  .chart-legend {
    flex-direction: column;
    gap: 0.5rem;
  }

  .chart-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .chart-label {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>