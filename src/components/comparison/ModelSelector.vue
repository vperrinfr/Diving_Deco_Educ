<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DecompressionModel } from '../../types/decoModels';
import { 
  DecompressionModel as Models,
  MODEL_CHARACTERISTICS,
  getConservatismColor
} from '../../types/decoModels';

const { t } = useI18n();

// Props
const props = defineProps<{
  maxModels?: number;
}>();

// Emits
const emit = defineEmits<{
  (e: 'modelsSelected', models: DecompressionModel[]): void;
}>();

// State
const selectedModels = ref<Set<DecompressionModel>>(new Set([Models.BUHLMANN_ZHL16C]));
const maxModels = props.maxModels || 3;

// Available models
const availableModels = [
  Models.BUHLMANN_ZHL16C,
  Models.VPM_B,
  Models.RGBM,
  Models.US_NAVY
];

// Computed
const canSelectMore = computed(() => selectedModels.value.size < maxModels);
const canCompare = computed(() => selectedModels.value.size >= 2);
const selectedCount = computed(() => selectedModels.value.size);

// Methods
const toggleModel = (model: DecompressionModel) => {
  if (selectedModels.value.has(model)) {
    selectedModels.value.delete(model);
  } else if (canSelectMore.value) {
    selectedModels.value.add(model);
  }
  selectedModels.value = new Set(selectedModels.value); // Trigger reactivity
};

const isSelected = (model: DecompressionModel) => {
  return selectedModels.value.has(model);
};

const handleCompare = () => {
  if (canCompare.value) {
    emit('modelsSelected', Array.from(selectedModels.value));
  }
};

const clearSelection = () => {
  selectedModels.value.clear();
  selectedModels.value = new Set(selectedModels.value);
};
</script>

<template>
  <div class="model-selector">
    <div class="selector-header">
      <h3 class="cds--type-heading-03">
        {{ t('comparison.selectModels') }}
      </h3>
      <div class="selector-info">
        <span class="selection-count">
          {{ selectedCount }} / {{ maxModels }} {{ t('comparison.modelsSelected') }}
        </span>
        <button 
          v-if="selectedCount > 0"
          @click="clearSelection"
          class="clear-button"
          :title="t('comparison.clearSelection')"
        >
          {{ t('comparison.clear') }}
        </button>
      </div>
    </div>

    <div class="model-grid">
      <div
        v-for="model in availableModels"
        :key="model"
        class="model-card"
        :class="{
          'model-card--selected': isSelected(model),
          'model-card--disabled': !isSelected(model) && !canSelectMore
        }"
        @click="toggleModel(model)"
      >
        <div class="model-card__header">
          <div class="model-card__checkbox">
            <input
              type="checkbox"
              :checked="isSelected(model)"
              :disabled="!isSelected(model) && !canSelectMore"
              @click.stop="toggleModel(model)"
            />
          </div>
          <div 
            class="model-card__color-indicator"
            :style="{ backgroundColor: MODEL_CHARACTERISTICS[model].color }"
          ></div>
        </div>

        <div class="model-card__content">
          <h4 class="model-card__name">
            {{ MODEL_CHARACTERISTICS[model].name }}
          </h4>
          <p class="model-card__description">
            {{ MODEL_CHARACTERISTICS[model].description }}
          </p>

          <div class="model-card__badges">
            <span 
              class="badge badge--conservatism"
              :style="{ 
                backgroundColor: getConservatismColor(MODEL_CHARACTERISTICS[model].conservatism),
                color: '#fff'
              }"
            >
              {{ t(`comparison.conservatism.${MODEL_CHARACTERISTICS[model].conservatism}`) }}
            </span>
            
            <span v-if="MODEL_CHARACTERISTICS[model].bubbleModel" class="badge badge--feature">
              {{ t('comparison.bubbleModel') }}
            </span>
            
            <span v-if="MODEL_CHARACTERISTICS[model].dissolvedGasModel" class="badge badge--feature">
              {{ t('comparison.dissolvedGas') }}
            </span>
            
            <span v-if="MODEL_CHARACTERISTICS[model].deepStops" class="badge badge--feature">
              {{ t('comparison.deepStops') }}
            </span>
            
            <span v-if="MODEL_CHARACTERISTICS[model].empirical" class="badge badge--feature">
              {{ t('comparison.empirical') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="selector-actions">
      <button
        @click="handleCompare"
        :disabled="!canCompare"
        class="compare-button"
        :class="{ 'compare-button--disabled': !canCompare }"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z"/>
        </svg>
        <span>{{ t('comparison.compareButton') }}</span>
      </button>
      
      <p v-if="!canCompare" class="selector-hint">
        {{ t('comparison.selectAtLeastTwo') }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.model-selector {
  background: #fff;
  border-radius: 4px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.selector-header h3 {
  margin: 0;
  color: #161616;
}

.selector-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selection-count {
  font-size: 0.875rem;
  color: #525252;
  font-weight: 500;
}

.clear-button {
  background: none;
  border: none;
  color: #0f62fe;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.clear-button:hover {
  background-color: #e8f4ff;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.model-card {
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.model-card:hover:not(.model-card--disabled) {
  border-color: #0f62fe;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.model-card--selected {
  border-color: #0f62fe;
  background-color: #e8f4ff;
}

.model-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.model-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.model-card__checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.model-card__color-indicator {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.model-card__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.model-card__name {
  font-size: 1rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.model-card__description {
  font-size: 0.875rem;
  color: #525252;
  line-height: 1.4;
  margin: 0;
}

.model-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
}

.badge--conservatism {
  text-transform: capitalize;
}

.badge--feature {
  background-color: #f4f4f4;
  color: #161616;
}

.selector-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.compare-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #0f62fe;
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.compare-button:hover:not(.compare-button--disabled) {
  background-color: #0353e9;
}

.compare-button--disabled {
  background-color: #c6c6c6;
  cursor: not-allowed;
}

.selector-hint {
  font-size: 0.875rem;
  color: #525252;
  margin: 0;
  text-align: center;
}
</style>

<!-- Made with Bob -->