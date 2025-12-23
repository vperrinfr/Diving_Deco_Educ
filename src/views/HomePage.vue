<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../components/common/LanguageSwitcher.vue';
import DiverInfoModal from '../components/common/DiverInfoModal.vue';

const router = useRouter();
const { t } = useI18n();

const isDiverInfoModalOpen = ref(false);

const goToCalculator = () => {
  router.push('/calculator');
};

function openDiverInfoModal() {
  isDiverInfoModalOpen.value = true;
}

function closeDiverInfoModal() {
  isDiverInfoModalOpen.value = false;
}

function handleDiverInfoSave(data: any) {
  console.log('Diver info saved:', data);
  // Show success message
  alert(t('diverInfo.title') + ' ✓');
}
</script>

<template>
  <div class="home-page">
    <!-- Header Actions -->
    <div class="header-actions-container">
      <button class="diver-info-button" @click="openDiverInfoModal" :title="t('diverInfo.title')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 11c-2.2 0-4.2-1.2-5.3-3h1.5c.9 1.2 2.4 2 4.1 2s3.1-.8 4.1-2h1.5c-1.2 1.8-3.2 3-5.9 3z"/>
        </svg>
      </button>
      <button class="help-button" @click="$router.push('/guide')" :title="t('guide.title')">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 13H9v-2h2v2zm0-3H9c0-3.3 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.2 1.8-4 4-4s4 1.8 4 4c0 2.8-3 2.8-3 5z"/>
        </svg>
      </button>
      <LanguageSwitcher />
    </div>

    <!-- Fond marin animé -->
    <div class="ocean-background">
      <!-- Vagues -->
      <div class="wave wave1"></div>
      <div class="wave wave2"></div>
      <div class="wave wave3"></div>
      
      <!-- Poissons animés -->
      <div class="fish fish1">🐠</div>
      <div class="fish fish2">🐟</div>
      <div class="fish fish3">🐡</div>
      <div class="fish fish4">🦈</div>
      <div class="fish fish5">🐠</div>
      <div class="fish fish6">🐟</div>
      
      <!-- Bulles -->
      <div class="bubble bubble1"></div>
      <div class="bubble bubble2"></div>
      <div class="bubble bubble3"></div>
      <div class="bubble bubble4"></div>
      <div class="bubble bubble5"></div>
      <div class="bubble bubble6"></div>
      
      <!-- Algues -->
      <div class="seaweed seaweed1"></div>
      <div class="seaweed seaweed2"></div>
      <div class="seaweed seaweed3"></div>
    </div>

    <!-- Contenu principal -->
    <div class="content-overlay">
      <div class="hero-section">
        <div class="hero-icon">🤿</div>
        <h1 class="hero-title">{{ t('home.title') }}</h1>
        <p class="hero-subtitle">
          {{ t('home.subtitle') }}
        </p>
        <div class="button-group">
          <button class="cta-button" @click="goToCalculator">
            <span class="button-text">{{ t('home.startButton') }}</span>
            <svg class="button-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 3l-1.5 1.5L14.25 9H3v2h11.25l-4.75 4.5L11 17l7-7-7-7z"/>
            </svg>
          </button>
          <button class="cta-button secondary" @click="$router.push('/dive-site')">
            <span class="button-text">{{ t('diveSite.title') }}</span>
            <svg class="button-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2C5.6 2 2 5.6 2 10s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm-1-9h2v5h-2V7zm0 6h2v2h-2v-2z"/>
            </svg>
          </button>
          <button class="cta-button test-button" @click="$router.push('/repetitive-dive-test')" title="Test - Plongées Répétitives">
            <span class="button-text">🧪 Test Répétitives</span>
          </button>
        </div>
        
        <div class="features">
          <div class="feature">
            <div class="feature-icon">📊</div>
            <div class="feature-text">{{ t('home.features.multiLevel') }}</div>
          </div>
          <div class="feature">
            <div class="feature-icon">🎯</div>
            <div class="feature-text">{{ t('home.features.gradientFactors') }}</div>
          </div>
          <div class="feature">
            <div class="feature-icon">💨</div>
            <div class="feature-text">{{ t('home.features.multiGas') }}</div>
          </div>
        </div>
      </div>
      
      <div class="disclaimer">
        <svg class="disclaimer-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 20h20L12 2zm0 4l7 12H5l7-12zm-1 9v2h2v-2h-2zm0-6v4h2V9h-2z"/>
        </svg>
        <p>
          <strong>{{ t('home.disclaimer.title') }}</strong> {{ t('home.disclaimer.text') }}
        </p>
      </div>
    </div>

    <!-- Diver Info Modal -->
    <DiverInfoModal
      :is-open="isDiverInfoModalOpen"
      @close="closeDiverInfoModal"
      @save="handleDiverInfoSave"
    />
  </div>
</template>

<style scoped>
.home-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(to bottom, #001f3f 0%, #003d7a 50%, #005f9e 100%);
}

