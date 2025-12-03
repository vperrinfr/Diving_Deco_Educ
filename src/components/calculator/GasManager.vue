<template>
  <div class="gas-manager">
    <div class="header">
      <h3 class="title">Gas Configuration</h3>
      <p class="subtitle">Select bottom gas and deco gases</p>
    </div>

    <!-- Bottom Gas -->
    <div class="gas-section">
      <h4 class="section-title">Bottom Gas</h4>
      <div class="gas-selector">
        <select v-model="selectedBottomGas" class="select" @change="updateBottomGas">
          <option v-for="(gas, key) in availableBottomGases" :key="key" :value="key">
            {{ gas.name }}
          </option>
          <option value="custom">Custom Mix</option>
        </select>
        
        <div v-if="selectedBottomGas !== 'custom'" class="gas-info">
          <span class="info-label">MOD:</span>
          <span class="info-value">{{ calculateMOD(bottomGas, 1.4).toFixed(1) }}m</span>
          <span class="info-label">O₂:</span>
          <span class="info-value">{{ (bottomGas.oxygen * 100).toFixed(0) }}%</span>
        </div>
      </div>

      <!-- Custom Bottom Gas -->
      <div v-if="selectedBottomGas === 'custom'" class="custom-gas">
        <div class="input-row">
          <div class="input-group">
            <label>O₂ %</label>
            <input
              v-model.number="customBottomO2"
              type="number"
              min="10"
              max="100"
              step="1"
              class="input"
              @input="updateCustomBottomGas"
            />
          </div>
          <div class="input-group">
            <label>He %</label>
            <input
              v-model.number="customBottomHe"
              type="number"
              min="0"
              max="90"
              step="1"
              class="input"
              @input="updateCustomBottomGas"
            />
          </div>
          <div class="input-group">
            <label>N₂ %</label>
            <input
              :value="100 - customBottomO2 - customBottomHe"
              type="number"
              disabled
              class="input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Deco Gases -->
    <div class="gas-section">
      <h4 class="section-title">Deco Gases</h4>
      
      <div v-if="decoGases.length === 0" class="empty-state">
        <p>No deco gases added. Add gases for optimal decompression.</p>
      </div>

      <div v-else class="deco-gases-list">
        <div
          v-for="(gas, index) in decoGases"
          :key="index"
          class="deco-gas-item"
        >
          <div class="gas-name">{{ formatGasMix(gas) }}</div>
          <div class="gas-details">
            <span class="detail">MOD: {{ calculateMOD(gas, 1.6).toFixed(1) }}m</span>
            <span class="detail">O₂: {{ (gas.oxygen * 100).toFixed(0) }}%</span>
            <span class="detail">Switch: {{ calculateSwitchDepth(bottomGas, gas).toFixed(0) }}m</span>
          </div>
          <button
            class="remove-btn"
            @click="removeDecoGas(index)"
            title="Remove gas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="add-deco-gas">
        <select v-model="selectedDecoGas" class="select">
          <option value="">Select deco gas...</option>
          <option v-for="(gas, key) in availableDecoGases" :key="key" :value="key">
            {{ gas.name }} (MOD: {{ calculateMOD(gas, 1.6).toFixed(1) }}m)
          </option>
          <option value="custom">Custom Deco Gas</option>
        </select>
      </div>
      <button
        class="add-btn"
        :disabled="!selectedDecoGas"
        @click="addDecoGas"
      >
        Add Gas
      </button>

      <!-- Custom Deco Gas -->
      <div v-if="selectedDecoGas === 'custom'" class="custom-gas">
        <div class="input-row">
          <div class="input-group">
            <label>O₂ %</label>
            <input
              v-model.number="customDecoO2"
              type="number"
              min="21"
              max="100"
              step="1"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>He %</label>
            <input
              v-model.number="customDecoHe"
              type="number"
              min="0"
              max="79"
              step="1"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>N₂ %</label>
            <input
              :value="100 - customDecoO2 - customDecoHe"
              type="number"
              disabled
              class="input"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Validation Warnings -->
    <div v-if="validationWarnings.length > 0" class="validation-warnings">
      <div v-for="(warning, index) in validationWarnings" :key="index" class="warning-message">
        {{ warning }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { GasMix, GasInventory } from '../../types';
import { PREDEFINED_GASES } from '../../types';
import { calculateMOD, formatGasMix, calculateSwitchDepth } from '../../utils/gasMix';

const props = defineProps<{
  modelValue: GasInventory;
}>();

const emit = defineEmits<{
  'update:modelValue': [inventory: GasInventory];
  'validation-error': [errors: string[]];
}>();

// Bottom gas state
const selectedBottomGas = ref<string>('AIR');
const customBottomO2 = ref(21);
const customBottomHe = ref(0);

// Deco gas state
const selectedDecoGas = ref<string>('');
const customDecoO2 = ref(50);
const customDecoHe = ref(0);
const decoGases = ref<GasMix[]>(props.modelValue.decoGases || []);

// Available gases
const availableBottomGases = computed(() => {
  return {
    AIR: PREDEFINED_GASES.AIR,
    EAN32: PREDEFINED_GASES.EAN32,
    EAN36: PREDEFINED_GASES.EAN36,
    TRIMIX_18_45: PREDEFINED_GASES.TRIMIX_18_45,
    TRIMIX_21_35: PREDEFINED_GASES.TRIMIX_21_35
  };
});

const availableDecoGases = computed(() => {
  return {
    EAN50: PREDEFINED_GASES.EAN50,
    EAN80: PREDEFINED_GASES.EAN80,
    OXYGEN: PREDEFINED_GASES.OXYGEN
  };
});

const bottomGas = computed(() => {
  if (selectedBottomGas.value === 'custom') {
    return {
      oxygen: customBottomO2.value / 100,
      nitrogen: (100 - customBottomO2.value - customBottomHe.value) / 100,
      helium: customBottomHe.value / 100,
      name: `Custom ${customBottomO2.value}/${customBottomHe.value}`
    };
  }
  return availableBottomGases.value[selectedBottomGas.value as keyof typeof availableBottomGases.value] || PREDEFINED_GASES.AIR;
});

const validationWarnings = computed(() => {
  const warnings: string[] = [];
  
  // Check if deco gases have higher O2 than bottom gas
  decoGases.value.forEach((gas, index) => {
    if (gas.oxygen <= bottomGas.value.oxygen) {
      warnings.push(`Deco gas ${index + 1} should have higher O₂ than bottom gas`);
    }
  });
  
  // Check for duplicate gases
  const gasStrings = decoGases.value.map(g => `${g.oxygen}-${g.helium}`);
  const duplicates = gasStrings.filter((item, index) => gasStrings.indexOf(item) !== index);
  if (duplicates.length > 0) {
    warnings.push('Duplicate deco gases detected');
  }
  
  return warnings;
});

function updateBottomGas() {
  emitUpdate();
}

function updateCustomBottomGas() {
  // Ensure values are valid
  if (customBottomO2.value + customBottomHe.value > 100) {
    customBottomHe.value = 100 - customBottomO2.value;
  }
  emitUpdate();
}

function addDecoGas() {
  if (!selectedDecoGas.value) return;
  
  let newGas: GasMix;
  
  if (selectedDecoGas.value === 'custom') {
    newGas = {
      oxygen: customDecoO2.value / 100,
      nitrogen: (100 - customDecoO2.value - customDecoHe.value) / 100,
      helium: customDecoHe.value / 100,
      name: `Custom ${customDecoO2.value}/${customDecoHe.value}`
    };
  } else {
    newGas = availableDecoGases.value[selectedDecoGas.value as keyof typeof availableDecoGases.value]!;
  }
  
  // Check if gas already exists
  const exists = decoGases.value.some(g => 
    Math.abs(g.oxygen - newGas.oxygen) < 0.01 && 
    Math.abs(g.helium - newGas.helium) < 0.01
  );
  
  if (!exists) {
    decoGases.value.push(newGas);
    // Sort by O2 content (ascending)
    decoGases.value.sort((a, b) => a.oxygen - b.oxygen);
    emitUpdate();
  }
  
  selectedDecoGas.value = '';
}

function removeDecoGas(index: number) {
  decoGases.value.splice(index, 1);
  emitUpdate();
}

function emitUpdate() {
  const inventory: GasInventory = {
    bottomGas: bottomGas.value,
    decoGases: decoGases.value
  };
  
  emit('update:modelValue', inventory);
  emit('validation-error', validationWarnings.value);
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue.decoGases && JSON.stringify(newValue.decoGases) !== JSON.stringify(decoGases.value)) {
    decoGases.value = newValue.decoGases;
  }
}, { deep: true });

// Initial emit
emitUpdate();
</script>

<style scoped>
.gas-manager {
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

.gas-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.gas-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.gas-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.gas-info {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #1f2937;
  font-weight: 600;
}

.custom-gas {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
}

.input-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 2px dashed #e5e7eb;
}

.deco-gases-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.deco-gas-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
}

.gas-name {
  font-weight: 600;
  color: #166534;
  min-width: 100px;
}

.gas-details {
  display: flex;
  gap: 0.75rem;
  flex: 1;
  font-size: 0.875rem;
  flex-wrap: wrap;
  align-items: center;
}

.detail {
  color: #6b7280;
  white-space: nowrap;
}

.remove-btn {
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #fef2f2;
  border-color: #ef4444;
}

.add-deco-gas {
  margin-bottom: 0.75rem;
}

.add-deco-gas .select {
  width: 100%;
}

.add-btn {
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  background: #059669;
}

.add-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.validation-warnings {
  margin-top: 1rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
}

.warning-message {
  font-size: 0.875rem;
  color: #d97706;
  margin-bottom: 0.5rem;
}

.warning-message:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .input-row {
    grid-template-columns: 1fr;
  }
  
  .add-deco-gas {
    flex-direction: column;
  }
  
  .gas-details {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>