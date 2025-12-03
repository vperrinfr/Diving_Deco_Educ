<template>
  <div class="rate-configuration">
    <div class="header">
      <h3 class="title">Ascent & Descent Rates</h3>
      <p class="subtitle">Configure dive profile rates</p>
    </div>

    <!-- Presets -->
    <div class="presets">
      <button
        v-for="preset in presets"
        :key="preset.name"
        class="preset-btn"
        :class="{ active: isActivePreset(preset) }"
        @click="applyPreset(preset)"
      >
        {{ preset.name }}
      </button>
    </div>

    <!-- Descent Rate -->
    <div class="rate-control">
      <div class="rate-header">
        <label for="descent-rate" class="rate-label">Descent Rate</label>
        <span class="rate-value">{{ descentRate }} m/min</span>
      </div>
      <input
        id="descent-rate"
        v-model.number="descentRate"
        type="range"
        min="10"
        max="30"
        step="1"
        class="slider"
        @input="updateRates"
      />
      <div class="rate-markers">
        <span class="marker">10</span>
        <span class="marker">20</span>
        <span class="marker">30</span>
      </div>
      <p class="rate-description">
        Standard: 20 m/min. Slower descent allows better equalization.
      </p>
    </div>

    <!-- Ascent Rate -->
    <div class="rate-control">
      <div class="rate-header">
        <label for="ascent-rate" class="rate-label">Ascent Rate</label>
        <span class="rate-value">{{ ascentRate }} m/min</span>
      </div>
      <input
        id="ascent-rate"
        v-model.number="ascentRate"
        type="range"
        min="6"
        max="12"
        step="1"
        class="slider"
        @input="updateRates"
      />
      <div class="rate-markers">
        <span class="marker">6</span>
        <span class="marker">9</span>
        <span class="marker">12</span>
      </div>
      <p class="rate-description">
        Standard: 9 m/min. Slower ascent is more conservative.
      </p>
    </div>

    <!-- Info Box -->
    <div class="info-box">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <div class="info-content">
        <p class="info-title">Rate Guidelines</p>
        <ul class="info-list">
          <li>Conservative: Slower rates, more safety margin</li>
          <li>Standard: Typical recreational diving rates</li>
          <li>Aggressive: Faster rates, less conservative</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { DESCENT_RATE, ASCENT_RATE } from '../../utils/buhlmann/constants';

interface RatePreset {
  name: string;
  descentRate: number;
  ascentRate: number;
}

const props = defineProps<{
  modelValue: {
    descentRate: number;
    ascentRate: number;
  };
}>();

const emit = defineEmits<{
  'update:modelValue': [rates: { descentRate: number; ascentRate: number }];
}>();

const descentRate = ref(props.modelValue.descentRate || DESCENT_RATE);
const ascentRate = ref(props.modelValue.ascentRate || ASCENT_RATE);

const presets: RatePreset[] = [
  {
    name: 'Conservative',
    descentRate: 15,
    ascentRate: 6
  },
  {
    name: 'Standard',
    descentRate: 20,
    ascentRate: 9
  },
  {
    name: 'Aggressive',
    descentRate: 25,
    ascentRate: 12
  }
];

function isActivePreset(preset: RatePreset): boolean {
  return descentRate.value === preset.descentRate && ascentRate.value === preset.ascentRate;
}

function applyPreset(preset: RatePreset) {
  descentRate.value = preset.descentRate;
  ascentRate.value = preset.ascentRate;
  updateRates();
}

function updateRates() {
  emit('update:modelValue', {
    descentRate: descentRate.value,
    ascentRate: ascentRate.value
  });
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue.descentRate !== descentRate.value) {
    descentRate.value = newValue.descentRate;
  }
  if (newValue.ascentRate !== ascentRate.value) {
    ascentRate.value = newValue.ascentRate;
  }
}, { deep: true });
</script>

<style scoped>
.rate-configuration {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  margin-bottom: 1.5rem;
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.presets {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.preset-btn {
  padding: 0.625rem 0.5rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.preset-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.rate-control {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.rate-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.rate-value {
  font-weight: 700;
  color: #3b82f6;
  font-size: 1.125rem;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: #2563eb;
  transform: scale(1.1);
}

.rate-markers {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0 0.25rem;
}

.marker {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

.rate-description {
  margin: 0.75rem 0 0 0;
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.4;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  margin-top: 1.5rem;
}

.info-box svg {
  flex-shrink: 0;
  color: #3b82f6;
}

.info-content {
  flex: 1;
}

.info-title {
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
}

.info-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.75rem;
  color: #1e40af;
  line-height: 1.6;
}

.info-list li {
  margin-bottom: 0.25rem;
}

.info-list li:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .presets {
    grid-template-columns: 1fr;
  }
}
</style>