<script setup lang="ts">
import { SEVERITY_META, SEVERITY_ORDER } from '~/constants/complaints'

/** Severity colour key, floated over a map. */
</script>

<template>
  <div class="mlegend" aria-hidden="true">
    <span v-for="s in SEVERITY_ORDER" :key="s"><i :style="{ background: SEVERITY_META[s].color }" />{{ SEVERITY_META[s].label }}</span>
  </div>
</template>

<style scoped>
.mlegend {
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--r-sm);
  background: rgba(253, 250, 243, 0.94);
  box-shadow: var(--sh-2);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  white-space: nowrap;
}

.mlegend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mlegend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
</style>
