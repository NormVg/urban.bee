<script setup lang="ts">
import { PAGE_TITLES } from '~/constants/navigation'

defineEmits<{ 'toggle-sidebar': [] }>()

const route = useRoute()
const { user } = useAdminSession()
const userName = computed(() => user.value?.name || 'City admin')

const crumb = computed(
  () => PAGE_TITLES.find((p) => route.path.startsWith(p.prefix))?.title ?? 'Dashboard',
)

/* Computed once on the server and reused on the client so both render the same text. */
const today = useState('topbar-today', () => {
  const parts = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    .formatToParts(new Date())
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${part('weekday')}, ${part('day')} ${part('month')}`
})

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')

watch(
  () => route.query.q,
  (q) => {
    query.value = typeof q === 'string' ? q : ''
  },
)

function search() {
  const q = query.value.trim()
  navigateTo({ path: '/complaints', query: q ? { q } : {} })
}
</script>

<template>
  <header class="topbar">
    <UiButton
      class="topbar__menu"
      variant="ghost"
      size="md"
      icon-only="menu"
      aria-label="Open navigation"
      @click="$emit('toggle-sidebar')"
    />

    <div class="topbar__context">
      <p class="topbar__crumb">{{ crumb }}</p>
      <p class="topbar__date">{{ today }}</p>
    </div>

    <div class="topbar__actions">
      <form class="topbar__search" role="search" @submit.prevent="search">
        <UiInput
          v-model="query"
          size="sm"
          icon="search"
          placeholder="Search by place, problem or reference"
          aria-label="Search complaints"
        />
      </form>
      <div class="topbar__user">
        <UiAvatar :name="userName" size="md" />
        <div class="topbar__user-text">
          <p class="topbar__user-name">{{ userName }}</p>
          <p class="topbar__user-role">City admin</p>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px clamp(16px, 3vw, 32px);
  background: rgba(227, 217, 201, 0.86);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--line);
}

.topbar__menu {
  display: inline-flex;
}

@media (min-width: 1024px) {
  .topbar__menu {
    display: none;
  }
}

.topbar__context {
  min-width: 0;
}

.topbar__crumb {
  font-size: 14px;
  font-weight: 650;
  color: var(--ink);
}

.topbar__date {
  font-size: 12.5px;
  color: var(--ink-3);
}

.topbar__actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar__search {
  width: min(320px, 32vw);
}

@media (max-width: 700px) {
  .topbar__search {
    display: none;
  }
}

.topbar__user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 4px;
}

/* Desktop: the sidebar footer already identifies the user — don't show it twice */
@media (min-width: 1024px) {
  .topbar__user {
    display: none;
  }
}

@media (max-width: 480px) {
  .topbar__user-text {
    display: none;
  }
}

.topbar__user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.topbar__user-role {
  font-size: 12px;
  color: var(--ink-3);
}
</style>
