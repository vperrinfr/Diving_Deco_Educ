<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useRepetitiveDiveStore } from '../stores/repetitiveDiveStore';
import SurfaceIntervalCalculator from '../components/repetitive/SurfaceIntervalCalculator.vue';
import DesaturationChart from '../components/repetitive/DesaturationChart.vue';
import DiveTimeline from '../components/repetitive/DiveTimeline.vue';
import LanguageSwitcher from '../components/common/LanguageSwitcher.vue';
import type { RepetitiveDive } from '../types/repetitiveDive';

const router = useRouter();
const { t } = useI18n();
const store = useRepetitiveDiveStore();

// Initialize plan on mount if none exists
onMounted(() => {
  if (!store.currentPlan) {
    store.createNewPlan();
    console.log('Created new dive plan on mount');
  }
});

// Form state
const newDive = ref<Partial<RepetitiveDive>>({
  depth: 18,
  bottomTime: 40,
  gasType: 'air',
  oxygenPercentage: 21
});

const activeTab = ref<'planner' | 'calculator' | 'timeline'>('planner');

// Computed
const canAddDive = computed(() => {
  return newDive.value.depth && 
         newDive.value.bottomTime && 
         newDive.value.depth > 0 && 
         newDive.value.bottomTime > 0;
});

const currentStats = computed(() => {
  if (!store.currentPlan) return null;
  
  return {
    totalDives: store.currentPlan.dives.length,
    totalBottomTime: store.currentPlan.dives.reduce((sum, d) => sum + (d.profile.totalDiveTime - d.profile.totalDecompressionTime), 0),
    maxDepth: Math.max(...store.currentPlan.dives.map(d => d.profile.maxDepth), 0),
    nitrogenLoad: store.currentNitrogenLoad,
    pressureGroup: store.currentPressureGroup,
    noFlyTime: store.noFlyTimeRemaining
  };
});

// Methods
const goHome = () => {
  router.push('/');
};

const handleAddDive = () => {
  if (!canAddDive.value) return;
  
  // Calculate nitrogen fraction (1 - oxygen - helium)
  const oxygenFraction = (newDive.value.oxygenPercentage || 21) / 100;
  const heliumFraction = 0;
  const nitrogenFraction = 1 - oxygenFraction - heliumFraction;
  
  // Create DiveParameters object for the store
  const parameters = {
    depth: newDive.value.depth!,
    bottomTime: newDive.value.bottomTime!,
    gasMix: {
      oxygen: oxygenFraction,
      nitrogen: nitrogenFraction,
      helium: heliumFraction,
      name: newDive.value.gasType === 'nitrox' ? `EAN${newDive.value.oxygenPercentage}` : 'Air'
    },
    gradientFactorLow: 30,
    gradientFactorHigh: 85,
    units: 'metric' as const
  };
  
  const surfaceInterval = 60; // Default 60 minutes
  
  console.log('Adding dive with parameters:', parameters);
  
  const result = store.addDive(parameters, surfaceInterval);
  
  if (result) {
    console.log('Dive added successfully:', result);
    // Reset form on success
    newDive.value = {
      depth: 18,
      bottomTime: 40,
      gasType: 'air',
      oxygenPercentage: 21
    };
  } else {
    console.error('Failed to add dive - check validation warnings');
  }
};

const handleRemoveDive = (index: number) => {
  if (!store.currentPlan || !store.currentPlan.dives[index]) return;
  const diveId = store.currentPlan.dives[index].id;
  store.removeDive(diveId);
};

const handleLoadTemplate = (templateId: string) => {
  store.loadTemplate(templateId);
};

const handleNewPlan = () => {
  store.createNewPlan();
};
</script>

