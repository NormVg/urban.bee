<script setup lang="ts">
import type { Priority } from '#shared/triage/priority'
import { PRIORITY_META } from '~/constants/complaints'

defineProps<{ priority: Priority; showLabel?: boolean }>()
</script>

<template>
  <UiBadge :tone="PRIORITY_META[priority].tone" class="pbadge">
    <span class="pbadge__code">{{ priority }}</span>
    <span v-if="showLabel" class="pbadge__label">{{ PRIORITY_META[priority].label }}</span>
  </UiBadge>
</template>

<style scoped>
.pbadge__code { font-weight: 750; letter-spacing: 0.02em; }
.pbadge__label { opacity: 0.85; }
</style>
