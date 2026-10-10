<script setup lang="ts">
import type { StatMetric } from '~/types/dashboard'

defineProps<{ metric: StatMetric }>()
</script>

<template>
  <UiCard padding="md" hoverable class="stat-card">
    <div class="stat">
      <div class="stat__head">
        <p class="stat__label">{{ metric.label }}</p>
        <span class="stat__icon" :class="`stat__icon--${metric.iconTone}`">
          <UiIcon :name="metric.icon" :size="16" />
        </span>
      </div>

      <p class="stat__value tnum">{{ metric.value }}</p>

      <p class="stat__hint" :class="`stat__hint--${metric.hintTone ?? 'neutral'}`" :title="metric.hint">
        {{ metric.hint }}
      </p>
    </div>
  </UiCard>
</template>

<style scoped>
/* Every stat card is the same height: the grid stretches them, the hint sits at the bottom. */
.stat-card {
  height: 100%;
}

.stat-card :deep(.ui-card__body) {
  flex: 1;
  display: flex;
}

.stat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.stat__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.stat__label {
  min-width: 0;
  font-size: 13px;
  font-weight: 550;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
}

.stat__icon--blue {
  background: var(--blue-tint);
  color: var(--blue);
}

.stat__icon--orange {
  background: var(--orange-tint);
  color: var(--orange-strong);
}

.stat__value {
  margin: 14px 0 12px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.stat__hint {
  max-width: 100%;
  align-self: flex-start;
  margin-top: auto;
  padding: 3px 9px;
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat__hint--good {
  background: var(--success-bg);
  color: var(--success);
}

.stat__hint--bad {
  background: var(--danger-bg);
  color: var(--danger);
}

.stat__hint--neutral {
  background: var(--surface-inset);
  color: var(--ink-2);
}
</style>
