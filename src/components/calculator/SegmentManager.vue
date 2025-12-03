<template>
  <div class="segment-manager">
    <div class="header">
      <h3 class="title">Dive Segments ({{ segments.length }}/{{ maxSegments }})</h3>
      <p class="subtitle">Define your multi-level dive profile</p>
    </div>

    <div class="segments-list">
      <div
        v-for="(segment, index) in segments"
        :key="index"
        class="segment-item"
      >
        <div class="segment-number">{{ index + 1 }}</div>
        
        <div class="segment-inputs">
          <div class="input-group">
            <label :for="`depth-${index}`">Depth (m)</label>
            <input
              :id="`depth-${index}`"
              v-model.number="segment.depth"
              type="number"
              min="1"
              max="100"
              step="1"
              class="input"
              @input="updateSegment(index)"
            />
          </div>

          <div class="input-group">
            <label :for="`duration-${index}`">Time (min)</label>
            <input
              :id="`duration-${index}`"
              v-model.number="segment.duration"
              type="number"
              min="1"
              max="200"
              step="1"
              class="input"
              @input="updateSegment(index)"
            />
          </div>
        </div>

        <button
          class="remove-btn"
          :disabled="segments.length === 1"
          @click="removeSegment(index)"
          title="Remove segment"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div class="actions">
      <button
        class="add-btn"
        :disabled="segments.length >= maxSegments"
        @click="addSegment"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Segment
      </button>
    </div>

    <div class="summary">
      <div class="summary-item">
        <span class="label">Total Bottom Time:</span>
        <span class="value">{{ totalBottomTime }} minutes</span>
      </div>
      <div class="summary-item">
        <span class="label">Max Depth:</span>
        <span class="value">{{ maxDepth }} meters</span>
      </div>
    </div>

    <div v-if="validationErrors.length > 0" class="validation-errors">
      <div v-for="(error, index) in validationErrors" :key="index" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { DiveSegment, GasMix } from '../../types';
import { PREDEFINED_GASES } from '../../types';
import { MAX_DIVE_SEGMENTS } from '../../utils/buhlmann/constants';

const props = defineProps<{
  modelValue: DiveSegment[];
  bottomGas: GasMix;
}>();

const emit = defineEmits<{
  'update:modelValue': [segments: DiveSegment[]];
  'validation-error': [errors: string[]];
}>();

const maxSegments = MAX_DIVE_SEGMENTS || 5;
const segments = ref<DiveSegment[]>(props.modelValue.length > 0 ? props.modelValue : [createDefaultSegment()]);

const totalBottomTime = computed(() => {
  return segments.value.reduce((sum, seg) => sum + (seg.duration || 0), 0);
});

const maxDepth = computed(() => {
  return Math.max(...segments.value.map(seg => seg.depth || 0), 0);
});

const validationErrors = computed(() => {
  const errors: string[] = [];
  
  segments.value.forEach((seg, index) => {
    if (!seg.depth || seg.depth <= 0) {
      errors.push(`Segment ${index + 1}: Depth must be greater than 0`);
    }
    if (!seg.duration || seg.duration <= 0) {
      errors.push(`Segment ${index + 1}: Duration must be greater than 0`);
    }
  });
  
  // Check if segments generally decrease in depth (warning, not error)
  for (let i = 1; i < segments.value.length; i++) {
    if (segments.value[i]!.depth > segments.value[i - 1]!.depth) {
      errors.push(`Warning: Segment ${i + 1} is deeper than previous segment (unusual profile)`);
    }
  }
  
  if (totalBottomTime.value > 200) {
    errors.push('Warning: Total bottom time exceeds 200 minutes');
  }
  
  return errors;
});

function createDefaultSegment(): DiveSegment {
  return {
    depth: 30,
    duration: 20,
    gasMix: props.bottomGas,
    segmentType: 'bottom'
  };
}

function addSegment() {
  if (segments.value.length < maxSegments) {
    const lastSegment = segments.value[segments.value.length - 1];
    const newDepth = lastSegment ? Math.max(10, lastSegment.depth - 5) : 30;
    
    segments.value.push({
      depth: newDepth,
      duration: 15,
      gasMix: props.bottomGas,
      segmentType: 'bottom'
    });
    
    emitUpdate();
  }
}

function removeSegment(index: number) {
  if (segments.value.length > 1) {
    segments.value.splice(index, 1);
    emitUpdate();
  }
}

function updateSegment(index: number) {
  // Update gas mix to current bottom gas
  segments.value[index]!.gasMix = props.bottomGas;
  emitUpdate();
}

function emitUpdate() {
  emit('update:modelValue', segments.value);
  emit('validation-error', validationErrors.value);
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue.length > 0 && JSON.stringify(newValue) !== JSON.stringify(segments.value)) {
    segments.value = newValue;
  }
}, { deep: true });

// Watch for bottom gas changes
watch(() => props.bottomGas, (newGas) => {
  segments.value.forEach(seg => {
    seg.gasMix = newGas;
  });
  emitUpdate();
}, { deep: true });

// Initial validation
emitUpdate();
</script>

<style scoped>
.segment-manager {
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

.segments-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.segment-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.segment-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.segment-inputs {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.input-group {
  flex: 1;
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

.remove-btn:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #ef4444;
}

.remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.actions {
  margin-bottom: 1rem;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  justify-content: center;
}

.add-btn:hover:not(:disabled) {
  background: #2563eb;
}

.add-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.summary {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: #eff6ff;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.summary-item .label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.summary-item .value {
  font-size: 1.125rem;
  color: #1f2937;
  font-weight: 600;
}

.validation-errors {
  margin-top: 1rem;
  padding: 1rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.error-message {
  font-size: 0.875rem;
  color: #dc2626;
  margin-bottom: 0.5rem;
}

.error-message:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .segment-inputs {
    flex-direction: column;
  }
  
  .summary {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>