<template>
  <div class="calculator-page">
    <!-- Header -->
    <header class="cds--header">
      <div class="cds--header__container">
        <div class="cds--header__content">
          <button class="back-button" @click="goHome" :title="t('calculator.backButton')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 3L1 10l8 7v-5h10V8H9V3z"/>
            </svg>
          </button>
          <div class="cds--header__name">
            <span class="cds--header__name-prefix">🔄</span>
            <span class="cds--header__name-title">{{ t('repetitiveDive.title') }}</span>
          </div>
          <div class="cds--header__subtitle">
            {{ t('repetitiveDive.subtitle') }}
          </div>
        </div>
        <div class="cds--header__actions">
          <button class="help-button" @click="$router.push('/guide')" :title="t('guide.title')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H9v-2h2v2zm0-3H9c0-3.3 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.8-3 2.8-3 5z"/>
            </svg>
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="cds--content">
      <div class="cds--grid cds--grid--full-width">
        <div class="cds--row">
          <!-- Left Column - Input -->
          <div class="cds--col-lg-4 cds--col-md-8 cds--col-sm-4">
            <!-- Templates -->
            <div class="cds--tile">
              <h3 class="cds--type-heading-02 cds--spacing-05">{{ t('repetitiveDive.templates.title') }}</h3>
              <div class="template-buttons">
                <button 
                  class="cds--btn cds--btn--secondary cds--btn--sm"
                  @click="handleLoadTemplate('recreational')"
                >
                  {{ t('repetitiveDive.templates.recreational') }}
                </button>
                <button 
                  class="cds--btn cds--btn--secondary cds--btn--sm"
                  @click="handleLoadTemplate('nitrox')"
                >
                  {{ t('repetitiveDive.templates.nitrox') }}
                </button>
                <button 
                  class="cds--btn cds--btn--secondary cds--btn--sm"
                  @click="handleLoadTemplate('training')"
                >
                  {{ t('repetitiveDive.templates.training') }}
                </button>
                <button 
                  class="cds--btn cds--btn--danger cds--btn--sm"
                  @click="handleNewPlan"
                >
                  {{ t('repetitiveDive.newPlan') }}
                </button>
              </div>
            </div>

            <!-- Add Dive Form -->
            <div class="cds--tile">
              <h3 class="cds--type-heading-02 cds--spacing-05">{{ t('repetitiveDive.addDive') }}</h3>
              
              <div class="cds--form-item">
                <label class="cds--label">{{ t('repetitiveDive.depth') }}</label>
                <input 
                  type="number" 
                  class="cds--text-input"
                  v-model.number="newDive.depth"
                  min="1"
                  max="100"
                />
              </div>

              <div class="cds--form-item">
                <label class="cds--label">{{ t('repetitiveDive.bottomTime') }}</label>
                <input 
                  type="number" 
                  class="cds--text-input"
                  v-model.number="newDive.bottomTime"
                  min="1"
                  max="200"
                />
              </div>

              <div class="cds--form-item">
                <label class="cds--label">{{ t('repetitiveDive.gasType') }}</label>
                <select class="cds--select-input" v-model="newDive.gasType">
                  <option value="air">{{ t('repetitiveDive.air') }}</option>
                  <option value="nitrox">{{ t('repetitiveDive.nitrox') }}</option>
                </select>
              </div>

              <div class="cds--form-item" v-if="newDive.gasType === 'nitrox'">
                <label class="cds--label">{{ t('repetitiveDive.oxygenPercentage') }}</label>
                <input 
                  type="number" 
                  class="cds--text-input"
                  v-model.number="newDive.oxygenPercentage"
                  min="21"
                  max="40"
                />
              </div>

              <button 
                class="cds--btn cds--btn--primary"
                @click="handleAddDive"
                :disabled="!canAddDive"
                style="margin-top: 1rem; width: 100%;"
              >
                {{ t('repetitiveDive.addDiveButton') }}
              </button>
            </div>

            <!-- Current Stats -->
            <div class="cds--tile" v-if="currentStats">
              <h3 class="cds--type-heading-02 cds--spacing-05">{{ t('repetitiveDive.currentStatus') }}</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="stat-label">{{ t('repetitiveDive.totalDives') }}</span>
                  <span class="stat-value">{{ currentStats.totalDives }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ t('repetitiveDive.totalBottomTime') }}</span>
                  <span class="stat-value">{{ currentStats.totalBottomTime }} min</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ t('repetitiveDive.maxDepth') }}</span>
                  <span class="stat-value">{{ currentStats.maxDepth }} m</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ t('repetitiveDive.nitrogenLoad') }}</span>
                  <span class="stat-value">{{ currentStats.nitrogenLoad.toFixed(1) }}%</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ t('repetitiveDive.pressureGroup') }}</span>
                  <span class="stat-value pressure-group">{{ currentStats.pressureGroup }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ t('repetitiveDive.noFlyTime') }}</span>
                  <span class="stat-value">{{ Math.round(currentStats.noFlyTime / 60) }} h</span>
                </div>
              </div>
            </div>

            <!-- Disclaimer -->
            <div class="cds--inline-notification cds--inline-notification--warning disclaimer-notification">
              <div class="cds--inline-notification__details">
                <svg class="cds--inline-notification__icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 1L1 17h18L10 1zm0 3.5L16.5 16h-13L10 4.5zM9 13v2h2v-2H9zm0-6v4h2V7H9z"/>
                </svg>
                <div class="cds--inline-notification__text-wrapper">
                  <p class="cds--inline-notification__title">{{ t('calculator.disclaimer.title') }}</p>
                  <p class="cds--inline-notification__subtitle">
                    {{ t('calculator.disclaimer.text') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Results -->
          <div class="cds--col-lg-12 cds--col-md-8 cds--col-sm-4">
            <!-- Tabs -->
            <div class="cds--tabs cds--tabs--container">
              <div class="cds--tab-content">
                <ul class="cds--tabs__nav" role="tablist">
                  <li
                    class="cds--tabs__nav-item"
                    :class="{ 'cds--tabs__nav-item--selected': activeTab === 'planner' }"
                    role="presentation"
                  >
                    <button
                      class="cds--tabs__nav-link"
                      role="tab"
                      type="button"
                      @click="activeTab = 'planner'"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 0.5rem;">
                        <path d="M2 2h12v2H2V2zm0 4h12v2H2V6zm0 4h12v2H2v-2zm0 4h8v2H2v-2z"/>
                      </svg>
                      {{ t('repetitiveDive.tabs.planner') }}
                    </button>
                  </li>
                  <li
                    class="cds--tabs__nav-item"
                    :class="{ 'cds--tabs__nav-item--selected': activeTab === 'calculator' }"
                    role="presentation"
                  >
                    <button
                      class="cds--tabs__nav-link"
                      role="tab"
                      type="button"
                      @click="activeTab = 'calculator'"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 0.5rem;">
                        <path d="M8 2C4.7 2 2 4.7 2 8s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>
                      </svg>
                      {{ t('repetitiveDive.tabs.calculator') }}
                    </button>
                  </li>
                  <li
                    class="cds--tabs__nav-item"
                    :class="{ 'cds--tabs__nav-item--selected': activeTab === 'timeline' }"
                    role="presentation"
                  >
                    <button
                      class="cds--tabs__nav-link"
                      role="tab"
                      type="button"
                      @click="activeTab = 'timeline'"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 0.5rem;">
                        <path d="M2 2h12v12H2V2zm2 2v8h8V4H4z"/>
                      </svg>
                      {{ t('repetitiveDive.tabs.timeline') }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Planner Tab -->
            <div v-show="activeTab === 'planner'">
              <div class="cds--tile" v-if="store.currentPlan && store.currentPlan.dives.length > 0">
                <h3 class="cds--type-heading-02 cds--spacing-05">{{ t('repetitiveDive.diveList') }}</h3>
                <div class="dive-list">
                  <div 
                    v-for="(dive, index) in store.currentPlan.dives" 
                    :key="index"
                    class="dive-item"
                  >
                    <div class="dive-info">
                      <span class="dive-number">{{ t('repetitiveDive.dive') }} {{ index + 1 }}</span>
                      <span class="dive-details">
                        {{ dive.profile.maxDepth }}m × {{ Math.round(dive.profile.totalDiveTime - dive.profile.totalDecompressionTime) }}min
                        <span v-if="dive.profile.segments[0]?.gasMix.name.includes('EAN')"> ({{ dive.profile.segments[0].gasMix.name }})</span>
                      </span>
                    </div>
                    <button 
                      class="cds--btn cds--btn--ghost cds--btn--sm cds--btn--icon-only"
                      @click="handleRemoveDive(index)"
                      :title="t('repetitiveDive.removeDive')"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12 4.7L11.3 4 8 7.3 4.7 4 4 4.7 7.3 8 4 11.3l.7.7L8 8.7l3.3 3.3.7-.7L8.7 8z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div class="cds--tile" v-else>
                <p class="cds--type-body-long-01">{{ t('repetitiveDive.noDives') }}</p>
              </div>

              <DesaturationChart
                v-if="store.currentPlan && store.currentPlan.dives.length > 0 && store.lastDive"
                :tissues="store.lastDive.residualNitrogenAfter"
              />
            </div>

            <!-- Calculator Tab -->
            <div v-show="activeTab === 'calculator'">
              <SurfaceIntervalCalculator
                v-if="store.currentPlan && store.currentPlan.dives.length > 0 && store.lastDive"
                :tissues="store.lastDive.residualNitrogenAfter"
              />
              <div class="cds--tile" v-else>
                <p class="cds--type-body-long-01">{{ t('repetitiveDive.addFirstDive') }}</p>
              </div>
            </div>

            <!-- Timeline Tab -->
            <div v-show="activeTab === 'timeline'">
              <DiveTimeline
                v-if="store.currentPlan && store.currentPlan.dives.length > 0"
                :dives="store.currentPlan.dives"
                :surface-intervals="store.currentPlan.surfaceIntervals"
              />
              <div class="cds--tile" v-else>
                <p class="cds--type-body-long-01">{{ t('repetitiveDive.addFirstDive') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Header Styles */
.cds--header {
  background: #161616;
  color: #ffffff;
  padding: 1rem 0;
  border-bottom: 1px solid #393939;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.cds--header__container {
  max-width: 1584px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.cds--header__content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.cds--header__actions {
  flex-shrink: 0;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-button {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.help-button:hover {
  background: #393939;
}

.back-button {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background: #393939;
}

.cds--header__name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cds--header__name-prefix {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.cds--header__name-title {
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.2;
  white-space: nowrap;
}

.cds--header__subtitle {
  font-size: 0.875rem;
  color: #c6c6c6;
  font-weight: 300;
  line-height: 1.4;
}

.template-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--cds-text-02);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--cds-text-01);
}

.stat-value.pressure-group {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cds-interactive-01);
}

.dive-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.dive-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--cds-ui-01);
  border-left: 3px solid var(--cds-interactive-01);
}

.dive-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dive-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cds-text-02);
  text-transform: uppercase;
}

.dive-details {
  font-size: 0.875rem;
  color: var(--cds-text-01);
}

/* Tabs Styles */
.cds--tabs {
  margin-bottom: 1rem;
}

.cds--tabs__nav {
  display: flex;
  list-style: none;
  padding: 0;
  margin: 0;
  border-bottom: 1px solid var(--cds-ui-03);
  background: var(--cds-ui-01);
}

.cds--tabs__nav-item {
  flex: 0 0 auto;
}

.cds--tabs__nav-link {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--cds-text-02);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 400;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.cds--tabs__nav-link:hover {
  background: var(--cds-ui-02);
  color: var(--cds-text-01);
}

.cds--tabs__nav-item--selected .cds--tabs__nav-link {
  color: var(--cds-interactive-01);
  border-bottom-color: var(--cds-interactive-01);
  font-weight: 600;
}

.cds--tabs__nav-link svg {
  flex-shrink: 0;
}
</style>