<script setup lang="ts">
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, Popup } from 'maplibre-gl'
import type { Point } from 'geojson'
// Vite moves maplibre's bundle when pre-bundling, so its worker must be pointed at explicitly.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import type { ComplaintSummary, ReportRelation } from '#shared/types/complaint'
import { PRIORITY_META, SEVERITY_META } from '~/constants/complaints'

/**
 * Live complaint map: MapLibre GL + OpenFreeMap vector tiles (no API key).
 *  - clustered points coloured by severity, sized by number of reporters
 *  - urgent (P1) points pulse
 *  - complaints that cover an area (extensions) draw a soft shaded circle
 *  - "mini" mode shows one complaint with each citizen's report point
 * Map state lives in MapLibre, not Vue reactivity (AGENTS.md performance rules).
 */

const props = withDefaults(
  defineProps<{
    complaints: ComplaintSummary[]
    selectedId?: string | null
    hoveredId?: string | null
    mini?: boolean
    /** Mini mode: each report's point */
    points?: { latitude: number; longitude: number; relation: ReportRelation }[]
  }>(),
  { selectedId: null, hoveredId: null, mini: false, points: () => [] },
)

const emit = defineEmits<{ select: [id: string] }>()

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'
const FALLBACK_CENTER: [number, number] = [77.5946, 12.9716]

const container = ref<HTMLElement | null>(null)
const ready = ref(false)
const failed = ref(false)
let map: MapLibreMap | null = null
let popup: Popup | null = null
let pulseFrame = 0
let lastFitKey = ''

/** CSS tokens → concrete colours for the WebGL layers. */
function token(name: string, fallback: string): string {
  if (!import.meta.client) return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function toFeatures(list: ComplaintSummary[]) {
  return {
    type: 'FeatureCollection' as const,
    features: list.map((c) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [c.longitude, c.latitude] },
      properties: {
        id: c.id,
        title: c.title,
        severity: c.severity,
        priority: c.priority,
        reports: c.reportCount,
        urgent: c.priority === 'P1' ? 1 : 0,
      },
    })),
  }
}

/** Circle polygon (64 steps) approximating an affected area of radius m. */
function circlePolygon(lng: number, lat: number, radiusM: number) {
  const coords: [number, number][] = []
  const dLat = radiusM / 111_320
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180))
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2
    coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)])
  }
  return coords
}

function toExtents(list: ComplaintSummary[]) {
  return {
    type: 'FeatureCollection' as const,
    features: list
      .filter((c) => c.extentM > 0)
      .map((c) => ({
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [circlePolygon(c.longitude, c.latitude, Math.max(c.extentM, 15) + 8)] },
        properties: { id: c.id, severity: c.severity },
      })),
  }
}

function toReportPoints() {
  return {
    type: 'FeatureCollection' as const,
    features: props.points.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
      properties: { relation: p.relation },
    })),
  }
}

function fitToData(animate: boolean) {
  if (!map) return
  const coords = [
    ...props.complaints.map((c) => [c.longitude, c.latitude] as [number, number]),
    ...props.points.map((p) => [p.longitude, p.latitude] as [number, number]),
  ]
  if (coords.length === 0) return
  if (coords.length === 1) {
    map.easeTo({ center: coords[0], zoom: props.mini ? 16.5 : 15, duration: animate ? 500 : 0 })
    return
  }
  const lngs = coords.map((c) => c[0])
  const lats = coords.map((c) => c[1])
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    { padding: props.mini ? 48 : 64, maxZoom: props.mini ? 17.5 : 15.5, duration: animate ? 600 : 0 },
  )
}

function syncData() {
  if (!map || !ready.value) return
  ;(map.getSource('complaints') as GeoJSONSource | undefined)?.setData(toFeatures(props.complaints))
  ;(map.getSource('extents') as GeoJSONSource | undefined)?.setData(toExtents(props.complaints))
  ;(map.getSource('report-points') as GeoJSONSource | undefined)?.setData(toReportPoints())

  // Refit only when the set of complaints changes (filters), not on a live refresh.
  const key = props.complaints.map((c) => c.id).sort().join(',')
  if (key !== lastFitKey) {
    fitToData(lastFitKey !== '')
    lastFitKey = key
  }
}

