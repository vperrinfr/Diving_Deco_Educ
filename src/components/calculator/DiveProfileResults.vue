<script setup lang="ts">
import type { DiveProfile } from '../../types';
import { isMultiLevelDive } from '../../types';
import { formatGasMix } from '../../utils/gasMix';

defineProps<{
  profile: DiveProfile | null;
}>();

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
    <h3 class="cds--type-heading-03 cds--spacing-05 results-title">Dive Profile Results</h3>

    <!-- Summary Cards -->
    <div class="cds--grid cds--grid--narrow cds--spacing-05">
      <div class="cds--row">
        <div class="cds--col-lg-4 cds--col-md-4 cds--col-sm-4">
          <div class="cds--tile cds--tile--clickable metric-card metric-card--blue">
            <div class="metric-card__label">Total Dive Time</div>
            <div class="metric-card__value">{{ formatTime(profile.totalDiveTime) }}</div>
          </div>
        </div>

        <div class="cds--col-lg-4 cds--col-md-4 cds--col-sm-4">
          <div class="cds--tile cds--tile--clickable metric-card metric-card--purple">
            <div class="metric-card__label">Decompression Time</div>
            <div class="metric-card__value">{{ formatTime(profile.totalDecompressionTime) }}</div>
          </div>
        </div>

        <div class="cds--col-lg-4 cds--col-md-4 cds--col-sm-4">
          <div class="cds--tile cds--tile--clickable metric-card metric-card--green">
            <div class="metric-card__label">NDL at Depth</div>
            <div class="metric-card__value">{{ formatTime(profile.noDecompressionLimit) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Multi-Level Dive Segments (if applicable) -->
    <div v-if="profile.segments && profile.segments.length > 0" class="cds--spacing-06">
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">Dive Segments</h4>
      <div class="cds--data-table-container">
        <table class="cds--data-table cds--data-table--compact">
          <thead>
            <tr>
              <th class="cds--table-header">#</th>
              <th class="cds--table-header">Depth</th>
              <th class="cds--table-header">Duration</th>
              <th class="cds--table-header">Type</th>
              <th class="cds--table-header">Gas</th>
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
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">Gas Switches</h4>
      <div class="cds--data-table-container">
        <table class="cds--data-table cds--data-table--compact">
          <thead>
            <tr>
              <th class="cds--table-header">Depth</th>
              <th class="cds--table-header">From</th>
              <th class="cds--table-header">To</th>
              <th class="cds--table-header">Reason</th>
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
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">Dive Parameters</h4>
      <div class="cds--structured-list">
        <div class="cds--structured-list-row">
          <div class="cds--structured-list-td">Max Depth:</div>
          <div class="cds--structured-list-td"><strong>{{ formatDepth(profile.maxDepth, profile.parameters.units) }}</strong></div>
        </div>
        <div v-if="!isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">Bottom Time:</div>
          <div class="cds--structured-list-td"><strong>{{ profile.parameters.bottomTime }} min</strong></div>
        </div>
        <div v-if="!isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">Gas Mix:</div>
          <div class="cds--structured-list-td">
            <strong>{{ profile.parameters.gasMix.name || 'Custom' }} ({{ Math.round(profile.parameters.gasMix.oxygen * 100) }}% O₂)</strong>
          </div>
        </div>
        <div class="cds--structured-list-row">
          <div class="cds--structured-list-td">Gradient Factors:</div>
          <div class="cds--structured-list-td">
            <strong>{{ profile.parameters.gradientFactorLow }}/{{ profile.parameters.gradientFactorHigh }}</strong>
          </div>
        </div>
        <div v-if="isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">Descent Rate:</div>
          <div class="cds--structured-list-td"><strong>{{ profile.parameters.descentRate }} m/min</strong></div>
        </div>
        <div v-if="isMultiLevelDive(profile.parameters)" class="cds--structured-list-row">
          <div class="cds--structured-list-td">Ascent Rate:</div>
          <div class="cds--structured-list-td"><strong>{{ profile.parameters.ascentRate }} m/min</strong></div>
        </div>
      </div>
    </div>

    <!-- Decompression Stops -->
    <div class="cds--spacing-06">
      <h4 class="cds--type-heading-02 cds--spacing-03 section-heading">Decompression Schedule</h4>
      
      <div v-if="profile.decompressionStops.length === 0" class="cds--tile cds--tile--success">
        <div class="success-message">
          <svg class="success-icon" width="32" height="32" viewBox="0 0 32 32">
            <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14 14-6.3 14-14S23.7 2 16 2zm-2 21.2L6.8 16l1.4-1.4L14 20.4l9.8-9.8 1.4 1.4L14 23.2z" fill="currentColor"/>
          </svg>
          <div>
            <p class="cds--type-heading-01">No Decompression Required</p>
            <p class="cds--type-body-compact-01">This dive is within no-decompression limits</p>
          </div>
        </div>
      </div>

      <div v-else class="cds--data-table-container">
        <table class="cds--data-table cds--data-table--compact">
          <thead>
            <tr>
              <th class="cds--table-header">Depth</th>
              <th class="cds--table-header">Stop Time</th>
              <th class="cds--table-header">Runtime</th>
              <th class="cds--table-header">Gas</th>
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
    <h3 class="cds--type-heading-02">No Dive Profile Yet</h3>
    <p class="cds--type-body-compact-01">Enter dive parameters and click "Calculate Dive Profile" to see results</p>
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
</style>