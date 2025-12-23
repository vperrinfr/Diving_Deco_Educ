<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '../components/common/LanguageSwitcher.vue';

const router = useRouter();
const { t } = useI18n();

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="guide-page">
    <!-- Header -->
    <header class="cds--header">
      <div class="cds--header__container">
        <div class="cds--header__content">
          <button class="back-button" @click="goBack" :title="t('guide.backButton')">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 3L1 10l8 7v-5h10V8H9V3z"/>
            </svg>
          </button>
          <div class="cds--header__name">
            <span class="cds--header__name-prefix">❓</span>
            <span class="cds--header__name-title">{{ t('guide.title') }}</span>
          </div>
        </div>
        <div class="cds--header__actions">
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="cds--content">
      <div class="cds--grid cds--grid--full-width">
        <div class="cds--row">
          <div class="cds--col-lg-12 cds--col-md-8 cds--col-sm-4">
            
            <!-- Introduction -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.intro.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.intro.description') }}</p>
            </div>

            <!-- Getting Started -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.gettingStarted.title') }}</h2>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h3 class="cds--type-heading-02">{{ t('guide.gettingStarted.step1.title') }}</h3>
                    <p class="cds--type-body-long-01">{{ t('guide.gettingStarted.step1.description') }}</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h3 class="cds--type-heading-02">{{ t('guide.gettingStarted.step2.title') }}</h3>
                    <p class="cds--type-body-long-01">{{ t('guide.gettingStarted.step2.description') }}</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h3 class="cds--type-heading-02">{{ t('guide.gettingStarted.step3.title') }}</h3>
                    <p class="cds--type-body-long-01">{{ t('guide.gettingStarted.step3.description') }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Simple Mode -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.simpleMode.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.simpleMode.description') }}</p>
              <ul class="feature-list">
                <li><strong>{{ t('guide.simpleMode.depth.title') }}:</strong> {{ t('guide.simpleMode.depth.description') }}</li>
                <li><strong>{{ t('guide.simpleMode.bottomTime.title') }}:</strong> {{ t('guide.simpleMode.bottomTime.description') }}</li>
                <li><strong>{{ t('guide.simpleMode.gasMix.title') }}:</strong> {{ t('guide.simpleMode.gasMix.description') }}</li>
              </ul>
            </div>

            <!-- Advanced Mode -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.advancedMode.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.advancedMode.description') }}</p>
              <ul class="feature-list">
                <li><strong>{{ t('guide.advancedMode.multiLevel.title') }}:</strong> {{ t('guide.advancedMode.multiLevel.description') }}</li>
                <li><strong>{{ t('guide.advancedMode.multiGas.title') }}:</strong> {{ t('guide.advancedMode.multiGas.description') }}</li>
                <li><strong>{{ t('guide.advancedMode.rates.title') }}:</strong> {{ t('guide.advancedMode.rates.description') }}</li>
              </ul>
            </div>

            <!-- Gradient Factors -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.gradientFactors.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.gradientFactors.description') }}</p>
              <div class="gf-presets">
                <div class="gf-preset gf-preset--conservative">
                  <h4 class="cds--type-heading-02">{{ t('guide.gradientFactors.conservative.title') }} (30/70)</h4>
                  <p class="cds--type-body-compact-01">{{ t('guide.gradientFactors.conservative.description') }}</p>
                </div>
                <div class="gf-preset gf-preset--moderate">
                  <h4 class="cds--type-heading-02">{{ t('guide.gradientFactors.moderate.title') }} (40/85)</h4>
                  <p class="cds--type-body-compact-01">{{ t('guide.gradientFactors.moderate.description') }}</p>
                </div>
                <div class="gf-preset gf-preset--aggressive">
                  <h4 class="cds--type-heading-02">{{ t('guide.gradientFactors.aggressive.title') }} (50/95)</h4>
                  <p class="cds--type-body-compact-01">{{ t('guide.gradientFactors.aggressive.description') }}</p>
                </div>
              </div>
            </div>

            <!-- Educational Section: Diving Concepts -->
            <div class="cds--tile guide-section education-section">
              <h2 class="cds--type-heading-04">{{ t('guide.education.title') }}</h2>
              <p class="cds--type-body-long-01 section-subtitle">{{ t('guide.education.subtitle') }}</p>

              <!-- Gradient Factors -->
              <div class="education-subsection">
                <h3 class="cds--type-heading-03">{{ t('guide.education.gradientFactorsSection.title') }}</h3>
                <p class="cds--type-body-long-01">{{ t('guide.education.gradientFactorsSection.intro') }}</p>
                
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.gradientFactorsSection.whatAreGF.title') }}</h4>
                  <p class="cds--type-body-long-01" v-html="t('guide.education.gradientFactorsSection.whatAreGF.description')"></p>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.gradientFactorsSection.howTheyWork.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.gradientFactorsSection.howTheyWork.gfLow')"></li>
                    <li v-html="t('guide.education.gradientFactorsSection.howTheyWork.gfHigh')"></li>
                    <li v-html="t('guide.education.gradientFactorsSection.howTheyWork.gradient')"></li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.gradientFactorsSection.examples.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.gradientFactorsSection.examples.conservative')"></li>
                    <li v-html="t('guide.education.gradientFactorsSection.examples.moderate')"></li>
                    <li v-html="t('guide.education.gradientFactorsSection.examples.aggressive')"></li>
                  </ul>
                </div>

                <div class="concept-card impact-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.gradientFactorsSection.impact.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.gradientFactorsSection.impact.decoTime')"></li>
                    <li v-html="t('guide.education.gradientFactorsSection.impact.risk')"></li>
                    <li v-html="t('guide.education.gradientFactorsSection.impact.recommendation')"></li>
                  </ul>
                </div>
              </div>

              <!-- NDL Section -->
              <div class="education-subsection">
                <h3 class="cds--type-heading-03">{{ t('guide.education.ndlSection.title') }}</h3>
                
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.ndlSection.definition.title') }}</h4>
                  <p class="cds--type-body-long-01">{{ t('guide.education.ndlSection.definition.description') }}</p>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.ndlSection.howItWorks.title') }}</h4>
                  <ul class="concept-list">
                    <li>{{ t('guide.education.ndlSection.howItWorks.saturation') }}</li>
                    <li>{{ t('guide.education.ndlSection.howItWorks.limit') }}</li>
                    <li>{{ t('guide.education.ndlSection.howItWorks.calculation') }}</li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.ndlSection.factors.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.ndlSection.factors.depth')"></li>
                    <li v-html="t('guide.education.ndlSection.factors.gas')"></li>
                    <li v-html="t('guide.education.ndlSection.factors.altitude')"></li>
                    <li v-html="t('guide.education.ndlSection.factors.gf')"></li>
                  </ul>
                </div>

                <div class="concept-card practical-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.ndlSection.practical.title') }}</h4>
                  <ul class="concept-list">
                    <li>{{ t('guide.education.ndlSection.practical.planning') }}</li>
                    <li>{{ t('guide.education.ndlSection.practical.monitoring') }}</li>
                    <li>{{ t('guide.education.ndlSection.practical.safety') }}</li>
                    <li>{{ t('guide.education.ndlSection.practical.multilevel') }}</li>
                  </ul>
                </div>
              </div>

              <!-- Decompression Stops Section -->
              <div class="education-subsection">
                <h3 class="cds--type-heading-03">{{ t('guide.education.decoStopsSection.title') }}</h3>
                
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.decoStopsSection.introduction.title') }}</h4>
                  <p class="cds--type-body-long-01">{{ t('guide.education.decoStopsSection.introduction.description') }}</p>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.decoStopsSection.purpose.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.decoStopsSection.purpose.elimination')"></li>
                    <li v-html="t('guide.education.decoStopsSection.purpose.prevention')"></li>
                    <li v-html="t('guide.education.decoStopsSection.purpose.equilibrium')"></li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.decoStopsSection.types.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.decoStopsSection.types.mandatory')"></li>
                    <li v-html="t('guide.education.decoStopsSection.types.safety')"></li>
                    <li v-html="t('guide.education.decoStopsSection.types.deep')"></li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.decoStopsSection.schedule.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.decoStopsSection.schedule.depth')"></li>
                    <li v-html="t('guide.education.decoStopsSection.schedule.duration')"></li>
                    <li v-html="t('guide.education.decoStopsSection.schedule.runtime')"></li>
                    <li v-html="t('guide.education.decoStopsSection.schedule.gas')"></li>
                  </ul>
                </div>

                <div class="concept-card example-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.decoStopsSection.example.title') }}</h4>
                  <p class="cds--type-body-long-01 example-scenario">{{ t('guide.education.decoStopsSection.example.scenario') }}</p>
                  <ol class="example-steps">
                    <li>{{ t('guide.education.decoStopsSection.example.step1') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.example.step2') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.example.step3') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.example.step4') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.example.step5') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.example.step6') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.example.step7') }}</li>
                  </ol>
                  <p class="cds--type-body-long-01 example-total"><strong>{{ t('guide.education.decoStopsSection.example.total') }}</strong></p>
                </div>

                <div class="concept-card safety-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.decoStopsSection.safety.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.decoStopsSection.safety.never')"></li>
                    <li>{{ t('guide.education.decoStopsSection.safety.ascent') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.safety.computer') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.safety.backup') }}</li>
                    <li>{{ t('guide.education.decoStopsSection.safety.conservative') }}</li>
                  </ul>
                </div>
              </div>

              <!-- Profile Reading Section -->
              <div class="education-subsection">
                <h3 class="cds--type-heading-03">{{ t('guide.education.profileReadingSection.title') }}</h3>
                
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.profileReadingSection.introduction.title') }}</h4>
                  <p class="cds--type-body-long-01">{{ t('guide.education.profileReadingSection.introduction.description') }}</p>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.profileReadingSection.axes.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.profileReadingSection.axes.horizontal')"></li>
                    <li v-html="t('guide.education.profileReadingSection.axes.vertical')"></li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.profileReadingSection.phases.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.profileReadingSection.phases.descent')"></li>
                    <li v-html="t('guide.education.profileReadingSection.phases.bottom')"></li>
                    <li v-html="t('guide.education.profileReadingSection.phases.ascent')"></li>
                    <li v-html="t('guide.education.profileReadingSection.phases.stops')"></li>
                    <li v-html="t('guide.education.profileReadingSection.phases.surface')"></li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.profileReadingSection.colors.title') }}</h4>
                  <ul class="concept-list color-list">
                    <li v-html="t('guide.education.profileReadingSection.colors.descent')"></li>
                    <li v-html="t('guide.education.profileReadingSection.colors.bottom')"></li>
                    <li v-html="t('guide.education.profileReadingSection.colors.deco')"></li>
                    <li v-html="t('guide.education.profileReadingSection.colors.safety')"></li>
                    <li v-html="t('guide.education.profileReadingSection.colors.danger')"></li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.profileReadingSection.information.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.profileReadingSection.information.maxDepth')"></li>
                    <li v-html="t('guide.education.profileReadingSection.information.totalTime')"></li>
                    <li v-html="t('guide.education.profileReadingSection.information.decoStops')"></li>
                    <li v-html="t('guide.education.profileReadingSection.information.ndl')"></li>
                    <li v-html="t('guide.education.profileReadingSection.information.gasSwitches')"></li>
                  </ul>
                </div>

                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.profileReadingSection.multiLevel.title') }}</h4>
                  <p class="cds--type-body-long-01">{{ t('guide.education.profileReadingSection.multiLevel.description') }}</p>
                  <ul class="concept-list">
                    <li>{{ t('guide.education.profileReadingSection.multiLevel.advantage') }}</li>
                    <li>{{ t('guide.education.profileReadingSection.multiLevel.calculation') }}</li>
                    <li>{{ t('guide.education.profileReadingSection.multiLevel.planning') }}</li>
                  </ul>
                </div>

                <div class="concept-card practical-card">
                  <h4 class="cds--type-heading-02">{{ t('guide.education.profileReadingSection.practical.title') }}</h4>
                  <ul class="concept-list">
                    <li v-html="t('guide.education.profileReadingSection.practical.before')"></li>
                    <li v-html="t('guide.education.profileReadingSection.practical.during')"></li>
                    <li v-html="t('guide.education.profileReadingSection.practical.after')"></li>
                    <li v-html="t('guide.education.profileReadingSection.practical.compare')"></li>
                  </ul>
                </div>
              </div>

              <!-- Air Consumption Education Section -->
              <div class="education-subsection">
                <h3 class="cds--type-heading-03">{{ t('airConsumption.education.title') }}</h3>
                
                <!-- SAC Rate -->
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('airConsumption.education.sacRate.title') }}</h4>
                  <p class="cds--type-body-long-01">{{ t('airConsumption.education.sacRate.definition') }}</p>
                  <p class="cds--type-body-long-01">{{ t('airConsumption.education.sacRate.calculation') }}</p>
                  
                  <div style="margin-top: 1rem;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.sacRate.factors.title') }}</h5>
                    <ul class="concept-list">
                      <li v-html="t('airConsumption.education.sacRate.factors.experience')"></li>
                      <li v-html="t('airConsumption.education.sacRate.factors.effort')"></li>
                      <li v-html="t('airConsumption.education.sacRate.factors.stress')"></li>
                      <li v-html="t('airConsumption.education.sacRate.factors.temperature')"></li>
                      <li v-html="t('airConsumption.education.sacRate.factors.equipment')"></li>
                    </ul>
                  </div>

                  <div class="typical-values" style="margin-top: 1rem; padding: 1rem; background: #f4f4f4; border-radius: 4px;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.sacRate.typical.title') }}</h5>
                    <ul class="concept-list" style="margin-top: 0.5rem;">
                      <li>{{ t('airConsumption.education.sacRate.typical.beginner') }}</li>
                      <li>{{ t('airConsumption.education.sacRate.typical.intermediate') }}</li>
                      <li>{{ t('airConsumption.education.sacRate.typical.advanced') }}</li>
                      <li>{{ t('airConsumption.education.sacRate.typical.professional') }}</li>
                    </ul>
                  </div>
                </div>

                <!-- Cylinder Sizes -->
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('airConsumption.education.cylinderSize.title') }}</h4>
                  <p class="cds--type-body-long-01">{{ t('airConsumption.education.cylinderSize.description') }}</p>
                  
                  <div style="margin-top: 1rem;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.cylinderSize.common.title') }}</h5>
                    <ul class="concept-list">
                      <li v-html="t('airConsumption.education.cylinderSize.common.single12')"></li>
                      <li v-html="t('airConsumption.education.cylinderSize.common.single15')"></li>
                      <li v-html="t('airConsumption.education.cylinderSize.common.double12')"></li>
                      <li v-html="t('airConsumption.education.cylinderSize.common.stage')"></li>
                      <li v-html="t('airConsumption.education.cylinderSize.common.pony')"></li>
                    </ul>
                  </div>

                  <div class="example-card" style="margin-top: 1rem; padding: 1rem; background: #e3f2fd; border-radius: 4px;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.cylinderSize.calculation.title') }}</h5>
                    <p class="cds--type-body-long-01"><strong>{{ t('airConsumption.education.cylinderSize.calculation.formula') }}</strong></p>
                    <p class="cds--type-body-long-01">{{ t('airConsumption.education.cylinderSize.calculation.example') }}</p>
                  </div>
                </div>

                <!-- Air Planning -->
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('airConsumption.education.planning.title') }}</h4>
                  
                  <div style="margin-top: 1rem;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.planning.ruleOfThirds.title') }}</h5>
                    <p class="cds--type-body-long-01">{{ t('airConsumption.education.planning.ruleOfThirds.description') }}</p>
                    <p class="cds--type-body-long-01"><em>{{ t('airConsumption.education.planning.ruleOfThirds.use') }}</em></p>
                  </div>

                  <div style="margin-top: 1rem;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.planning.turnPressure.title') }}</h5>
                    <p class="cds--type-body-long-01">{{ t('airConsumption.education.planning.turnPressure.description') }}</p>
                    <p class="cds--type-body-long-01">{{ t('airConsumption.education.planning.turnPressure.calculation') }}</p>
                  </div>

                  <div class="safety-card" style="margin-top: 1rem; padding: 1rem; background: #ffebee; border-radius: 4px; border-left: 4px solid #da1e28;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.planning.contingency.title') }}</h5>
                    <ul class="concept-list">
                      <li>{{ t('airConsumption.education.planning.contingency.buddy') }}</li>
                      <li>{{ t('airConsumption.education.planning.contingency.stress') }}</li>
                      <li>{{ t('airConsumption.education.planning.contingency.deco') }}</li>
                      <li>{{ t('airConsumption.education.planning.contingency.reserve') }}</li>
                    </ul>
                  </div>
                </div>

                <!-- Multi-Cylinder -->
                <div class="concept-card">
                  <h4 class="cds--type-heading-02">{{ t('airConsumption.education.multiCylinder.title') }}</h4>
                  <p class="cds--type-body-long-01">{{ t('airConsumption.education.multiCylinder.description') }}</p>
                  
                  <div style="margin-top: 1rem;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.multiCylinder.types.title') }}</h5>
                    <ul class="concept-list">
                      <li v-html="t('airConsumption.education.multiCylinder.types.sidemount')"></li>
                      <li v-html="t('airConsumption.education.multiCylinder.types.backmount')"></li>
                      <li v-html="t('airConsumption.education.multiCylinder.types.stage')"></li>
                      <li v-html="t('airConsumption.education.multiCylinder.types.bailout')"></li>
                    </ul>
                  </div>

                  <div class="practical-card" style="margin-top: 1rem; padding: 1rem; background: #e8f5e9; border-radius: 4px; border-left: 4px solid #24a148;">
                    <h5 class="cds--type-heading-02">{{ t('airConsumption.education.multiCylinder.advantages.title') }}</h5>
                    <ul class="concept-list">
                      <li>{{ t('airConsumption.education.multiCylinder.advantages.redundancy') }}</li>
                      <li>{{ t('airConsumption.education.multiCylinder.advantages.capacity') }}</li>
                      <li>{{ t('airConsumption.education.multiCylinder.advantages.optimization') }}</li>
                      <li>{{ t('airConsumption.education.multiCylinder.advantages.safety') }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <!-- Understanding Results -->
            <div class="cds--tile guide-section">
              <h2 class="cds--type-heading-04">{{ t('guide.results.title') }}</h2>
              <p class="cds--type-body-long-01">{{ t('guide.results.description') }}</p>
              <ul class="feature-list">
                <li><strong>{{ t('guide.results.totalTime.title') }}:</strong> {{ t('guide.results.totalTime.description') }}</li>
                <li><strong>{{ t('guide.results.decoTime.title') }}:</strong> {{ t('guide.results.decoTime.description') }}</li>
                <li><strong>{{ t('guide.results.ndl.title') }}:</strong> {{ t('guide.results.ndl.description') }}</li>
                <li><strong>{{ t('guide.results.decoStops.title') }}:</strong> {{ t('guide.results.decoStops.description') }}</li>
              </ul>
            </div>

            <!-- Safety Warning -->
            <div class="cds--tile guide-section warning-section">
              <div class="warning-header">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 2L2 28h28L16 2zm0 5l10 18H6l10-18zm-2 13v2h4v-2h-4zm0-8v6h4v-6h-4z"/>
                </svg>
                <h2 class="cds--type-heading-04">{{ t('guide.safety.title') }}</h2>
              </div>
              <p class="cds--type-body-long-01">{{ t('guide.safety.description') }}</p>
              <ul class="warning-list">
                <li>{{ t('guide.safety.point1') }}</li>
                <li>{{ t('guide.safety.point2') }}</li>
                <li>{{ t('guide.safety.point3') }}</li>
                <li>{{ t('guide.safety.point4') }}</li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.guide-page {
  min-height: 100vh;
  background: #f4f4f4;
  font-family: 'IBM Plex Sans', sans-serif;
}

/* Header Styles */
.cds--header {
  background: #161616;
  color: #ffffff;
  padding: 1rem 0;
  border-bottom: 1px solid #393939;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.cds--header__container {
  max-width: 1584px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.cds--header__content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
}

.cds--header__actions {
  flex-shrink: 0;
  margin-left: auto;
}

.back-button {
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.back-button:hover {
  background: #393939;
}

.cds--header__name {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cds--header__name-prefix {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.cds--header__name-title {
  font-size: 1.5rem;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.2;
  white-space: nowrap;
}

/* Main Content */
.cds--content {
  padding: 2rem 0;
  max-width: 1584px;
  margin: 0 auto;
}

.cds--grid {
  padding: 0 2rem;
}

.cds--row {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -1rem;
}

.cds--col-lg-12 {
  padding: 0 1rem;
  flex: 0 0 100%;
  max-width: 100%;
}

/* Guide Sections */
.guide-section {
  padding: 2rem;
  margin-bottom: 1.5rem;
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

.cds--type-heading-04 {
  font-size: 1.75rem;
  font-weight: 400;
  line-height: 1.28572;
  color: #161616;
  margin-bottom: 1rem;
}

.cds--type-heading-02 {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.375;
  color: #161616;
  margin-bottom: 0.5rem;
}

.cds--type-body-long-01 {
  font-size: 0.875rem;
  line-height: 1.42857;
  color: #525252;
  margin-bottom: 1rem;
}

.cds--type-body-compact-01 {
  font-size: 0.875rem;
  line-height: 1.28572;
  color: #525252;
}

/* Step List */
.step-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.step-item {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.step-number {
  width: 3rem;
  height: 3rem;
  background: #0f62fe;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

/* Feature List */
.feature-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.feature-list li {
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.875rem;
  line-height: 1.42857;
  color: #525252;
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-list strong {
  color: #161616;
  font-weight: 600;
}

/* Gradient Factor Presets */
.gf-presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.gf-preset {
  padding: 1.5rem;
  border-radius: 4px;
  border-left: 4px solid;
}

.gf-preset--conservative {
  background: #defbe6;
  border-left-color: #24a148;
}

.gf-preset--moderate {
  background: #d0e2ff;
  border-left-color: #0f62fe;
}

.gf-preset--aggressive {
  background: #fcf4d6;
  border-left-color: #f1c21b;
}

/* Warning Section */
.warning-section {
  background: #fff1f1;
  border-left: 4px solid #da1e28;
}

.warning-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.warning-header svg {
  color: #da1e28;
  flex-shrink: 0;
}

.warning-list {
  list-style: disc;
  padding-left: 1.5rem;
  margin: 1rem 0;
}

.warning-list li {
  padding: 0.5rem 0;
  font-size: 0.875rem;
  line-height: 1.42857;
  color: #161616;
}

/* Educational Section Styles */
.education-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border-left: 4px solid #0f62fe;
}

.section-subtitle {
  font-style: italic;
  color: #525252;
  margin-bottom: 2rem;
}

.education-subsection {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 2px solid #e0e0e0;
}

.education-subsection:first-child {
  margin-top: 1.5rem;
  border-top: none;
  padding-top: 0;
}

.cds--type-heading-03 {
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
  color: #0f62fe;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cds--type-heading-03::before {
  content: '📚';
  font-size: 1.5rem;
}

.concept-card {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.concept-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.concept-card h4 {
  color: #161616;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.concept-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
}

.concept-list li {
  padding: 0.75rem 0 0.75rem 2rem;
  position: relative;
  line-height: 1.6;
  color: #525252;
}

.concept-list li::before {
  content: '▸';
  position: absolute;
  left: 0.5rem;
  color: #0f62fe;
  font-weight: bold;
  font-size: 1.2rem;
}

.concept-list li strong {
  color: #161616;
  font-weight: 600;
}

/* Special card types */
.impact-card {
  background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%);
  border-left: 4px solid #f1c21b;
}

.practical-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%);
  border-left: 4px solid #24a148;
}

.safety-card {
  background: linear-gradient(135deg, #ffebee 0%, #ffffff 100%);
  border-left: 4px solid #da1e28;
}

.example-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%);
  border-left: 4px solid #0f62fe;
}

.example-scenario {
  background: #f4f4f4;
  padding: 1rem;
  border-radius: 4px;
  margin: 1rem 0;
  font-weight: 500;
  color: #161616;
}

.example-steps {
  list-style: none;
  counter-reset: step-counter;
  padding: 0;
  margin: 1rem 0;
}

.example-steps li {
  counter-increment: step-counter;
  padding: 0.75rem 0 0.75rem 3rem;
  position: relative;
  line-height: 1.6;
  color: #525252;
  border-left: 2px solid #e0e0e0;
  margin-left: 1rem;
}

.example-steps li::before {
  content: counter(step-counter);
  position: absolute;
  left: -1.25rem;
  top: 0.5rem;
  background: #0f62fe;
  color: #ffffff;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.875rem;
}

.example-total {
  background: #0f62fe;
  color: #ffffff;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  text-align: center;
}

.color-list li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .cds--header__container,
  .cds--content {
    padding: 0 1rem;
  }
  
  .guide-section {
    padding: 1.5rem;
  }
  
  .step-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .gf-presets {
    grid-template-columns: 1fr;
  }
}
</style>