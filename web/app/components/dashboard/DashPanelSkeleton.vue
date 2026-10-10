<script setup lang="ts">
/** Placeholder for a dashboard panel while its data loads: same frame, shimmering content. */
withDefaults(defineProps<{ rows?: number; height?: string; variant?: 'list' | 'chart' }>(), {
  rows: 4,
  height: '260px',
  variant: 'list',
})
</script>

<template>
  <UiCard class="pskel" aria-busy="true">
    <template #header>
      <div class="pskel__head">
        <UiSkeleton width="140px" height="14px" />
        <UiSkeleton width="200px" height="11px" />
      </div>
    </template>
    <div class="pskel__body" :style="{ minHeight: height }">
      <div v-if="variant === 'chart'" class="pskel__bars">
        <UiSkeleton
          v-for="i in 14"
          :key="i"
          width="100%"
          :height="`${20 + ((i * 37) % 70)}%`"
          radius="var(--r-micro) var(--r-micro) 0 0"
        />
      </div>
      <template v-else>
        <div v-for="i in rows" :key="i" class="pskel__row">
          <UiSkeleton width="40px" height="40px" radius="var(--r-sm)" />
          <div class="pskel__text">
            <UiSkeleton :width="`${55 + ((i * 13) % 35)}%`" />
            <UiSkeleton width="40%" height="11px" />
          </div>
        </div>
      </template>
    </div>
  </UiCard>
</template>

<style scoped>
.pskel { height: 100%; }
.pskel__head { display: flex; flex-direction: column; gap: 7px; }
.pskel__body { display: flex; flex-direction: column; gap: 16px; }
.pskel__row { display: flex; align-items: center; gap: 12px; }
.pskel__text { flex: 1; display: flex; flex-direction: column; gap: 7px; }
.pskel__bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 8px;
}
</style>
