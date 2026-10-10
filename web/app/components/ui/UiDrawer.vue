<script setup lang="ts">
/**
 * Right-side panel (full-screen sheet on mobile). Closes on Escape and on
 * backdrop click; focus moves into the panel when it opens.
 */
const props = defineProps<{ open: boolean; label: string }>()
const emit = defineEmits<{ close: [] }>()

const panel = ref<HTMLElement | null>(null)

function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.open) emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) nextTick(() => panel.value?.focus())
  },
)

onMounted(() => document.addEventListener('keydown', onKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="open" class="ui-drawer__backdrop" aria-hidden="true" @click="emit('close')" />
    </Transition>
    <Transition name="drawer-slide">
      <aside
        v-if="open"
        ref="panel"
        class="ui-drawer"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        tabindex="-1"
      >
        <slot />
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ui-drawer__backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(36, 28, 19, 0.28);
}

.ui-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 61;
  width: min(560px, 100vw);
  display: flex;
  flex-direction: column;
  background: var(--bg);
  box-shadow: var(--sh-3);
  outline: none;
  contain: layout style;
}

.drawer-fade-enter-active,
.drawer-fade-leave-active { transition: opacity var(--t-med) var(--ease-out); }
.drawer-fade-enter-from,
.drawer-fade-leave-to { opacity: 0; }

.drawer-slide-enter-active { transition: transform 280ms var(--ease-out), opacity 200ms var(--ease-out); }
.drawer-slide-leave-active { transition: transform 180ms var(--ease-in-out), opacity 180ms var(--ease-in-out); }
.drawer-slide-enter-from,
.drawer-slide-leave-to { transform: translateX(24px); opacity: 0; }
</style>
