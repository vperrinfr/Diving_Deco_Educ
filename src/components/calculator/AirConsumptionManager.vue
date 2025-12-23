<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { 
  AirConsumptionData, 
  CylinderSelection, 
  CylinderConfig 
} from '../../types/airConsumption';
import { STANDARD_CYLINDERS } from '../../types/airConsumption';

const { t } = useI18n();

const props = defineProps<{
  modelValue: AirConsumptionData;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: AirConsumptionData];
}>();

const localData = ref<AirConsumptionData>({ ...props.modelValue });

const updateData = () => {
  emit('update:modelValue', { ...localData.value });
};

const addCylinder = () => {
  localData.value.cylinders.push({
    cylinderId: STANDARD_CYLINDERS[0].id,
    startPressure: STANDARD_CYLINDERS[0].workingPressure,
    gasType: 'bottom'
  });
  updateData();
};

const removeCylinder = (index: number) => {
  localData.value.cylinders.splice(index, 1);
  updateData();
};

const getCylinderConfig = (cylinderId: string): CylinderConfig | undefined => {
  return STANDARD_CYLINDERS.find(c => c.id === cylinderId);
};

const activityLevels = [
  { value: 15, label: 'airConsumption.activityLevels.resting' },
  { value: 20, label: 'airConsumption.activityLevels.light' },
  { value: 25, label: 'airConsumption.activityLevels.moderate' },
  { value: 30, label: 'airConsumption.activityLevels.heavy' }
];

const totalCylinderCapacity = computed(() => {
  return localData.value.cylinders.reduce((total, selection) => {
    const cylinder = getCylinderConfig(selection.cylinderId);
    if (!cylinder) return total;
    const usablePressure = selection.startPressure - localData.value.reservePressure;
    return total + (cylinder.volume * usablePressure);
  }, 0);
});
</script>

