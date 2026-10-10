<script setup lang="ts">
const { toasts, dismiss } = useToast()
const ICON = { success: 'checkCircle', danger: 'alert', info: 'sparkles' } as const
</script>

<template>
  <div class="ui-toaster" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" class="ui-toast" :class="`ui-toast--${t.tone}`" role="status">
        <UiIcon :name="ICON[t.tone]" :size="17" />
        <span class="ui-toast__msg">{{ t.message }}</span>
        <button type="button" class="ui-toast__close" aria-label="Dismiss" @click="dismiss(t.id)">
          <UiIcon name="close" :size="14" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ui-toaster {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 80;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.ui-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 260px;
  max-width: 380px;
  padding: 11px 12px 11px 14px;
  border-radius: var(--r-md);
  background: var(--ink);
  color: var(--surface-2);
  box-shadow: var(--sh-3);
  font-size: 13.5px;
  font-weight: 500;
  pointer-events: auto;
}

.ui-toast--success :deep(svg:first-child) { color: #9fd1ac; }
.ui-toast--danger :deep(svg:first-child) { color: #f2b8a7; }

.ui-toast__msg { flex: 1; }

.ui-toast__close {
  display: inline-flex;
  padding: 4px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  opacity: 0.6;
  cursor: pointer;
}
.ui-toast__close:hover { opacity: 1; }

.toast-enter-active { transition: opacity 200ms var(--ease-out), transform 240ms var(--ease-out); }
.toast-leave-active { transition: opacity 140ms var(--ease-in-out), transform 140ms var(--ease-in-out); }
.toast-enter-from { opacity: 0; transform: translateY(10px) scale(0.98); }
.toast-leave-to { opacity: 0; transform: translateX(16px); }
</style>
