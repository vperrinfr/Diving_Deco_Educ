<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DiveProfile } from '../../types';
import type { AirConsumptionResult } from '../../types/airConsumption';
import { isMultiLevelDive } from '../../types';
import { formatGasMix } from '../../utils/gasMix';
import { generateDivePlanPDF } from '../../services/pdfExportService';
import { useDiveSiteStore } from '../../stores/diveSiteStore';

const { t } = useI18n();
const diveSiteStore = useDiveSiteStore();

const props = defineProps<{
  profile: DiveProfile | null;
  airConsumption?: AirConsumptionResult | null;
}>();

const isExporting = ref(false);

const handleExportPDF = async (profile: DiveProfile) => {
  isExporting.value = true;
  
  try {
    // Récupérer les informations du plongeur depuis localStorage
    let diverInfo = null;
    const savedDiverInfo = localStorage.getItem('diver-info');
    if (savedDiverInfo) {
      diverInfo = JSON.parse(savedDiverInfo);
    } else {
      // Demander confirmation si les infos du plongeur sont manquantes
      const proceed = confirm(t('results.exportPdf.missingDiverInfo'));
      if (!proceed) {
        isExporting.value = false;
        return;
      }
    }
    
    // Générer le PDF avec toutes les données disponibles
    generateDivePlanPDF({
      profile,
      diverInfo,
      diveSite: diveSiteStore.currentSite || undefined,
      weather: diveSiteStore.weatherConditions || undefined,
      airConsumption: props.airConsumption || undefined
    });
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert(t('results.exportPdf.error'));
  } finally {
    isExporting.value = false;
  }
};

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const formatDepth = (depth: number, units: 'metric' | 'imperial'): string => {
  if (units === 'imperial') {
    return `${Math.round(depth * 3.28084)}ft`;
  }
  return `${depth}m`;
};
</script>

