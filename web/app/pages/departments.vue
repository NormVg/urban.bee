<script setup lang="ts">
import { DEPARTMENTS, OPEN_STATUSES } from '#shared/triage/taxonomy'
import { departmentIcon } from '~/constants/complaints'
import { formatTimeAgo } from '~/composables/useTimeAgo'
import { ComplaintService } from '~/services/complaint.service'

definePageMeta({ layout: 'dashboard' })

const { scopeId } = useDepartmentScope()

/* City-wide data regardless of scope: this page compares teams. */
const { data, pending, error, refresh } = useAsyncData('departments-page', async () => {
  const [overview, open] = await Promise.all([
    ComplaintService.overview(),
    ComplaintService.list({ status: [...OPEN_STATUSES] }),
  ])
  return { overview, open }
})

const cards = computed(() => {
  if (!data.value) return []
  return DEPARTMENTS.map((d) => {
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
      status: row?.status ?? 'healthy',
      top: [...byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      oldest,
    }
  }).sort((a, b) => b.p1 - a.p1 || b.open - a.open)
})

const STATUS = {
  healthy: { tone: 'success', label: 'On track' },
  watch: { tone: 'warning', label: 'Watch' },
  critical: { tone: 'danger', label: 'Needs help' },
} as const

function viewOnMap(id: string) {
  scopeId.value = id
  navigateTo('/complaints')
}

useHead({ title: 'Teams · urban.bee' })
</script>

<template>
  <div class="deps">
    <header class="deps__head u-rise">
      <h1 class="deps__title">Teams</h1>
      <p class="deps__sub">Every report is routed to one of these teams automatically</p>
    </header>

    <UiEmptyState v-if="error" tone="danger" icon="alert" title="We couldn't load the teams" description="Check your connection and try again.">
      <UiButton variant="outline" size="sm" icon-left="refresh" @click="refresh()">Try again</UiButton>
    </UiEmptyState>

    <div v-else class="deps__grid">
      <template v-if="pending">
        <UiCard v-for="i in 8" :key="i"><UiSkeleton height="160px" /></UiCard>
      </template>
      <UiCard
        v-for="(d, i) in cards"
        v-else
        :id="d.id"
        :key="d.id"
        hoverable
        class="dept u-rise"
        :style="{ '--stagger': `${i * 35}ms` }"
      >
        <div class="dept__head">
          <span class="dept__icon"><UiIcon :name="d.iconName" :size="18" /></span>
          <div class="dept__text">
            <h2 class="dept__name">{{ d.label }}</h2>
            <p class="dept__desc">{{ d.description }}</p>
          </div>
          <UiBadge :tone="STATUS[d.status].tone" dot>{{ STATUS[d.status].label }}</UiBadge>
        </div>

        <dl class="dept__stats">
          <div><dt>Open</dt><dd class="tnum">{{ d.open }}</dd></div>
          <div><dt>Urgent</dt><dd class="tnum" :class="{ 'is-hot': d.p1 }">{{ d.p1 }}</dd></div>
          <div><dt>Fixed</dt><dd class="tnum">{{ d.resolved }}</dd></div>
        </dl>

        <div class="dept__foot">
          <p v-if="d.top.length" class="dept__top">
            <span v-for="[label, n] in d.top" :key="label" class="dept__cat">{{ label }} <b class="tnum">{{ n }}</b></span>
          </p>
          <p v-else class="dept__top dept__top--empty">No open problems</p>
          <p v-if="d.oldest" class="dept__oldest">
            <UiIcon name="clock" :size="12" /> Oldest open: {{ formatTimeAgo(d.oldest.createdAt) }}
          </p>
          <UiButton variant="outline" size="sm" icon-left="map" block @click="viewOnMap(d.id)">View on map</UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.deps { display: flex; flex-direction: column; gap: 24px; }
.deps__title { font-size: 25px; font-weight: 700; letter-spacing: -0.02em; }
.deps__sub { margin-top: 4px; font-size: 13.5px; color: var(--ink-3); }

.deps__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.dept :deep(.ui-card__body) {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
}

.dept__head { display: flex; align-items: flex-start; gap: 12px; }

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
.dept__name { font-size: 15px; font-weight: 700; }
.dept__desc { margin-top: 2px; font-size: 12.5px; color: var(--ink-3); line-height: 1.4; }

.dept__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  padding: 12px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.dept__stats dt {
  font-size: 10.5px;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.dept__stats dd { margin: 2px 0 0; font-size: 22px; font-weight: 700; }
.dept__stats dd.is-hot { color: var(--danger); }

.dept__foot { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }

.dept__top { display: flex; flex-wrap: wrap; gap: 6px; }
.dept__top--empty { font-size: 12.5px; color: var(--ink-3); }

.dept__cat {
  padding: 3px 9px;
  border-radius: var(--r-pill);
  background: var(--surface-inset);
  font-size: 12px;
  color: var(--ink-2);
}
.dept__cat b { margin-left: 3px; color: var(--ink); }

.dept__oldest {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-3);
}
</style>
