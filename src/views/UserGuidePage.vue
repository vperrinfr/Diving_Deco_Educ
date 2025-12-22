<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../components/common/LanguageSwitcher.vue';

const router = useRouter();
const { t } = useI18n();

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="guide-page">
    <!-- Header -->
    <header class="cds--header">
      <div class="cds--header__container">
        <div class="cds--header__content">
          <button class="back-button" @click="goBack" :title="t('guide.backButton')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 3L1 10l8 7v-5h10V8H9V3z"/>
            </svg>
          </button>
          <div class="cds--header__name">
            <span class="cds--header__name-prefix">❓</span>
            <span class="cds--header__name-title">{{ t('guide.title') }}</span>
          </div>
        </div>
        <div class="cds--header__actions">
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="cds--content">
      <div class="cds--grid cds--grid--full-width">
        <div class="cds--row">
          <div class="cds--col-lg-12 cds--col-md-8 cds--col-sm-4">
            
            <!-- Introduction -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.intro.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.intro.description') }}</p>
            </div>

            <!-- Getting Started -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.gettingStarted.title') }}</h2>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h3 class="cds--type-heading-02">{{ t('guide.gettingStarted.step1.title') }}</h3>
                    <p class="cds--type-body-long-01">{{ t('guide.gettingStarted.step1.description') }}</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h3 class="cds--type-heading-02">{{ t('guide.gettingStarted.step2.title') }}</h3>
                    <p class="cds--type-body-long-01">{{ t('guide.gettingStarted.step2.description') }}</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h3 class="cds--type-heading-02">{{ t('guide.gettingStarted.step3.title') }}</h3>
                    <p class="cds--type-body-long-01">{{ t('guide.gettingStarted.step3.description') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Simple Mode -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.simpleMode.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.simpleMode.description') }}</p>
              <ul class="feature-list">
                <li><strong>{{ t('guide.simpleMode.depth.title') }}:</strong> {{ t('guide.simpleMode.depth.description') }}</li>
                <li><strong>{{ t('guide.simpleMode.bottomTime.title') }}:</strong> {{ t('guide.simpleMode.bottomTime.description') }}</li>
                <li><strong>{{ t('guide.simpleMode.gasMix.title') }}:</strong> {{ t('guide.simpleMode.gasMix.description') }}</li>
              </ul>
            </div>

            <!-- Advanced Mode -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.advancedMode.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.advancedMode.description') }}</p>
              <ul class="feature-list">
                <li><strong>{{ t('guide.advancedMode.multiLevel.title') }}:</strong> {{ t('guide.advancedMode.multiLevel.description') }}</li>
                <li><strong>{{ t('guide.advancedMode.multiGas.title') }}:</strong> {{ t('guide.advancedMode.multiGas.description') }}</li>
                <li><strong>{{ t('guide.advancedMode.rates.title') }}:</strong> {{ t('guide.advancedMode.rates.description') }}</li>
              </ul>
            </div>

            <!-- Gradient Factors -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.gradientFactors.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.gradientFactors.description') }}</p>
              <div class="gf-presets">
                <div class="gf-preset gf-preset--conservative">
                  <h4 class="cds--type-heading-02">{{ t('guide.gradientFactors.conservative.title') }} (30/70)</h4>
                  <p class="cds--type-body-compact-01">{{ t('guide.gradientFactors.conservative.description') }}</p>
                </div>
                <div class="gf-preset gf-preset--moderate">
                  <h4 class="cds--type-heading-02">{{ t('guide.gradientFactors.moderate.title') }} (40/85)</h4>
                  <p class="cds--type-body-compact-01">{{ t('guide.gradientFactors.moderate.description') }}</p>
                </div>
                <div class="gf-preset gf-preset--aggressive">
                  <h4 class="cds--type-heading-02">{{ t('guide.gradientFactors.aggressive.title') }} (50/95)</h4>
                  <p class="cds--type-body-compact-01">{{ t('guide.gradientFactors.aggressive.description') }}</p>
                </div>
              </div>
            </div>

            <!-- Understanding Results -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.results.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.results.description') }}</p>
              <ul class="feature-list">
                <li><strong>{{ t('guide.results.totalTime.title') }}:</strong> {{ t('guide.results.totalTime.description') }}</li>
                <li><strong>{{ t('guide.results.decoTime.title') }}:</strong> {{ t('guide.results.decoTime.description') }}</li>
                <li><strong>{{ t('guide.results.ndl.title') }}:</strong> {{ t('guide.results.ndl.description') }}</li>
                <li><strong>{{ t('guide.results.decoStops.title') }}:</strong> {{ t('guide.results.decoStops.description') }}</li>
              </ul>
            </div>

            <!-- Safety Warning -->
            <div class="cds--tile guide-section warning-section">
              <div class="warning-header">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 2L2 28h28L16 2zm0 5l10 18H6l10-18zm-2 13v2h4v-2h-4zm0-8v6h4v-6h-4z"/>
                </svg>
                <h2 class="cds--type-heading-04">{{ t('guide.safety.title') }}</h2>
              </div>
              <p class="cds--type-body-long-01">{{ t('guide.safety.description') }}</p>
              <ul class="warning-list">
                <li>{{ t('guide.safety.point1') }}</li>
                <li>{{ t('guide.safety.point2') }}</li>
                <li>{{ t('guide.safety.point3') }}</li>
                <li>{{ t('guide.safety.point4') }}</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.guide-page {
  min-height: 100vh;
  background: #f4f4f4;
  font-family: 'IBM Plex Sans', sans-serif;
}

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

/* Main Content */
.cds--content {
  padding: 2rem 0;
  max-width: 1584px;
  margin: 0 auto;
}

.cds--grid {
  padding: 0 2rem;
}

.cds--row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -1rem;
}

.cds--col-lg-12 {
  padding: 0 1rem;
  flex: 0 0 100%;
  max-width: 100%;
}

/* Guide Sections */
.guide-section {
  padding: 2rem;
  margin-bottom: 1.5rem;
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

.cds--type-heading-04 {
  font-size: 1.75rem;
  font-weight: 400;
  line-height: 1.28572;
  color: #161616;
  margin-bottom: 1rem;
}

.cds--type-heading-02 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.375;
  color: #161616;
  margin-bottom: 0.5rem;
}

.cds--type-body-long-01 {
  font-size: 0.875rem;
  line-height: 1.42857;
  color: #525252;
  margin-bottom: 1rem;
}

.cds--type-body-compact-01 {
  font-size: 0.875rem;
  line-height: 1.28572;
  color: #525252;
}

/* Step List */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.step-item {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.step-number {
  width: 3rem;
  height: 3rem;
  background: #0f62fe;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

/* Feature List */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.feature-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.875rem;
  line-height: 1.42857;
  color: #525252;
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-list strong {
  color: #161616;
  font-weight: 600;
}

/* Gradient Factor Presets */
.gf-presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.gf-preset {
  padding: 1.5rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.gf-preset--conservative {
  background: #defbe6;
  border-left-color: #24a148;
}

.gf-preset--moderate {
  background: #d0e2ff;
  border-left-color: #0f62fe;
}

.gf-preset--aggressive {
  background: #fcf4d6;
  border-left-color: #f1c21b;
}

/* Warning Section */
.warning-section {
  background: #fff1f1;
  border-left: 4px solid #da1e28;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.warning-header svg {
  color: #da1e28;
  flex-shrink: 0;
}

.warning-list {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.warning-list li {
  padding: 0.5rem 0;
  font-size: 0.875rem;
  line-height: 1.42857;
  color: #161616;
}

/* Responsive */
@media (max-width: 768px) {
  .cds--header__container,
  .cds--content {
    padding: 0 1rem;
  }
  
  .guide-section {
    padding: 1.5rem;
  }
  
  .step-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .gf-presets {
    grid-template-columns: 1fr;
  }
}
</style>