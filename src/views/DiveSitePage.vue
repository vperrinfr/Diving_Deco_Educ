<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useDiveSiteStore } from '../stores/diveSiteStore';
import type { WaterType } from '../types/diveSite';
import { weatherCodeDescriptions } from '../types/diveSite';
import LanguageSwitcher from '../components/common/LanguageSwitcher.vue';
import DiverInfoModal from '../components/common/DiverInfoModal.vue';

const router = useRouter();
const { t, locale } = useI18n();
const diveSiteStore = useDiveSiteStore();

// Form state
const siteName = ref('');
const waterType = ref<WaterType>('sea');
const latitude = ref<number | null>(null);
const longitude = ref<number | null>(null);
const address = ref('');
const altitude = ref(0);
const waterTemperature = ref<number | null>(null);
const useEstimatedTemp = ref(false);

// Diver info modal
const isDiverInfoModalOpen = ref(false);

// Validation errors
const errors = ref<Record<string, string>>({});

// Computed
const weatherDescription = computed(() => {
  if (!diveSiteStore.weatherConditions) return '';
  const code = diveSiteStore.weatherConditions.weatherCode;
  const desc = weatherCodeDescriptions[code];
  return desc ? (locale.value === 'fr' ? desc.fr : desc.en) : '';
});

const windDirectionText = computed(() => {
  if (!diveSiteStore.weatherConditions) return '';
  const deg = diveSiteStore.weatherConditions.windDirection;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
});

const canFetchWeather = computed(() => {
  return latitude.value !== null && longitude.value !== null &&
         latitude.value >= -90 && latitude.value <= 90 &&
         longitude.value >= -180 && longitude.value <= 180;
});

// Watch for estimated temperature toggle
watch(useEstimatedTemp, async (useEstimated) => {
  if (useEstimated && diveSiteStore.weatherConditions) {
    const month = new Date().getMonth();
    const { estimateWaterTemperature } = await import('../services/weatherService');
    waterTemperature.value = estimateWaterTemperature(
      diveSiteStore.weatherConditions.temperature,
      month,
      waterType.value
    );
  }
});

// Methods
function validateForm(): boolean {
  errors.value = {};
  
  if (!siteName.value.trim()) {
    errors.value.siteName = t('diveSite.validation.nameRequired');
  }
  
  if (latitude.value === null || latitude.value < -90 || latitude.value > 90) {
    errors.value.latitude = t('diveSite.validation.invalidLatitude');
  }
  
  if (longitude.value === null || longitude.value < -180 || longitude.value > 180) {
    errors.value.longitude = t('diveSite.validation.invalidLongitude');
  }
  
  if (waterTemperature.value !== null && (waterTemperature.value < -2 || waterTemperature.value > 40)) {
    errors.value.waterTemperature = t('diveSite.validation.invalidTemperature');
  }
  
  return Object.keys(errors.value).length === 0;
}

async function handleFetchWeather() {
  if (!canFetchWeather.value) return;
  
  await diveSiteStore.fetchWeather(latitude.value!, longitude.value!);
  
  if (useEstimatedTemp.value && diveSiteStore.weatherConditions) {
    const month = new Date().getMonth();
    const { estimateWaterTemperature } = await import('../services/weatherService');
    waterTemperature.value = estimateWaterTemperature(
      diveSiteStore.weatherConditions.temperature,
      month,
      waterType.value
    );
  }
}

function handleSaveSite() {
  if (!validateForm()) return;
  
  diveSiteStore.createDiveSite(
    siteName.value,
    waterType.value,
    latitude.value!,
    longitude.value!,
    altitude.value,
    waterTemperature.value || 15,
    address.value || undefined,
    undefined
  );
  
  diveSiteStore.saveDiveSite();
  
  // Show success message (you could add a toast notification here)
  alert(t('diveSite.form.saveSite') + ' ✓');
}

function handleClearForm() {
  siteName.value = '';
  waterType.value = 'sea';
  latitude.value = null;
  longitude.value = null;
  address.value = '';
  altitude.value = 0;
  waterTemperature.value = null;
  useEstimatedTemp.value = false;
  errors.value = {};
  diveSiteStore.clearCurrentSite();
}

