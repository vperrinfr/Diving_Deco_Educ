<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { DiveParameters, GasMix, MultiLevelDiveParameters, GasInventory, DiveSegment } from '../../types';
import { PREDEFINED_GASES } from '../../types';
import { DESCENT_RATE, ASCENT_RATE } from '../../utils/buhlmann/constants';
import SegmentManager from './SegmentManager.vue';
import GasManager from './GasManager.vue';
import RateConfiguration from './RateConfiguration.vue';

const emit = defineEmits<{
  calculate: [parameters: DiveParameters | MultiLevelDiveParameters]
}>();

const { t } = useI18n();

// Mode toggle
const isAdvancedMode = ref(false);

// Simple mode state
const depth = ref(30);
const bottomTime = ref(25);
const selectedGas = ref<string>('AIR');
const customOxygen = ref(21);
const customNitrogen = ref(79);
const customHelium = ref(0);
const useCustomGas = ref(false);

// Advanced mode state
const segments = ref<DiveSegment[]>([]);
const gasInventory = ref<GasInventory>({
  bottomGas: PREDEFINED_GASES.AIR,
  decoGases: []
});
const rates = ref({
  descentRate: DESCENT_RATE,
  ascentRate: ASCENT_RATE
});

// Common state
const gradientFactorLow = ref(30);
const gradientFactorHigh = ref(85);
const units = ref<'metric' | 'imperial'>('metric');

// Validation errors
const segmentErrors = ref<string[]>([]);
const gasErrors = ref<string[]>([]);

// Computed gas mix for simple mode
const currentGasMix = computed((): GasMix => {
  if (useCustomGas.value) {
    return {
      oxygen: customOxygen.value / 100,
      nitrogen: customNitrogen.value / 100,
      helium: customHelium.value / 100,
      name: 'Custom'
    };
  }
  return PREDEFINED_GASES[selectedGas.value] || PREDEFINED_GASES.AIR;
});

// Validate custom gas percentages
const gasPercentageError = computed(() => {
  if (!useCustomGas.value) return '';
  const total = customOxygen.value + customNitrogen.value + customHelium.value;
  if (Math.abs(total - 100) > 0.1) {
    return t('input.gasPercentageError', { total: total.toFixed(1) });
  }
  return '';
});

// Check if calculation is valid
const canCalculate = computed(() => {
  if (isAdvancedMode.value) {
    return segments.value.length > 0 && segmentErrors.value.length === 0;
  }
  return !gasPercentageError.value;
});

// Handle calculation
const handleCalculate = () => {
  if (!canCalculate.value) return;
  
  if (isAdvancedMode.value) {
    // Multi-level dive
    const parameters: MultiLevelDiveParameters = {
      segments: segments.value,
      gasInventory: gasInventory.value,
      gradientFactorLow: gradientFactorLow.value,
      gradientFactorHigh: gradientFactorHigh.value,
      descentRate: rates.value.descentRate,
      ascentRate: rates.value.ascentRate,
      units: units.value
    };
    emit('calculate', parameters);
  } else {
    // Simple single-level dive
    const parameters: DiveParameters = {
      depth: depth.value,
      bottomTime: bottomTime.value,
      gasMix: currentGasMix.value,
      gradientFactorLow: gradientFactorLow.value,
      gradientFactorHigh: gradientFactorHigh.value,
      units: units.value
    };
    emit('calculate', parameters);
  }
};

// Auto-adjust nitrogen when oxygen changes
const handleOxygenChange = () => {
  if (useCustomGas.value && customHelium.value === 0) {
    customNitrogen.value = 100 - customOxygen.value;
  }
};

// Handle mode toggle
const toggleMode = () => {
  isAdvancedMode.value = !isAdvancedMode.value;
  
  // Initialize segments with current simple mode values when switching to advanced
  if (isAdvancedMode.value && segments.value.length === 0) {
    segments.value = [{
      depth: depth.value,
      duration: bottomTime.value,
      gasMix: currentGasMix.value,
      segmentType: 'bottom'
    }];
  }
};
</script>

