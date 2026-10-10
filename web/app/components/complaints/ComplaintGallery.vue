<script setup lang="ts">
import type { ComplaintPhotoDto } from '#shared/types/complaint'
import { RELATION_META } from '~/constants/complaints'

/** Every photo from every linked report, with a keyboard-friendly lightbox. */
const props = defineProps<{ photos: ComplaintPhotoDto[] }>()

const active = ref(0)
const lightbox = ref(false)
const current = computed(() => props.photos[active.value])

watch(
  () => props.photos,
  () => (active.value = 0),
)

function step(delta: number) {
  const n = props.photos.length
  active.value = (active.value + delta + n) % n
}

function onKey(event: KeyboardEvent) {
  if (!lightbox.value) return
  if (event.key === 'ArrowRight') step(1)
  if (event.key === 'ArrowLeft') step(-1)
  if (event.key === 'Escape') {
    event.stopPropagation()
    lightbox.value = false
  }
}
onMounted(() => document.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey, true))
</script>

<template>
  <div v-if="current" class="gallery">
    <button type="button" class="gallery__main" aria-label="Open photo full screen" @click="lightbox = true">
      <Transition name="gallery-fade" mode="out-in">
        <img :key="current.id" :src="current.url" alt="Photo of the reported problem" />
      </Transition>
      <UiBadge v-if="photos.length > 1" :tone="RELATION_META[current.relation].tone" class="gallery__tag">
        {{ RELATION_META[current.relation].label }}
      </UiBadge>
      <span class="gallery__expand"><UiIcon name="expand" :size="15" /></span>
    </button>

    <div v-if="photos.length > 1" class="gallery__thumbs" role="tablist" aria-label="Photos">
      <button
        v-for="(p, i) in photos"
        :key="p.id"
        type="button"
        role="tab"
        :aria-selected="i === active"
        :aria-label="`Photo ${i + 1} of ${photos.length}`"
        class="gallery__thumb"
        :class="{ 'is-active': i === active }"
        @click="active = i"
      >
        <img :src="p.url" alt="" loading="lazy" />
      </button>
    </div>

    <Teleport to="body">
      <Transition name="gallery-fade">
        <div v-if="lightbox" class="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" @click.self="lightbox = false">
          <img :src="current.url" alt="Photo of the reported problem" />
          <button type="button" class="lightbox__btn lightbox__close" aria-label="Close" @click="lightbox = false">
            <UiIcon name="close" :size="20" />
          </button>
          <template v-if="photos.length > 1">
            <button type="button" class="lightbox__btn lightbox__prev" aria-label="Previous photo" @click="step(-1)">
              <UiIcon name="chevronLeft" :size="22" />
            </button>
            <button type="button" class="lightbox__btn lightbox__next" aria-label="Next photo" @click="step(1)">
              <UiIcon name="chevronRight" :size="22" />
            </button>
            <p class="lightbox__count tnum">{{ active + 1 }} / {{ photos.length }}</p>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.gallery {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gallery__main {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: none;
  border-radius: var(--r-md);
  overflow: hidden;
  background: var(--surface-inset);
  cursor: zoom-in;
}

.gallery__main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery__main .gallery__tag {
  position: absolute;
  left: 10px;
  top: 10px;
  background: var(--surface-2);
  box-shadow: var(--sh-1);
}

.gallery__expand {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: inline-flex;
  padding: 7px;
  border-radius: var(--r-sm);
  background: rgba(36, 28, 19, 0.55);
  color: #fff;
  opacity: 0;
  transition: opacity var(--t-fast) var(--ease-in-out);
}
.gallery__main:hover .gallery__expand,
.gallery__main:focus-visible .gallery__expand { opacity: 1; }

.gallery__thumbs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
}

.gallery__thumb {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: var(--surface-inset);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--t-fast) var(--ease-in-out), border-color var(--t-fast) var(--ease-in-out);
}
.gallery__thumb img { width: 100%; height: 100%; object-fit: cover; }
.gallery__thumb:hover { opacity: 1; }
.gallery__thumb.is-active { opacity: 1; border-color: var(--blue); }

.lightbox {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  background: rgba(18, 14, 10, 0.92);
}

.lightbox img {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--r-sm);
  box-shadow: var(--sh-3);
}

.lightbox__btn {
  position: absolute;
  display: inline-flex;
  padding: 10px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  cursor: pointer;
}
.lightbox__btn:hover { background: rgba(255, 255, 255, 0.22); }
.lightbox__close { top: 16px; right: 16px; }
.lightbox__prev { left: 16px; top: 50%; transform: translateY(-50%); }
.lightbox__next { right: 16px; top: 50%; transform: translateY(-50%); }
.lightbox__count {
  position: absolute;
  bottom: 18px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
}

.gallery-fade-enter-active,
.gallery-fade-leave-active { transition: opacity 160ms var(--ease-out); }
.gallery-fade-enter-from,
.gallery-fade-leave-to { opacity: 0; }
</style>
