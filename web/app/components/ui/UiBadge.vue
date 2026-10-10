<script setup lang="ts">
import type { IconName } from '~/constants/icons'

withDefaults(
  defineProps<{
    tone?: 'neutral' | 'info' | 'orange' | 'success' | 'warning' | 'danger'
    dot?: boolean
    icon?: IconName
  }>(),
  { tone: 'neutral' },
)
</script>

<template>
  <span class="ui-badge" :class="`ui-badge--${tone}`">
    <span v-if="dot" class="ui-badge__dot" aria-hidden="true" />
    <UiIcon v-if="icon" :name="icon" :size="12" />
    <slot />
  </span>
</template>

<style scoped>
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--r-pill);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.ui-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.ui-badge--neutral { background: var(--surface-inset); color: var(--ink-2); }
.ui-badge--info { background: var(--blue-tint); color: var(--blue); }
.ui-badge--orange { background: var(--orange-tint); color: var(--orange-strong); }
.ui-badge--success { background: var(--success-bg); color: var(--success); }
.ui-badge--warning { background: var(--warning-bg); color: var(--warning); }
.ui-badge--danger { background: var(--danger-bg); color: var(--danger); }
</style>