function syncHighlight() {
  if (!map || !ready.value) return
  map.setFilter('complaint-selected', ['==', ['get', 'id'], props.selectedId ?? ''])
  map.setFilter('complaint-hover', ['==', ['get', 'id'], props.hoveredId ?? ''])
}

function severityColorExpression() {
  return [
    'match',
    ['get', 'severity'],
    'critical', token('--danger', SEVERITY_META.critical.color),
    'high', token('--orange', '#e6683f'),
    'medium', token('--warning', '#a06f22'),
    token('--success', '#4a7b5a'),
  ] as unknown as string
}

function addLayers(m: MapLibreMap) {
  const blue = token('--blue', '#1c4f78')
  const surface = token('--surface-2', '#fdfaf3')
  const onBlue = token('--on-blue', '#efe9dc')

  m.addSource('extents', { type: 'geojson', data: toExtents(props.complaints) })
  m.addLayer({
    id: 'extent-fill',
    type: 'fill',
    source: 'extents',
    paint: { 'fill-color': severityColorExpression(), 'fill-opacity': 0.14 },
  })
  m.addLayer({
    id: 'extent-line',
    type: 'line',
    source: 'extents',
    paint: { 'line-color': severityColorExpression(), 'line-opacity': 0.45, 'line-width': 1.5, 'line-dasharray': [2, 2] },
  })

  m.addSource('complaints', {
    type: 'geojson',
    data: toFeatures(props.complaints),
    cluster: !props.mini,
    clusterRadius: 44,
    clusterMaxZoom: 14,
    clusterProperties: { urgent: ['+', ['get', 'urgent']] },
  })

  if (!props.mini) {
    m.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'complaints',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': blue,
        'circle-opacity': 0.92,
        'circle-radius': ['step', ['get', 'point_count'], 16, 5, 20, 12, 25],
        'circle-stroke-width': ['case', ['>', ['get', 'urgent'], 0], 3, 2],
        'circle-stroke-color': ['case', ['>', ['get', 'urgent'], 0], token('--danger', '#b0442f'), surface],
      },
    })
    m.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'complaints',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Noto Sans Bold'],
        'text-size': 12.5,
        'text-allow-overlap': true,
      },
      paint: { 'text-color': onBlue },
    })
  }

  const unclustered: ['!', ['has', string]] = ['!', ['has', 'point_count']]

  m.addLayer({
    id: 'complaint-pulse',
    type: 'circle',
    source: 'complaints',
    filter: ['all', unclustered, ['==', ['get', 'urgent'], 1]],
    paint: {
      'circle-color': token('--danger', '#b0442f'),
      'circle-radius': 14,
      'circle-opacity': 0.2,
    },
  })
  m.addLayer({
    id: 'complaint-hover',
    type: 'circle',
    source: 'complaints',
    filter: ['==', ['get', 'id'], ''],
    paint: { 'circle-color': blue, 'circle-radius': 17, 'circle-opacity': 0.16 },
  })
  m.addLayer({
    id: 'complaint-points',
    type: 'circle',
    source: 'complaints',
    filter: unclustered,
    paint: {
      'circle-color': severityColorExpression(),
      'circle-radius': ['interpolate', ['linear'], ['get', 'reports'], 1, 7, 3, 9, 6, 11],
      'circle-stroke-width': 2.5,
      'circle-stroke-color': surface,
    },
  })
  m.addLayer({
    id: 'complaint-selected',
    type: 'circle',
    source: 'complaints',
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'circle-color': 'rgba(0,0,0,0)',
      'circle-radius': 15,
      'circle-stroke-width': 3,
      'circle-stroke-color': blue,
    },
  })

  if (props.mini) {
    m.addSource('report-points', { type: 'geojson', data: toReportPoints() })
    m.addLayer({
      id: 'report-points',
      type: 'circle',
      source: 'report-points',
      paint: {
        'circle-color': ['match', ['get', 'relation'], 'extension', token('--warning', '#a06f22'), blue],
        'circle-radius': 5,
        'circle-stroke-width': 2,
        'circle-stroke-color': surface,
      },
    })
  }
}

