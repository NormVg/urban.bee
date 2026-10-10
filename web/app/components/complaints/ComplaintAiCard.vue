<script setup lang="ts">
import { DEPARTMENTS } from '#shared/triage/taxonomy'
import type { ComplaintDetail } from '#shared/types/complaint'
import { PRIORITY_META, SEVERITY_META } from '~/constants/complaints'

/** "AI review": what the AI decided, how sure it was, and what to do. */
const props = defineProps<{ complaint: ComplaintDetail }>()

const confidence = computed(() => Math.round((props.complaint.aiConfidence ?? 0) * 100))

/** Top 3 department probabilities from the decision model, when available. */
const alternatives = computed(() => {
  const answers = (props.complaint.aiRaw as { answers?: Record<string, { probabilities?: Record<string, number> }> } | null)?.answers
  const probs = answers?.department?.probabilities
  if (!probs) return []
  return Object.entries(probs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, p]) => ({ id, label: DEPARTMENTS.find((d) => d.id === id)?.label ?? id, pct: Math.round(p * 100) }))
})

const hazards = computed(() => {
  const h = props.complaint.hazards
  return [
    h.riskToLife && 'Risk to people',
    h.blocksTraffic && 'Blocks traffic',
    h.affectsMany && 'Affects many people',
    h.longStanding && 'Been there a while',
  ].filter(Boolean) as string[]
})

const byRules = computed(() => props.complaint.aiProvider === 'rules')
</script>

<template>
  <section class="ai" aria-labelledby="ai-title">
    <header class="ai__head">
      <span class="ai__icon"><UiIcon name="sparkles" :size="16" /></span>
      <h3 id="ai-title" class="ai__title">AI review</h3>
      <span class="ai__sure tnum">
        {{ byRules ? 'Sorted by keywords' : `${confidence}% sure` }}
      </span>
    </header>

    <div v-if="complaint.needsReview" class="ai__warn" role="note">
      <UiIcon name="alert" :size="15" />
      <span><strong>Check this one.</strong> The AI wasn't sure what this shows. Please confirm the team before acting.</span>
    </div>

    <dl class="ai__grid">
      <div>
        <dt>Team</dt>
        <dd>{{ complaint.departmentLabel }}</dd>
      </div>
      <div>
        <dt>Problem</dt>
        <dd>{{ complaint.categoryLabel }}</dd>
      </div>
      <div>
        <dt>Severity</dt>
        <dd><UiBadge :tone="SEVERITY_META[complaint.severity].tone" dot>{{ SEVERITY_META[complaint.severity].label }}</UiBadge></dd>
      </div>
      <div>
        <dt>Priority</dt>
        <dd class="ai__prio">
          <ComplaintPriorityBadge :priority="complaint.priority" show-label />
          <span class="ai__target">respond {{ complaint.priorityTarget }}</span>
        </dd>
      </div>
    </dl>

    <p class="ai__summary">{{ complaint.summary }}</p>

    <div v-if="complaint.suggestedAction" class="ai__action">
      <span class="ai__label">Suggested next step</span>
      <p>{{ complaint.suggestedAction }}</p>
    </div>

    <div v-if="hazards.length" class="ai__chips">
      <UiBadge v-for="h in hazards" :key="h" tone="danger" icon="alert">{{ h }}</UiBadge>
    </div>

    <div v-if="alternatives.length" class="ai__alts">
      <span class="ai__label">How sure, by team</span>
      <div v-for="(alt, i) in alternatives" :key="alt.id" class="ai__alt">
        <span class="ai__alt-name">{{ alt.label }}</span>
        <span class="ai__alt-bar"><span :style="{ width: `${alt.pct}%`, '--stagger': `${i * 60}ms` }" :class="{ 'is-top': i === 0 }" /></span>
        <span class="ai__alt-pct tnum">{{ alt.pct }}%</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ai {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: var(--r-md);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--sh-1);
}

.ai__head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai__icon {
  display: inline-flex;
  padding: 6px;
  border-radius: var(--r-sm);
  background: var(--orange-tint);
  color: var(--orange-strong);
}

.ai__title {
  font-size: 14px;
  font-weight: 700;
}

.ai__sure {
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-3);
}

.ai__warn {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--r-sm);
  background: var(--warning-bg);
  color: var(--warning);
  font-size: 12.5px;
  line-height: 1.45;
}
.ai__warn strong { font-weight: 700; }

.ai__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
  margin: 0;
}

.ai__grid dt,
.ai__label {
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.ai__grid dd {
  margin: 3px 0 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--ink);
}

.ai__prio {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.ai__target {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--ink-3);
}

.ai__summary {
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}

.ai__action {
  padding: 10px 12px;
  border-left: 3px solid var(--blue);
  border-radius: 0 var(--r-sm) var(--r-sm) 0;
  background: var(--blue-tint);
}
.ai__action p {
  margin-top: 3px;
  font-size: 13px;
  color: var(--ink);
}

.ai__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ai__alts {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ai__alt {
  display: grid;
  grid-template-columns: 150px 1fr 40px;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--ink-2);
}

.ai__alt-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai__alt-bar {
  height: 6px;
  border-radius: 3px;
  background: var(--surface-inset);
  overflow: hidden;
}

.ai__alt-bar span {
  display: block;
  height: 100%;
  border-radius: 3px;
  background: var(--ink-3);
  transform-origin: left;
  animation: ai-grow 420ms var(--ease-out) both;
  animation-delay: var(--stagger, 0ms);
}
.ai__alt-bar span.is-top { background: var(--blue); }

@keyframes ai-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.ai__alt-pct {
  text-align: right;
  font-weight: 600;
}
</style>
