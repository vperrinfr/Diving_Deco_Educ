<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { RepetitiveDive } from '../../types/repetitiveDive';

const props = defineProps<{
  dives: RepetitiveDive[];
  surfaceIntervals: number[];
}>();

const { t } = useI18n();

interface TimelineItem {
  type: 'dive' | 'surface';
  startTime: number; // minutes from start
  duration: number;
  dive?: RepetitiveDive;
  intervalIndex?: number;
}

const timelineItems = computed((): TimelineItem[] => {
  const items: TimelineItem[] = [];
  let currentTime = 0;

  props.dives.forEach((dive, index) => {
    // Add dive
    items.push({
      type: 'dive',
      startTime: currentTime,
      duration: dive.profile.totalDiveTime,
      dive
    });
    currentTime += dive.profile.totalDiveTime;

    // Add surface interval if not last dive
    if (index < props.surfaceIntervals.length) {
      const interval = props.surfaceIntervals[index]!;
      items.push({
        type: 'surface',
        startTime: currentTime,
        duration: interval,
        intervalIndex: index
      });
      currentTime += interval;
    }
  });

  return items;
});

const totalDuration = computed(() => {
  if (timelineItems.value.length === 0) return 0;
  const lastItem = timelineItems.value[timelineItems.value.length - 1]!;
  return lastItem.startTime + lastItem.duration;
});

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  }
  return `${mins}min`;
};

const getItemWidth = (duration: number): string => {
  if (totalDuration.value === 0) return '0%';
  return `${(duration / totalDuration.value) * 100}%`;
};

const getItemPosition = (startTime: number): string => {
  if (totalDuration.value === 0) return '0%';
  return `${(startTime / totalDuration.value) * 100}%`;
};

const getDiveColor = (dive: RepetitiveDive): string => {
  const depth = dive.profile.maxDepth;
  if (depth < 20) return 'bg-blue-500';
  if (depth < 30) return 'bg-blue-600';
  if (depth < 40) return 'bg-blue-700';
  return 'bg-blue-800';
};

const getPressureGroupColor = (group: string): string => {
  const index = group.charCodeAt(0) - 65; // A=0, B=1, etc.
  if (index < 5) return 'text-green-400';
  if (index < 15) return 'text-yellow-400';
  return 'text-red-400';
};
</script>

<template>
  <div class="dive-timeline bg-gray-800 rounded-lg p-6">
    <h3 class="text-2xl font-bold text-white mb-4">
      {{ t('repetitiveDive.timeline.title') }}
    </h3>

    <div v-if="dives.length === 0" class="text-center py-12 text-gray-400">
      <div class="text-4xl mb-3">📅</div>
      <p>{{ t('repetitiveDive.diveList.empty') }}</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Timeline Header -->
      <div class="flex justify-between items-center text-sm text-gray-400">
        <span>{{ t('repetitiveDive.timeline.now') }}</span>
        <span>{{ formatTime(totalDuration) }}</span>
      </div>

      <!-- Timeline Bar -->
      <div class="relative h-24 bg-gray-900 rounded-lg overflow-hidden">
        <!-- Timeline Items -->
        <div
          v-for="(item, index) in timelineItems"
          :key="index"
          class="absolute top-0 h-full transition-all duration-300 hover:z-10"
          :style="{
            left: getItemPosition(item.startTime),
            width: getItemWidth(item.duration)
          }"
        >
          <!-- Dive Block -->
          <div
            v-if="item.type === 'dive' && item.dive"
            :class="[
              'h-full border-2 border-gray-700 rounded cursor-pointer transition-transform hover:scale-105',
              getDiveColor(item.dive)
            ]"
            :title="`${t('repetitiveDive.timeline.dive')} #${item.dive.diveNumber}`"
          >
            <div class="h-full flex flex-col justify-center items-center text-white text-xs font-bold p-1">
              <div class="text-lg">🤿</div>
              <div>#{{ item.dive.diveNumber }}</div>
              <div class="text-[10px] opacity-90">{{ item.dive.profile.maxDepth }}m</div>
            </div>
          </div>

          <!-- Surface Interval Block -->
          <div
            v-else-if="item.type === 'surface'"
            class="h-full bg-gradient-to-r from-cyan-900 to-cyan-800 border-2 border-cyan-700 rounded opacity-60"
            :title="`${t('repetitiveDive.timeline.surface')}: ${formatTime(item.duration)}`"
          >
            <div class="h-full flex flex-col justify-center items-center text-cyan-200 text-xs font-medium p-1">
              <div class="text-lg">⏱️</div>
              <div class="text-[10px]">{{ formatTime(item.duration) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline Details -->
      <div class="space-y-3">
        <div
          v-for="(item, index) in timelineItems"
          :key="index"
          class="flex items-center gap-4 p-3 bg-gray-700 rounded-lg"
        >
          <!-- Dive Details -->
          <template v-if="item.type === 'dive' && item.dive">
            <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                 :class="getDiveColor(item.dive)">
              🤿
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-bold text-white">
                  {{ t('repetitiveDive.timeline.dive') }} #{{ item.dive.diveNumber }}
                </span>
                <span class="text-xs px-2 py-1 rounded"
                      :class="getPressureGroupColor(item.dive.pressureGroupAfter) + ' bg-gray-800'">
                  {{ item.dive.pressureGroupAfter }}
                </span>
              </div>
              <div class="text-sm text-gray-400 mt-1">
                {{ item.dive.profile.maxDepth }}m × {{ item.dive.profile.totalDiveTime }}min
                <span v-if="item.dive.profile.totalDecompressionTime > 0" class="ml-2">
                  ({{ item.dive.profile.totalDecompressionTime }}min déco)
                </span>
              </div>
            </div>
            <div class="text-right text-sm text-gray-400">
              <div>{{ formatTime(item.startTime) }}</div>
              <div class="text-xs">→ {{ formatTime(item.startTime + item.duration) }}</div>
            </div>
          </template>

          <!-- Surface Interval Details -->
          <template v-else-if="item.type === 'surface'">
            <div class="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-900 flex items-center justify-center text-2xl">
              ⏱️
            </div>
            <div class="flex-1">
              <div class="font-bold text-cyan-300">
                {{ t('repetitiveDive.timeline.surface') }}
              </div>
              <div class="text-sm text-gray-400 mt-1">
                {{ formatTime(item.duration) }}
              </div>
            </div>
            <div class="text-right text-sm text-gray-400">
              <div>{{ formatTime(item.startTime) }}</div>
              <div class="text-xs">→ {{ formatTime(item.startTime + item.duration) }}</div>
            </div>
          </template>
        </div>
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
        <div class="text-center">
          <div class="text-2xl font-bold text-white">{{ dives.length }}</div>
          <div class="text-sm text-gray-400">{{ t('repetitiveDive.currentPlan.diveCount') }}</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-white">
            {{ formatTime(dives.reduce((sum, d) => sum + d.profile.totalDiveTime, 0)) }}
          </div>
          <div class="text-sm text-gray-400">Temps de plongée</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-white">{{ formatTime(totalDuration) }}</div>
          <div class="text-sm text-gray-400">Durée totale</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dive-timeline {
  position: relative;
}

/* Smooth transitions */
* {
  transition-property: transform, opacity;
  transition-duration: 200ms;
  transition-timing-function: ease-in-out;
}
</style>

<!-- Made with Bob -->