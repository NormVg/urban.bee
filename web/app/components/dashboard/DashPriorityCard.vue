<script setup lang="ts">
import type { Priority } from '#shared/triage/priority'
import { PRIORITY_META } from '~/constants/complaints'

/** Open problems by priority as a ring + legend. */
const props = defineProps<{ mix: Record<Priority, number> }>()

const ORDER: Priority[] = ['P1', 'P2', 'P3', 'P4']
const total = computed(() => ORDER.reduce((sum, p) => sum + props.mix[p], 0))

const ringStyle = computed(() => {
  if (!total.value) return { background: 'var(--surface-inset)' }
  let start = 0
  const stops = ORDER.map((p) => {
    const end = start + (props.mix[p] / total.value) * 100
    const stop = `${PRIORITY_META[p].color} ${start}% ${end}%`
    start = end
    return stop
  })
  return { background: `conic-gradient(${stops.join(', ')})` }
})
</script>

<template>
  <UiCard>
    <template #header>
      <div>
        <h2 class="pcard__title">Open by priority</h2>
        <p class="pcard__sub">What needs attention first</p>
      </div>
    </template>

    <div class="pcard">
      <div class="pcard__ring" :style="ringStyle" role="img" :aria-label="`${mix.P1} urgent out of ${total} open problems`">
        <span class="pcard__center">
          <span class="pcard__value tnum">{{ mix.P1 }}</span>
          <span class="pcard__caption">urgent</span>
        </span>
      </div>

      <ul class="pcard__legend">
        <li v-for="p in ORDER" :key="p" class="pcard__row">
          <span class="pcard__dot" :style="{ background: PRIORITY_META[p].color }" />
          <span class="pcard__label"><strong>{{ p }}</strong> {{ PRIORITY_META[p].label }}</span>
          <span class="pcard__num tnum">{{ mix[p] }}</span>
        </li>
      </ul>
    </div>
  </UiCard>
</template>

<style scoped>
.pcard__title { font-size: 15px; font-weight: 650; color: var(--ink); }
.pcard__sub { font-size: 12.5px; color: var(--ink-3); }

.pcard {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

@media (min-width: 480px) {
  .pcard { flex-direction: row; justify-content: space-between; }
}

.pcard__ring {
  position: relative;
  width: 136px;
  height: 136px;
  flex-shrink: 0;
  border-radius: 50%;
  transition: background 400ms var(--ease-out);
}

.pcard__ring::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--sh-1);
}

.pcard__center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.pcard__value { font-size: 28px; font-weight: 700; line-height: 1; color: var(--danger); }

.pcard__caption {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.pcard__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
  width: 100%;
  max-width: 220px;
}

.pcard__row { display: flex; align-items: center; gap: 10px; }
.pcard__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.pcard__label { flex: 1; font-size: 13px; color: var(--ink-2); }
.pcard__label strong { font-weight: 700; color: var(--ink); margin-right: 3px; }
.pcard__num { font-size: 13px; font-weight: 600; color: var(--ink); }
</style>
