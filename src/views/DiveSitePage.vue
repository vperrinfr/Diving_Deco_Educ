<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
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

// Map state
const mapContainer = ref<HTMLElement | null>(null);
let map: any = null;
let marker: any = null;
const showCoordinateInfo = ref(false);

// Diver info modal
const isDiverInfoModalOpen = ref(false);

// Estimated temperature info modal
const showEstimatedTempModal = ref(false);

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

const hasValidCoordinates = computed(() => {
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

// Watch for coordinate changes to update map
watch([latitude, longitude], async () => {
  if (hasValidCoordinates.value) {
    await nextTick();
    if (!map) {
      initMap();
    } else {
      updateMapMarker();
    }
    // Force map resize after coordinate change
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        console.log('Map resized after coordinate change');
      }
    }, 200);
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

// Map functions
function initMap() {
  if (!mapContainer.value) {
    console.error('Map container not found');
    return;
  }
  
  // Initialize Leaflet map
  const L = (window as any).L;
  if (!L) {
    console.error('Leaflet not loaded yet');
    return;
  }
  
  try {
    // Remove existing map if any
    if (map) {
      map.remove();
      map = null;
    }
    
    // Set initial view based on coordinates or default
    const initialLat = hasValidCoordinates.value ? Number(latitude.value) : 20;
    const initialLng = hasValidCoordinates.value ? Number(longitude.value) : 0;
    const initialZoom = hasValidCoordinates.value ? 13 : 2;
    
    console.log('Initializing map with coordinates:', initialLat, initialLng);
    
    map = L.map(mapContainer.value, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      scrollWheelZoom: true,
      zoomControl: true
    });
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      minZoom: 2
    }).addTo(map);
    
    console.log('Map initialized successfully');
    
    // Add click event to set coordinates
    map.on('click', function(e: any) {
      latitude.value = Number(e.latlng.lat.toFixed(6));
      longitude.value = Number(e.latlng.lng.toFixed(6));
      console.log('Map clicked at:', latitude.value, longitude.value);
    });
    
    // Initialize marker if coordinates exist
    if (hasValidCoordinates.value) {
      updateMapMarker();
    }
    
    // Force map to resize after initialization
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        console.log('Map resized after initialization');
      }
    }, 100);
    
    // Additional resize after a longer delay to ensure tiles load
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
        console.log('Map resized (delayed)');
      }
    }, 500);
  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