<template>
  <div class="dive-calculator-input">
    <!-- Mode Toggle -->
    <div class="mode-toggle-container">
      <button
        class="mode-toggle"
        :class="{ advanced: isAdvancedMode }"
        @click="toggleMode"
      >
        <span class="mode-icon">{{ isAdvancedMode ? '⚙️' : '📊' }}</span>
        <span class="mode-text">
          {{ isAdvancedMode ? t('input.modeToggle.advanced') : t('input.modeToggle.simple') }}
        </span>
        <span class="mode-hint">
          {{ isAdvancedMode ? t('input.modeToggle.advancedHint') : t('input.modeToggle.simpleHint') }}
        </span>
      </button>
    </div>

    <div class="cds--tile cds--tile--light">
      <h3 class="cds--type-heading-03 cds--spacing-05">
        {{ isAdvancedMode ? t('input.title.advanced') : t('input.title.simple') }}
      </h3>
      
      <div class="cds--form cds--spacing-05">
        <!-- Simple Mode -->
        <template v-if="!isAdvancedMode">
          <!-- Depth Input -->
          <div class="cds--form-item cds--spacing-05">
            <label class="cds--label">
              {{ t('input.depth') }} ({{ units === 'metric' ? t('input.units.meters') : t('input.units.feet') }})
            </label>
            <input
              v-model.number="depth"
              type="number"
              min="1"
              max="100"
              class="cds--text-input cds--text-input--light"
            />
            <div class="slider-container">
              <input
                v-model.number="depth"
                type="range"
                min="1"
                max="100"
                class="cds--slider"
              />
              <div class="cds--slider__range-label">
                <span>1{{ units === 'metric' ? 'm' : 'ft' }}</span>
                <span>100{{ units === 'metric' ? 'm' : 'ft' }}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Time Input -->
          <div class="cds--form-item cds--spacing-05">
            <label class="cds--label">
              {{ t('input.bottomTime') }}
            </label>
            <input
              v-model.number="bottomTime"
              type="number"
              min="1"
              max="200"
              class="cds--text-input cds--text-input--light"
            />
            <div class="slider-container">
              <input
                v-model.number="bottomTime"
                type="range"
                min="1"
                max="200"
                class="cds--slider"
              />
              <div class="cds--slider__range-label">
                <span>1{{ t('input.sliderLabels.min') }}</span>
                <span>200{{ t('input.sliderLabels.min') }}</span>
              </div>
            </div>
          </div>

          <!-- Gas Mix Selection -->
          <div class="cds--form-item cds--spacing-05">
            <label class="cds--label">{{ t('input.gasMix') }}</label>
            
            <div class="cds--checkbox-wrapper cds--spacing-03">
              <input
                v-model="useCustomGas"
                type="checkbox"
                id="customGas"
                class="cds--checkbox"
              />
              <label for="customGas" class="cds--checkbox-label">
                <span class="cds--checkbox-label-text">{{ t('input.useCustomGas') }}</span>
              </label>
            </div>

            <div v-if="!useCustomGas" class="cds--spacing-03">
              <select
                v-model="selectedGas"
                class="cds--select-input"
              >
                <option value="AIR">Air (21% O₂)</option>
                <option value="EAN32">EAN32 (32% O₂)</option>
                <option value="EAN36">EAN36 (36% O₂)</option>
                <option value="EAN40">EAN40 (40% O₂)</option>
              </select>
            </div>

            <div v-else class="cds--spacing-03">
              <div class="cds--form-item">
                <label class="cds--label">{{ t('input.oxygen') }}</label>
                <input
                  v-model.number="customOxygen"
                  @input="handleOxygenChange"
                  type="number"
                  min="10"
                  max="100"
                  step="1"
                  class="cds--text-input cds--text-input--light"
                />
              </div>
              <div class="cds--form-item cds--spacing-03">
                <label class="cds--label">{{ t('input.nitrogen') }}</label>
                <input
                  v-model.number="customNitrogen"
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  class="cds--text-input cds--text-input--light"
                />
              </div>
              <div class="cds--form-item cds--spacing-03">
                <label class="cds--label">{{ t('input.helium') }}</label>
                <input
                  v-model.number="customHelium"
                  type="number"
                  min="0"
                  max="90"
                  step="1"
                  class="cds--text-input cds--text-input--light"
                />
              </div>
              <div v-if="gasPercentageError" class="cds--form-requirement cds--spacing-03">
                {{ gasPercentageError }}
              </div>
            </div>
          </div>
        </template>

        <!-- Advanced Mode -->
        <template v-else>
          <div class="advanced-components">
            <SegmentManager
              v-model="segments"
              :bottom-gas="gasInventory.bottomGas"
              @validation-error="segmentErrors = $event"
            />
            
            <GasManager
              v-model="gasInventory"
              @validation-error="gasErrors = $event"
            />
            
            <RateConfiguration
              v-model="rates"
            />
          </div>
        </template>

        <!-- Gradient Factors (Common) -->
        <div class="cds--form-item cds--spacing-05">
          <h4 class="cds--type-heading-02 cds--spacing-03">{{ t('input.gradientFactors') }}</h4>
          
          <div class="cds--form-item cds--spacing-03">
            <label class="cds--label">
              {{ t('input.gfLow') }}: {{ gradientFactorLow }}%
            </label>
            <div class="slider-container">
              <input
                v-model.number="gradientFactorLow"
                type="range"
                min="10"
                max="100"
                class="cds--slider"
              />
              <div class="cds--slider__range-label">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div class="cds--form-item cds--spacing-03">
            <label class="cds--label">
              {{ t('input.gfHigh') }}: {{ gradientFactorHigh }}%
            </label>
            <div class="slider-container">
              <input
                v-model.number="gradientFactorHigh"
                type="range"
                min="10"
                max="100"
                class="cds--slider"
              />
              <div class="cds--slider__range-label">
                <span>10%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div class="cds--tile cds--tile--info cds--spacing-03">
            <p class="cds--type-body-compact-01">
              <strong>{{ t('input.gfPresets.conservative') }}:</strong> 30/70 | <strong>{{ t('input.gfPresets.moderate') }}:</strong> 40/85 | <strong>{{ t('input.gfPresets.aggressive') }}:</strong> 50/95
            </p>
          </div>
        </div>

        <!-- Calculate Button -->
        <button
          @click="handleCalculate"
          :disabled="!canCalculate"
          class="cds--btn cds--btn--primary cds--btn--full-width cds--spacing-05"
        >
          {{ isAdvancedMode ? t('input.calculateButton.advanced') : t('input.calculateButton.simple') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dive-calculator-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mode-toggle-container {
  display: flex;
  justify-content: center;
}

.mode-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.mode-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.mode-toggle.advanced {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.mode-icon {
  font-size: 2rem;
}

.mode-text {
  font-size: 1rem;
  font-weight: 600;
}

.mode-hint {
  font-size: 0.75rem;
  opacity: 0.9;
}

.advanced-components {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cds--tile {
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #393939;
  border: none;
  color: #f4f4f4;
}

.cds--spacing-03 {
  margin-top: 0.75rem;
}

.cds--spacing-05 {
  margin-top: 1.5rem;
}

.cds--form-item {
  margin-bottom: 1.5rem;
}

.cds--text-input,
.cds--select-input {
  width: 100%;
  padding: 0.6875rem 1rem;
  border: none;
  border-bottom: 1px solid #6f6f6f;
  background: #525252;
  color: #f4f4f4;
  font-size: 0.875rem;
  font-family: 'IBM Plex Sans', sans-serif;
}

.cds--text-input:focus,
.cds--select-input:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
  background: #525252;
}

.cds--slider {
  width: 100%;
  height: 4px;
  background: #6f6f6f;
  outline: none;
  margin: 0.75rem 0;
  border-radius: 2px;
}

.cds--slider::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  background: #0f62fe;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.cds--slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #0f62fe;
  cursor: pointer;
  border-radius: 50%;
  border: 2px solid #ffffff;
}

.cds--slider__range-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #c6c6c6;
  margin-top: 0.25rem;
}

.cds--checkbox-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.cds--checkbox {
  width: 1.125rem;
  height: 1.125rem;
  margin-right: 0.5rem;
  accent-color: #0f62fe;
}

.cds--checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.cds--checkbox-label-text {
  font-size: 0.875rem;
  color: #f4f4f4;
}

.cds--btn {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  font-weight: 400;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  font-family: 'IBM Plex Sans', sans-serif;
}

.cds--btn--primary {
  background: #0f62fe;
  color: #ffffff;
}

.cds--btn--primary:hover:not(:disabled) {
  background: #0353e9;
}

.cds--btn--primary:disabled {
  background: #6f6f6f;
  cursor: not-allowed;
  color: #c6c6c6;
}

.cds--btn--full-width {
  width: 100%;
}

.cds--form-requirement {
  color: #ff8389;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.cds--tile--info {
  background: #0353e9;
  border-left: 3px solid #78a9ff;
  padding: 0.75rem;
  color: #ffffff;
}

.cds--label {
  display: block;
  font-size: 0.75rem;
  font-weight: 400;
  color: #c6c6c6;
  margin-bottom: 0.5rem;
  letter-spacing: 0.16px;
}

.cds--type-heading-02 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.375;
  color: #f4f4f4;
}

.cds--type-heading-03 {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.4;
  color: #ffffff;
  margin-bottom: 1.5rem;
}

.cds--type-body-compact-01 {
  font-size: 0.875rem;
  line-height: 1.28572;
  color: #ffffff;
}

@media (max-width: 1056px) {
  .cds--tile {
    background: #ffffff;
    color: #161616;
    border: 1px solid #e0e0e0;
  }
  
  .cds--text-input,
  .cds--select-input {
    background: #f4f4f4;
    color: #161616;
    border-bottom: 1px solid #8d8d8d;
  }
  
  .cds--label,
  .cds--type-heading-02,
  .cds--type-heading-03,
  .cds--checkbox-label-text {
    color: #161616;
  }
  
  .cds--slider {
    background: #e0e0e0;
  }
  
  .cds--slider__range-label {
    color: #525252;
  }
}
</style>