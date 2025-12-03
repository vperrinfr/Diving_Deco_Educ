<script setup lang="ts">
import { computed } from 'vue';
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
  Filler,
  type ChartOptions,
  type Plugin
} from 'chart.js';
import type { DiveProfile } from '../../types';
import { isMultiLevelDive } from '../../types';
import { formatGasMix } from '../../utils/gasMix';

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
  profile: DiveProfile | null;
}>();

// Plugin to draw gas switch markers
const gasSwitchPlugin: Plugin<'line'> = {
  id: 'gasSwitchMarkers',
  afterDatasetsDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const profile = props.profile;
    
    if (!chartArea || !profile || !profile.gasSwitches || profile.gasSwitches.length === 0) {
      return;
    }
    
    ctx.save();
    
    profile.gasSwitches.forEach((gasSwitch) => {
      // Find the time point for this gas switch
      const stop = profile.decompressionStops.find(s => s.depth === gasSwitch.depth);
      if (!stop) return;
      
      const x = scales.x.getPixelForValue(stop.runtime);
      const y = scales.y.getPixelForValue(-gasSwitch.depth);
      
      // Check if point is within chart area
      if (x < chartArea.left || x > chartArea.right || y < chartArea.top || y > chartArea.bottom) {
        return;
      }
      
      // Draw marker circle
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw gas switch icon (arrow)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⇄', x, y);
    });
    
    ctx.restore();
  }
};

const chartData = computed(() => {
  if (!props.profile) {
    return {
      labels: [],
      datasets: []
    };
  }

  const { parameters, decompressionStops } = props.profile;
  const timePoints: number[] = [0];
  const depthPoints: number[] = [0];
  const segmentColors: string[] = [];
  
  if (isMultiLevelDive(parameters)) {
    // Multi-level dive visualization
    let currentTime = 0;
    const colors = ['#0f62fe', '#8a3ffc', '#ff832b', '#24a148', '#da1e28'];
    
    // Process each segment
    if (props.profile.segments) {
      const bottomSegments = props.profile.segments.filter(s => s.segmentType === 'bottom');
      
      bottomSegments.forEach((segment, index) => {
        // Descent to segment depth
        const descentTime = segment.depth / parameters.descentRate;
        currentTime += descentTime;
        timePoints.push(currentTime);
        depthPoints.push(segment.depth);
        segmentColors.push(colors[index % colors.length]!);
        
        // Stay at segment depth
        currentTime += segment.duration;
        timePoints.push(currentTime);
        depthPoints.push(segment.depth);
        segmentColors.push(colors[index % colors.length]!);
      });
    }
    
    // Ascent and stops
    let currentDepth = depthPoints[depthPoints.length - 1] || 0;
    const ascentRate = parameters.ascentRate;
    
    if (decompressionStops.length > 0) {
      for (const stop of decompressionStops) {
        if (currentDepth !== stop.depth) {
          const ascentTime = (currentDepth - stop.depth) / ascentRate;
          currentTime += ascentTime;
          timePoints.push(currentTime);
          depthPoints.push(stop.depth);
          segmentColors.push('#6f6f6f');
        }
        
        currentTime += stop.duration;
        timePoints.push(currentTime);
        depthPoints.push(stop.depth);
        segmentColors.push('#6f6f6f');
        currentDepth = stop.depth;
      }
      
      if (currentDepth > 0) {
        const finalAscentTime = currentDepth / ascentRate;
        currentTime += finalAscentTime;
        timePoints.push(currentTime);
        depthPoints.push(0);
        segmentColors.push('#6f6f6f');
      }
    } else {
      const ascentTime = currentDepth / ascentRate;
      currentTime += ascentTime;
      timePoints.push(currentTime);
      depthPoints.push(0);
      segmentColors.push('#6f6f6f');
    }
  } else {
    // Simple single-level dive
    const descentTime = parameters.depth / 20;
    timePoints.push(descentTime);
    depthPoints.push(parameters.depth);
    
    const bottomEndTime = descentTime + parameters.bottomTime;
    timePoints.push(bottomEndTime);
    depthPoints.push(parameters.depth);
    
    let currentTime = bottomEndTime;
    let currentDepth = parameters.depth;
    const ascentRate = 10;
    
    if (decompressionStops.length > 0) {
      const firstStop = decompressionStops[0]!;
      const ascentTime = (currentDepth - firstStop.depth) / ascentRate;
      currentTime += ascentTime;
      timePoints.push(currentTime);
      depthPoints.push(firstStop.depth);
      
      for (const stop of decompressionStops) {
        if (currentDepth !== stop.depth) {
          const ascentTime = (currentDepth - stop.depth) / ascentRate;
          currentTime += ascentTime;
          timePoints.push(currentTime);
          depthPoints.push(stop.depth);
        }
        
        currentTime += stop.duration;
        timePoints.push(currentTime);
        depthPoints.push(stop.depth);
        currentDepth = stop.depth;
      }
      
      if (currentDepth > 0) {
        const finalAscentTime = currentDepth / ascentRate;
        currentTime += finalAscentTime;
        timePoints.push(currentTime);
        depthPoints.push(0);
      }
    } else {
      const ascentTime = currentDepth / ascentRate;
      currentTime += ascentTime;
      timePoints.push(currentTime);
      depthPoints.push(0);
    }
  }
  
  // Remove duplicate consecutive time points after rounding
  const roundedTimes = timePoints.map(t => Math.round(t));
  const uniqueLabels: number[] = [];
  const uniqueDepths: number[] = [];
  const uniqueColors: string[] = [];
  
  roundedTimes.forEach((time, index) => {
    if (index === 0 || time !== roundedTimes[index - 1]) {
      uniqueLabels.push(time);
      uniqueDepths.push(depthPoints[index]!);
      if (segmentColors.length > 0) {
        uniqueColors.push(segmentColors[index] || '#0f62fe');
      }
    }
  });
  
  return {
    labels: uniqueLabels,
    datasets: [
      {
        label: 'Depth Profile',
        data: uniqueDepths.map(d => -d),
        borderColor: '#0f62fe',
        backgroundColor: 'rgba(15, 98, 254, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        pointBackgroundColor: '#0f62fe',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        segment: {
          borderColor: (ctx) => {
            if (uniqueColors.length > 0 && ctx.p0DataIndex < uniqueColors.length) {
              return uniqueColors[ctx.p0DataIndex];
            }
            return '#0f62fe';
          }
        }
      }
    ]
  };
});

