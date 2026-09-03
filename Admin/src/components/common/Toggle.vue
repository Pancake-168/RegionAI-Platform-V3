<script setup lang="ts">
import { Toggle } from 'reka-ui'
import styles from './Toggle.module.css'

withDefaults(
  defineProps<{
    pressed?: boolean
    defaultPressed?: boolean
    disabled?: boolean
    ariaLabel?: string
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:pressed': [pressed: boolean]
  'pressed-change': [pressed: boolean]
}>()

function onPressedChange(next: boolean) {
  emit('update:pressed', next)
  emit('pressed-change', next)
}
</script>

<template>
  <Toggle
    :class="styles.root"
    :pressed="pressed"
    :default-pressed="defaultPressed"
    :disabled="disabled"
    :aria-label="ariaLabel"
    @update:pressed="onPressedChange"
  >
    <slot />
  </Toggle>
</template>
