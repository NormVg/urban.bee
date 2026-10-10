<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
  }>(),
  { width: '100%', height: '14px', radius: 'var(--r-micro)' },
)
</script>

<template>
  <span class="ui-skeleton" :style="{ width, height, borderRadius: radius }" aria-hidden="true" />
</template>

<style scoped>
.ui-skeleton {
  display: block;
  background: linear-gradient(90deg, var(--surface-inset) 0%, var(--surface-2) 50%, var(--surface-inset) 100%);
  background-size: 200% 100%;
  animation: ui-shimmer 1.3s var(--ease-in-out) infinite;
}

@keyframes ui-shimmer {
  from { background-position: 100% 0; }
  to { background-position: -100% 0; }
}
</style>
