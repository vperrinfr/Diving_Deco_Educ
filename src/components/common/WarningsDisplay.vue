<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { Warning } from '../../types';
import { WarningLevel } from '../../types';

defineProps<{
  warnings: Warning[];
}>();

const { t } = useI18n();

const getNotificationKind = (level: string) => {
  switch (level) {
    case WarningLevel.DANGER:
      return 'error';
    case WarningLevel.WARNING:
      return 'warning';
    case WarningLevel.INFO:
    default:
      return 'info';
  }
};

const getNotificationIcon = (level: string) => {
  switch (level) {
    case WarningLevel.DANGER:
      return `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1c4.9 0 9 4.1 9 9s-4.1 9-9 9-9-4.1-9-9 4.1-9 9-9zM9 13v2h2v-2H9zm0-8v6h2V5H9z"/>
        </svg>
      `;
    case WarningLevel.WARNING:
      return `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1L1 17h18L10 1zm0 3.5L16.5 16h-13L10 4.5zM9 13v2h2v-2H9zm0-6v4h2V7H9z"/>
        </svg>
      `;
    case WarningLevel.INFO:
    default:
      return `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 1c4.9 0 9 4.1 9 9s-4.1 9-9 9-9-4.1-9-9 4.1-9 9-9zm1 13H9v2h2v-2zm0-10H9v8h2V4z"/>
        </svg>
      `;
  }
};
</script>

<template>
  <div v-if="warnings.length > 0" class="cds--tile warnings-container">
    <h3 class="cds--type-heading-03 cds--spacing-05 warnings-title">{{ t('warnings.title') }}</h3>
    
    <div class="notifications-list">
      <div
        v-for="(warning, index) in warnings"
        :key="index"
        :class="[
          'cds--inline-notification',
          `cds--inline-notification--${getNotificationKind(warning.level)}`
        ]"
        role="alert"
      >
        <div class="cds--inline-notification__details">
          <div
            class="cds--inline-notification__icon"
            v-html="getNotificationIcon(warning.level)"
          ></div>
          <div class="cds--inline-notification__text-wrapper">
            <p class="cds--inline-notification__title">
              <strong>{{ warning.message }}</strong>
            </p>
            <p v-if="warning.details" class="cds--inline-notification__subtitle">
              {{ warning.details }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Warning Legend -->
    <div class="warning-legend">
      <h4 class="cds--type-label-01">{{ t('warnings.legend.title') }}</h4>
      <div class="legend-items">
        <div class="legend-item">
          <div class="legend-indicator legend-indicator--error"></div>
          <span class="legend-text">{{ t('warnings.legend.error') }}</span>
        </div>
        <div class="legend-item">
          <div class="legend-indicator legend-indicator--warning"></div>
          <span class="legend-text">{{ t('warnings.legend.warning') }}</span>
        </div>
        <div class="legend-item">
          <div class="legend-indicator legend-indicator--info"></div>
          <span class="legend-text">{{ t('warnings.legend.info') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cds--tile {
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

.warnings-container {
  padding: 2rem;
}

.cds--spacing-05 {
  margin-bottom: 1.5rem;
}

.cds--type-heading-03 {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.4;
  color: #161616;
  font-family: 'IBM Plex Sans', sans-serif;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.cds--inline-notification {
  display: flex;
  width: 100%;
  min-height: 3rem;
  padding: 0.75rem 1rem;
  border-left: 3px solid;
  font-family: 'IBM Plex Sans', sans-serif;
}

.cds--inline-notification--error {
  background: #fff1f1;
  border-left-color: #da1e28;
}

.cds--inline-notification--warning {
  background: #fcf4d6;
  border-left-color: #f1c21b;
}

.cds--inline-notification--info {
  background: #edf5ff;
  border-left-color: #0f62fe;
}

.cds--inline-notification__details {
  display: flex;
  flex: 1;
  gap: 1rem;
}

.cds--inline-notification__icon {
  flex-shrink: 0;
  margin-top: 0.1875rem;
}

.cds--inline-notification--error .cds--inline-notification__icon {
  color: #da1e28;
}

.cds--inline-notification--warning .cds--inline-notification__icon {
  color: #f1c21b;
}

.cds--inline-notification--info .cds--inline-notification__icon {
  color: #0f62fe;
}

.cds--inline-notification__text-wrapper {
  flex: 1;
  min-width: 0;
}

.cds--inline-notification__title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.28572;
  margin: 0 0 0.25rem 0;
  color: #161616;
  display: block;
}

.cds--inline-notification__title strong {
  font-weight: 600;
}

.cds--inline-notification__subtitle {
  font-size: 0.875rem;
  line-height: 1.28572;
  margin: 0;
  color: #161616;
}

.warning-legend {
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.cds--type-label-01 {
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.33333;
  letter-spacing: 0.32px;
  color: #525252;
  margin-bottom: 0.75rem;
  display: block;
  font-family: 'IBM Plex Sans', sans-serif;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-indicator--error {
  background: #da1e28;
}

.legend-indicator--warning {
  background: #f1c21b;
}

.legend-indicator--info {
  background: #0f62fe;
}

.legend-text {
  font-size: 0.75rem;
  color: #525252;
  font-family: 'IBM Plex Sans', sans-serif;
}

@media (max-width: 768px) {
  .warnings-container {
    padding: 1rem;
  }
  
  .legend-items {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .cds--inline-notification {
    padding: 0.5rem 0.75rem;
  }
  
  .cds--inline-notification__details {
    gap: 0.75rem;
  }
}
</style>