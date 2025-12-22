import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { DiveSite, WeatherConditions, WaterType } from '../types/diveSite';
import { fetchCompleteConditions, estimateWaterTemperature } from '../services/weatherService';

export const useDiveSiteStore = defineStore('diveSite', () => {
  // State
  const currentSite = ref<DiveSite | null>(null);
  const weatherConditions = ref<WeatherConditions | null>(null);
  const isLoadingWeather = ref(false);
  const weatherError = ref<string | null>(null);
  const savedSites = ref<DiveSite[]>([]);

  // Computed
  const hasCurrentSite = computed(() => currentSite.value !== null);
  const hasWeatherData = computed(() => weatherConditions.value !== null);

  // Actions
  function createDiveSite(
    name: string,
    waterType: WaterType,
    latitude: number,
    longitude: number,
    altitude: number,
    waterTemperature: number,
    address?: string,
    country?: string
  ): DiveSite {
    const site: DiveSite = {
      id: `site-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      waterType,
      location: {
        latitude,
        longitude,
        address,
        country,
      },
      altitude,
      waterTemperature,
      lastUpdated: new Date(),
    };

    currentSite.value = site;
    return site;
  }

  function updateDiveSite(updates: Partial<DiveSite>) {
    if (currentSite.value) {
      currentSite.value = {
        ...currentSite.value,
        ...updates,
        lastUpdated: new Date(),
      };
    }
  }

  async function fetchWeather(latitude: number, longitude: number) {
    isLoadingWeather.value = true;
    weatherError.value = null;

    try {
      const conditions = await fetchCompleteConditions(latitude, longitude);
      weatherConditions.value = conditions;

      // Auto-estimate water temperature if not manually set
      if (currentSite.value && !currentSite.value.waterTemperature) {
        const month = new Date().getMonth();
        const estimatedTemp = estimateWaterTemperature(
          conditions.temperature,
          month,
          currentSite.value.waterType
        );
        updateDiveSite({ waterTemperature: estimatedTemp });
      }
    } catch (error) {
      weatherError.value = error instanceof Error ? error.message : 'Failed to fetch weather data';
      console.error('Weather fetch error:', error);
    } finally {
      isLoadingWeather.value = false;
    }
  }

  function saveDiveSite() {
    if (currentSite.value) {
      const existingIndex = savedSites.value.findIndex(
        (site) => site.id === currentSite.value!.id
      );

      if (existingIndex >= 0) {
        savedSites.value[existingIndex] = { ...currentSite.value };
      } else {
        savedSites.value.push({ ...currentSite.value });
      }

      // Save to localStorage
      localStorage.setItem('diveSites', JSON.stringify(savedSites.value));
    }
  }

  function loadDiveSite(siteId: string) {
    const site = savedSites.value.find((s) => s.id === siteId);
    if (site) {
      currentSite.value = { ...site };
      // Refresh weather data
      fetchWeather(site.location.latitude, site.location.longitude);
    }
  }

  function deleteDiveSite(siteId: string) {
    savedSites.value = savedSites.value.filter((site) => site.id !== siteId);
    localStorage.setItem('diveSites', JSON.stringify(savedSites.value));
    
    if (currentSite.value?.id === siteId) {
      currentSite.value = null;
      weatherConditions.value = null;
    }
  }

  function clearCurrentSite() {
    currentSite.value = null;
    weatherConditions.value = null;
    weatherError.value = null;
  }

  function loadSavedSites() {
    try {
      const stored = localStorage.getItem('diveSites');
      if (stored) {
        savedSites.value = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading saved dive sites:', error);
    }
  }

  // Initialize
  loadSavedSites();

  return {
    // State
    currentSite,
    weatherConditions,
    isLoadingWeather,
    weatherError,
    savedSites,
    // Computed
    hasCurrentSite,
    hasWeatherData,
    // Actions
    createDiveSite,
    updateDiveSite,
    fetchWeather,
    saveDiveSite,
    loadDiveSite,
    deleteDiveSite,
    clearCurrentSite,
    loadSavedSites,
  };
});

// Made with Bob
