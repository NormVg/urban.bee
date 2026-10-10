<script setup lang="ts">
import { SIDEBAR_NAV } from '~/constants/navigation'
import { useDepartmentScope } from '~/composables/useDepartmentScope'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)

/* A plain string in <component :is> does NOT resolve NuxtLink — resolve it. */
const NuxtLinkComponent = resolveComponent('NuxtLink')

const { user, signOut } = useAdminSession()
const userName = computed(() => user.value?.name || 'City admin')
const userEmail = computed(() => user.value?.email ?? '')

/* --- department switcher (workspace-switcher pattern) --- */
const { scopeId, scopeOptions } = useDepartmentScope()

const switcherOpen = ref(false)
const triggerEl = ref<HTMLElement | null>(null)
const popoverEl = ref<HTMLElement | null>(null)

const activeOption = computed(
  () => scopeOptions.value.find((opt) => opt.id === scopeId.value) ?? scopeOptions.value[0]!,
)

function optionEl(id: string): HTMLElement | null {
  return popoverEl.value?.querySelector<HTMLElement>(`[data-scope-id="${id}"]`) ?? null
}

function onOutsidePointer(event: PointerEvent) {
  if (
    !triggerEl.value?.contains(event.target as Node) &&
    !popoverEl.value?.contains(event.target as Node)
  ) {
    closeSwitcher(false)
  }
}

function openSwitcher() {
  switcherOpen.value = true
  document.addEventListener('pointerdown', onOutsidePointer, true)
  nextTick(() => {
    optionEl(scopeId.value)?.focus()
  })
}

function closeSwitcher(refocus = true) {
  switcherOpen.value = false
  document.removeEventListener('pointerdown', onOutsidePointer, true)
  if (refocus) triggerEl.value?.focus()
}

function toggleSwitcher() {
  if (switcherOpen.value) closeSwitcher()
  else openSwitcher()
}

function selectScope(id: string) {
  scopeId.value = id
  closeSwitcher()
}

function onPopoverKeydown(event: KeyboardEvent) {
  const ids = scopeOptions.value.map((opt) => opt.id)
  const focusedId = (event.target as HTMLElement).dataset.scopeId
  const current = focusedId ? ids.indexOf(focusedId) : -1

  const focusIndex = (index: number) => {
    event.preventDefault()
    const wrapped = (index + ids.length) % ids.length
    const id = ids[wrapped]
    if (id) optionEl(id)?.focus()
  }

  switch (event.key) {
    case 'ArrowDown':
      focusIndex(current + 1)
      break
    case 'ArrowUp':
      focusIndex(current - 1)
      break
    case 'Home':
      focusIndex(0)
      break
    case 'End':
      focusIndex(ids.length - 1)
      break
    case 'Escape':
      event.preventDefault()
      closeSwitcher()
      break
  }
}

/* Close the popover when navigating away. */
watch(
  () => route.path,
  () => closeSwitcher(false),
)

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutsidePointer, true)
})
</script>

<template>
  <aside class="side" :class="{ 'is-open': open }" aria-label="Main navigation">
    <div class="side__top">
      <NuxtLink to="/dashboard" class="side__brand" aria-label="urban.bee home">
        <BrandWordmark size="md" on-blue />
      </NuxtLink>
    </div>

    <div class="side__scope">
      <button
        ref="triggerEl"
        type="button"
        class="scope-btn"
        :class="{ 'is-open': switcherOpen }"
        aria-haspopup="listbox"
        :aria-expanded="switcherOpen"
        aria-controls="scope-listbox"
        @click="toggleSwitcher"
      >
        <span class="scope-btn__icon">
          <UiIcon :name="activeOption.icon" :size="16" />
        </span>
        <span class="scope-btn__text">
          <span class="scope-btn__name">{{ activeOption.name }}</span>
          <span class="scope-btn__caption">
            {{ activeOption.caption ?? 'City operations' }}
          </span>
        </span>
        <UiIcon class="scope-btn__chev" name="chevronDown" :size="15" />
      </button>

      <Transition name="scope-pop">
        <div
          v-if="switcherOpen"
          id="scope-listbox"
          ref="popoverEl"
          class="scope-pop"
          role="listbox"
          aria-label="Switch department"
          tabindex="-1"
          @keydown="onPopoverKeydown"
        >
          <p class="scope-pop__label">Departments</p>
          <button
            v-for="opt in scopeOptions"
            :key="opt.id"
            type="button"
            role="option"
            :data-scope-id="opt.id"
            :aria-selected="opt.id === scopeId"
            class="scope-pop__item"
            :class="{ 'is-selected': opt.id === scopeId }"
            @click="selectScope(opt.id)"
          >
            <UiIcon :name="opt.icon" :size="16" class="scope-pop__item-icon" />
            <span class="scope-pop__item-name">{{ opt.name }}</span>
            <UiIcon v-if="opt.id === scopeId" name="check" :size="15" class="scope-pop__check" />
          </button>
        </div>
      </Transition>
    </div>

    <nav class="side__nav">
      <div v-for="section in SIDEBAR_NAV" :key="section.label" class="side__section">
        <p class="side__section-label">{{ section.label }}</p>

        <component
          :is="item.to ? NuxtLinkComponent : 'span'"
          v-for="item in section.items"
          :key="item.label"
          :to="item.to"
          class="side__item"
          :class="{
            'is-active': item.to && isActive(item.to),
            'is-soon': item.soon,
          }"
          :aria-disabled="item.soon ? 'true' : undefined"
          @click="item.to && emit('close')"
        >
          <UiIcon :name="item.icon" :size="17" />
          <span class="side__item-label">{{ item.label }}</span>
          <UiBadge v-if="item.soon" tone="neutral">soon</UiBadge>
        </component>
      </div>
    </nav>

    <div class="side__footer">
      <UiAvatar :name="userName" size="md" />
      <div class="side__user">
        <p class="side__user-name">{{ userName }}</p>
        <p class="side__user-role">{{ userEmail }}</p>
      </div>
      <UiButton
        variant="inverse-ghost"
        size="sm"
        icon-only="logOut"
        aria-label="Sign out"
        title="Sign out"
        @click="signOut"
      />
    </div>
  </aside>
