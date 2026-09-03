<script setup lang="ts">
import { useId } from 'vue'
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import Label from './Label.vue'
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
    <Label v-if="label" :html-for="inputId" :class="styles.label">{{
      label
    }}</Label>
  </div>
</template>