<template>
  <div v-if="profile" class="cds--tile">
    <div class="results-header">
      <h3 class="cds--type-heading-03 results-title">{{ t('results.title') }}</h3>
      <button
        @click="handleExportPDF(profile)"
        :disabled="isExporting"
        class="export-pdf-button"
        :title="t('results.exportPdf.button')"
      >
        <svg v-if="!isExporting" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M15 7h-3V1H8v6H5l5 5 5-5zM4 17v2h12v-2H4z"/>
        </svg>
        <svg v-else class="spinner" width="20" height="20" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="50" stroke-dashoffset="25"/>
        </svg>
        <span>{{ isExporting ? t('results.exportPdf.generating') : t('results.exportPdf.button') }}</span>
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="cds--grid cds--grid--narrow cds--spacing-05">
      <div class="cds--row">
        <div class="cds--col-lg-4 cds--col-md-4 cds--col-sm-4">
          <div class="cds--tile cds--tile--clickable metric-card metric-card--blue">
            <div class="metric-card__label">{{ t('results.metrics.totalDiveTime') }}</div>
            <div class="metric-card__value">{{ formatTime(profile.totalDiveTime) }}</div>
          </div>
        </div>

        <div class="cds--col-lg-4 cds--col-md-4 cds--col-sm-4">
          <div class="cds--tile cds--tile--clickable metric-card metric-card--purple">
            <div class="metric-card__label">{{ t('results.metrics.decompressionTime') }}</div>
            <div class="metric-card__value">{{ formatTime(profile.totalDecompressionTime) }}</div>
          </div>
        </div>

        <div class="cds--col-lg-4 cds--col-md-4 cds--col-sm-4">
          <div class="cds--tile cds--tile--clickable metric-card metric-card--green">
            <div class="metric-card__label">{{ t('results.metrics.ndlAtDepth') }}</div>
            <div class="metric-card__value">{{ formatTime(profile.noDecompressionLimit) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Multi-Level Dive Segments (if applicable) -->
    <div v-if="profile.segments && profile.segments.length > 0" class="cds--spacing-06">
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">{{ t('results.segments.title') }}</h4>
      <div class="cds--data-table-container">
        <table class="cds--data-table cds--data-table--compact">
          <thead>
            <tr>
              <th class="cds--table-header">{{ t('results.segments.number') }}</th>
              <th class="cds--table-header">{{ t('results.segments.depth') }}</th>
              <th class="cds--table-header">{{ t('results.segments.duration') }}</th>
              <th class="cds--table-header">{{ t('results.segments.type') }}</th>
              <th class="cds--table-header">{{ t('results.segments.gas') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(segment, index) in profile.segments.filter(s => s.segmentType === 'bottom')" :key="index" class="cds--table-row">
              <td class="cds--table-cell">{{ index + 1 }}</td>
              <td class="cds--table-cell">
                <strong class="depth-value">{{ formatDepth(segment.depth, profile.parameters.units) }}</strong>
              </td>
              <td class="cds--table-cell">{{ formatTime(segment.duration) }}</td>
              <td class="cds--table-cell">
                <span class="cds--tag cds--tag--purple">{{ segment.segmentType }}</span>
              </td>
              <td class="cds--table-cell">
                <span class="cds--tag cds--tag--blue">
                  {{ formatGasMix(segment.gasMix) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Gas Switches (if applicable) -->
    <div v-if="profile.gasSwitches && profile.gasSwitches.length > 0" class="cds--spacing-06">
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">{{ t('results.gasSwitches.title') }}</h4>
      <div class="cds--data-table-container">
        <table class="cds--data-table cds--data-table--compact">
          <thead>
            <tr>
              <th class="cds--table-header">{{ t('results.gasSwitches.depth') }}</th>
              <th class="cds--table-header">{{ t('results.gasSwitches.from') }}</th>
              <th class="cds--table-header">{{ t('results.gasSwitches.to') }}</th>
              <th class="cds--table-header">{{ t('results.gasSwitches.reason') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(gasSwitch, index) in profile.gasSwitches" :key="index" class="cds--table-row">
              <td class="cds--table-cell">
                <strong class="depth-value">{{ formatDepth(gasSwitch.depth, profile.parameters.units) }}</strong>
              </td>
              <td class="cds--table-cell">
                <span class="cds--tag cds--tag--gray">
                  {{ formatGasMix(gasSwitch.fromGas) }}
                </span>
              </td>
              <td class="cds--table-cell">
                <span class="cds--tag cds--tag--green">
                  {{ formatGasMix(gasSwitch.toGas) }}
                </span>
              </td>
              <td class="cds--table-cell">{{ gasSwitch.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dive Parameters Summary -->
    <div class="cds--spacing-06">
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">{{ t('results.parameters.title') }}</h4>
      <div class="cds--structured-list">
        <div class="cds--structured-list-row">
          <div class="cds--structured-list-td">{{ t('results.parameters.maxDepth') }}:</div>
          <div class="cds--structured-list-td"><strong>{{ formatDepth(profile.maxDepth, profile.parameters.units) }}</strong></div>
        </div>
        <div v-if="!isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">{{ t('results.parameters.bottomTime') }}:</div>
          <div class="cds--structured-list-td"><strong>{{ profile.parameters.bottomTime }} min</strong></div>
        </div>
        <div v-if="!isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">{{ t('results.parameters.gasMix') }}:</div>
          <div class="cds--structured-list-td">
            <strong>{{ profile.parameters.gasMix.name || 'Custom' }} ({{ Math.round(profile.parameters.gasMix.oxygen * 100) }}% O₂)</strong>
          </div>
        </div>
        <div class="cds--structured-list-row">
          <div class="cds--structured-list-td">{{ t('results.parameters.gradientFactors') }}:</div>
          <div class="cds--structured-list-td">
            <strong>{{ profile.parameters.gradientFactorLow }}/{{ profile.parameters.gradientFactorHigh }}</strong>
          </div>
        </div>
        <div v-if="isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">{{ t('results.parameters.descentRate') }}:</div>
          <div class="cds--structured-list-td"><strong>{{ profile.parameters.descentRate }} m/min</strong></div>
        </div>
        <div v-if="isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">{{ t('results.parameters.ascentRate') }}:</div>
          <div class="cds--structured-list-td"><strong>{{ profile.parameters.ascentRate }} m/min</strong></div>
        </div>
      </div>
    </div>

    <!-- Decompression Stops -->
    <div class="cds--spacing-06">
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">{{ t('results.decompression.title') }}</h4>
      
      <div v-if="profile.decompressionStops.length === 0" class="cds--tile cds--tile--success">
        <div class="success-message">
          <svg class="success-icon" width="32" height="32" viewBox="0 0 32 32">
            <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm-2 21.2L6.8 16l1.4-1.4L14 20.4l9.8-9.8 1.4 1.4L14 23.2z" fill="currentColor"/>
          </svg>
          <div>
            <p class="cds--type-heading-01">{{ t('results.decompression.noDecoRequired') }}</p>
            <p class="cds--type-body-compact-01">{{ t('results.decompression.noDecoMessage') }}</p>
          </div>
        </div>
      </div>

      <div v-else class="cds--data-table-container">
        <table class="cds--data-table cds--data-table--compact">
          <thead>
            <tr>
              <th class="cds--table-header">{{ t('results.decompression.depth') }}</th>
              <th class="cds--table-header">{{ t('results.decompression.stopTime') }}</th>
              <th class="cds--table-header">{{ t('results.decompression.runtime') }}</th>
              <th class="cds--table-header">{{ t('results.decompression.gas') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stop, index) in profile.decompressionStops" :key="index" class="cds--table-row">
              <td class="cds--table-cell">
                <strong class="depth-value">{{ formatDepth(stop.depth, profile.parameters.units) }}</strong>
              </td>
              <td class="cds--table-cell">{{ formatTime(stop.duration) }}</td>
              <td class="cds--table-cell">{{ formatTime(stop.runtime) }}</td>
              <td class="cds--table-cell">
                <span class="cds--tag cds--tag--blue">
                  {{ stop.gasMix.name || 'Custom' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <div v-else class="cds--tile empty-state">
    <svg class="empty-state__icon" width="80" height="80" viewBox="0 0 32 32">
      <path d="M25 5h-3V4a2 2 0 00-2-2h-8a2 2 0 00-2 2v1H7a2 2 0 00-2 2v21a2 2 0 002 2h18a2 2 0 002-2V7a2 2 0 00-2-2zM12 4h8v1h-8zm13 24H7V7h3v1a1 1 0 001 1h10a1 1 0 001-1V7h3z" fill="currentColor"/>
    </svg>
    <h3 class="cds--type-heading-02">{{ t('results.empty.title') }}</h3>
    <p class="cds--type-body-compact-01">{{ t('results.empty.message') }}</p>
  </div>
</template>

<style scoped>
.cds--tile {
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

.cds--spacing-03 {
  margin-top: 0.75rem;
}

.cds--spacing-05 {
  margin-top: 1.5rem;
}

.cds--spacing-06 {
  margin-top: 2rem;
}

.cds--grid {
  margin: 0 -0.5rem;
}

.cds--row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -0.5rem;
}

.cds--col-lg-4,
.cds--col-md-4,
.cds--col-sm-4 {
  padding: 0 0.5rem;
  margin-bottom: 1rem;
}

.cds--col-lg-4 {
  flex: 0 0 33.333%;
  max-width: 33.333%;
}

@media (max-width: 768px) {
  .cds--col-lg-4 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

.metric-card {
  padding: 1.5rem;
  text-align: center;
  transition: transform 0.15s;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card__label {
  font-size: 0.75rem;
  color: #525252;
  margin-bottom: 0.5rem;
}

.metric-card__value {
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.2;
}

.metric-card--blue {
  background: #d0e2ff;
  border-left: 4px solid #0f62fe;
}

.metric-card--blue .metric-card__value {
  color: #0043ce;
}

.metric-card--purple {
  background: #e8daff;
  border-left: 4px solid #8a3ffc;
}

.metric-card--purple .metric-card__value {
  color: #6929c4;
}

.metric-card--green {
  background: #defbe6;
  border-left: 4px solid #24a148;
}

.metric-card--green .metric-card__value {
  color: #0e6027;
}

.cds--structured-list {
  border-top: 1px solid #e0e0e0;
}

.cds--structured-list-row {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  padding: 0.75rem 0;
}

.cds--structured-list-td {
  flex: 1;
  font-size: 0.875rem;
  color: #161616;
}

.cds--structured-list-td:first-child {
  color: #525252;
}

.cds--tile--success {
  background: #defbe6;
  border-left: 4px solid #24a148;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  color: #24a148;
  flex-shrink: 0;
}

.cds--data-table-container {
  overflow-x: auto;
}

.cds--data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.cds--table-header {
  background: #262626;
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #f4f4f4;
  border-bottom: 1px solid #525252;
}

.cds--table-row {
  border-bottom: 1px solid #e0e0e0;
}

.cds--table-row {
  background: #393939;
}

.cds--table-row:hover {
  background: #4c4c4c;
}

.cds--table-cell {
  padding: 0.875rem 1rem;
  color: #f4f4f4;
}

.depth-value {
  color: #0f62fe;
}

.cds--tag {
  display: inline-flex;
  align-items: center;
  padding: 0 0.5rem;
  height: 1.5rem;
  font-size: 0.75rem;
  border-radius: 0.75rem;
}

.cds--tag--blue {
  background: #d0e2ff;
  color: #0043ce;
}

.cds--tag--purple {
  background: #e8daff;
  color: #6929c4;
}

.cds--tag--green {
  background: #defbe6;
  color: #0e6027;
}

.cds--tag--gray {
  background: #e0e0e0;
  color: #525252;
}


.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: #f4f4f4;
}

.empty-state__icon {
  color: #8d8d8d;
  margin-bottom: 1.5rem;
}

.results-title {
  color: #161616 !important;
  font-weight: 600 !important;
}

.section-heading {
  color: #161616 !important;
  font-weight: 600 !important;
}

.cds--type-heading-01 {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.28572;
}

.cds--type-heading-02 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.375;
}

.cds--type-heading-03 {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.4;
}

.cds--type-body-compact-01 {
  font-size: 0.875rem;
  line-height: 1.28572;
  color: #525252;
}

.cds--type-helper-text-01 {
  font-size: 0.75rem;
  line-height: 1.33333;
  color: #6f6f6f;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.export-pdf-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #0f62fe;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: 2px solid transparent;
  outline-offset: -2px;
}

.export-pdf-button:hover:not(:disabled) {
  background: #0353e9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.export-pdf-button:active:not(:disabled) {
  transform: translateY(0);
}

.export-pdf-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.export-pdf-button svg {
  flex-shrink: 0;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .export-pdf-button {
    width: 100%;
    justify-content: center;
  }
}
</style>