function handleLoadSite(siteId: string) {
  diveSiteStore.loadDiveSite(siteId);
  
  if (diveSiteStore.currentSite) {
    const site = diveSiteStore.currentSite;
    siteName.value = site.name;
    waterType.value = site.waterType;
    latitude.value = site.location.latitude;
    longitude.value = site.location.longitude;
    address.value = site.location.address || '';
    altitude.value = site.altitude;
    waterTemperature.value = site.waterTemperature;
  }
}

function handleDeleteSite(siteId: string) {
  if (confirm(t('diveSite.savedSites.confirmDelete'))) {
    diveSiteStore.deleteDiveSite(siteId);
  }
}

function goBack() {
  router.push('/');
}

function openDiverInfoModal() {
  isDiverInfoModalOpen.value = true;
}

function closeDiverInfoModal() {
  isDiverInfoModalOpen.value = false;
}

function handleDiverInfoSave(data: any) {
  console.log('Diver info saved:', data);
  // Show success message
  alert(t('diverInfo.title') + ' ✓');
}
</script>

<template>
  <div class="dive-site-page">
    <!-- Header -->
    <header class="cds--header">
      <div class="cds--header__container">
        <div class="cds--header__content">
          <button class="back-button" @click="goBack" :title="t('diveSite.backButton')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 3L1 10l8 7v-5h10V8H9V3z"/>
            </svg>
          </button>
          <div class="cds--header__name">
            <span class="cds--header__name-prefix">📍</span>
            <span class="cds--header__name-title">{{ t('diveSite.title') }}</span>
          </div>
          <div class="cds--header__subtitle">
            {{ t('diveSite.subtitle') }}
          </div>
        </div>
        <div class="cds--header__actions">
          <button class="diver-info-button" @click="openDiverInfoModal" :title="t('diverInfo.title')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 11c-2.2 0-4.2-1.2-5.3-3h1.5c.9 1.2 2.4 2 4.1 2s3.1-.8 4.1-2h1.5c-1.2 1.8-3.2 3-5.9 3z"/>
            </svg>
          </button>
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
          <!-- Left Column: Form -->
          <div class="cds--col-lg-10 cds--col-md-8 cds--col-sm-4">
            <!-- Site Information Card -->
            <div class="cds--tile form-tile">
              <h2 class="cds--type-heading-02 cds--spacing-05">{{ t('diveSite.form.siteName') }}</h2>
              
              <div class="form-content">
                <!-- Site Name -->
                <div class="form-group">
                  <label class="cds--label">{{ t('diveSite.form.siteName') }}</label>
                  <input
                    v-model="siteName"
                    type="text"
                    :placeholder="t('diveSite.form.siteNamePlaceholder')"
                    class="cds--text-input"
                    :class="{ 'cds--text-input--invalid': errors.siteName }"
                  />
                  <p v-if="errors.siteName" class="cds--form-requirement">{{ errors.siteName }}</p>
                </div>

                <!-- Water Type -->
                <div class="form-group">
                  <label class="cds--label">{{ t('diveSite.form.waterType') }}</label>
                  <select v-model="waterType" class="cds--select-input">
                    <option value="sea">{{ t('diveSite.form.waterTypes.sea') }}</option>
                    <option value="lake">{{ t('diveSite.form.waterTypes.lake') }}</option>
                    <option value="river">{{ t('diveSite.form.waterTypes.river') }}</option>
                    <option value="quarry">{{ t('diveSite.form.waterTypes.quarry') }}</option>
                  </select>
                </div>

                <!-- Location -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="cds--label">{{ t('diveSite.form.latitude') }}</label>
                    <input
                      v-model.number="latitude"
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      class="cds--text-input"
                      :class="{ 'cds--text-input--invalid': errors.latitude }"
                    />
                    <p v-if="errors.latitude" class="cds--form-requirement">{{ errors.latitude }}</p>
                  </div>
                  <div class="form-group">
                    <label class="cds--label">{{ t('diveSite.form.longitude') }}</label>
                    <input
                      v-model.number="longitude"
                      type="number"
                      step="0.000001"
                      min="-180"
                      max="180"
                      class="cds--text-input"
                      :class="{ 'cds--text-input--invalid': errors.longitude }"
                    />
                    <p v-if="errors.longitude" class="cds--form-requirement">{{ errors.longitude }}</p>
                  </div>
                </div>

                <!-- Address -->
                <div class="form-group">
                  <label class="cds--label">{{ t('diveSite.form.address') }}</label>
                  <input
                    v-model="address"
                    type="text"
                    :placeholder="t('diveSite.form.addressPlaceholder')"
                    class="cds--text-input"
                  />
                </div>

                <!-- Altitude -->
                <div class="form-group">
                  <label class="cds--label">{{ t('diveSite.form.altitude') }} ({{ t('diveSite.form.altitudeUnit') }})</label>
                  <input
                    v-model.number="altitude"
                    type="number"
                    step="1"
                    class="cds--text-input"
                  />
                </div>

                <!-- Water Temperature -->
                <div class="form-group">
                  <label class="cds--label">{{ t('diveSite.form.waterTemperature') }} ({{ t('diveSite.form.temperatureUnit') }})</label>
                  <div class="temp-input-group">
                    <input
                      v-model.number="waterTemperature"
                      type="number"
                      step="0.1"
                      :disabled="useEstimatedTemp"
                      class="cds--text-input"
                      :class="{ 'cds--text-input--invalid': errors.waterTemperature, 'disabled': useEstimatedTemp }"
                    />
                    <label class="cds--checkbox-wrapper">
                      <input
                        v-model="useEstimatedTemp"
                        type="checkbox"
                        class="cds--checkbox"
                      />
                      <span class="cds--checkbox-label-text">{{ t('diveSite.form.useEstimated') }}</span>
                    </label>
                  </div>
                  <p v-if="errors.waterTemperature" class="cds--form-requirement">{{ errors.waterTemperature }}</p>
                </div>

                <!-- Action Buttons -->
                <div class="button-group">
                  <button
                    @click="handleFetchWeather"
                    :disabled="!canFetchWeather || diveSiteStore.isLoadingWeather"
                    class="cds--btn cds--btn--primary"
                  >
                    {{ diveSiteStore.isLoadingWeather ? t('diveSite.weather.loading') : t('diveSite.form.fetchWeather') }}
                  </button>
                  <button
                    @click="handleSaveSite"
                    class="cds--btn cds--btn--secondary"
                  >
                    {{ t('diveSite.form.saveSite') }}
                  </button>
                  <button
                    @click="handleClearForm"
                    class="cds--btn cds--btn--tertiary"
                  >
                    {{ t('diveSite.form.clearForm') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Weather Conditions Card -->
            <div v-if="diveSiteStore.hasWeatherData" class="cds--tile weather-tile">
              <h2 class="cds--type-heading-02 cds--spacing-05">{{ t('diveSite.weather.title') }}</h2>
              
              <div v-if="diveSiteStore.weatherError" class="cds--inline-notification cds--inline-notification--error">
                <div class="cds--inline-notification__details">
                  <p class="cds--inline-notification__subtitle">
                    {{ t('diveSite.weather.error') }}: {{ diveSiteStore.weatherError }}
                  </p>
                </div>
              </div>

              <div v-else-if="diveSiteStore.weatherConditions" class="weather-grid">
                <!-- Weather Condition -->
                <div class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.conditions') }}</div>
                  <div class="weather-value">{{ weatherDescription }}</div>
                </div>

                <!-- Air Temperature -->
                <div class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.airTemperature') }}</div>
                  <div class="weather-value">{{ diveSiteStore.weatherConditions.temperature.toFixed(1) }}°C</div>
                </div>

                <!-- Wind -->
                <div class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.windSpeed') }}</div>
                  <div class="weather-value">
                    {{ diveSiteStore.weatherConditions.windSpeed.toFixed(1) }} km/h {{ windDirectionText }}
                  </div>
                </div>

                <!-- Wave Height -->
                <div v-if="diveSiteStore.weatherConditions.waveHeight" class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.waveHeight') }}</div>
                  <div class="weather-value">{{ diveSiteStore.weatherConditions.waveHeight.toFixed(1) }} m</div>
                </div>

                <!-- Precipitation -->
                <div class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.precipitation') }}</div>
                  <div class="weather-value">{{ diveSiteStore.weatherConditions.precipitation.toFixed(1) }} mm</div>
                </div>

                <!-- Pressure -->
                <div class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.pressure') }}</div>
                  <div class="weather-value">{{ diveSiteStore.weatherConditions.pressure.toFixed(0) }} hPa</div>
                </div>

                <!-- Humidity -->
                <div class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.humidity') }}</div>
                  <div class="weather-value">{{ diveSiteStore.weatherConditions.humidity }}%</div>
                </div>

                <!-- Cloud Cover -->
                <div class="weather-card">
                  <div class="weather-label">{{ t('diveSite.weather.cloudCover') }}</div>
                  <div class="weather-value">{{ diveSiteStore.weatherConditions.cloudCover }}%</div>
                </div>
              </div>

              <div class="weather-timestamp">
                {{ t('diveSite.weather.lastUpdated') }}: {{ new Date(diveSiteStore.weatherConditions.timestamp).toLocaleString() }}
              </div>
            </div>
          </div>

          <!-- Right Column: Saved Sites & Info -->
          <div class="cds--col-lg-6 cds--col-md-8 cds--col-sm-4">
            <!-- Saved Sites Card -->
            <div class="cds--tile saved-sites-tile">
              <h2 class="cds--type-heading-02 cds--spacing-05">{{ t('diveSite.savedSites.title') }}</h2>
              
              <div v-if="diveSiteStore.savedSites.length === 0" class="empty-state">
                {{ t('diveSite.savedSites.empty') }}
              </div>

              <div v-else class="saved-sites-list">
                <div
                  v-for="site in diveSiteStore.savedSites"
                  :key="site.id"
                  class="saved-site-item"
                >
                  <div class="site-info">
                    <h3 class="site-name">{{ site.name }}</h3>
                    <p class="site-type">{{ t(`diveSite.form.waterTypes.${site.waterType}`) }}</p>
                    <p class="site-details">
                      {{ site.waterTemperature }}°C • {{ site.altitude }}m
                    </p>
                  </div>
                  <div class="site-actions">
                    <button
                      @click="handleLoadSite(site.id)"
                      class="cds--btn cds--btn--sm cds--btn--ghost"
                    >
                      {{ t('diveSite.savedSites.load') }}
                    </button>
                    <button
                      @click="handleDeleteSite(site.id)"
                      class="cds--btn cds--btn--sm cds--btn--ghost cds--btn--danger"
                    >
                      {{ t('diveSite.savedSites.delete') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Information Card -->
            <div class="cds--inline-notification cds--inline-notification--info info-notification">
              <div class="cds--inline-notification__details">
                <p class="cds--inline-notification__title">{{ t('diveSite.info.title') }}</p>
                <div class="cds--inline-notification__text-wrapper">
                  <p class="info-text">💡 {{ t('diveSite.info.altitudeEffect') }}</p>
                  <p class="info-text">🌡️ {{ t('diveSite.info.waterTempEffect') }}</p>
                  <p class="info-source">{{ t('diveSite.info.weatherSource') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Diver Info Modal -->
    <DiverInfoModal
      :is-open="isDiverInfoModalOpen"
      @close="closeDiverInfoModal"
      @save="handleDiverInfoSave"
    />
  </div>
</template>

<style scoped>
.dive-site-page {
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
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-button,
.diver-info-button,
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

.help-button:hover,
.diver-info-button:hover,
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

.cds--col-lg-10,
.cds--col-lg-6 {
  padding: 0 1rem;
  margin-bottom: 2rem;
}

.cds--col-lg-10 {
  flex: 0 0 62.5%;
  max-width: 62.5%;
}

.cds--col-lg-6 {
  flex: 0 0 37.5%;
  max-width: 37.5%;
}

@media (max-width: 1056px) {
  .cds--col-lg-10,
  .cds--col-lg-6 {
    flex: 0 0 100%;
    max-width: 100%;
  }
}

/* Tiles */
.cds--tile {
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

/* Form Styles */
.form-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.cds--label {
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.33333;
  color: #161616;
  margin-bottom: 0.5rem;
}

.cds--text-input,
.cds--select-input {
  width: 100%;
  padding: 0.6875rem 1rem;
  font-size: 0.875rem;
  line-height: 1.28572;
  color: #161616;
  background: #f4f4f4;
  border: none;
  border-bottom: 1px solid #8d8d8d;
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition: all 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
}

.cds--text-input:focus,
.cds--select-input:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
}

.cds--text-input.disabled {
  background: #c6c6c6;
  color: #8d8d8d;
  cursor: not-allowed;
}

.cds--text-input--invalid {
  outline: 2px solid #da1e28;
  outline-offset: -2px;
}

.cds--form-requirement {
  font-size: 0.75rem;
  line-height: 1.33333;
  color: #da1e28;
  margin-top: 0.25rem;
}

.temp-input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cds--checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.cds--checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.cds--checkbox-label-text {
  font-size: 0.875rem;
  color: #161616;
}

/* Buttons */
.button-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.cds--btn {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.28572;
  border: none;
  cursor: pointer;
  transition: all 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  outline: 2px solid transparent;
  outline-offset: -2px;
}

.cds--btn:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
}

.cds--btn--primary {
  background: #0f62fe;
  color: #ffffff;
}

.cds--btn--primary:hover {
  background: #0353e9;
}

.cds--btn--primary:disabled {
  background: #c6c6c6;
  color: #8d8d8d;
  cursor: not-allowed;
}

.cds--btn--secondary {
  background: #393939;
  color: #ffffff;
}

.cds--btn--secondary:hover {
  background: #4c4c4c;
}

.cds--btn--tertiary {
  background: transparent;
  color: #0f62fe;
  border: 1px solid #0f62fe;
}

.cds--btn--tertiary:hover {
  background: #0f62fe;
  color: #ffffff;
}

.cds--btn--sm {
  padding: 0.4375rem 0.9375rem;
  font-size: 0.75rem;
}

.cds--btn--ghost {
  background: transparent;
  color: #0f62fe;
}

.cds--btn--ghost:hover {
  background: #e5e5e5;
}

.cds--btn--danger {
  color: #da1e28;
}

.cds--btn--danger:hover {
  background: #fff1f1;
}

/* Weather Grid */
.weather-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.weather-card {
  background: #f4f4f4;
  padding: 1rem;
  border-left: 3px solid #0f62fe;
}

.weather-label {
  font-size: 0.75rem;
  color: #525252;
  margin-bottom: 0.5rem;
}

.weather-value {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
}

.weather-timestamp {
  font-size: 0.75rem;
  color: #6f6f6f;
  margin-top: 1rem;
}

/* Saved Sites */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #525252;
  font-size: 0.875rem;
}

.saved-sites-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.saved-site-item {
  border: 1px solid #e0e0e0;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: border-color 0.2s ease;
}

.saved-site-item:hover {
  border-color: #0f62fe;
}

.site-info {
  flex: 1;
}

.site-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #161616;
  margin-bottom: 0.25rem;
}

.site-type {
  font-size: 0.75rem;
  color: #525252;
  margin-bottom: 0.25rem;
}

.site-details {
  font-size: 0.75rem;
  color: #6f6f6f;
}

.site-actions {
  display: flex;
  gap: 0.5rem;
}

/* Notifications */
.cds--inline-notification {
  padding: 1rem;
  margin-bottom: 1rem;
}

.cds--inline-notification--error {
  background: #fff1f1;
  border-left: 3px solid #da1e28;
}

.cds--inline-notification--info {
  background: #edf5ff;
  border-left: 3px solid #0f62fe;
}

.cds--inline-notification__details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cds--inline-notification__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #161616;
}

.cds--inline-notification__subtitle {
  font-size: 0.75rem;
  color: #161616;
}

.info-text {
  font-size: 0.75rem;
  color: #161616;
  margin-bottom: 0.5rem;
}

.info-source {
  font-size: 0.75rem;
  color: #525252;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

/* Responsive */
@media (max-width: 768px) {
  .cds--header__container,
  .cds--content {
    padding: 0 1rem;
  }
  
  .cds--header__name-title {
    font-size: 1rem;
  }
  
  .cds--header__subtitle {
    display: none;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .weather-grid {
    grid-template-columns: 1fr;
  }
  
  .saved-site-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .site-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>