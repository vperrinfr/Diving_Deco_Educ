<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';

const { locale, t } = useI18n();
const isOpen = ref(false);

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const changeLanguage = (lang: string) => {
  locale.value = lang;
  localStorage.setItem('user-locale', lang);
  isOpen.value = false;
};

const getCurrentLanguageLabel = () => {
  return locale.value === 'fr' ? 'FR' : 'EN';
};

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.language-switcher')) {
    isOpen.value = false;
  }
};

if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside);
}
</script>

<template>
  <div class="language-switcher">
    <button 
      class="language-button" 
      @click="toggleDropdown"
      :aria-label="t('language.switch')"
    >
      <svg class="language-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm4.8 12.4c-.8.8-1.8 1.4-2.9 1.7-.3-.9-.5-1.9-.6-2.9h3.5zm-3.5-3.2c0-1 .1-2 .3-2.9 1.1.3 2.1.9 2.9 1.7v1.2h-3.2zm-1.6 0H6.5v-1.2c.8-.8 1.8-1.4 2.9-1.7.2.9.3 1.9.3 2.9zm0 1.6c-.1 1-.3 2-.6 2.9-1.1-.3-2.1-.9-2.9-1.7v-1.2h3.5zm1.6 0h3.2v1.2c-.8.8-1.8 1.4-2.9 1.7-.3-.9-.5-1.9-.6-2.9zm3.5-5.6c-.8-.8-1.8-1.4-2.9-1.7.1.9.3 1.9.3 2.9h3.5v-1.2zm-5.1-1.2c-1.1.3-2.1.9-2.9 1.7v1.2h3.2c0-1 .1-2 .3-2.9zm-3.2 8.8c.8.8 1.8 1.4 2.9 1.7-.2-.9-.3-1.9-.3-2.9H6.5v1.2z"/>
      </svg>
      <span class="language-label">{{ getCurrentLanguageLabel() }}</span>
      <svg class="dropdown-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 11L3 6h10l-5 5z"/>
      </svg>
    </button>
    
    <div v-if="isOpen" class="language-dropdown">
      <button 
        class="language-option"
        :class="{ active: locale === 'fr' }"
        @click="changeLanguage('fr')"
      >
        <span class="flag">🇫🇷</span>
        <span>{{ t('language.french') }}</span>
      </button>
      <button 
        class="language-option"
        :class="{ active: locale === 'en' }"
        @click="changeLanguage('en')"
      >
        <span class="flag">🇬🇧</span>
        <span>{{ t('language.english') }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.language-button:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.language-icon {
  flex-shrink: 0;
}

.language-label {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.dropdown-icon {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.language-button:hover .dropdown-icon {
  transform: translateY(2px);
}

.language-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 160px;
  z-index: 1000;
  overflow: hidden;
}

.language-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: #161616;
  cursor: pointer;
  font-size: 0.875rem;
  text-align: left;
  transition: background-color 0.2s ease;
}

.language-option:hover {
  background: #f4f4f4;
}

.language-option.active {
  background: #e0e0e0;
  font-weight: 600;
}

.flag {
  font-size: 1.25rem;
  line-height: 1;
}

/* Responsive */
@media (max-width: 768px) {
  .language-button {
    padding: 0.5rem 0.75rem;
  }
  
  .language-label {
    display: none;
  }
}
</style>