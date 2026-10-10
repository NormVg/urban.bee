<script setup lang="ts">
import type { StatMetric } from '~/types/dashboard'

definePageMeta({ layout: 'dashboard' })

const { scopeId, activeDepartment } = useDepartmentScope()
const { overview, pending, refreshing, error, refresh } = useOverview()

const pageTitle = computed(() => activeDepartment.value?.label ?? 'City overview')
const updatedAt = ref(new Date())
watch(overview, () => (updatedAt.value = new Date()))
const updatedLabel = useTimeAgo(() => updatedAt.value.toISOString())

/* Computed once on the server and reused on the client so both render the same text. */
const today = useState('overview-today', () =>
  new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
)

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
      hint: s.reportsMerged === 1 ? '1 repeat report merged' : `${s.reportsMerged} repeat reports merged`,
      hintTone: 'good',
      icon: 'checkCircle',
      iconTone: 'blue',
    },
    {
      id: 'speed',
      label: 'Time to sort a report',
      value: triage ? `${triage.toFixed(1)} s` : '–',
      hint: 'Routed by AI',
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
    <DashPageHeader :title="pageTitle">
      <template #meta>
        <span>{{ today }}</span>
        <span class="dash-page__live"><span class="dash-page__pulse" />Live</span>
        <span>Updated {{ updatedLabel }}</span>
      </template>
      <template #actions>
        <UiButton variant="outline" size="sm" icon-left="refresh" :loading="refreshing" @click="refresh()">
          Refresh
        </UiButton>
        <UiButton variant="primary" size="sm" icon-left="mapPin" to="/map">Live map</UiButton>
      </template>
    </DashPageHeader>

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
          <UiCard v-for="i in 4" :key="i" class="stat-skel">
            <div class="stat-skel__body">
              <UiSkeleton width="55%" height="12px" />
              <UiSkeleton width="40%" height="28px" />
              <UiSkeleton width="70%" height="20px" radius="var(--r-pill)" />
            </div>
          </UiCard>
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

      <section class="panel-grid" aria-label="Trends">
        <template v-if="pending">
          <DashPanelSkeleton variant="chart" height="240px" />
          <DashPanelSkeleton :rows="4" height="240px" />
        </template>
        <template v-else-if="overview">
          <DashActivityChart class="u-rise" :series="overview.series" :style="{ '--stagger': '160ms' }" />
          <DashPriorityCard class="u-rise" :mix="overview.priority" :style="{ '--stagger': '200ms' }" />
        </template>
      </section>

      <section class="panel-grid panel-grid--wide" aria-label="Teams and urgent problems">
        <template v-if="pending">
          <DashPanelSkeleton :rows="6" height="320px" />
          <DashPanelSkeleton :rows="5" height="320px" />
        </template>
        <template v-else-if="overview">
          <DashDepartmentTable
            class="u-rise"
            :departments="overview.departments"
            :active-id="scopeId === 'all' ? undefined : scopeId"
            :style="{ '--stagger': '240ms' }"
            @select="(id) => navigateTo(`/departments#${id}`)"
          />
          <div class="side-stack">
            <DashCriticalList class="side-stack__grow u-rise" :complaints="overview.latestCritical" :style="{ '--stagger': '270ms' }" />
            <DashSeverityCard class="u-rise" :mix="overview.severity" :style="{ '--stagger': '300ms' }" />
          </div>
        </template>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dash-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dash-page__live {
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

.dash-page__pulse {
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

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.stat-skel__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 112px;
}

/* Cards in a row always share one height (stretch), so rows read as clean bands. */
.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.panel-grid--wide {
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
}

.side-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* The urgent list takes the leftover height so the column ends level with the table. */
.side-stack__grow {
  flex: 1;
  height: auto;
}

@media (max-width: 1180px) {
  .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .panel-grid--wide { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 900px) {
  .panel-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 560px) {
  .stat-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