/* Header Actions Container */
.header-actions-container {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.help-button,
.diver-info-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.help-button:hover,
.diver-info-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

/* Fond marin animé */
.ocean-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Vagues */
.wave {
  position: absolute;
  width: 200%;
  height: 100px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: wave-animation 15s ease-in-out infinite;
}

.wave1 {
  top: 10%;
  left: -50%;
  animation-delay: 0s;
}

.wave2 {
  top: 30%;
  left: -50%;
  animation-delay: 2s;
  opacity: 0.7;
}

.wave3 {
  top: 50%;
  left: -50%;
  animation-delay: 4s;
  opacity: 0.5;
}

@keyframes wave-animation {
  0%, 100% {
    transform: translateX(0) translateY(0);
  }
  50% {
    transform: translateX(25%) translateY(-20px);
  }
}

/* Poissons */
.fish {
  position: absolute;
  font-size: 2rem;
  animation: swim 20s linear infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.fish1 {
  top: 15%;
  animation-duration: 25s;
  animation-delay: 0s;
}

.fish2 {
  top: 35%;
  animation-duration: 30s;
  animation-delay: 3s;
}

.fish3 {
  top: 55%;
  animation-duration: 22s;
  animation-delay: 6s;
}

.fish4 {
  top: 25%;
  font-size: 3rem;
  animation-duration: 35s;
  animation-delay: 2s;
}

.fish5 {
  top: 65%;
  animation-duration: 28s;
  animation-delay: 8s;
}

.fish6 {
  top: 45%;
  animation-duration: 26s;
  animation-delay: 5s;
}

@keyframes swim {
  0% {
    left: -10%;
    transform: scaleX(1);
  }
  49% {
    transform: scaleX(1);
  }
  50% {
    left: 110%;
    transform: scaleX(-1);
  }
  99% {
    transform: scaleX(-1);
  }
  100% {
    left: -10%;
    transform: scaleX(1);
  }
}

/* Bulles */
.bubble {
  position: absolute;
  bottom: -50px;
  width: 20px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: rise 10s ease-in infinite;
}

.bubble1 {
  left: 10%;
  animation-duration: 8s;
  animation-delay: 0s;
}

.bubble2 {
  left: 25%;
  width: 15px;
  height: 15px;
  animation-duration: 10s;
  animation-delay: 2s;
}

.bubble3 {
  left: 45%;
  width: 25px;
  height: 25px;
  animation-duration: 12s;
  animation-delay: 4s;
}

.bubble4 {
  left: 60%;
  animation-duration: 9s;
  animation-delay: 1s;
}

.bubble5 {
  left: 75%;
  width: 18px;
  height: 18px;
  animation-duration: 11s;
  animation-delay: 3s;
}

.bubble6 {
  left: 90%;
  width: 22px;
  height: 22px;
  animation-duration: 13s;
  animation-delay: 5s;
}

@keyframes rise {
  0% {
    bottom: -50px;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    bottom: 110%;
    opacity: 0;
  }
}

/* Algues */
.seaweed {
  position: absolute;
  bottom: 0;
  width: 40px;
  height: 200px;
  background: linear-gradient(to top, #1a5f3a, #2d8659);
  border-radius: 20px 20px 0 0;
  transform-origin: bottom center;
  animation: sway 4s ease-in-out infinite;
}

.seaweed1 {
  left: 15%;
  animation-delay: 0s;
}

.seaweed2 {
  left: 50%;
  height: 250px;
  animation-delay: 1s;
}

.seaweed3 {
  left: 80%;
  height: 180px;
  animation-delay: 2s;
}

@keyframes sway {
  0%, 100% {
    transform: rotate(-5deg);
  }
  50% {
    transform: rotate(5deg);
  }
}

/* Contenu principal */
.content-overlay {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.hero-section {
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 4rem 3rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  backdrop-filter: blur(10px);
}

.hero-icon {
  font-size: 5rem;
  margin-bottom: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: #001f3f;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #525252;
  margin-bottom: 2.5rem;
  line-height: 1.5;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #0f62fe 0%, #0043ce 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(15, 98, 254, 0.3);
}

.cta-button.secondary {
  background: linear-gradient(135deg, #24a148 0%, #198038 100%);
  box-shadow: 0 4px 12px rgba(36, 161, 72, 0.3);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(15, 98, 254, 0.4);
  background: linear-gradient(135deg, #0043ce 0%, #002d9c 100%);
}

.cta-button.secondary:hover {
  box-shadow: 0 6px 20px rgba(36, 161, 72, 0.4);
  background: linear-gradient(135deg, #198038 0%, #0e6027 100%);
}

.cta-button:active {
  transform: translateY(0);
}

.button-icon {
  transition: transform 0.3s ease;
}

.cta-button:hover .button-icon {
  transform: translateX(4px);
}

.features {
  display: flex;
  gap: 2rem;
  margin-top: 3rem;
  justify-content: center;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.feature-icon {
  font-size: 2rem;
}

.feature-text {
  font-size: 0.875rem;
  color: #525252;
  font-weight: 500;
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  max-width: 600px;
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(241, 194, 27, 0.15);
  border: 2px solid rgba(241, 194, 27, 0.5);
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.disclaimer-icon {
  color: #f1c21b;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.disclaimer p {
  font-size: 0.875rem;
  color: #ffffff;
  line-height: 1.5;
  margin: 0;
}

.disclaimer strong {
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .header-actions-container {
    top: 1rem;
    right: 1rem;
  }
  
  .hero-section {
    padding: 3rem 2rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .features {
    gap: 1rem;
  }
  
  .fish {
    font-size: 1.5rem;
  }
  
  .fish4 {
    font-size: 2rem;
  }
}
</style>