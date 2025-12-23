<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DepthPoint } from '../../types/stopAnalysis';

const { t } = useI18n();

const props = defineProps<{
  maxDepth: number;
  currentDepth: number;
  depthPoints: DepthPoint[];
  units: 'metric' | 'imperial';
}>();

const emit = defineEmits<{
  (e: 'update:depth', depth: number): void;
}>();

const sliderValue = ref(props.currentDepth);

// Watch for external changes
watch(() => props.currentDepth, (newDepth) => {
  sliderValue.value = newDepth;
});

// Update depth when slider changes
const handleSliderChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const depth = parseInt(target.value);
  sliderValue.value = depth;
  emit('update:depth', depth);
};

// Quick select depth point
const selectDepthPoint = (depth: number) => {
  sliderValue.value = depth;
  emit('update:depth', depth);
};

// Format depth for display
const formatDepth = (depth: number): string => {
  if (props.units === 'imperial') {
    return `${Math.round(depth * 3.28084)}ft`;
  }
  return `${depth}m`;
};

// Get slider background gradient
const sliderBackground = computed(() => {
  const percent = props.maxDepth > 0 ? (sliderValue.value / props.maxDepth) * 100 : 0;
  return `linear-gradient(to right, #0f62fe 0%, #0f62fe ${percent}%, #e0e0e0 ${percent}%, #e0e0e0 100%)`;
});
</script>

<template>
  <div class="depth-selector">
    <div class="depth-selector__header">
      <h4 class="depth-selector__title">{{ t('analysis.depthSelector.title') }}</h4>
      <div class="depth-selector__current">
        <span class="depth-value">{{ formatDepth(sliderValue) }}</span>
      </div>
    </div>

    <!-- Slider -->
    <div class="depth-selector__slider">
      <input
        type="range"
        :min="0"
        :max="maxDepth"
        :value="sliderValue"
        @input="handleSliderChange"
        class="slider"
        :style="{ background: sliderBackground }"
      />
      <div class="slider-labels">
        <span>{{ formatDepth(0) }}</span>
        <span>{{ formatDepth(maxDepth) }}</span>
      </div>
    </div>

    <!-- Quick Select Points -->
    <div class="depth-selector__points">
      <div class="points-label">{{ t('analysis.depthSelector.quickSelect') }}:</div>
      <div class="points-buttons">
        <button
          v-for="point in depthPoints"
          :key="point.depth"
          @click="selectDepthPoint(point.depth)"
          :class="[
            'point-button',
            {
              'point-button--active': sliderValue === point.depth,
              'point-button--surface': point.type === 'surface',
              'point-button--stop': point.type === 'stop',
              'point-button--max': point.type === 'max'
            }
          ]"
          :title="point.label"
        >
          <svg v-if="point.type === 'surface'" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 8h12M2 6h12M2 10h12"/>
          </svg>
          <svg v-else-if="point.type === 'stop'" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="4" y="4" width="8" height="8"/>
          </svg>
          <svg v-else-if="point.type === 'max'" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2L2 14h12L8 2z"/>
          </svg>
          <span>{{ formatDepth(point.depth) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.depth-selector {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.depth-selector__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.depth-selector__title {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.depth-selector__current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.depth-value {
  font-size: 1.5rem;
  font-weight: 300;
  color: #0f62fe;
}

.depth-selector__slider {
  margin-bottom: 1.5rem;
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 4px;
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
  background: #0f62fe;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0f62fe;
  cursor: pointer;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.slider:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.3);
}

.slider:focus::-moz-range-thumb {
  box-shadow: 0 0 0 3px rgba(15, 98, 254, 0.3);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #525252;
}

.depth-selector__points {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.points-label {
  font-size: 0.875rem;
  color: #525252;
  margin-bottom: 0.75rem;
}

.points-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.point-button {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: #f4f4f4;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #161616;
  cursor: pointer;
  transition: all 0.2s ease;
}

.point-button:hover {
  background: #e0e0e0;
  border-color: #c6c6c6;
}

.point-button--active {
  background: #0f62fe;
  border-color: #0f62fe;
  color: #ffffff;
}

.point-button--surface {
  border-left: 3px solid #24a148;
}

.point-button--stop {
  border-left: 3px solid #f1c21b;
}

.point-button--max {
  border-left: 3px solid #da1e28;
}

.point-button svg {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .depth-selector {
    padding: 1rem;
  }

  .depth-selector__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .points-buttons {
    flex-direction: column;
  }

  .point-button {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>