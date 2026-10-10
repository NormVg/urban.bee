<script setup lang="ts">
definePageMeta({ layout: 'dashboard', fullBleed: true })

const route = useRoute()
const router = useRouter()
const { activeDepartment } = useDepartmentScope()
const { complaints, pending, error, refresh, statusId, severities, search, reviewOnly } = useComplaints()

/* Selected complaint lives in the URL (?id=) so a view can be shared. */
const selectedId = computed<string | null>({
  get: () => (typeof route.query.id === 'string' ? route.query.id : null),
  set: (id) => router.replace({ query: { ...route.query, id: id ?? undefined } }),
})
const hoveredId = ref<string | null>(null)

const { complaint, pending: detailPending, updating, setStatus } = useComplaint(selectedId)

async function onChangeStatus(status: Parameters<typeof setStatus>[0], message: string) {
  if (await setStatus(status, message)) refresh()
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

useHead({ title: computed(() => `${activeDepartment.value?.label ?? 'All'} problems · urban.bee`) })
</script>

<template>
  <div class="cpage">
    <div class="cpage__bar u-rise">
      <div class="cpage__heading">
        <h1 class="cpage__title">{{ activeDepartment ? activeDepartment.label : 'All problems' }}</h1>
        <p class="cpage__sub">Every report on the map, most urgent first</p>
      </div>
      <ComplaintFilters
        v-model:status="statusId"
        v-model:severities="severities"
        v-model:search="search"
        v-model:review-only="reviewOnly"
        class="cpage__filters"
        :result-count="complaints.length"
        :pending="pending"
      />
    </div>

    <div class="cpage__split">
      <section class="cpage__list" aria-label="Problems list">
        <template v-if="pending && complaints.length === 0">
          <div v-for="i in 6" :key="i" class="cpage__skeleton">
            <UiSkeleton width="72px" height="72px" radius="var(--r-sm)" />
            <div class="cpage__skeleton-text">
              <UiSkeleton width="40%" />
              <UiSkeleton width="90%" height="16px" />
              <UiSkeleton width="60%" />
            </div>
          </div>
        </template>

        <UiEmptyState
          v-else-if="error"
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

        <ul v-else class="cpage__items">
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
            <div class="cpage__legend" aria-hidden="true">
              <span><i style="background: var(--danger)" />Critical</span>
              <span><i style="background: var(--orange)" />High</span>
              <span><i style="background: var(--warning)" />Medium</span>
              <span><i style="background: var(--success)" />Low</span>
            </div>
          </ComplaintMap>
        </ClientOnly>
      </section>
    </div>

    <UiDrawer :open="!!selectedId" label="Problem details" @close="selectedId = null">
      <div class="cpage__drawer-bar">
        <UiButton variant="ghost" size="sm" icon-only="close" aria-label="Close" @click="selectedId = null" />
        <UiButton v-if="selectedId" variant="ghost" size="sm" icon-right="externalLink" :to="`/complaints/${selectedId}`">
          Open full page
        </UiButton>
      </div>
      <div class="cpage__drawer-body">
        <div v-if="detailPending" class="cpage__drawer-loading">
          <UiSkeleton height="24px" width="60%" />
          <UiSkeleton height="260px" radius="var(--r-md)" />
          <UiSkeleton height="140px" radius="var(--r-md)" />
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
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 57px);
}

.cpage__bar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px clamp(16px, 3vw, 28px) 14px;
  border-bottom: 1px solid var(--line);
}

.cpage__title {
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.cpage__sub {
  font-size: 13px;
  color: var(--ink-3);
}

.cpage__split {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 400px 1fr;
}

.cpage__list {
  overflow-y: auto;
  padding: 10px;
  border-right: 1px solid var(--line);
}

.cpage__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
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
  display: flex;
  gap: 12px;
  padding: 8px 12px;
  border-radius: var(--r-sm);
  background: rgba(253, 250, 243, 0.92);
  box-shadow: var(--sh-2);
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
}

.cpage__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.cpage__legend i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
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

@media (max-width: 900px) {
  .cpage {
    height: auto;
  }
  .cpage__split {
    grid-template-columns: 1fr;
  }
  .cpage__map {
    order: -1;
    height: 46vh;
  }
  .cpage__list {
    border-right: none;
  }
  .cpage__legend {
    display: none;
  }
}
</style>
