<script setup lang="ts">
const sidebarOpen = ref(false)
const route = useRoute()
/** Pages like the map opt into edge-to-edge content via definePageMeta({ fullBleed: true }). */
const fullBleed = computed(() => Boolean(route.meta.fullBleed))
</script>

<template>
  <div class="dash">
    <DashSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <Transition name="dash-backdrop">
      <div
        v-if="sidebarOpen"
        class="dash__backdrop"
        aria-hidden="true"
        @click="sidebarOpen = false"
      />
    </Transition>

    <div class="dash__main">
      <DashTopbar @toggle-sidebar="sidebarOpen = true" />
      <main class="dash__content" :class="{ 'dash__content--bleed': fullBleed }">
        <slot />
      </main>
    </div>

    <UiToaster />
  </div>
</template>

<style scoped>
.dash {
  min-height: 100dvh;
}

.dash__backdrop {
  position: fixed;
  inset: 0;
  z-index: 35;
  background: rgba(36, 28, 19, 0.42);
}

.dash-backdrop-enter-active,
.dash-backdrop-leave-active {
  transition: opacity var(--t-med) var(--ease-out);
}
.dash-backdrop-enter-from,
.dash-backdrop-leave-to {
  opacity: 0;
}

.dash__main {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.dash__content {
  flex: 1;
  width: 100%;
  max-width: 1360px;
  margin: 0 auto;
  padding: 28px clamp(20px, 3.4vw, 40px) 56px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dash__content--bleed {
  max-width: none;
  padding: 0;
  gap: 0;
}

@media (min-width: 1024px) {
  .dash__main {
    margin-left: var(--sidebar-w);
  }
  .dash__backdrop {
    display: none;
  }
}
</style>
