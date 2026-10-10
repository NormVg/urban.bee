<script setup lang="ts">
import type { ComplaintStatus } from '#shared/triage/taxonomy'

definePageMeta({ layout: 'dashboard', fullBleed: true })

const route = useRoute()
const router = useRouter()
const { activeDepartment } = useDepartmentScope()
const { complaints, pending, initialLoading, error, refresh, patchLocal, statusId, severities, search, reviewOnly } =
  useComplaints()

/* Selected complaint lives in the URL (?id=) so a view can be shared. */
const selectedId = computed<string | null>({
  get: () => (typeof route.query.id === 'string' ? route.query.id : null),
  set: (id) => router.replace({ query: { ...route.query, id: id ?? undefined } }),
})
const hoveredId = ref<string | null>(null)

const { complaint, pending: detailPending, updating, setStatus } = useComplaint(selectedId)

/* The list row changes at the same moment as the drawer; the refetch happens quietly after the save. */
async function onChangeStatus(status: ComplaintStatus, message: string) {
  if (!selectedId.value) return
  const id = selectedId.value
  const before = complaints.value.find((c) => c.id === id)?.status
  patchLocal(id, { status })
  const saved = await setStatus(status, message)
  if (!saved && before) patchLocal(id, { status: before })
  else void refresh()
}

/* Keep the list fresh during a live demo. */
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => refresh(), 20_000)))
onBeforeUnmount(() => clearInterval(timer))

