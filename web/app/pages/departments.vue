<script setup lang="ts">
import { DEPARTMENTS, OPEN_STATUSES } from '#shared/triage/taxonomy'
import { departmentIcon } from '~/constants/complaints'
import { formatTimeAgo } from '~/composables/useTimeAgo'
import { ComplaintService } from '~/services/complaint.service'

definePageMeta({ layout: 'dashboard' })

const { scopeId } = useDepartmentScope()

/* City-wide data regardless of scope: this page compares teams. */
const { data, status, error, refresh } = useAsyncData('departments-page', async () => {
  const [overview, open] = await Promise.all([
    ComplaintService.overview(),
    ComplaintService.list({ status: [...OPEN_STATUSES] }),
  ])
  return { overview, open }
})
const pending = computed(() => status.value === 'pending' && !data.value)

const STATUS = {
  healthy: { tone: 'success', label: 'On track' },
  watch: { tone: 'warning', label: 'Watch' },
  critical: { tone: 'danger', label: 'Needs help' },
} as const

const cards = computed(() => {
  if (!data.value) return []
  const rows = DEPARTMENTS.map((d) => {
    const row = data.value!.overview.departments.find((x) => x.id === d.id)
    const mine = data.value!.open.filter((c) => c.department === d.id)
    const byCategory = new Map<string, number>()
    for (const c of mine) byCategory.set(c.categoryLabel, (byCategory.get(c.categoryLabel) ?? 0) + 1)
    const oldest = [...mine].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
    return {
      ...d,
      iconName: departmentIcon(d.icon),
      open: row?.open ?? 0,
      p1: row?.p1 ?? 0,
      resolved: row?.resolved ?? 0,
      status: (row?.status ?? 'healthy') as keyof typeof STATUS,
      top: [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      oldest,
    }
  })
  return rows.sort((a, b) => b.p1 - a.p1 || b.open - a.open || a.label.localeCompare(b.label))
})

/* Workload bars are relative to the busiest team. */
const maxOpen = computed(() => Math.max(1, ...cards.value.map((c) => c.open)))

const summary = computed(() => {
  const c = cards.value
  return [
    { id: 'open', label: 'Open problems', value: c.reduce((s, d) => s + d.open, 0), icon: 'inbox' as const },
    { id: 'urgent', label: 'Urgent (P1)', value: c.reduce((s, d) => s + d.p1, 0), icon: 'alert' as const, hot: true },
    { id: 'fixed', label: 'Fixed · 30 days', value: c.reduce((s, d) => s + d.resolved, 0), icon: 'checkCircle' as const },
    { id: 'help', label: 'Teams needing help', value: c.filter((d) => d.status !== 'healthy').length, icon: 'users' as const },
  ]
})

function openIn(id: string, path: '/map' | '/complaints') {
  scopeId.value = id
  navigateTo(path)
}

useHead({ title: 'Teams · urban.bee' })
</script>

<template>
  <div class="deps">
    <DashPageHeader title="Teams" subtitle="Every report is routed to one of these teams automatically. Busiest first.">
      <template #actions>
        <UiButton variant="outline" size="sm" icon-left="refresh" :loading="status === 'pending' && !!data" @click="refresh()">
          Refresh
        </UiButton>
      </template>
    </DashPageHeader>

    <UiEmptyState v-if="error && !data" tone="danger" icon="alert" title="We couldn't load the teams" description="Check your connection and try again.">
      <UiButton variant="outline" size="sm" icon-left="refresh" @click="refresh()">Try again</UiButton>
    </UiEmptyState>

    <template v-else>
      <!-- City-wide totals across all teams -->
      <section class="deps__summary" aria-label="All teams">
        <template v-if="pending">
          <div v-for="i in 4" :key="i" class="deps__sum"><UiSkeleton width="60%" height="12px" /><UiSkeleton width="35%" height="24px" /></div>
        </template>
        <div
          v-for="(s, i) in summary"
          v-else
          :key="s.id"
          class="deps__sum u-rise"
          :style="{ '--stagger': `${i * 35}ms` }"
        >
          <p class="deps__sum-label"><UiIcon :name="s.icon" :size="14" /> {{ s.label }}</p>
          <p class="deps__sum-value tnum" :class="{ 'is-hot': s.hot && s.value > 0 }">{{ s.value }}</p>
        </div>
      </section>

      <div class="deps__grid">
        <template v-if="pending">
          <UiCard v-for="i in 8" :key="i">
            <div class="deps__skel">
              <div class="deps__skel-head"><UiSkeleton width="38px" height="38px" radius="var(--r-sm)" /><UiSkeleton width="55%" height="15px" /></div>
              <UiSkeleton height="54px" radius="var(--r-sm)" />
              <UiSkeleton width="70%" height="12px" />
              <UiSkeleton height="32px" radius="var(--r-sm)" />
            </div>
          </UiCard>
        </template>

        <UiCard
          v-for="(d, i) in cards"
          v-else
          :id="d.id"
          :key="d.id"
          hoverable
          class="dept u-rise"
          :class="`dept--${d.status}`"
          :style="{ '--stagger': `${120 + i * 35}ms` }"
        >
          <div class="dept__head">
            <span class="dept__icon"><UiIcon :name="d.iconName" :size="18" /></span>
            <div class="dept__text">
              <h2 class="dept__name" :title="d.label">{{ d.label }}</h2>
              <p class="dept__desc" :title="d.description">{{ d.description }}</p>
            </div>
          </div>

          <div class="dept__state">
            <UiBadge :tone="STATUS[d.status].tone" dot>{{ STATUS[d.status].label }}</UiBadge>
            <span v-if="d.oldest" class="dept__oldest"><UiIcon name="clock" :size="12" /> Oldest {{ formatTimeAgo(d.oldest.createdAt) }}</span>
          </div>

          <dl class="dept__stats">
            <div><dt>Open</dt><dd class="tnum">{{ d.open }}</dd></div>
            <div><dt>Urgent</dt><dd class="tnum" :class="{ 'is-hot': d.p1 }">{{ d.p1 }}</dd></div>
            <div><dt>Fixed</dt><dd class="tnum">{{ d.resolved }}</dd></div>
          </dl>

          <div class="dept__load" :aria-label="`Workload: ${d.open} open`">
            <span :style="{ width: `${(d.open / maxOpen) * 100}%` }" />
          </div>

          <div class="dept__cats">
            <template v-if="d.top.length">
              <span v-for="[label, n] in d.top" :key="label" class="dept__cat" :title="label">
                <span class="dept__cat-label">{{ label }}</span> <b class="tnum">{{ n }}</b>
              </span>
            </template>
            <span v-else class="dept__none"><UiIcon name="checkCircle" :size="13" /> No open problems</span>
          </div>

          <div class="dept__actions">
            <UiButton variant="outline" size="sm" icon-left="mapPin" @click="openIn(d.id, '/map')">Map</UiButton>
            <UiButton variant="ghost" size="sm" icon-right="chevronRight" @click="openIn(d.id, '/complaints')">Problems</UiButton>
          </div>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<style scoped>
.deps { display: flex; flex-direction: column; gap: 20px; }

.deps__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--surface);
  box-shadow: var(--sh-1);
  overflow: hidden;
}

