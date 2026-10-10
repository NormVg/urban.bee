<script setup lang="ts">
import { PAGE_TITLES } from '~/constants/navigation'

/**
 * Mobile-only bar: opens the off-canvas sidebar and names the current page.
 * On desktop the sidebar is always visible and each page carries its own
 * header, so this bar is hidden to give the content the full height.
 */
defineEmits<{ 'toggle-sidebar': [] }>()

const route = useRoute()
const crumb = computed(
  () => PAGE_TITLES.find((p) => route.path.startsWith(p.prefix))?.title ?? 'Dashboard',
)
</script>

<template>
  <header class="topbar">
    <UiButton
      variant="ghost"
      size="md"
      icon-only="menu"
      aria-label="Open navigation"
      @click="$emit('toggle-sidebar')"
    />
    <p class="topbar__crumb">{{ crumb }}</p>
    <BrandWordmark size="sm" mark-only class="topbar__mark" />
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;
  height: var(--topbar-h);
  padding: 0 clamp(12px, 3vw, 24px);
  background: rgba(227, 217, 201, 0.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
}

.topbar__crumb {
  font-size: 15px;
  font-weight: 650;
  color: var(--ink);
}

.topbar__mark {
  margin-left: auto;
}

@media (min-width: 1024px) {
  .topbar {
    display: none;
  }
}
</style>
