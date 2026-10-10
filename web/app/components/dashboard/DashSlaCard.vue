<script setup lang="ts">
import type { SlaSummary } from '~/types/dashboard'

const props = defineProps<{ summary: SlaSummary }>()

/** Conic stops: met → at-risk → missed, in legend colors */
const ringStyle = computed(() => {
  const { met, atRisk, missed } = props.summary
  const total = met + atRisk + missed || 1
  const pct = (n: number) => (n / total) * 100
  const metEnd = pct(met)
  const riskEnd = metEnd + pct(atRisk)
  return {
    background: `conic-gradient(
      var(--blue) 0 ${metEnd}%,
      var(--warning) ${metEnd}% ${riskEnd}%,
      var(--danger) ${riskEnd}% 100%
    )`,
  }
})
</script>

<template>
  <UiCard>
    <template #header>
      <div>
        <h2 class="sla-card__title">SLA compliance</h2>
        <p class="sla-card__sub">City-wide · last 30 days</p>
      </div>
    </template>

    <div class="sla">
      <div class="sla__ring" :style="ringStyle" role="img" :aria-label="`SLA compliance ${summary.percent} percent`">
        <span class="sla__ring-center">
          <span class="sla__ring-value tnum">{{ summary.percent }}<small>%</small></span>
          <span class="sla__ring-caption">met SLA</span>
        </span>
      </div>

      <ul class="sla__legend">
        <li class="sla__legend-row">
          <span class="sla__legend-dot" style="color: var(--blue)" />
          <span class="sla__legend-label">Met</span>
          <span class="sla__legend-value tnum">{{ summary.met.toLocaleString('en-IN') }}</span>
        </li>
        <li class="sla__legend-row">
          <span class="sla__legend-dot" style="color: var(--warning)" />
          <span class="sla__legend-label">At risk</span>
          <span class="sla__legend-value tnum">{{ summary.atRisk }}</span>
        </li>
        <li class="sla__legend-row">
          <span class="sla__legend-dot" style="color: var(--danger)" />
          <span class="sla__legend-label">Missed</span>
          <span class="sla__legend-value tnum">{{ summary.missed }}</span>
        </li>
      </ul>
    </div>
  </UiCard>
</template>

<style scoped>
.sla-card__title {
  font-size: 15px;
  font-weight: 650;
  color: var(--ink);
}

.sla-card__sub {
  font-size: 12.5px;
  color: var(--ink-3);
}

.sla {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

@media (min-width: 480px) {
  .sla {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.sla__ring {
  position: relative;
  width: 136px;
  height: 136px;
  flex-shrink: 0;
  border-radius: 50%;
}

.sla__ring::after {
  content: '';
  position: absolute;
  inset: 13px;
  border-radius: 50%;
  background: var(--surface);
  box-shadow: var(--sh-1);
}

.sla__ring-center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.sla__ring-value {
  font-size: 25px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.sla__ring-value small {
  font-size: 14px;
  font-weight: 600;
  margin-left: 1px;
}

.sla__ring-caption {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.sla__legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 220px;
}

.sla__legend-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sla__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.sla__legend-label {
  flex: 1;
  font-size: 13px;
  color: var(--ink-2);
}

.sla__legend-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
</style>
