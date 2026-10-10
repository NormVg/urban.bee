<script setup lang="ts">
import type { Priority } from '#shared/triage/priority'
import { PRIORITY_META } from '~/constants/complaints'

/**
 * Open problems by priority: a headline count, then one bar per band.
 * Rows share the card height evenly so the card never has a dead gap
 * next to the taller chart.
 */
const props = defineProps<{ mix: Record<Priority, number> }>()

const ORDER: Priority[] = ['P1', 'P2', 'P3', 'P4']
const TARGET: Record<Priority, string> = { P1: '4 h', P2: '24 h', P3: '3 days', P4: '7 days' }

const total = computed(() => ORDER.reduce((sum, p) => sum + props.mix[p], 0))
const max = computed(() => Math.max(1, ...ORDER.map((p) => props.mix[p])))
const urgentShare = computed(() => (total.value ? Math.round(((props.mix.P1 + props.mix.P2) / total.value) * 100) : 0))
</script>

<template>
  <UiCard class="pcard-wrap">
    <template #header>
      <div>
        <h2 class="pcard__title">Open by priority</h2>
        <p class="pcard__sub">What needs attention first</p>
      </div>
    </template>

    <div class="pcard">
      <div class="pcard__summary">
        <p class="pcard__total tnum">{{ total }}</p>
        <p class="pcard__total-label">
          open {{ total === 1 ? 'problem' : 'problems' }}
          <span v-if="total" class="pcard__share">· {{ urgentShare }}% urgent or high</span>
        </p>
      </div>

      <ul class="pcard__rows">
        <li v-for="(p, i) in ORDER" :key="p" class="pcard__row">
          <div class="pcard__row-head">
            <span class="pcard__band">
              <span class="pcard__dot" :style="{ background: PRIORITY_META[p].color }" />
              <strong>{{ p }}</strong>
              <span class="pcard__band-label">{{ PRIORITY_META[p].label }}</span>
            </span>
            <span class="pcard__target">within {{ TARGET[p] }}</span>
            <span class="pcard__num tnum">{{ mix[p] }}</span>
          </div>
          <div class="pcard__track" aria-hidden="true">
            <span
              class="pcard__fill"
              :style="{
                width: `${(mix[p] / max) * 100}%`,
                background: PRIORITY_META[p].color,
                '--stagger': `${200 + i * 50}ms`,
              }"
            />
          </div>
        </li>
      </ul>
    </div>
  </UiCard>
</template>

<style scoped>
.pcard-wrap {
  height: 100%;
}

.pcard-wrap :deep(.ui-card__body) {
  flex: 1;
  display: flex;
}

.pcard__title { font-size: 15px; font-weight: 650; color: var(--ink); }
.pcard__sub { font-size: 12.5px; color: var(--ink-3); }

.pcard {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.pcard__summary {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.pcard__total {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.pcard__total-label {
  min-width: 0;
  font-size: 13px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcard__share { color: var(--ink-3); }

.pcard__rows {
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 14px;
}

.pcard__row { display: flex; flex-direction: column; gap: 7px; }

.pcard__row-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  white-space: nowrap;
}

.pcard__band {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--ink-2);
}

.pcard__band strong { font-weight: 700; color: var(--ink); }

.pcard__band-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.pcard__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

.pcard__target {
  margin-left: auto;
  font-size: 12px;
  color: var(--ink-3);
}

.pcard__num {
  min-width: 22px;
  text-align: right;
  font-weight: 700;
  color: var(--ink);
}

.pcard__track {
  height: 6px;
  border-radius: var(--r-pill);
  background: var(--surface-inset);
  overflow: hidden;
}

.pcard__fill {
  display: block;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  transform-origin: left;
  animation: pcard-grow 520ms var(--ease-out) both;
  animation-delay: var(--stagger, 0ms);
}

@keyframes pcard-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .pcard__fill { animation: none; }
}
</style>