const chartOptions = computed((): ChartOptions<'line'> => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: true,
      text: isMultiLevelDive(props.profile?.parameters) ? 'Multi-Level Dive Profile' : 'Dive Profile',
      font: {
        size: 16,
        weight: '600',
        family: "'IBM Plex Sans', sans-serif"
      },
      color: '#161616',
      padding: {
        bottom: 20
      }
    },
    tooltip: {
      backgroundColor: '#161616',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#393939',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      callbacks: {
        label: (context) => {
          const depth = Math.abs(context.parsed.y);
          const time = context.label; // Use the label which is the actual time point
          
          // Find if there's a gas switch at this point
          if (props.profile?.gasSwitches) {
            const gasSwitch = props.profile.gasSwitches.find(gs => {
              const stop = props.profile!.decompressionStops.find(s => s.depth === gs.depth);
              return stop && Math.abs(stop.runtime - Number(time)) < 0.5;
            });
            
            if (gasSwitch) {
              return [
                `Depth: ${depth}m at ${time} min`,
                `Gas Switch: ${formatGasMix(gasSwitch.fromGas)} → ${formatGasMix(gasSwitch.toGas)}`
              ];
            }
          }
          
          return `Depth: ${depth}m at ${time} min`;
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Time (minutes)',
        font: {
          size: 12,
          weight: '600',
          family: "'IBM Plex Sans', sans-serif"
        },
        color: '#161616'
      },
      grid: {
        color: '#e0e0e0',
        drawBorder: false
      },
      ticks: {
        color: '#525252',
        font: {
          size: 12,
          family: "'IBM Plex Sans', sans-serif"
        }
      }
    },
    y: {
      title: {
        display: true,
        text: 'Depth (meters)',
        font: {
          size: 12,
          weight: '600',
          family: "'IBM Plex Sans', sans-serif"
        },
        color: '#161616'
      },
      reverse: false,
      grid: {
        color: '#e0e0e0',
        drawBorder: false
      },
      ticks: {
        color: '#525252',
        font: {
          size: 12,
          family: "'IBM Plex Sans', sans-serif"
        },
        callback: (value) => {
          return Math.abs(Number(value)) + 'm';
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index'
  }
}));

const legendItems = computed(() => {
  const items = [
    { color: '#0f62fe', label: 'Dive Profile' },
    { color: 'rgba(15, 98, 254, 0.2)', label: 'Underwater Phase', border: true }
  ];
  
  if (props.profile?.gasSwitches && props.profile.gasSwitches.length > 0) {
    items.push({ color: '#10b981', label: 'Gas Switch', isMarker: true });
  }
  
  if (isMultiLevelDive(props.profile?.parameters)) {
    items.push({ color: '#8a3ffc', label: 'Segment 2' });
    items.push({ color: '#ff832b', label: 'Segment 3' });
  }
  
  return items;
});
</script>

<template>
  <div v-if="profile" class="cds--tile chart-container">
    <div class="chart-wrapper">
      <Line :data="chartData" :options="chartOptions" :plugins="[gasSwitchPlugin]" />
    </div>
    
    <!-- Chart Legend -->
    <div class="chart-legend">
      <div v-for="(item, index) in legendItems" :key="index" class="legend-item">
        <div 
          v-if="item.isMarker"
          class="legend-marker"
          :style="{ backgroundColor: item.color }"
        >
          ⇄
        </div>
        <div 
          v-else
          class="legend-color"
          :class="{ 'legend-color--border': item.border }"
          :style="{ 
            backgroundColor: item.color,
            borderColor: item.border ? '#0f62fe' : 'transparent'
          }"
        ></div>
        <span class="legend-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cds--tile {
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #ffffff;
  border: 1px solid #e0e0e0;
}

.chart-container {
  padding: 2rem;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}

.chart-legend {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 1rem;
  height: 1rem;
  border-radius: 0.125rem;
}

.legend-color--border {
  border: 2px solid;
}

.legend-marker {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: bold;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.legend-label {
  font-size: 0.875rem;
  color: #161616;
  font-family: 'IBM Plex Sans', sans-serif;
}

@media (max-width: 768px) {
  .chart-container {
    padding: 1rem;
  }
  
  .chart-wrapper {
    height: 300px;
  }
  
  .chart-legend {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>