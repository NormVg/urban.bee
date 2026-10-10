<script setup lang="ts">
import type { TraceStep } from '#shared/types/complaint'
import { TRACE_ICON } from '~/constants/complaints'

/** "How this was sorted": each pipeline step in plain words with its time. */
const props = defineProps<{ steps: TraceStep[] }>()

const total = computed(() => props.steps.reduce((sum, s) => sum + s.ms, 0))

const STATUS_WORD: Record<TraceStep['status'], string> = {
  ok: 'Done',
  skipped: 'Skipped',
  fallback: 'Backup used',
  error: 'Unavailable',
}

const seconds = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${ms} ms`)
</script>

<template>
  <section class="trace" aria-labelledby="trace-title">
    <header class="trace__head">
      <h3 id="trace-title" class="trace__title">How this was sorted</h3>
      <span class="trace__total tnum">{{ seconds(total) }} total</span>
    </header>
    <ol class="trace__list">
      <li
        v-for="(s, i) in steps"
        :key="s.step"
        class="trace__step u-rise"
        :class="`is-${s.status}`"
        :style="{ '--stagger': `${i * 45}ms` }"
      >
        <span class="trace__dot"><UiIcon :name="TRACE_ICON[s.step]" :size="13" /></span>
        <div class="trace__text">
          <p class="trace__label">{{ s.label }}</p>
          <p v-if="s.note" class="trace__note">{{ s.note }}</p>
        </div>
        <div class="trace__side">
          <span class="trace__status">{{ STATUS_WORD[s.status] }}</span>
          <span v-if="s.ms" class="trace__ms tnum">{{ seconds(s.ms) }}</span>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.trace__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.trace__title {
  font-size: 14px;
  font-weight: 700;
}

.trace__total {
  font-size: 12px;
  color: var(--ink-3);
}

.trace__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.trace__step {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.trace__step:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 13px;
  top: 36px;
  bottom: -6px;
  width: 2px;
  background: var(--line);
}

.trace__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--blue);
  color: var(--on-blue);
}

.is-skipped .trace__dot { background: var(--surface-inset); color: var(--ink-3); }
.is-fallback .trace__dot { background: var(--warning); }
.is-error .trace__dot { background: var(--danger); }

.trace__text {
  flex: 1;
  min-width: 0;
  padding-top: 4px;
}

.trace__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.is-skipped .trace__label { color: var(--ink-3); }

.trace__note {
  margin-top: 1px;
  font-size: 12px;
  color: var(--ink-3);
}

.trace__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-top: 4px;
}

.trace__status {
  font-size: 11px;
  font-weight: 650;
  color: var(--ink-3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.is-fallback .trace__status { color: var(--warning); }
.is-error .trace__status { color: var(--danger); }

.trace__ms {
  font-size: 12px;
  color: var(--ink-2);
}
</style>