.deps__sum {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  min-width: 0;
}

.deps__sum + .deps__sum { border-left: 1px solid var(--line); }

.deps__sum-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 550;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deps__sum-value { font-size: 24px; font-weight: 700; line-height: 1.1; letter-spacing: -0.015em; }
.deps__sum-value.is-hot { color: var(--danger); }

.deps__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.deps__skel { display: flex; flex-direction: column; gap: 14px; }
.deps__skel-head { display: flex; align-items: center; gap: 12px; }

.dept { height: 100%; }

.dept :deep(.ui-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* A thin top accent tells team health at a glance. */
.dept--watch { box-shadow: inset 0 3px 0 var(--warning), var(--sh-1); }
.dept--critical { box-shadow: inset 0 3px 0 var(--danger), var(--sh-1); }

.dept__head { display: flex; align-items: center; gap: 12px; min-width: 0; }

.dept__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
  background: var(--blue-tint);
  color: var(--blue);
}

.dept__text { flex: 1; min-width: 0; }

.dept__name,
.dept__desc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dept__name { font-size: 15px; font-weight: 700; }
.dept__desc { margin-top: 1px; font-size: 12.5px; color: var(--ink-3); }

.dept__state {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 22px;
}

.dept__oldest {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
}

.dept__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--r-sm);
  background: var(--surface-inset);
}

.dept__stats dt {
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.dept__stats dd { margin: 3px 0 0; font-size: 22px; font-weight: 700; line-height: 1; }
.dept__stats dd.is-hot { color: var(--danger); }

.dept__load {
  height: 4px;
  margin-top: -4px;
  border-radius: var(--r-pill);
  background: var(--surface-inset);
  overflow: hidden;
}

.dept__load span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--blue);
  transition: width 500ms var(--ease-out);
}

.dept--critical .dept__load span { background: var(--danger); }
.dept--watch .dept__load span { background: var(--warning); }

.dept__cats {
  display: flex;
  gap: 6px;
  min-height: 24px;
  overflow: hidden;
}

.dept__cat {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  padding: 3px 9px;
  border-radius: var(--r-pill);
  background: var(--surface-inset);
  font-size: 12px;
  color: var(--ink-2);
  white-space: nowrap;
}

.dept__cat-label { overflow: hidden; text-overflow: ellipsis; }
.dept__cat b { margin-left: 4px; color: var(--ink); }

.dept__none {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--success);
}

.dept__actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

@media (max-width: 900px) {
  .deps__summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .deps__sum:nth-child(3) { border-left: none; }
  .deps__sum:nth-child(n + 3) { border-top: 1px solid var(--line); }
}
</style>
