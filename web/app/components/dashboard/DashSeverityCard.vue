<script setup lang="ts">
import type { Severity } from '#shared/triage/taxonomy'
import { SEVERITY_META, SEVERITY_ORDER } from '~/constants/complaints'

/** Open problems by how serious they look: one stacked bar plus a compact legend. */
const props = defineProps<{ mix: Record<Severity, number> }>()

const total = computed(() => SEVERITY_ORDER.reduce((sum, s) => sum + props.mix[s], 0))
const parts = computed(() =>
  SEVERITY_ORDER.map((s) => ({ id: s, ...SEVERITY_META[s], n: props.mix[s], pct: total.value ? (props.mix[s] / total.value) * 100 : 0 })),
)
</script>

<template>
  <UiCard>
    <template #header>
      <div>
        <h2 class="scard__title">Open by severity</h2>
        <p class="scard__sub">How serious the open problems look</p>
      </div>
    </template>

    <div class="scard">
      <div class="scard__bar" role="img" :aria-label="parts.map((p) => `${p.n} ${p.label}`).join(', ')">
        <template v-if="total">
          <span v-for="p in parts" v-show="p.n" :key="p.id" :style="{ width: `${p.pct}%`, background: p.color }" />
        </template>
      </div>
      <ul class="scard__legend">
        <li v-for="p in parts" :key="p.id" :class="{ 'is-empty': !p.n }">
          <i :style="{ background: p.color }" />
          <span>{{ p.label }}</span>
          <b class="tnum">{{ p.n }}</b>
        </li>
      </ul>
    </div>
  </UiCard>
</template>

<style scoped>
.scard__title { font-size: 15px; font-weight: 650; color: var(--ink); }
.scard__sub { font-size: 12.5px; color: var(--ink-3); }

.scard { display: flex; flex-direction: column; gap: 14px; }

.scard__bar {
  display: flex;
  gap: 3px;
  height: 10px;
  border-radius: var(--r-pill);
  background: var(--surface-inset);
  overflow: hidden;
}

.scard__bar span { display: block; height: 100%; transition: width 500ms var(--ease-out); }

.scard__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
}

.scard__legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-2);
  white-space: nowrap;
}

.scard__legend li.is-empty { opacity: 0.55; }
.scard__legend i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.scard__legend b { margin-left: auto; font-weight: 700; color: var(--ink); }
</style>
