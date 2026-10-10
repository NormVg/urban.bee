<script setup lang="ts">
import type { StatMetric } from '~/types/dashboard'

defineProps<{ metric: StatMetric }>()
</script>

<template>
  <UiCard padding="md" hoverable>
    <div class="stat">
      <div class="stat__head">
        <p class="stat__label">{{ metric.label }}</p>
        <span class="stat__icon" :class="`stat__icon--${metric.iconTone}`">
          <UiIcon :name="metric.icon" :size="17" />
        </span>
      </div>

      <p class="stat__value tnum">{{ metric.value }}</p>

      <p class="stat__delta" :class="`stat__delta--${metric.hintTone ?? 'neutral'}`">
        {{ metric.hint }}
      </p>
    </div>
  </UiCard>
</template>

<style scoped>
.stat {
  display: flex;
  flex-direction: column;
}

.stat__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.stat__label {
  padding-top: 7px;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--ink-2);
}

.stat__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
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
  font-size: 28px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.015em;
  color: var(--ink);
}

.stat__delta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  margin-top: 10px;
  padding: 3px 9px;
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.stat__delta--good {
  background: var(--success-bg);
  color: var(--success);
}

.stat__delta--bad {
  background: var(--danger-bg);
  color: var(--danger);
}

.stat__delta--neutral {
  background: var(--surface-inset);
  color: var(--ink-2);
}
</style>
