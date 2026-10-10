<script setup lang="ts">
import type { StatMetric } from '~/types/dashboard'

definePageMeta({ layout: 'dashboard' })

const { scopeId, activeDepartment } = useDepartmentScope()
const { overview, pending, error, refresh } = useOverview()

const pageTitle = computed(() => activeDepartment.value?.label ?? 'City overview')
const updatedAt = ref(new Date())
watch(overview, () => (updatedAt.value = new Date()))
const updatedLabel = useTimeAgo(() => updatedAt.value.toISOString())

const stats = computed<StatMetric[]>(() => {
  const s = overview.value?.stats
  if (!s) return []
  const triage = s.medianTriageSeconds
  return [
    {
      id: 'open',
      label: 'Open problems',
      value: String(s.open),
      hint: `${s.total} reported in total`,
      icon: 'inbox',
      iconTone: 'blue',
    },
    {
      id: 'urgent',
      label: 'Urgent (P1)',
      value: String(s.p1Open),
      hint: s.p1Open ? 'Respond within 4 hours' : 'Nothing urgent',
      hintTone: s.p1Open ? 'bad' : 'good',
      icon: 'alert',
      iconTone: 'orange',
    },
    {
      id: 'fixed',
      label: 'Fixed · 30 days',
      value: String(s.resolved30d),
      hint: `${s.reportsMerged} repeat reports merged`,
      hintTone: 'good',
      icon: 'checkCircle',
      iconTone: 'blue',
    },
    {
      id: 'speed',
      label: 'Time to sort a report',
      value: triage ? `${triage.toFixed(1)} s` : '–',
      hint: 'AI reads, sorts and routes it',
      icon: 'sparkles',
      iconTone: 'orange',
    },
  ]
})

useHead({ title: computed(() => `${pageTitle.value} · urban.bee`) })
</script>

<template>
  <!-- Keyed by scope: switching departments replays the entrance staggers -->
  <div :key="scopeId" class="dash-page">
    <header class="page-head u-rise">
      <div class="page-head__text">
        <h1 class="page-head__title">{{ pageTitle }}</h1>
        <p class="page-head__sub">
          <span class="page-head__live"><span class="page-head__pulse" />Live</span>
          Updated {{ updatedLabel }}
        </p>
      </div>
      <div class="page-head__actions">
        <UiButton variant="outline" size="sm" icon-left="refresh" @click="refresh()">Refresh</UiButton>
        <UiButton variant="primary" size="sm" icon-left="map" to="/complaints">Open map</UiButton>
      </div>
    </header>

    <UiEmptyState
      v-if="error && !overview"
      tone="danger"
      icon="alert"
      title="We couldn't load the overview"
      description="Check your connection and try again."
    >
      <UiButton variant="outline" size="sm" icon-left="refresh" @click="refresh()">Try again</UiButton>
    </UiEmptyState>

    <template v-else>
      <section class="stat-grid" aria-label="Key numbers">
        <template v-if="pending">
          <UiCard v-for="i in 4" :key="i"><UiSkeleton height="86px" /></UiCard>
        </template>
        <DashStatCard
          v-for="(metric, i) in stats"
          v-else
          :key="metric.id"
          :metric="metric"
          class="u-rise"
          :style="{ '--stagger': `${i * 35}ms` }"
        />
      </section>

      <section v-if="overview" class="panel-grid" aria-label="Trends">
        <DashActivityChart class="u-rise" :series="overview.series" :style="{ '--stagger': '160ms' }" />
        <DashPriorityCard class="u-rise" :mix="overview.priority" :style="{ '--stagger': '200ms' }" />
      </section>

      <section v-if="overview" class="panel-grid panel-grid--even" aria-label="Teams and urgent problems">
        <DashDepartmentTable
          class="u-rise"
          :departments="overview.departments"
          :active-id="scopeId === 'all' ? undefined : scopeId"
          :style="{ '--stagger': '240ms' }"
          @select="(id) => navigateTo(`/departments#${id}`)"
        />
        <DashCriticalList class="u-rise" :complaints="overview.latestCritical" :style="{ '--stagger': '260ms' }" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.dash-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-head__title {
  font-size: 25px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}

.page-head__sub {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  font-size: 13.5px;
  color: var(--ink-3);
}

.page-head__live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 8px;
  border-radius: var(--r-pill);
  background: var(--success-bg);
  color: var(--success);
  font-size: 11.5px;
  font-weight: 700;
}

.page-head__pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: live-pulse 1.8s var(--ease-in-out) infinite;
}

@keyframes live-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.page-head__actions {
  display: flex;
  gap: 10px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.panel-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  align-items: stretch;
}

.panel-grid--even {
  grid-template-columns: 3fr 2fr;
  align-items: start;
}

@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1280px) {
  .panel-grid--even { grid-template-columns: 1fr; }
}

@media (max-width: 980px) {
  .panel-grid { grid-template-columns: 1fr; }
}

@media (max-width: 620px) {
  .stat-grid { grid-template-columns: 1fr; }
}
</style>
