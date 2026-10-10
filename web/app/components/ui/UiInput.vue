<script setup lang="ts">
import type { IconName } from '~/constants/icons'

withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    icon?: IconName
    hint?: string
    error?: string
    disabled?: boolean
    size?: 'sm' | 'md' | 'lg'
    autocomplete?: string
    required?: boolean
  }>(),
  { type: 'text', size: 'md' },
)

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="ui-field">
    <label v-if="label" class="ui-field__label" :for="id">{{ label }}</label>

    <div
      class="ui-input"
      :class="[
        `ui-input--${size}`,
        { 'has-icon': icon, 'is-error': !!error, 'is-disabled': disabled },
      ]"
    >
      <UiIcon v-if="icon" :name="icon" :size="16" class="ui-input__icon" />
      <input
        :id="id"
        v-model="model"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :required="required"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="error || hint ? `${id}-help` : undefined"
        class="ui-input__control"
      />
    </div>

    <p
      v-if="error || hint"
      :id="`${id}-help`"
      class="ui-field__help"
      :class="{ 'is-error': !!error }"
    >
      {{ error || hint }}
    </p>
  </div>
</template>

<style scoped>
.ui-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.ui-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
}

.ui-input {
  display: inline-flex;
  align-items: center;
  position: relative;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-sm);
  box-shadow: var(--sh-1);
  transition:
    border-color var(--t-fast) var(--ease-in-out),
    box-shadow var(--t-fast) var(--ease-in-out),
    background-color var(--t-fast) var(--ease-in-out);
}

.ui-input:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 3px var(--blue-tint);
}

.ui-input.is-error {
  border-color: var(--danger);
}
.ui-input.is-error:focus-within {
  box-shadow: 0 0 0 3px var(--danger-bg);
}

.ui-input.is-disabled {
  opacity: 0.6;
}

.ui-input__icon {
  position: absolute;
  left: 12px;
  color: var(--ink-3);
  pointer-events: none;
}

.ui-input__control {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0 14px;
  color: var(--ink);
  font: inherit;
  outline: none;
}
.ui-input.has-icon .ui-input__control {
  padding-left: 38px;
}
.ui-input__control::placeholder {
  color: var(--ink-3);
}

.ui-input--sm .ui-input__control { height: 34px; font-size: 13px; }
.ui-input--md .ui-input__control { height: 40px; font-size: 14px; }
.ui-input--lg .ui-input__control { height: 46px; font-size: 15px; }

.ui-field__help {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-3);
}
.ui-field__help.is-error {
  color: var(--danger);
}
</style>
