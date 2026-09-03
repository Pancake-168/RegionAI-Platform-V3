<script setup lang="ts">
import { computed } from 'vue'
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from 'reka-ui'
import styles from './Slider.module.css'

const props = withDefaults(
  defineProps<{
    modelValue?: number[]
    defaultValue?: number[]
    min?: number
    max?: number
    step?: number
    disabled?: boolean
    label?: string
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  },
)

const thumbCount = computed(
  () => props.modelValue?.length ?? props.defaultValue?.length ?? 1,
)
</script>

<template>
  <SliderRoot
    :class="styles.root"
    :model-value="modelValue"
    :default-value="defaultValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :aria-label="label"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <SliderTrack :class="styles.track">
      <SliderRange :class="styles.range" />
    </SliderTrack>
    <SliderThumb
      v-for="index in thumbCount"
      :key="index - 1"
      :class="styles.thumb"
    />
  </SliderRoot>
</template>