<template>
  <div class="air-consumption-manager">
    <div class="cds--tile cds--spacing-05">
      <h3 class="cds--type-heading-03 cds--spacing-05">{{ t('airConsumption.title') }}</h3>
      
      <div class="cds--form cds--spacing-05">
        <!-- SAC Rate Configuration -->
        <div class="cds--form-item cds--spacing-05">
          <label class="cds--label">{{ t('airConsumption.sacRate.label') }} (L/min)</label>
          <p class="cds--form__helper-text">{{ t('airConsumption.sacRate.description') }}</p>
          <input
            type="number"
            v-model.number="localData.surfaceAirConsumptionRate"
            @input="updateData"
            min="10"
            max="50"
            step="1"
            class="cds--text-input cds--text-input--light"
          />
          <div class="slider-container">
            <input
              type="range"
              v-model.number="localData.surfaceAirConsumptionRate"
              @input="updateData"
              min="10"
              max="50"
              step="1"
              class="cds--slider"
            />
            <div class="cds--slider__range-label">
              <span>10</span>
              <span>50</span>
            </div>
          </div>

          <!-- Activity Level Presets -->
          <div class="preset-buttons cds--spacing-03">
            <button
              v-for="level in activityLevels"
              :key="level.value"
              @click="localData.surfaceAirConsumptionRate = level.value; updateData()"
              :class="['preset-btn', { active: localData.surfaceAirConsumptionRate === level.value }]"
              type="button"
            >
              {{ t(level.label) }}
            </button>
          </div>
        </div>

        <!-- Reserve Pressure -->
        <div class="cds--form-item cds--spacing-05">
          <label class="cds--label">{{ t('airConsumption.reservePressure.label') }} (bar)</label>
          <p class="cds--form__helper-text">{{ t('airConsumption.reservePressure.description') }}</p>
          <input
            type="number"
            v-model.number="localData.reservePressure"
            @input="updateData"
            min="30"
            max="100"
            step="10"
            class="cds--text-input cds--text-input--light"
          />
        </div>

        <!-- Cylinders Configuration -->
        <div class="cds--form-item cds--spacing-05">
          <div class="section-header-with-action">
            <label class="cds--label">{{ t('airConsumption.cylinders.title') }}</label>
            <button @click="addCylinder" class="cds--btn cds--btn--primary cds--btn--sm" type="button">
              + {{ t('airConsumption.cylinders.addButton') }}
            </button>
          </div>
          <p class="cds--form__helper-text">{{ t('airConsumption.cylinders.description') }}</p>

          <div v-if="localData.cylinders.length === 0" class="empty-state cds--spacing-03">
            <p class="cds--type-body-compact-01">{{ t('airConsumption.cylinders.empty') }}</p>
          </div>

          <div v-else class="cylinders-list cds--spacing-03">
            <div
              v-for="(cylinder, index) in localData.cylinders"
              :key="index"
              class="cylinder-item"
            >
              <div class="cylinder-header">
                <span class="cylinder-number">{{ index + 1 }}</span>
                <button
                  @click="removeCylinder(index)"
                  class="remove-btn"
                  :title="t('airConsumption.cylinders.removeButton')"
                  type="button"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 7h12v2H2z"/>
                  </svg>
                </button>
              </div>
              
              <div class="cylinder-config">
                <div class="cds--form-item">
                  <label class="cds--label">{{ t('airConsumption.cylinders.type') }}</label>
                  <select
                    v-model="cylinder.cylinderId"
                    @change="updateData"
                    class="cds--select-input"
                  >
                    <option v-for="config in STANDARD_CYLINDERS" :key="config.id" :value="config.id">
                      {{ config.name }}
                    </option>
                  </select>
                </div>

                <div class="input-row">
                  <div class="cds--form-item">
                    <label class="cds--label">{{ t('airConsumption.cylinders.startPressure') }}</label>
                    <input
                      type="number"
                      v-model.number="cylinder.startPressure"
                      @input="updateData"
                      min="50"
                      max="300"
                      step="10"
                      class="cds--text-input cds--text-input--light"
                    />
                  </div>

                  <div class="cds--form-item">
                    <label class="cds--label">{{ t('airConsumption.cylinders.gasType') }}</label>
                    <select
                      v-model="cylinder.gasType"
                      @change="updateData"
                      class="cds--select-input"
                    >
                      <option value="bottom">{{ t('airConsumption.cylinders.gasTypes.bottom') }}</option>
                      <option value="deco">{{ t('airConsumption.cylinders.gasTypes.deco') }}</option>
                      <option value="bailout">{{ t('airConsumption.cylinders.gasTypes.bailout') }}</option>
                    </select>
                  </div>
                </div>

                <div class="cylinder-info">
                  <span class="info-item">
                    <strong>{{ t('airConsumption.cylinders.capacity') }}:</strong>
                    {{ getCylinderConfig(cylinder.cylinderId)?.volume || 0 }}L
                  </span>
                  <span class="info-item">
                    <strong>{{ t('airConsumption.cylinders.totalAir') }}:</strong>
                    {{ ((getCylinderConfig(cylinder.cylinderId)?.volume || 0) * (cylinder.startPressure - localData.reservePressure)).toFixed(0) }}L
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Capacity Summary -->
          <div v-if="localData.cylinders.length > 0" class="capacity-summary cds--spacing-03">
            <div class="summary-item">
              <span class="summary-label">{{ t('airConsumption.summary.totalCapacity') }}</span>
              <span class="summary-value">{{ totalCylinderCapacity.toFixed(0) }} L</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">{{ t('airConsumption.summary.numberOfCylinders') }}</span>
              <span class="summary-value">{{ localData.cylinders.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.air-consumption-manager {
  margin-top: 1rem;
}

.cds--tile {
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #393939;
  border: none;
  color: #f4f4f4;
}

.cds--type-heading-03 {
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0;
  color: #f4f4f4;
}

.cds--spacing-05 {
  margin-top: 1.5rem;
}

.cds--spacing-03 {
  margin-top: 0.75rem;
}

.cds--form {
  display: flex;
  flex-direction: column;
}

.cds--form-item {
  margin-bottom: 1.5rem;
}

.cds--label {
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.33333;
  letter-spacing: 0.32px;
  color: #f4f4f4;
  margin-bottom: 0.5rem;
}

.cds--form__helper-text {
  font-size: 0.75rem;
  line-height: 1.33333;
  color: #c6c6c6;
  margin-top: 0.25rem;
  margin-bottom: 0.5rem;
}

.cds--text-input {
  width: 100%;
  padding: 0.6875rem 1rem;
  border: none;
  border-bottom: 1px solid #6f6f6f;
  background: #525252;
  color: #f4f4f4;
  font-size: 0.875rem;
  font-family: 'IBM Plex Sans', sans-serif;
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition: background-color 70ms cubic-bezier(0.2, 0, 0.38, 0.9),
              outline 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
}

.cds--text-input:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
  background: #525252;
}

.slider-container {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.cds--slider {
  width: 100%;
  height: 4px;
  background: #6f6f6f;
  outline: none;
  margin: 0.75rem 0;
  border-radius: 2px;
  -webkit-appearance: none;
  appearance: none;
}

.cds--slider::-webkit-slider-thumb {
  -webkit-appearance: none;
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

.preset-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #6f6f6f;
  background: #525252;
  color: #f4f4f4;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  font-family: inherit;
}

.preset-btn:hover {
  background: #636363;
  border-color: #8d8d8d;
}

.preset-btn.active {
  background: #0f62fe;
  color: #ffffff;
  border-color: #0f62fe;
}

.section-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.cds--btn {
  padding: 0.875rem 3.875rem 0.875rem 0.9375rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.28572;
  letter-spacing: 0.16px;
  cursor: pointer;
  transition: background 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  font-family: inherit;
}

.cds--btn--primary {
  background: #0f62fe;
  color: #ffffff;
}

.cds--btn--primary:hover {
  background: #0353e9;
}

.cds--btn--sm {
  padding: 0.4375rem 3.875rem 0.4375rem 0.9375rem;
  font-size: 0.875rem;
}

.cds--select-input {
  width: 100%;
  padding: 0.6875rem 1rem;
  border: none;
  border-bottom: 1px solid #6f6f6f;
  background: #525252;
  color: #f4f4f4;
  font-size: 0.875rem;
  font-family: 'IBM Plex Sans', sans-serif;
  outline: 2px solid transparent;
  outline-offset: -2px;
  cursor: pointer;
  transition: background-color 70ms cubic-bezier(0.2, 0, 0.38, 0.9),
              outline 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
  appearance: none;
}

.cds--select-input:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
  background: #525252;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #c6c6c6;
  background: #525252;
  border: 1px dashed #6f6f6f;
}

.cylinders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cylinder-item {
  padding: 1rem;
  background: #525252;
  border-left: 3px solid #0f62fe;
}

.cylinder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.cylinder-number {
  width: 1.5rem;
  height: 1.5rem;
  background: #0f62fe;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.cylinder-config {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.cylinder-info {
  display: flex;
  gap: 1.5rem;
  font-size: 0.75rem;
  color: #c6c6c6;
  margin-top: 0.5rem;
}

.info-item strong {
  color: #f4f4f4;
}

.remove-btn {
  background: transparent;
  border: none;
  color: #ff8389;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 70ms cubic-bezier(0.2, 0, 0.38, 0.9);
}

.remove-btn:hover {
  background: #520408;
}

.capacity-summary {
  padding: 1rem;
  background: #525252;
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  border: 1px solid #6f6f6f;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #c6c6c6;
  text-transform: uppercase;
  letter-spacing: 0.32px;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #78a9ff;
}

@media (max-width: 672px) {
  .input-row {
    grid-template-columns: 1fr;
  }
  
  .section-header-with-action {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .capacity-summary {
    flex-direction: column;
  }
}
</style>