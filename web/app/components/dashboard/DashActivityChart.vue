<script setup lang="ts">
import type { RequestDay } from '~/types/dashboard'

const props = withDefaults(
  defineProps<{ series: RequestDay[]; title?: string; subtitle?: string }>(),
  { title: 'New reports', subtitle: 'Per day · last 14 days' },
)

const max = computed(() => Math.max(1, ...props.series.map((day) => day.value)))

/** Bar heights as percentages, pre-rounded once for template reuse */
const columns = computed(() =>
  props.series.map((day, i) => ({
    ...day,
    index: i,
    height: Math.round((day.value / max.value) * 100),
    isCurrent: i === props.series.length - 1,
  })),
)

const GRID_LINES = [25, 50, 75, 100] as const
</script>

<template>
  <UiCard class="chart-card">
    <template #header>
      <div>
        <h2 class="chart-card__title">{{ title }}</h2>
        <p class="chart-card__sub">{{ subtitle }}</p>
      </div>
      <UiBadge tone="info" icon="activity">live</UiBadge>
    </template>

    <div class="chart" role="img" :aria-label="`Bar chart of new reports per day over the last ${series.length} days`">
      <div class="chart__plot" aria-hidden="true">
        <span
          v-for="line in GRID_LINES"
          :key="line"
          class="chart__gridline"
          :style="{ bottom: `${line}%` }"
        />
      </div>

      <div class="chart__cols">
        <div
          v-for="col in columns"
          :key="`${col.label}-${col.index}`"
          class="chart__col"
          :title="`${col.date ?? col.label}: ${col.value} reports`"
        >
          <div
            class="chart__col-plot"
            :style="{ '--h': `${col.height}%`, '--stagger': `${col.index * 18}ms` }"
          >
            <span class="chart__value tnum">{{ col.value }}</span>
            <span class="chart__bar" :class="{ 'is-current': col.isCurrent }" />
          </div>
        </div>
      </div>

      <div class="chart__days">
        <span v-for="(col, i) in columns" :key="`day-${i}`" class="chart__day">
          {{ col.label }}
        </span>
      </div>
    </div>
  </UiCard>
</template>

<style scoped>
.chart-card__title {
  font-size: 15px;
  font-weight: 650;
  color: var(--ink);
}

.chart-card__sub {
  font-size: 12.5px;
  color: var(--ink-3);
}

.chart {
  position: relative;
  padding-top: 18px;
}

/* gridlines span the plot region only (above the baseline) */
.chart__plot {
  position: absolute;
  top: 18px;
  left: 0;
  right: 0;
  bottom: 26px;
  pointer-events: none;
}

.chart__gridline {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  border-top: 1px dashed rgba(36, 28, 19, 0.07);
}

.chart__cols {
  display: flex;
  align-items: stretch;
  gap: 8px;
  height: 208px;
  border-bottom: 1px solid var(--line-strong);
}

.chart__col {
  flex: 1;
  min-width: 0;
}

.chart__col-plot {
  position: relative;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.chart__bar {
  width: 100%;
  max-width: 32px;
  height: var(--h);
  border-radius: var(--r-micro) var(--r-micro) 0 0;
  background: var(--blue);
  transform-origin: bottom;
  animation: u-grow 300ms var(--ease-out) both;
  animation-delay: var(--stagger, 0ms);
  transition: background-color var(--t-fast) var(--ease-in-out);
}

.chart__col:hover .chart__bar {
  background: var(--blue-deep);
}

.chart__col:hover .chart__bar.is-current,
.chart__bar.is-current {
  background: var(--orange);
}

.chart__value {
  position: absolute;
  bottom: calc(var(--h) + 6px);
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-2);
  opacity: 0;
  transition: opacity var(--t-fast) var(--ease-in-out);
  pointer-events: none;
}

.chart__col:hover .chart__value {
  opacity: 1;
}

.chart__col:has(.is-current) .chart__value {
  opacity: 1;
  color: var(--orange-strong);
}

.chart__days {
  display: flex;
  gap: 8px;
  padding-top: 8px;
}

.chart__day {
  flex: 1;
  min-width: 0;
  text-align: center;
  font-size: 11px;
  color: var(--ink-3);
}
</style>