</template>

<style scoped>
.side {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 40;
  width: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--blue) 0%, var(--blue-ink) 100%);
  transform: translateX(-100%);
  transition: transform var(--t-med) var(--ease-out);
}

.side.is-open {
  transform: translateX(0);
}

@media (min-width: 1024px) {
  .side {
    transform: translateX(0);
  }
}

.side__top {
  padding: 18px 20px 12px;
}

.side__brand {
  display: inline-flex;
  border-radius: var(--r-sm);
  text-decoration: none;
}

/* --- department switcher --- */
.side__scope {
  position: relative;
  padding: 0 16px 16px;
  border-bottom: 1px solid var(--on-blue-line);
}

.scope-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--on-blue-line);
  border-radius: var(--r-md);
  background: rgba(239, 233, 220, 0.08);
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--t-fast) var(--ease-in-out),
    border-color var(--t-fast) var(--ease-in-out);
}

.scope-btn:hover {
  background: rgba(239, 233, 220, 0.14);
}

.scope-btn.is-open {
  background: rgba(239, 233, 220, 0.16);
  border-color: rgba(239, 233, 220, 0.28);
}

.scope-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
  background: rgba(239, 233, 220, 0.14);
  color: var(--on-blue);
}

.scope-btn__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.scope-btn__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--on-blue);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope-btn__caption {
  font-size: 11px;
  color: var(--on-blue-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope-btn__chev {
  flex-shrink: 0;
  color: var(--on-blue-muted);
  transition: transform var(--t-med) var(--ease-out);
}

.scope-btn.is-open .scope-btn__chev {
  transform: rotate(180deg);
}

.scope-pop {
  position: absolute;
  top: calc(100% + 6px);
  left: 12px;
  right: 12px;
  z-index: 5;
  max-height: min(348px, 60dvh);
  overflow-y: auto;
  padding: 6px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  box-shadow: var(--sh-3);
}

.scope-pop__label {
  margin: 0;
  padding: 8px 10px 5px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-3);
}

.scope-pop__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-2);
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--t-fast) var(--ease-in-out),
    color var(--t-fast) var(--ease-in-out);
}

.scope-pop__item:hover,
.scope-pop__item:focus-visible {
  background: var(--blue-tint);
  color: var(--blue);
}

.scope-pop__item.is-selected {
  font-weight: 600;
}

.scope-pop__item-icon {
  color: var(--ink-3);
  flex-shrink: 0;
}

.scope-pop__item.is-selected .scope-pop__item-icon,
.scope-pop__item:hover .scope-pop__item-icon {
  color: var(--blue);
}

.scope-pop__item-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scope-pop__check {
  flex-shrink: 0;
  color: var(--blue);
}

/* popover: scale + fade from the trigger, faster on the way out */
.scope-pop-enter-active {
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.scope-pop-leave-active {
  transition:
    opacity 110ms var(--ease-in-out),
    transform 110ms var(--ease-in-out);
}

.scope-pop-enter-from,
.scope-pop-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}

/* --- nav --- */
.side__nav {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px 12px;
}

.side__section-label {
  margin: 0 0 6px 10px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--on-blue-muted);
}

.side__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--r-md);
  color: var(--on-blue-muted);
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 500;
  transition:
    background-color var(--t-fast) var(--ease-in-out),
    color var(--t-fast) var(--ease-in-out);
}

.side__item:not(.is-soon):hover {
  background: rgba(239, 233, 220, 0.08);
  color: var(--on-blue);
}

.side__item.is-active {
  background: rgba(239, 233, 220, 0.14);
  color: var(--on-blue);
}

.side__item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 22%;
  bottom: 22%;
  width: 3px;
  border-radius: 2px;
  background: var(--orange);
}

.side__item.is-soon {
  cursor: default;
  opacity: 0.68;
}

.side__item-label {
  flex: 1;
}

.side__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--on-blue-line);
}

.side__user {
  flex: 1;
  min-width: 0;
}

.side__user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--on-blue);
}

.side__user-name,
.side__user-role {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.side__user-role {
  font-size: 12px;
  color: var(--on-blue-muted);
}
</style>
