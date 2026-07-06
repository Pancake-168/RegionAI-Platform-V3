<script setup lang="ts">
import { useId } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import styles from './Switch.module.css'

withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

defineEmits<{
  'update:modelValue': [v: boolean]
}>()

const inputId = useId()
</script>

<template>
  <div :class="styles.wrapper">
    <SwitchRoot
      :id="inputId"
      :class="styles.root"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <SwitchThumb :class="styles.thumb" />
    </SwitchRoot>
    <label v-if="label" :class="styles.label" :for="inputId">{{ label }}</label>
  </div>
</template>
