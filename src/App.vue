<script setup lang="ts">
import { ref } from 'vue';
import DiveCalculatorInput from './components/calculator/DiveCalculatorInput.vue';
import DiveProfileResults from './components/calculator/DiveProfileResults.vue';
import DiveProfileChart from './components/visualizations/DiveProfileChart.vue';
import WarningsDisplay from './components/common/WarningsDisplay.vue';
import { calculateDiveProfile, calculateMultiLevelDiveProfile } from './utils/buhlmann/decompression';
import { isMultiLevelDive } from './types';
import type { DiveParameters, MultiLevelDiveParameters, DiveProfile } from './types';

const currentProfile = ref<DiveProfile | null>(null);
const isCalculating = ref(false);

const handleCalculate = (parameters: DiveParameters | MultiLevelDiveParameters) => {
  isCalculating.value = true;
  
  // Simulate a brief calculation delay for better UX
  setTimeout(() => {
    try {
      if (isMultiLevelDive(parameters)) {
        // Multi-level dive with multiple gases
        currentProfile.value = calculateMultiLevelDiveProfile(parameters);
      } else {
        // Simple single-level dive
        currentProfile.value = calculateDiveProfile(parameters);
      }
    } catch (error) {
      console.error('Error calculating dive profile:', error);
      alert('An error occurred while calculating the dive profile. Please check your parameters.');
    } finally {
      isCalculating.value = false;
    }
  }, 300);
};
</script>

<template>
  <div class="cds--g100 app-container">
    <!-- Header -->
    <header class="cds--header">
      <div class="cds--header__container">
        <div class="cds--header__content">
          <div class="cds--header__name">
            <span class="cds--header__name-prefix">🤿</span>
            <span class="cds--header__name-title">Decompression Calculator</span>
          </div>
          <div class="cds--header__subtitle">
            Bühlmann ZHL-16C Algorithm with Gradient Factors
          </div>
        </div>
      </div>
    </header>

    <!-- Loading Overlay -->
    <div v-if="isCalculating" class="loading-overlay">
      <div class="loading-card">
        <div class="cds--loading cds--loading--normal">
          <svg class="cds--loading__svg" viewBox="0 0 100 100">
            <circle class="cds--loading__background" cx="50%" cy="50%" r="42"></circle>
            <circle class="cds--loading__stroke" cx="50%" cy="50%" r="42"></circle>
          </svg>
        </div>
        <p class="loading-text">Calculating dive profile...</p>
      </div>
    </div>

    <!-- Main Content -->
    <main class="cds--content">
      <div class="cds--grid cds--grid--full-width">
        <div class="cds--row">
          <!-- Left Column - Input -->
          <div class="cds--col-lg-4 cds--col-md-8 cds--col-sm-4">
            <DiveCalculatorInput @calculate="handleCalculate" />
            
            <!-- Disclaimer -->
            <div class="cds--inline-notification cds--inline-notification--warning disclaimer-notification">
              <div class="cds--inline-notification__details">
                <svg class="cds--inline-notification__icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 1L1 17h18L10 1zm0 3.5L16.5 16h-13L10 4.5zM9 13v2h2v-2H9zm0-6v4h2V7H9z"/>
                </svg>
                <div class="cds--inline-notification__text-wrapper">
                  <p class="cds--inline-notification__title">Important Notice</p>
                  <p class="cds--inline-notification__subtitle">
                    This calculator is for educational purposes only. Always use certified dive computers and follow proper dive planning procedures. Never dive beyond your training and certification level.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Results -->
          <div class="cds--col-lg-12 cds--col-md-8 cds--col-sm-4">
            <!-- Warnings -->
            <WarningsDisplay 
              v-if="currentProfile?.warnings"
              :warnings="currentProfile.warnings"
            />

            <!-- Results -->
            <DiveProfileResults :profile="currentProfile" />

            <!-- Chart -->
            <DiveProfileChart :profile="currentProfile" />

            <!-- Additional Information -->
            <div v-if="currentProfile" class="cds--tile info-tile">
              <h3 class="cds--type-heading-02 cds--spacing-05">About This Calculation</h3>
              <div class="info-content">
                <p class="cds--type-body-long-01">
                  This dive profile was calculated using the <strong>Bühlmann ZHL-16C</strong> decompression algorithm 
                  with gradient factors <strong>{{ currentProfile.parameters.gradientFactorLow }}/{{ currentProfile.parameters.gradientFactorHigh }}</strong>.
                </p>
                <ul class="info-list">
                  <li>Ascent rate: 10 meters per minute</li>
                  <li>Descent rate: 20 meters per minute</li>
                  <li>Safety stop: 3 minutes at 5 meters (when applicable)</li>
                  <li>16 tissue compartments with nitrogen and helium tracking</li>
                </ul>
                <p class="cds--type-helper-text-01">
                  Lower gradient factors (e.g., 30/70) provide more conservative profiles with longer decompression times. 
                  Higher gradient factors (e.g., 50/95) are more aggressive with shorter decompression times but higher risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <footer class="app-footer">
        <div class="cds--grid cds--grid--full-width">
          <div class="cds--row">
            <div class="cds--col">
              <p class="footer-text">Made with Bob | Bühlmann ZHL-16C Algorithm Implementation</p>
              <p class="footer-link">
                <a href="https://github.com" class="cds--link">View Source Code</a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.app-container {
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
}