function bindInteractions(m: MapLibreMap, maplibre: typeof import('maplibre-gl')) {
  if (props.mini) return

  popup = new maplibre.Popup({ closeButton: false, closeOnClick: false, offset: 14, className: 'cmap-popup' })

  m.on('click', 'clusters', async (event: MapLayerMouseEvent) => {
    const feature = event.features?.[0]
    if (!feature) return
    const source = m.getSource('complaints') as GeoJSONSource
    const zoom = await source.getClusterExpansionZoom(feature.properties.cluster_id as number)
    m.easeTo({ center: (feature.geometry as Point).coordinates as [number, number], zoom, duration: 450 })
  })

  m.on('click', 'complaint-points', (event: MapLayerMouseEvent) => {
    const id = event.features?.[0]?.properties.id as string | undefined
    if (id) emit('select', id)
  })

  m.on('mouseenter', 'complaint-points', (event: MapLayerMouseEvent) => {
    m.getCanvas().style.cursor = 'pointer'
    const f = event.features?.[0]
    if (!f || !popup) return
    const p = f.properties as { title: string; priority: keyof typeof PRIORITY_META; reports: number }
    const meta = PRIORITY_META[p.priority]
    const el = document.createElement('div')
    const title = document.createElement('strong')
    title.textContent = p.title
    const sub = document.createElement('span')
    sub.textContent = `${p.priority} · ${meta.label}${p.reports > 1 ? ` · ${p.reports} people` : ''}`
    el.append(title, sub)
    popup.setLngLat((f.geometry as Point).coordinates as [number, number]).setDOMContent(el).addTo(m)
  })
  m.on('mouseleave', 'complaint-points', () => {
    m.getCanvas().style.cursor = ''
    popup?.remove()
  })
  m.on('mouseenter', 'clusters', () => (m.getCanvas().style.cursor = 'pointer'))
  m.on('mouseleave', 'clusters', () => (m.getCanvas().style.cursor = ''))
}

/** Urgent points breathe; disabled under reduced motion. */
function startPulse(m: MapLibreMap) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const started = performance.now()
  const tick = (now: number) => {
    const t = ((now - started) % 1800) / 1800
    m.setPaintProperty('complaint-pulse', 'circle-radius', 10 + t * 16)
    m.setPaintProperty('complaint-pulse', 'circle-opacity', 0.32 * (1 - t))
    pulseFrame = requestAnimationFrame(tick)
  }
  pulseFrame = requestAnimationFrame(tick)
}

/** Give up waiting for the tile style after this long and offer a retry. */
const LOAD_TIMEOUT_MS = 15_000
let resizeObserver: ResizeObserver | null = null
let loadTimer: ReturnType<typeof setTimeout> | undefined

function destroyMap() {
  cancelAnimationFrame(pulseFrame)
  clearTimeout(loadTimer)
  popup?.remove()
  popup = null
  map?.remove()
  map = null
  ready.value = false
  lastFitKey = ''
}

/*
 * Blank/black map causes handled here:
 *  - the container changes size after start-up (layout settling, drawer,
 *    sidebar) and MapLibre keeps the old canvas size: a ResizeObserver
 *    calls map.resize() on every size change;
 *  - the tile style is slow or fails: a timeout and the error event show a
 *    retry instead of an endless "Loading map";
 *  - the browser drops the WebGL context: the map is rebuilt.
 */