function updateMapMarker() {
  if (!map || !hasValidCoordinates.value) return;
  
  const L = (window as any).L;
  if (!L) return;
  
  try {
    // Ensure values are numbers
    const lat = Number(latitude.value);
    const lng = Number(longitude.value);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid coordinates:', lat, lng);
      return;
    }
    
    console.log('Updating marker at:', lat, lng);
    
    // Remove existing marker
    if (marker) {
      map.removeLayer(marker);
    }
    
    // Add new marker
    marker = L.marker([lat, lng], {
      draggable: true
    }).addTo(map);
    
    marker.bindPopup(`<b>${siteName.value || t('diveSite.form.siteName')}</b><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
    
    // Update coordinates when marker is dragged
    marker.on('dragend', function(event: any) {
      const position = event.target.getLatLng();
      latitude.value = Number(position.lat.toFixed(6));
      longitude.value = Number(position.lng.toFixed(6));
      marker.setPopupContent(`<b>${siteName.value || t('diveSite.form.siteName')}</b><br>Lat: ${latitude.value}<br>Lng: ${longitude.value}`);
    });
    
    // Center map on marker
    map.setView([lat, lng], 13);
    
    console.log('Marker updated successfully');
  } catch (error) {
    console.error('Error updating marker:', error);
  }
}

async function loadLeaflet() {
  console.log('Loading Leaflet...');
  
  // Check if Leaflet is already loaded
  if ((window as any).L) {
    console.log('Leaflet already loaded');
    await nextTick();
    if (mapContainer.value) {
      initMap();
    }
    return;
  }
  
  // Load Leaflet CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
  link.crossOrigin = '';
  document.head.appendChild(link);
  console.log('Leaflet CSS loaded');
  
  // Load Leaflet JS
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = async () => {
      console.log('Leaflet JS loaded');
      await nextTick();
      if (mapContainer.value) {
        initMap();
        resolve();
      } else {
        console.error('Map container not available after Leaflet load');
        reject(new Error('Map container not available'));
      }
    };
    script.onerror = (error) => {
      console.error('Failed to load Leaflet:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

// Lifecycle hooks
onMounted(() => {
  loadLeaflet();
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
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

                <!-- Location with Info Bubble -->
                <div class="form-group">
                  <div class="label-with-info">
                    <label class="cds--label">{{ t('diveSite.form.location') }}</label>
                    <button
                      type="button"
                      class="info-button"
                      @click="showCoordinateInfo = !showCoordinateInfo"
                      :title="t('diveSite.form.coordinateFormat')"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 11c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V5h2v4z"/>
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Coordinate Info Bubble -->
                  <div v-if="showCoordinateInfo" class="coordinate-info-bubble">
                    <div class="info-bubble-header">
                      <strong>{{ t('diveSite.form.coordinateFormat') }}</strong>
                      <button
                        type="button"
                        class="close-info-button"
                        @click="showCoordinateInfo = false"
                      >
                        ×
                      </button>
                    </div>
                    <p class="info-bubble-text">{{ t('diveSite.form.coordinateFormatInfo') }}</p>
                    <p class="info-bubble-example">{{ t('diveSite.form.coordinateExample') }}</p>
                  </div>
                </div>

                <!-- Latitude and Longitude Inputs -->
                <div class="form-row">
                  <div class="form-group">
                    <label class="cds--label">{{ t('diveSite.form.latitude') }}</label>
                    <input
                      v-model.number="latitude"
                      type="number"
                      step="0.000001"
                      min="-90"
                      max="90"
                      placeholder="43.7034"
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
                      placeholder="7.2663"
                      class="cds--text-input"
                      :class="{ 'cds--text-input--invalid': errors.longitude }"
                    />
                    <p v-if="errors.longitude" class="cds--form-requirement">{{ errors.longitude }}</p>
                  </div>
                </div>

                <!-- Map Display -->
                <div class="map-container" style="height: 400px; min-height: 400px;">
                  <div ref="mapContainer" class="map" :style="{ visibility: hasValidCoordinates ? 'visible' : 'hidden', height: '400px', minHeight: '400px' }"></div>
                  <div v-if="!hasValidCoordinates" class="map-placeholder">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <p>{{ t('diveSite.form.enterCoordinates') }}</p>
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
                  <div class="label-with-info">
                    <label class="cds--label">{{ t('diveSite.form.waterTemperature') }} ({{ t('diveSite.form.temperatureUnit') }})</label>
                  </div>
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
                    <button
                      type="button"
                      class="info-button"
                      @click="showEstimatedTempModal = true"
                      :title="t('diveSite.form.estimatedTempInfo')"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 1C4.1 1 1 4.1 1 8s3.1 7 7 7 7-3.1 7-7-3.1-7-7-7zm0 11c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-3H7V5h2v4z"/>
                      </svg>
                    </button>
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

    <!-- Estimated Temperature Info Modal -->
    <div v-if="showEstimatedTempModal" class="modal-overlay" @click.self="showEstimatedTempModal = false">
      <div class="modal-content estimated-temp-modal">
        <div class="modal-header">
          <h2 class="modal-title">{{ t('diveSite.estimatedTemp.title') }}</h2>
          <button class="modal-close" @click="showEstimatedTempModal = false">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <p class="modal-subtitle">{{ t('diveSite.estimatedTemp.subtitle') }}</p>
          <p class="modal-intro">{{ t('diveSite.estimatedTemp.intro') }}</p>
          
          <!-- Parameters Section -->
          <div class="info-section">
            <h3 class="section-title">{{ t('diveSite.estimatedTemp.parameters.title') }}</h3>
            <ul class="info-list">
              <li><strong>airTemp:</strong> {{ t('diveSite.estimatedTemp.parameters.airTemp') }}</li>
              <li><strong>month:</strong> {{ t('diveSite.estimatedTemp.parameters.month') }}</li>
              <li><strong>waterType:</strong> {{ t('diveSite.estimatedTemp.parameters.waterType') }}</li>
            </ul>
          </div>
          
          <!-- Calculation Method -->
          <div class="info-section">
            <h3 class="section-title">{{ t('diveSite.estimatedTemp.calculation.title') }}</h3>
            
            <div class="calculation-step">
              <h4 class="step-title">{{ t('diveSite.estimatedTemp.calculation.step1.title') }}</h4>
              <p>{{ t('diveSite.estimatedTemp.calculation.step1.description') }}</p>
              <ul class="info-list">
                <li>{{ t('diveSite.estimatedTemp.calculation.step1.sea') }}</li>
                <li>{{ t('diveSite.estimatedTemp.calculation.step1.lake') }}</li>
              </ul>
            </div>
            
            <div class="calculation-step">
              <h4 class="step-title">{{ t('diveSite.estimatedTemp.calculation.step2.title') }}</h4>
              <p>{{ t('diveSite.estimatedTemp.calculation.step2.description') }}</p>
              <code class="formula">{{ t('diveSite.estimatedTemp.calculation.step2.formula') }}</code>
              <p class="note">{{ t('diveSite.estimatedTemp.calculation.step2.note') }}</p>
            </div>
            
            <div class="calculation-step">
              <h4 class="step-title">{{ t('diveSite.estimatedTemp.calculation.step3.title') }}</h4>
              <ul class="info-list">
                <li>{{ t('diveSite.estimatedTemp.calculation.step3.sea') }}</li>
                <li>{{ t('diveSite.estimatedTemp.calculation.step3.lake') }}</li>
                <li>{{ t('diveSite.estimatedTemp.calculation.step3.river') }}</li>
                <li>{{ t('diveSite.estimatedTemp.calculation.step3.quarry') }}</li>
              </ul>
            </div>
            
            <div class="calculation-step">
              <h4 class="step-title">{{ t('diveSite.estimatedTemp.calculation.step4.title') }}</h4>
              <p>{{ t('diveSite.estimatedTemp.calculation.step4.description') }}</p>
            </div>
          </div>
          
          <!-- Example Section -->
          <div class="info-section example-section">
            <h3 class="section-title">{{ t('diveSite.estimatedTemp.example.title') }}</h3>
            <p>{{ t('diveSite.estimatedTemp.example.scenario') }}</p>
            <ul class="info-list">
              <li>{{ t('diveSite.estimatedTemp.example.base') }}</li>
              <li>{{ t('diveSite.estimatedTemp.example.seasonal') }}</li>
              <li><strong>{{ t('diveSite.estimatedTemp.example.result') }}</strong></li>
            </ul>
          </div>
          
          <!-- Disclaimer -->
          <div class="disclaimer-box">
            <p>⚠️ {{ t('diveSite.estimatedTemp.disclaimer') }}</p>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cds--btn cds--btn--primary" @click="showEstimatedTempModal = false">
            {{ t('diveSite.estimatedTemp.close') }}
          </button>
        </div>
      </div>
    </div>
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

.temp-input-group .info-button {
  margin-left: 0.5rem;
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

/* Label with Info Button */
.label-with-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.info-button {
  background: transparent;
  border: none;
  color: #0f62fe;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.info-button:hover {
  background: #e5e5e5;
}

/* Coordinate Info Bubble */
.coordinate-info-bubble {
  background: #edf5ff;
  border: 1px solid #0f62fe;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  position: relative;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.info-bubble-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  color: #161616;
}

.close-info-button {
  background: transparent;
  border: none;
  color: #161616;
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.close-info-button:hover {
  background: rgba(0, 0, 0, 0.1);
}

.info-bubble-text {
  font-size: 0.875rem;
  color: #161616;
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.info-bubble-example {
  font-size: 0.875rem;
  color: #0f62fe;
  font-weight: 600;
  font-family: 'IBM Plex Mono', monospace;
  background: #ffffff;
  padding: 0.5rem;
  border-radius: 4px;
  margin-top: 0.5rem;
}

/* Map Container */
.map-container {
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  height: 400px;
  min-height: 400px;
}

.map {
  width: 100%;
  height: 400px;
  background: #f4f4f4;
  position: relative;
  z-index: 1;
  cursor: crosshair;
  min-height: 400px;
}

/* Ensure Leaflet controls are visible */
.map :deep(.leaflet-control-zoom) {
  z-index: 1000;
}

.map :deep(.leaflet-control-attribution) {
  z-index: 1000;
  background: rgba(255, 255, 255, 0.8);
}

.map :deep(.leaflet-container) {
  height: 100%;
  width: 100%;
  min-height: 400px;
  background: #f4f4f4;
}

.map :deep(.leaflet-tile-pane) {
  z-index: 1;
}

.map :deep(.leaflet-marker-pane) {
  z-index: 600;
}

.map :deep(.leaflet-popup-pane) {
  z-index: 700;
}

.map-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(244, 244, 244, 0.95);
  color: #525252;
  z-index: 2;
  pointer-events: none;
}

.map-placeholder svg {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.map-placeholder p {
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 768px) {
  .map {
    height: 300px;
  }
}
  }
}
</style>
/* Estimated Temperature Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.estimated-temp-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.estimated-temp-modal .modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.estimated-temp-modal .modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #525252;
  transition: color 0.2s ease;
}

.estimated-temp-modal .modal-close:hover {
  color: #161616;
}

.estimated-temp-modal .modal-body {
  padding: 1.5rem;
}

.estimated-temp-modal .modal-subtitle {
  font-size: 1.125rem;
  font-weight: 500;
  color: #0f62fe;
  margin-bottom: 1rem;
}

.estimated-temp-modal .modal-intro {
  font-size: 0.875rem;
  color: #525252;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.estimated-temp-modal .info-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f4f4f4;
  border-radius: 4px;
}

.estimated-temp-modal .section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin-bottom: 0.75rem;
}

.estimated-temp-modal .info-list {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.estimated-temp-modal .info-list li {
  font-size: 0.875rem;
  color: #525252;
  line-height: 1.6;
  padding: 0.25rem 0;
  padding-left: 1.5rem;
  position: relative;
}

.estimated-temp-modal .info-list li::before {
  content: "•";
  position: absolute;
  left: 0.5rem;
  color: #0f62fe;
  font-weight: bold;
}

.estimated-temp-modal .calculation-step {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.estimated-temp-modal .calculation-step:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.estimated-temp-modal .step-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f62fe;
  margin-bottom: 0.5rem;
}

.estimated-temp-modal .calculation-step p {
  font-size: 0.875rem;
  color: #525252;
  line-height: 1.6;
  margin: 0.5rem 0;
}

.estimated-temp-modal .formula {
  display: block;
  background: #262626;
  color: #f4f4f4;
  padding: 0.75rem;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', 'Menlo', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', Courier, monospace;
  font-size: 0.8125rem;
  margin: 0.5rem 0;
  overflow-x: auto;
}

.estimated-temp-modal .note {
  font-size: 0.8125rem;
  color: #525252;
  font-style: italic;
  margin-top: 0.5rem;
}

.estimated-temp-modal .example-section {
  background: #e8f4ff;
  border-left: 4px solid #0f62fe;
}

.estimated-temp-modal .disclaimer-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 1rem;
  margin-top: 1.5rem;
}

.estimated-temp-modal .disclaimer-box p {
  font-size: 0.875rem;
  color: #856404;
  margin: 0;
  line-height: 1.6;
}

.estimated-temp-modal .modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
}

.estimated-temp-modal .modal-footer .cds--btn {
  min-width: 100px;
}
