<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { TissueCompartment } from '../../types/repetitiveDive';
import { calculateDesaturationCurve } from '../../services/repetitiveDiveService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps<{
  tissues: TissueCompartment[];
  duration?: number; // minutes
}>();

const { t } = useI18n();

const chartDuration = ref(props.duration || 360); // 6 hours default
const desaturationData = ref(calculateDesaturationCurve(props.tissues, chartDuration.value));

const chartData = computed(() => {
  const labels = desaturationData.value.map(point => point.time);
  const nitrogenLoadData = desaturationData.value.map(point => point.nitrogenLoad * 100);
  
  return {
    labels,
    datasets: [
      {
        label: t('repetitiveDive.desaturation.load'),
        data: nitrogenLoadData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        borderWidth: 3
      }
    ]
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        color: '#e5e7eb',
        font: {
          size: 12
        }
      }
    },
    title: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#e5e7eb',
      bodyColor: '#e5e7eb',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        title: (context: any) => {
          const index = context[0].dataIndex;
          const point = desaturationData.value[index];
          return `${t('repetitiveDive.desaturation.time')}: ${point?.time} min`;
        },
        label: (context: any) => {
          const index = context.dataIndex;
          const point = desaturationData.value[index];
          return [
            `${t('repetitiveDive.desaturation.load')}: ${context.parsed.y.toFixed(1)}%`,
            `${t('repetitiveDive.desaturation.pressureGroup')}: ${point?.pressureGroup}`,
            `${t('repetitiveDive.desaturation.controllingTissue')}: ${point?.controllingTissue}`
          ];
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: t('repetitiveDive.desaturation.time'),
        color: '#9ca3af',
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
      ticks: {
        color: '#9ca3af',
        callback: function(value: any) {
          const minutes = this.getLabelForValue(value);
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          if (hours > 0) {
            return `${hours}h${mins > 0 ? mins : ''}`;
          }
          return `${minutes}min`;
        }
      },
      grid: {
        color: 'rgba(75, 85, 99, 0.3)'
      }
    },
    y: {
      title: {
        display: true,
        text: t('repetitiveDive.desaturation.load'),
        color: '#9ca3af',
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
      min: 0,
      max: 100,
      ticks: {
        color: '#9ca3af',
        callback: function(value: any) {
          return value + '%';
        }
      },
      grid: {
        color: 'rgba(75, 85, 99, 0.3)'
      }
    }
  }
}));

const updateDuration = () => {
  desaturationData.value = calculateDesaturationCurve(props.tissues, chartDuration.value);
};

const presetDurations = [
  { label: '1h', value: 60 },
  { label: '3h', value: 180 },
  { label: '6h', value: 360 },
  { label: '12h', value: 720 },
  { label: '24h', value: 1440 }
];

const setPresetDuration = (minutes: number) => {
  chartDuration.value = minutes;
  updateDuration();
};
</script>

<template>
  <div class="desaturation-chart bg-gray-800 rounded-lg p-6">
    <div class="mb-4">
      <h3 class="text-2xl font-bold text-white mb-2">
        {{ t('repetitiveDive.desaturation.title') }}
      </h3>
      <p class="text-gray-400 text-sm">
        {{ t('repetitiveDive.desaturation.description') }}
      </p>
    </div>

    <!-- Duration Controls -->
    <div class="mb-6">
      <div class="flex items-center gap-4 mb-3">
        <label class="text-sm font-medium text-gray-300">
          Durée d'affichage:
        </label>
        <div class="flex gap-2">
          <button
            v-for="preset in presetDurations"
            :key="preset.value"
            @click="setPresetDuration(preset.value)"
            class="px-3 py-1 rounded text-sm font-medium transition-colors"
            :class="chartDuration === preset.value 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <input
          v-model.number="chartDuration"
          type="range"
          min="60"
          max="1440"
          step="30"
          @change="updateDuration"
          class="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <span class="text-white font-medium min-w-[80px]">
          {{ Math.floor(chartDuration / 60) }}h {{ chartDuration % 60 }}min
        </span>
      </div>
    </div>

    <!-- Chart -->
    <div class="chart-container bg-gray-900 rounded-lg p-4" style="height: 400px;">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Legend -->
    <div class="mt-4 grid grid-cols-3 gap-3">
      <div class="p-3 bg-green-900 bg-opacity-30 border border-green-700 rounded-lg">
        <div class="text-xs text-green-300 mb-1">Sûr</div>
        <div class="text-sm font-semibold text-green-400">< 70%</div>
      </div>
      <div class="p-3 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg">
        <div class="text-xs text-yellow-300 mb-1">Attention</div>
        <div class="text-sm font-semibold text-yellow-400">70-85%</div>
      </div>
      <div class="p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
        <div class="text-xs text-red-300 mb-1">Danger</div>
        <div class="text-sm font-semibold text-red-400">> 85%</div>
      </div>
    </div>

    <!-- Current Status -->
    <div class="mt-4 p-4 bg-gray-700 rounded-lg">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <div class="text-sm text-gray-400 mb-1">Charge initiale</div>
          <div class="text-2xl font-bold text-white">
            {{ (desaturationData[0]?.nitrogenLoad * 100).toFixed(1) }}%
          </div>
        </div>
        <div>
          <div class="text-sm text-gray-400 mb-1">Après {{ Math.floor(chartDuration / 60) }}h</div>
          <div class="text-2xl font-bold text-white">
            {{ (desaturationData[desaturationData.length - 1]?.nitrogenLoad * 100).toFixed(1) }}%
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 2px solid white;
}

.chart-container {
  position: relative;
}
</style>

<!-- Made with Bob -->