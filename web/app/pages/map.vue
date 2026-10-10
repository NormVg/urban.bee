<script setup lang="ts">
import { SEVERITY_META, SEVERITY_ORDER, STATUS_FILTERS, STATUS_META } from '~/constants/complaints'

/**
 * Live map: the whole screen is the map. A small floating panel shows what
 * is on it and switches status; clicking a pin opens a preview card.
 */
definePageMeta({ layout: 'dashboard', fullBleed: true })

const { activeDepartment } = useDepartmentScope()
const { complaints, pending, initialLoading, refresh, statusId } = useComplaints()

const selectedId = ref<string | null>(null)
const selected = computed(() => complaints.value.find((c) => c.id === selectedId.value) ?? null)
const age = useTimeAgo(() => selected.value?.createdAt ?? new Date().toISOString())

const counts = computed(() =>
  SEVERITY_ORDER.map((s) => ({ id: s, ...SEVERITY_META[s], n: complaints.value.filter((c) => c.severity === s).length })),
)
const urgent = computed(() => complaints.value.filter((c) => c.priority === 'P1').length)

/* Live: pins appear without a reload. */
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => (timer = setInterval(() => refresh(), 20_000)))
onBeforeUnmount(() => clearInterval(timer))

watch(statusId, () => (selectedId.value = null))

const map = ref<{ fitAll: () => void } | null>(null)
useHead({ title: 'Live map · urban.bee' })
</script>

<template>
  <div class="lmap">
    <ClientOnly>
      <ComplaintMap ref="map" :complaints="complaints" :selected-id="selectedId" @select="(id) => (selectedId = id)">
        <!-- Floating summary + status switch -->
        <div class="lmap__panel u-rise">
          <div class="lmap__panel-head">
            <div class="lmap__heading">
              <h1 class="lmap__title">{{ activeDepartment?.label ?? 'Live map' }}</h1>
              <p class="lmap__sub tnum">
                <span class="lmap__live"><span class="lmap__pulse" />Live</span>
                <template v-if="initialLoading">Loading…</template>
                <template v-else>
                  {{ complaints.length }} on the map<template v-if="urgent"> · <b>{{ urgent }} urgent</b></template>
                </template>
              </p>
            </div>
            <UiSpinner v-if="pending && !initialLoading" :size="14" />
          </div>

          <UiSegmented v-model="statusId" :options="STATUS_FILTERS" label="Status" block />

          <ul class="lmap__counts">
            <li v-for="c in counts" :key="c.id" :class="{ 'is-empty': !c.n }">
              <i :style="{ background: c.color }" />
              <span>{{ c.label }}</span>
              <b class="tnum">{{ c.n }}</b>
            </li>
          </ul>
        </div>

        <div class="lmap__tools">
          <UiButton variant="secondary" size="sm" icon-left="locate" @click="map?.fitAll()">Show all</UiButton>
        </div>

        <!-- Preview of the clicked pin -->
        <Transition name="lmap-card">
          <article v-if="selected" :key="selected.id" class="lmap__card" aria-live="polite">
            <button type="button" class="lmap__close" aria-label="Close preview" @click="selectedId = null">
              <UiIcon name="close" :size="16" />
            </button>
            <img :src="selected.coverPhotoUrl" alt="" class="lmap__photo" />
            <div class="lmap__card-body">
              <div class="lmap__badges">
                <ComplaintPriorityBadge :priority="selected.priority" />
                <UiBadge :tone="STATUS_META[selected.status].tone">{{ STATUS_META[selected.status].label }}</UiBadge>
                <span class="lmap__age">{{ age }}</span>
              </div>
              <h2 class="lmap__card-title">{{ selected.title }}</h2>
              <p class="lmap__card-meta">{{ selected.departmentLabel }}<template v-if="selected.reportCount > 1"> · {{ selected.reportCount }} people</template></p>
              <p v-if="selected.address" class="lmap__card-addr"><UiIcon name="mapPin" :size="13" /> {{ selected.address }}</p>
              <UiButton variant="primary" size="sm" block icon-right="arrowUpRight" :to="`/complaints?id=${selected.id}`">
                Open details
              </UiButton>
            </div>
          </article>
        </Transition>
      </ComplaintMap>
    </ClientOnly>
  </div>
</template>

<style scoped>
.lmap {
  position: relative;
  height: var(--page-h);
}

.lmap__panel {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 2;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: var(--r-md);
  background: rgba(253, 250, 243, 0.96);
  border: 1px solid var(--line);
  box-shadow: var(--sh-3);
}

.lmap__panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.lmap__heading { min-width: 0; }

.lmap__title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.015em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lmap__sub {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
  font-size: 12.5px;
  color: var(--ink-3);
  white-space: nowrap;
}

.lmap__sub b { color: var(--danger); font-weight: 700; }

.lmap__live {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 1px 7px;
  border-radius: var(--r-pill);
  background: var(--success-bg);
  color: var(--success);
  font-size: 11px;
  font-weight: 700;
}

.lmap__pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: lmap-pulse 1.8s var(--ease-in-out) infinite;
}

@keyframes lmap-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

.lmap__counts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.lmap__counts li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--r-sm);
  background: var(--surface-inset);
  font-size: 12.5px;
  color: var(--ink-2);
}

.lmap__counts li.is-empty { opacity: 0.55; }
.lmap__counts i { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.lmap__counts b { margin-left: auto; font-weight: 700; color: var(--ink); }

.lmap__tools {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
}

.lmap__card {
  position: absolute;
  /* below "Show all", clear of the zoom buttons in the bottom-right corner */
  top: 64px;
  right: 16px;
  z-index: 3;
  width: 340px;
  overflow: hidden;
  border-radius: var(--r-md);
  background: var(--surface-2);
  border: 1px solid var(--line);
  box-shadow: var(--sh-3);
}

.lmap__close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: rgba(36, 28, 19, 0.6);
  color: #fff;
  cursor: pointer;
}

.lmap__photo {
  display: block;
  width: 100%;
  height: 160px;
  object-fit: cover;
  background: var(--surface-inset);
}

.lmap__card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px 16px;
}

.lmap__badges { display: flex; align-items: center; gap: 6px; }
.lmap__age { margin-left: auto; font-size: 12px; color: var(--ink-3); white-space: nowrap; }

.lmap__card-title {
  margin-top: 2px;
  font-size: 15.5px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--ink);
}

.lmap__card-meta { font-size: 12.5px; color: var(--ink-2); }

.lmap__card-addr {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
  font-size: 12.5px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lmap-card-enter-active,
.lmap-card-leave-active {
  transition:
    opacity var(--t-med) var(--ease-out),
    transform var(--t-med) var(--ease-out);
}

.lmap-card-enter-from,
.lmap-card-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 640px) {
  .lmap__panel { left: 10px; right: 10px; top: 10px; width: auto; }
  .lmap__counts { display: none; }
  .lmap__tools { display: none; }
  .lmap__card { left: 10px; right: 10px; bottom: 10px; width: auto; }
}
</style>
