<script setup lang="ts">
import { computed } from 'vue'
import RadioGroup from './RadioGroup.vue'
import styles from './SegmentedControl.module.css'

interface SegmentedOption {
  value: string
  label?: any
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: SegmentedOption[]
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const radioOptions = computed(() =>
  props.options.map((option) => ({
    value: option.value,
    content: option.label,
    disabled: option.disabled,
  })),
)
</script>

<template>
  <RadioGroup
    :model-value="modelValue"
    :options="radioOptions"
    :disabled="disabled"
    bare
    :group-class="styles.root"
    :item-class="styles.item"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