.cds--header__content {
  display: flex;
  align-items: center;
  gap: 1rem;
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

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 22, 22, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-card {
  background: #ffffff;
  padding: 3rem;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.cds--loading {
  width: 5.5rem;
  height: 5.5rem;
}

.cds--loading__svg {
  animation: rotate 2s linear infinite;
}

.cds--loading__background {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 6;
}

.cds--loading__stroke {
  fill: none;
  stroke: #0f62fe;
  stroke-width: 6;
  stroke-dasharray: 240;
  stroke-dashoffset: 240;
  animation: loading-stroke 2s ease-in-out infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes loading-stroke {
  0% {
    stroke-dashoffset: 240;
  }
  50% {
    stroke-dashoffset: 60;
  }
  100% {
    stroke-dashoffset: 240;
  }
}

.loading-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #161616;
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

.cds--col-lg-4,
.cds--col-lg-12 {
  padding: 0 1rem;
  margin-bottom: 2rem;
}

.cds--col-lg-4 {
  flex: 0 0 25%;
  max-width: 25%;
}

.cds--col-lg-12 {
  flex: 0 0 75%;
  max-width: 75%;
}

@media (max-width: 1056px) {
  .cds--col-lg-4,
  .cds--col-lg-12 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

/* Disclaimer */
.disclaimer-notification {
  margin-top: 1rem;
  background: #fcf4d6;
  border-left: 3px solid #f1c21b;
  padding: 1rem;
}

.disclaimer-notification .cds--inline-notification__icon {
  color: #f1c21b;
  flex-shrink: 0;
  margin-top: 0.1875rem;
}

.disclaimer-notification .cds--inline-notification__details {
  display: flex;
  gap: 1rem;
}

.disclaimer-notification .cds--inline-notification__title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #161616;
}

.disclaimer-notification .cds--inline-notification__subtitle {
  font-size: 0.75rem;
  line-height: 1.33333;
  color: #161616;
}

/* Info Tile */
.info-tile {
  padding: 2rem;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  margin-bottom: 2rem;
}

.cds--spacing-05 {
  margin-bottom: 1.5rem;
}

.cds--type-heading-02 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.375;
  color: #161616;
}

.info-content {
  color: #525252;
}

.cds--type-body-long-01 {
  font-size: 0.875rem;
  line-height: 1.42857;
  margin-bottom: 1rem;
}

.info-list {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  line-height: 1.71429;
}

.info-list li {
  margin-bottom: 0.5rem;
}

.cds--type-helper-text-01 {
  font-size: 0.75rem;
  line-height: 1.33333;
  color: #6f6f6f;
  margin-top: 1rem;
}

/* Footer */
.app-footer {
  margin-top: 4rem;
  padding: 2rem 0;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.footer-text {
  font-size: 0.875rem;
  color: #525252;
  margin-bottom: 0.5rem;
}

.footer-link {
  font-size: 0.875rem;
}

.cds--link {
  color: #0f62fe;
  text-decoration: none;
}

.cds--link:hover {
  text-decoration: underline;
  color: #0043ce;
}

/* Responsive */
@media (max-width: 768px) {
  .cds--header__container,
  .cds--content {
    padding: 0 1rem;
  }
  
  .cds--header__name {
    font-size: 1rem;
  }
  
  .cds--header__subtitle {
    font-size: 0.75rem;
    margin-left: 1.5rem;
  }
  
  .loading-card {
    padding: 2rem;
  }
  
  .info-tile {
    padding: 1rem;
  }
}
</style>
