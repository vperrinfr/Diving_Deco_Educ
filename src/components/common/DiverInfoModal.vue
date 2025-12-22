<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  save: [data: DiverInfo];
}>();

interface DiverInfo {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  padiNumber: string;
}

const firstName = ref('');
const lastName = ref('');
const phoneNumber = ref('');
const padiNumber = ref('');
const errors = ref<Record<string, string>>({});
const isSaving = ref(false);

// Load existing data from localStorage
const loadDiverInfo = () => {
  const saved = localStorage.getItem('diver-info');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      firstName.value = data.firstName || '';
      lastName.value = data.lastName || '';
      phoneNumber.value = data.phoneNumber || '';
      padiNumber.value = data.padiNumber || '';
    } catch (e) {
      console.error('Error loading diver info:', e);
    }
  }
};

// Watch for modal opening to load data
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadDiverInfo();
    errors.value = {};
  }
});

const validateForm = (): boolean => {
  errors.value = {};
  
  if (!firstName.value.trim()) {
    errors.value.firstName = t('diverInfo.validation.firstNameRequired');
  }
  
  if (!lastName.value.trim()) {
    errors.value.lastName = t('diverInfo.validation.lastNameRequired');
  }
  
  if (!phoneNumber.value.trim()) {
    errors.value.phoneNumber = t('diverInfo.validation.phoneRequired');
  } else if (!/^[\d\s\+\-\(\)]+$/.test(phoneNumber.value)) {
    errors.value.phoneNumber = t('diverInfo.validation.phoneInvalid');
  }
  
  if (!padiNumber.value.trim()) {
    errors.value.padiNumber = t('diverInfo.validation.padiRequired');
  }
  
  return Object.keys(errors.value).length === 0;
};

const handleSave = async () => {
  if (!validateForm()) return;
  
  isSaving.value = true;
  
  const diverInfo: DiverInfo = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    phoneNumber: phoneNumber.value.trim(),
    padiNumber: padiNumber.value.trim(),
  };
  
  try {
    // Save to localStorage
    localStorage.setItem('diver-info', JSON.stringify(diverInfo));
    
    // Send to backend API
    const response = await fetch('/api/diver-info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(diverInfo),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save diver information');
    }
    
    emit('save', diverInfo);
    emit('close');
  } catch (error) {
    console.error('Error saving diver info:', error);
    alert(t('diverInfo.error.saveFailed'));
  } finally {
    isSaving.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

const handleBackdropClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    handleClose();
  }
};
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click="handleBackdropClick">
        <div class="modal-container">
          <div class="modal-header">
            <h2 class="modal-title">{{ t('diverInfo.title') }}</h2>
            <button class="close-button" @click="handleClose" :aria-label="t('diverInfo.close')">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 8.586L3.707 2.293 2.293 3.707 8.586 10l-6.293 6.293 1.414 1.414L10 11.414l6.293 6.293 1.414-1.414L11.414 10l6.293-6.293-1.414-1.414L10 8.586z"/>
              </svg>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="handleSave">
              <!-- First Name -->
              <div class="form-group">
                <label class="form-label">{{ t('diverInfo.firstName') }} *</label>
                <input
                  v-model="firstName"
                  type="text"
                  class="form-input"
                  :class="{ 'form-input--error': errors.firstName }"
                  :placeholder="t('diverInfo.firstNamePlaceholder')"
                />
                <p v-if="errors.firstName" class="form-error">{{ errors.firstName }}</p>
              </div>
              
              <!-- Last Name -->
              <div class="form-group">
                <label class="form-label">{{ t('diverInfo.lastName') }} *</label>
                <input
                  v-model="lastName"
                  type="text"
                  class="form-input"
                  :class="{ 'form-input--error': errors.lastName }"
                  :placeholder="t('diverInfo.lastNamePlaceholder')"
                />
                <p v-if="errors.lastName" class="form-error">{{ errors.lastName }}</p>
              </div>
              
              <!-- Phone Number -->
              <div class="form-group">
                <label class="form-label">{{ t('diverInfo.phoneNumber') }} *</label>
                <input
                  v-model="phoneNumber"
                  type="tel"
                  class="form-input"
                  :class="{ 'form-input--error': errors.phoneNumber }"
                  :placeholder="t('diverInfo.phoneNumberPlaceholder')"
                />
                <p v-if="errors.phoneNumber" class="form-error">{{ errors.phoneNumber }}</p>
              </div>
              
              <!-- PADI Number -->
              <div class="form-group">
                <label class="form-label">{{ t('diverInfo.padiNumber') }} *</label>
                <input
                  v-model="padiNumber"
                  type="text"
                  class="form-input"
                  :class="{ 'form-input--error': errors.padiNumber }"
                  :placeholder="t('diverInfo.padiNumberPlaceholder')"
                />
                <p v-if="errors.padiNumber" class="form-error">{{ errors.padiNumber }}</p>
              </div>
              
              <p class="form-note">{{ t('diverInfo.requiredFields') }}</p>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="btn btn--secondary" @click="handleClose" :disabled="isSaving">
              {{ t('diverInfo.cancel') }}
            </button>
            <button class="btn btn--primary" @click="handleSave" :disabled="isSaving">
              {{ isSaving ? t('diverInfo.saving') : t('diverInfo.save') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.close-button {
  background: transparent;
  border: none;
  color: #525252;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #f4f4f4;
  color: #161616;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #161616;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.4;
  color: #161616;
  background: #f4f4f4;
  border: none;
  border-bottom: 1px solid #8d8d8d;
  outline: 2px solid transparent;
  outline-offset: -2px;
  transition: all 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  border-radius: 4px 4px 0 0;
}

.form-input:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
}

.form-input--error {
  outline: 2px solid #da1e28;
  outline-offset: -2px;
}

.form-error {
  font-size: 0.75rem;
  color: #da1e28;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

.form-note {
  font-size: 0.75rem;
  color: #525252;
  margin-top: 1rem;
  margin-bottom: 0;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: 2px solid transparent;
  outline-offset: -2px;
}

.btn:focus {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #0f62fe;
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background: #0353e9;
}

.btn--secondary {
  background: transparent;
  color: #0f62fe;
  border: 1px solid #0f62fe;
}

.btn--secondary:hover:not(:disabled) {
  background: #f4f4f4;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>