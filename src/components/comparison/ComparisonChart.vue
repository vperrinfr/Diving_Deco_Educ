<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ComparisonResult } from '../../types/decoModels';
import { formatModelName } from '../../types/decoModels';

const { t } = useI18n();

const props = defineProps<{
  result: ComparisonResult | null;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// Chart dimensions
const width = 800;
const height = 400;
const padding = { top: 40, right: 150, bottom: 60, left: 60 };

// Computed
const hasResult = computed(() => props.result !== null);

const chartData = computed(() => {
  if (!props.result) return null;

  const profiles = props.result.profiles.map(profile => {
    const points: { x: number; y: number }[] = [];
    let time = 0;

    // Add surface start point
    points.push({ x: 0, y: 0 });

    // Add descent (simplified - assume 20m/min)
    const params = profile.profile.parameters as any;
    const maxDepth = profile.profile.maxDepth;
    const descentTime = maxDepth / 20;
    points.push({ x: descentTime, y: maxDepth });
    time = descentTime;

    // Add bottom time
    const bottomTime = params.bottomTime || 0;
    points.push({ x: time + bottomTime, y: maxDepth });
    time += bottomTime;

    // Add ascent with stops
    const stops = profile.profile.decompressionStops;
    let currentDepth = maxDepth;

    for (const stop of stops) {
      // Ascent to stop depth
      const ascentTime = (currentDepth - stop.depth) / 10; // 10m/min ascent
      time += ascentTime;
      points.push({ x: time, y: stop.depth });

      // Stay at stop
      time += stop.duration;
      points.push({ x: time, y: stop.depth });

      currentDepth = stop.depth;
    }

    // Final ascent to surface
    if (currentDepth > 0) {
      const finalAscentTime = currentDepth / 10;
      time += finalAscentTime;
      points.push({ x: time, y: 0 });
    }

    return {
      model: profile.model,
      name: profile.characteristics.name,
      color: profile.characteristics.color,
      points
    };
  });

  // Find max time and depth for scaling
  const maxTime = Math.max(...profiles.flatMap(p => p.points.map(pt => pt.x)));
  const maxDepth = Math.max(...profiles.flatMap(p => p.points.map(pt => pt.y)));

  return { profiles, maxTime, maxDepth };
});

// Methods
const drawChart = () => {
  if (!canvas.value || !chartData.value) return;

  const context = canvas.value.getContext('2d');
  if (!context) return;

  ctx.value = context;

  // Clear canvas
  context.clearRect(0, 0, width, height);

  // Set canvas size
  canvas.value.width = width;
  canvas.value.height = height;

  const { profiles, maxTime, maxDepth } = chartData.value;

  // Calculate scales
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const scaleX = (time: number) => padding.left + (time / maxTime) * chartWidth;
  const scaleY = (depth: number) => padding.top + (depth / maxDepth) * chartHeight;

  // Draw grid
  drawGrid(context, maxTime, maxDepth, scaleX, scaleY, chartWidth, chartHeight);

  // Draw axes
  drawAxes(context, maxTime, maxDepth, scaleX, scaleY, chartWidth, chartHeight);

  // Draw profiles
  profiles.forEach(profile => {
    drawProfile(context, profile, scaleX, scaleY);
  });

  // Draw legend
  drawLegend(context, profiles);
};

const drawGrid = (
  context: CanvasRenderingContext2D,
  maxTime: number,
  maxDepth: number,
  scaleX: (t: number) => number,
  scaleY: (d: number) => number,
  chartWidth: number,
  chartHeight: number
) => {
  context.strokeStyle = '#e0e0e0';
  context.lineWidth = 1;

  // Vertical grid lines (time)
  const timeStep = Math.ceil(maxTime / 10);
  for (let t = 0; t <= maxTime; t += timeStep) {
    context.beginPath();
    context.moveTo(scaleX(t), padding.top);
    context.lineTo(scaleX(t), padding.top + chartHeight);
    context.stroke();
  }

  // Horizontal grid lines (depth)
  const depthStep = Math.ceil(maxDepth / 10);
  for (let d = 0; d <= maxDepth; d += depthStep) {
    context.beginPath();
    context.moveTo(padding.left, scaleY(d));
    context.lineTo(padding.left + chartWidth, scaleY(d));
    context.stroke();
  }
};

const drawAxes = (
  context: CanvasRenderingContext2D,
  maxTime: number,
  maxDepth: number,
  scaleX: (t: number) => number,
  scaleY: (d: number) => number,
  chartWidth: number,
  chartHeight: number
) => {
  context.strokeStyle = '#161616';
  context.lineWidth = 2;
  context.font = '12px sans-serif';
  context.fillStyle = '#161616';

  // X-axis (time)
  context.beginPath();
  context.moveTo(padding.left, padding.top + chartHeight);
  context.lineTo(padding.left + chartWidth, padding.top + chartHeight);
  context.stroke();

  // X-axis labels
  const timeStep = Math.ceil(maxTime / 10);
  for (let t = 0; t <= maxTime; t += timeStep) {
    const x = scaleX(t);
    context.fillText(`${Math.round(t)}`, x - 10, padding.top + chartHeight + 20);
  }

  // X-axis title
  context.font = '14px sans-serif';
  context.fillText(
    t('comparison.chart.time'),
    padding.left + chartWidth / 2 - 30,
    height - 10
  );

  // Y-axis (depth)
  context.font = '12px sans-serif';
  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.stroke();

  // Y-axis labels
  const depthStep = Math.ceil(maxDepth / 10);
  for (let d = 0; d <= maxDepth; d += depthStep) {
    const y = scaleY(d);
    context.fillText(`${Math.round(d)}`, padding.left - 30, y + 5);
  }

  // Y-axis title
  context.save();
  context.font = '14px sans-serif';
  context.translate(15, padding.top + chartHeight / 2);
  context.rotate(-Math.PI / 2);
  context.fillText(t('comparison.chart.depth'), -40, 0);
  context.restore();
};

const drawProfile = (
  context: CanvasRenderingContext2D,
  profile: any,
  scaleX: (t: number) => number,
  scaleY: (d: number) => number
) => {
  context.strokeStyle = profile.color;
  context.lineWidth = 3;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  context.beginPath();
  profile.points.forEach((point: any, index: number) => {
    const x = scaleX(point.x);
    const y = scaleY(point.y);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();
};

const drawLegend = (context: CanvasRenderingContext2D, profiles: any[]) => {
  const legendX = width - padding.right + 10;
  let legendY = padding.top;

  context.font = '12px sans-serif';

  profiles.forEach((profile, index) => {
    const y = legendY + index * 25;

    // Color indicator
    context.fillStyle = profile.color;
    context.fillRect(legendX, y - 8, 20, 3);

    // Model name
    context.fillStyle = '#161616';
    context.fillText(profile.name, legendX + 25, y);
  });
};

// Lifecycle
onMounted(() => {
  drawChart();
});

watch(() => props.result, () => {
  drawChart();
}, { deep: true });
</script>

<template>
  <div class="comparison-chart">
    <div v-if="hasResult" class="chart-container">
      <h3 class="chart-title">{{ t('comparison.chart.title') }}</h3>
      <canvas ref="canvas" class="chart-canvas"></canvas>
    </div>
    <div v-else class="no-chart">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor">
        <path d="M8 48 L16 32 L24 40 L32 24 L40 36 L48 20 L56 28" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="4" y="4" width="56" height="56" rx="4" stroke-width="2"/>
      </svg>
      <p class="no-chart__text">{{ t('comparison.selectAtLeastTwo') }}</p>
    </div>
  </div>
</template>

<style scoped>
.comparison-chart {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 1.5rem;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #161616;
  margin: 0;
}

.chart-canvas {
  width: 100%;
  height: auto;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.no-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #8d8d8d;
}

.no-chart svg {
  margin-bottom: 1rem;
}

.no-chart__text {
  font-size: 1rem;
  margin: 0;
}
</style>

<!-- Made with Bob -->