/* Scroll the selected card into view when picked on the map. */
watch(selectedId, (id) => {
  if (!id) return
  nextTick(() => document.querySelector(`[data-complaint="${id}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))
})

const map = ref<{ fitAll: () => void } | null>(null)
const title = computed(() => (activeDepartment.value ? activeDepartment.value.label : 'All problems'))
const countLabel = computed(() => `${complaints.value.length} ${complaints.value.length === 1 ? 'problem' : 'problems'}`)

useHead({ title: computed(() => `${title.value} · urban.bee`) })
</script>

<template>
  <div class="cpage">
    <!-- Left: everything about the list in one column (header, filters, results) -->
    <aside class="cpage__panel" aria-label="Problems">
      <div class="cpage__panel-head u-rise">
        <div class="cpage__heading">
          <h1 class="cpage__title">{{ title }}</h1>
          <p class="cpage__count tnum" aria-live="polite">
            <UiSpinner v-if="pending && !initialLoading" :size="12" />
            {{ initialLoading ? 'Loading…' : countLabel }} · most urgent first
          </p>
        </div>
        <UiButton variant="ghost" size="sm" icon-only="refresh" aria-label="Refresh list" :loading="pending && !initialLoading" @click="refresh()" />
      </div>

      <ComplaintFilters
        v-model:status="statusId"
        v-model:severities="severities"
        v-model:search="search"
        v-model:review-only="reviewOnly"
        class="cpage__filters u-rise"
        :style="{ '--stagger': '40ms' }"
      />

      <section class="cpage__list" aria-label="Problems list">
        <template v-if="initialLoading">
          <div v-for="i in 6" :key="i" class="cpage__skeleton">
            <UiSkeleton width="64px" height="64px" radius="var(--r-sm)" />
            <div class="cpage__skeleton-text">
              <UiSkeleton width="30%" height="12px" />
              <UiSkeleton width="85%" height="15px" />
              <UiSkeleton width="55%" height="12px" />
            </div>
          </div>
        </template>

        <UiEmptyState
          v-else-if="error && complaints.length === 0"
          tone="danger"
          icon="alert"
          title="We couldn't load the reports"
          description="Check your connection and try again."
        >
          <UiButton variant="outline" size="sm" icon-left="refresh" @click="refresh()">Try again</UiButton>
        </UiEmptyState>

        <UiEmptyState
          v-else-if="complaints.length === 0"
          icon="checkCircle"
          title="All clear"
          description="Nothing matches these filters right now."
        />

        <ul v-else class="cpage__items" :class="{ 'is-refreshing': pending }">
          <li v-for="(c, i) in complaints" :key="c.id" :data-complaint="c.id" class="u-rise" :style="{ '--stagger': `${Math.min(i, 10) * 25}ms` }">
            <ComplaintListItem
              :complaint="c"
              :selected="c.id === selectedId"
              @select="selectedId = c.id"
              @hover="(on) => (hoveredId = on ? c.id : null)"
            />
          </li>
        </ul>
      </section>
    </aside>

    <!-- Right: the map fills the rest of the screen -->
    <section class="cpage__map" aria-label="Map of problems">
      <ClientOnly>
        <ComplaintMap
          ref="map"
          :complaints="complaints"
          :selected-id="selectedId"
          :hovered-id="hoveredId"
          @select="(id) => (selectedId = id)"
        >
          <div class="cpage__map-tools">
            <UiButton variant="secondary" size="sm" icon-left="locate" @click="map?.fitAll()">Show all</UiButton>
          </div>
          <ComplaintMapLegend class="cpage__legend" />
        </ComplaintMap>
      </ClientOnly>
    </section>

    <UiDrawer :open="!!selectedId" label="Problem details" @close="selectedId = null">
      <div class="cpage__drawer-bar">
        <UiButton variant="ghost" size="sm" icon-only="close" aria-label="Close" @click="selectedId = null" />
        <UiButton v-if="selectedId" variant="ghost" size="sm" icon-right="externalLink" :to="`/complaints/${selectedId}`">
          Open full page
        </UiButton>
      </div>
      <div class="cpage__drawer-body">
        <div v-if="detailPending" class="cpage__drawer-loading">
          <UiSkeleton height="22px" width="35%" />
          <UiSkeleton height="28px" width="80%" />
          <UiSkeleton height="240px" radius="var(--r-md)" />
          <UiSkeleton height="44px" radius="var(--r-sm)" />
          <UiSkeleton height="160px" radius="var(--r-md)" />
        </div>
        <ComplaintDetailView
          v-else-if="complaint"
          :key="complaint.id"
          :complaint="complaint"
          :updating="updating"
          @change="onChangeStatus"
        />
      </div>
    </UiDrawer>
  </div>
</template>

<style scoped>
.cpage {
  display: grid;
  grid-template-columns: 440px minmax(0, 1fr);
  height: var(--page-h);
  min-height: 0;
}

.cpage__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-right: 1px solid var(--line);
  background: var(--bg);
}

.cpage__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 12px;
}

.cpage__heading {
  min-width: 0;
}

.cpage__title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cpage__count {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 3px;
  font-size: 12.5px;
  color: var(--ink-3);
  white-space: nowrap;
}

.cpage__filters {
  padding: 0 20px 14px;
  border-bottom: 1px solid var(--line);
}

.cpage__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px;
}

.cpage__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: opacity var(--t-med) var(--ease-out);
}

/* Filter change in flight: keep the old results visible but quieter instead of flashing skeletons. */
.cpage__items.is-refreshing {
  opacity: 0.6;
}

.cpage__skeleton {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.cpage__skeleton-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cpage__map {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.cpage__map-tools {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
}

.cpage__legend {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 2;
}

.cpage__drawer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
}

.cpage__drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px 40px;
}

.cpage__drawer-loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media (max-width: 1100px) {
  .cpage {
    grid-template-columns: 360px minmax(0, 1fr);
  }
}

@media (max-width: 860px) {
  .cpage {
    display: flex;
    flex-direction: column;
    height: auto;
  }
  .cpage__panel {
    border-right: none;
  }
  .cpage__map {
    order: -1;
    height: 42vh;
  }
  .cpage__list {
    overflow: visible;
  }
  .cpage__legend {
    display: none;
  }
}
</style>