async function createMap() {
  if (!container.value) return
  destroyMap()
  failed.value = false
  try {
    const maplibre = await import('maplibre-gl')
    maplibre.setWorkerUrl(maplibreWorkerUrl)
    if (!container.value) return
    const first = props.complaints[0]
    const m = new maplibre.Map({
      container: container.value,
      style: STYLE_URL,
      center: first ? [first.longitude, first.latitude] : FALLBACK_CENTER,
      zoom: props.mini ? 16 : 12,
      attributionControl: { compact: true },
      cooperativeGestures: props.mini,
    })
    map = m
    if (!props.mini) m.addControl(new maplibre.NavigationControl({ showCompass: false }), 'bottom-right')

    loadTimer = setTimeout(() => {
      if (!ready.value) failed.value = true
    }, LOAD_TIMEOUT_MS)

    m.on('load', () => {
      if (map !== m) return
      clearTimeout(loadTimer)
      addLayers(m)
      bindInteractions(m, maplibre)
      ready.value = true
      failed.value = false
      m.resize()
      syncHighlight()
      syncData()
      startPulse(m)
    })
    m.on('error', (event) => {
      if (ready.value) return
      console.warn('[map]', event.error?.message)
      // Only a failed style is fatal before load; a missing tile is not.
      if (!m.isStyleLoaded() && /style/i.test(event.error?.message ?? '')) failed.value = true
    })
    m.on('webglcontextlost', () => {
      console.warn('[map] WebGL context lost, rebuilding')
      setTimeout(() => void createMap(), 300)
    })
  } catch (error) {
    console.error('[map] failed to start', error)
    failed.value = true
  }
}

onMounted(() => {
  void createMap()
  if (container.value && 'ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(() => map?.resize())
    resizeObserver.observe(container.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  destroyMap()
})

watch(() => [props.complaints, props.points], syncData)
watch(() => [props.selectedId, props.hoveredId], syncHighlight)

/** Pan to the selected complaint when it is chosen from the list. */
watch(
  () => props.selectedId,
  (id) => {
    const c = props.complaints.find((x) => x.id === id)
    if (c && map && !props.mini) {
      map.easeTo({ center: [c.longitude, c.latitude], zoom: Math.max(map.getZoom(), 15), duration: 500 })
    }
  },
)

defineExpose({ fitAll: () => fitToData(true), resize: () => map?.resize() })
</script>

<template>
  <div class="cmap" :class="{ 'cmap--mini': mini }">
    <div ref="container" class="cmap__canvas" />
    <Transition name="cmap-fade">
      <div v-if="!ready && !failed" class="cmap__loading" aria-hidden="true">
        <UiSpinner :size="20" />
        <span>Loading map…</span>
      </div>
    </Transition>
    <div v-if="failed" class="cmap__loading cmap__loading--failed" role="alert">
      <UiIcon name="alert" :size="18" />
      <span>The map couldn't load. Check your internet connection.</span>
      <UiButton variant="outline" size="sm" icon-left="refresh" @click="createMap()">Try again</UiButton>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.cmap {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 240px;
  overflow: hidden;
  background: var(--surface-inset);
  contain: layout paint;
}

.cmap--mini {
  border-radius: var(--r-md);
  border: 1px solid var(--line);
  contain: layout paint;
}

.cmap__canvas {
  position: absolute;
  inset: 0;
}

.cmap__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  color: var(--ink-3);
  background: var(--surface-inset);
}

.cmap__loading--failed {
  flex-direction: column;
  z-index: 3;
  text-align: center;
  padding: 24px;
}

.cmap-fade-leave-active { transition: opacity 300ms var(--ease-out); }
.cmap-fade-leave-to { opacity: 0; }

:deep(.cmap-popup .maplibregl-popup-content) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 12px;
  border-radius: var(--r-sm);
  background: var(--ink);
  color: var(--surface-2);
  box-shadow: var(--sh-3);
  font-family: var(--font-sans);
  font-size: 12px;
  max-width: 240px;
}
:deep(.cmap-popup .maplibregl-popup-content strong) { font-size: 13px; font-weight: 650; }
:deep(.cmap-popup .maplibregl-popup-content span) { opacity: 0.75; }
:deep(.cmap-popup .maplibregl-popup-tip) { border-top-color: var(--ink); border-bottom-color: var(--ink); }
:deep(.maplibregl-ctrl-group) { border-radius: var(--r-sm); box-shadow: var(--sh-2); }
</style>
