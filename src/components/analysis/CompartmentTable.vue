<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { CompartmentAnalysis } from '../../types/stopAnalysis';
import { 
  getStatusColor, 
  formatPressure, 
  formatPercent,
  getCompartmentDisplayName 
} from '../../services/stopAnalysisService';

const { t } = useI18n();

const props = defineProps<{
  compartments: CompartmentAnalysis[];
  units: 'metric' | 'imperial';
}>();

// Format depth for display
const formatDepth = (depth: number): string => {
  if (props.units === 'imperial') {
    return `${Math.round(depth * 3.28084)}ft`;
  }
  return `${depth}m`;
};

// Get status icon
const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'safe':
      return '✓';
    case 'caution':
      return '⚠';
    case 'danger':
      return '⚠';
    default:
      return '•';
  }
};

// Get status label
const getStatusLabel = (status: string): string => {
  return t(`analysis.table.status.${status}`);
};
</script>

<template>
  <div class="compartment-table">
    <div class="table-header">
      <h4 class="table-title">{{ t('analysis.table.title') }}</h4>
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('analysis.table.compartment') }}</th>
            <th>{{ t('analysis.table.halfTime') }}</th>
            <th>{{ t('analysis.table.tissuePressure') }}</th>
            <th>{{ t('analysis.table.toleratedPressure') }}</th>
            <th>{{ t('analysis.table.margin') }}</th>
            <th>{{ t('analysis.table.ceiling') }}</th>
            <th>{{ t('analysis.table.saturation') }}</th>
            <th>{{ t('analysis.table.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="compartment in compartments"
            :key="compartment.compartmentNumber"
            :class="['table-row', { 'table-row--limiting': compartment.isLimiting }]"
          >
            <td class="cell-compartment">
              <span class="compartment-label">
                {{ getCompartmentDisplayName(compartment.compartmentNumber, compartment.n2HalfTime) }}
              </span>
              <span v-if="compartment.isLimiting" class="limiting-indicator">
                ⚠️ {{ t('analysis.table.limiting') }}
              </span>
            </td>
            <td>{{ compartment.n2HalfTime.toFixed(1) }} min</td>
            <td>{{ formatPressure(compartment.tissuePressure) }}</td>
            <td>{{ formatPressure(compartment.toleratedPressure) }}</td>
            <td>
              <div class="margin-cell">
                <span class="margin-bar">{{ formatPressure(compartment.marginBar) }}</span>
                <span class="margin-percent" :style="{ color: getStatusColor(compartment.status) }">
                  ({{ formatPercent(compartment.marginPercent) }})
                </span>
              </div>
            </td>
            <td>
              <span class="ceiling-value">{{ formatDepth(compartment.ceiling) }}</span>
            </td>
            <td>
              <span :style="{ color: getStatusColor(compartment.status), fontWeight: 600 }">
                {{ formatPercent(compartment.saturationPercent) }}
              </span>
            </td>
            <td>
              <span 
                class="status-badge"
                :class="`status-badge--${compartment.status}`"
                :style="{ borderColor: getStatusColor(compartment.status) }"
              >
                {{ getStatusIcon(compartment.status) }} {{ getStatusLabel(compartment.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <p class="table-note">
        {{ t('analysis.table.note') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.compartment-table {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.table-header {
  margin-bottom: 1rem;
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 1rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead {
  background: #262626;
  color: #f4f4f4;
}

.data-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #525252;
  white-space: nowrap;
}

.data-table tbody {
  background: #ffffff;
}

.table-row {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: #f4f4f4;
}

.table-row--limiting {
  background: #fff1f1;
  border-left: 4px solid #da1e28;
}

.table-row--limiting:hover {
  background: #ffe0e0;
}

.data-table td {
  padding: 0.75rem 1rem;
  color: #161616;
  vertical-align: middle;
}

.cell-compartment {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.compartment-label {
  font-weight: 500;
}

.limiting-indicator {
  font-size: 0.75rem;
  color: #da1e28;
  font-weight: 600;
}

.margin-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.margin-bar {
  font-weight: 500;
}

.margin-percent {
  font-size: 0.75rem;
}

.ceiling-value {
  font-weight: 600;
  color: #0f62fe;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
  white-space: nowrap;
}

.status-badge--safe {
  background: #defbe6;
  color: #0e6027;
}

.status-badge--caution {
  background: #fcf4d6;
  color: #8e6a00;
}

.status-badge--danger {
  background: #fff1f1;
  color: #750e13;
}

.table-footer {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.table-note {
  font-size: 0.75rem;
  color: #6f6f6f;
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 1200px) {
  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem 0.75rem;
  }
}

@media (max-width: 768px) {
  .compartment-table {
    padding: 1rem;
  }

  .table-container {
    margin: 0 -1rem;
    padding: 0 1rem;
  }

  .data-table {
    font-size: 0.7rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }

  .data-table th {
    font-size: 0.65rem;
  }
}
</style>