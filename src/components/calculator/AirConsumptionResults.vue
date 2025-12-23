<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AirConsumptionResult, CylinderConfig } from '../../types/airConsumption';
import { STANDARD_CYLINDERS } from '../../types/airConsumption';

const { t } = useI18n();

const props = defineProps<{
  result: AirConsumptionResult | null;
}>();

const getCylinderConfig = (cylinderId: string): CylinderConfig | undefined => {
  return STANDARD_CYLINDERS.find(c => c.id === cylinderId);
};

const statusClass = computed(() => {
  if (!props.result) return '';
  return props.result.isSufficient ? 'status-sufficient' : 'status-insufficient';
});

const statusIcon = computed(() => {
  if (!props.result) return '';
  return props.result.isSufficient ? '✓' : '⚠';
});
</script>

<template>
  <div v-if="result" class="air-consumption-results">
    <div class="cds--tile results-tile">
      <h3 class="cds--type-heading-03">{{ t('airConsumption.results.title') }}</h3>
      
      <!-- Summary -->
      <div class="results-summary" :class="statusClass">
        <div class="summary-row">
          <div class="summary-item">
            <span class="summary-label">{{ t('airConsumption.results.airNeeded') }}</span>
            <span class="summary-value">{{ result.totalAirNeeded.toFixed(0) }} L</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">{{ t('airConsumption.results.airAvailable') }}</span>
            <span class="summary-value">
              {{ result.cylinderUsage.reduce((sum, u) => sum + u.volumeUsed, 0).toFixed(0) }} L
            </span>
          </div>
          <div class="summary-item status-item">
            <span class="status-icon">{{ statusIcon }}</span>
            <span class="status-text">
              {{ result.isSufficient ? t('airConsumption.results.sufficient') : t('airConsumption.results.insufficient') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Cylinder Usage Details -->
      <div class="cylinder-usage-section">
        <h4 class="cds--type-heading-02">{{ t('airConsumption.results.cylinderUsage') }}</h4>
        
        <div class="usage-list">
          <div
            v-for="(usage, index) in result.cylinderUsage"
            :key="index"
            class="usage-item"
          >
            <div class="usage-header">
              <span class="cylinder-name">
                {{ getCylinderConfig(usage.cylinderId)?.name || usage.cylinderId }}
              </span>
              <span class="usage-percentage" :class="{ 'high-usage': usage.percentageUsed > 80 }">
                {{ usage.percentageUsed.toFixed(0) }}%
              </span>
            </div>
            
            <div class="usage-bar">
              <div 
                class="usage-fill" 
                :style="{ width: `${Math.min(usage.percentageUsed, 100)}%` }"
                :class="{ 'high-usage': usage.percentageUsed > 80 }"
              ></div>
            </div>
            
            <div class="usage-details">
              <span class="detail-item">
                <strong>{{ t('airConsumption.results.startPressure') }}:</strong> {{ usage.startPressure }} bar
              </span>
              <span class="detail-item">
                <strong>{{ t('airConsumption.results.endPressure') }}:</strong> {{ usage.endPressure.toFixed(0) }} bar
              </span>
              <span class="detail-item">
                <strong>{{ t('airConsumption.results.used') }}:</strong> {{ usage.volumeUsed.toFixed(0) }} L
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div v-if="result.warnings.length > 0" class="warnings-section">
        <h4 class="cds--type-heading-02">{{ t('airConsumption.results.warnings') }}</h4>
        <div class="warning-list">
          <div v-for="(warning, index) in result.warnings" :key="index" class="warning-item">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L1 14h14L8 1zm0 2.5L13 13H3l5-9.5zM7 10v2h2v-2H7zm0-5v3h2V5H7z"/>
            </svg>
            <span>{{ warning }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.air-consumption-results {
  margin-top: 1rem;
}

.results-tile {
  padding: 1.5rem;
}

.cds--type-heading-03 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #161616;
  margin-bottom: 1rem;
}

.cds--type-heading-02 {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin-bottom: 0.75rem;
}

.results-summary {
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.status-sufficient {
  background: linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%);
  border-left: 4px solid #24a148;
}

.status-insufficient {
  background: linear-gradient(135deg, #ffebee 0%, #ffffff 100%);
  border-left: 4px solid #da1e28;
}

.summary-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #525252;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #161616;
}

.status-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.status-icon {
  font-size: 2rem;
}

.status-sufficient .status-icon {
  color: #24a148;
}

.status-insufficient .status-icon {
  color: #da1e28;
}

.status-text {
  font-size: 1rem;
  font-weight: 600;
}

.cylinder-usage-section {
  margin-top: 1.5rem;
}

.usage-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.usage-item {
  padding: 1rem;
  background: #f4f4f4;
  border-radius: 4px;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.cylinder-name {
  font-weight: 600;
  color: #161616;
}

.usage-percentage {
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f62fe;
}

.usage-percentage.high-usage {
  color: #da1e28;
}

.usage-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.usage-fill {
  height: 100%;
  background: #0f62fe;
  transition: width 0.3s ease;
}

.usage-fill.high-usage {
  background: #da1e28;
}

.usage-details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: #525252;
}

.detail-item strong {
  color: #161616;
}

.warnings-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #fff1f1;
  border-radius: 4px;
  border-left: 4px solid #da1e28;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #161616;
}

.warning-item svg {
  color: #da1e28;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

@media (max-width: 768px) {
  .summary-row {
    grid-template-columns: 1fr;
  }
  
  .usage-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>