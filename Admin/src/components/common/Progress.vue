<script setup lang="ts">
import { computed } from 'vue'
import { ProgressRoot, ProgressIndicator } from 'reka-ui'
import styles from './Progress.module.css'

const props = withDefaults(
  defineProps<{
    value: number
    max?: number
  }>(),
  {
    max: 100,
  },
)

const percent = computed(() => {
  const max = props.max > 0 ? props.max : 0
  return max > 0 ? Math.min(100, Math.max(0, (props.value / max) * 100)) : 0
})

const indicatorStyle = computed(() => ({
  transform: `translateX(-${100 - percent.value}%)`,
}))
</script>

<template>
  <ProgressRoot :class="styles.root" :value="value" :max="max">
    <ProgressIndicator :class="styles.indicator" :style="indicatorStyle" />
  </ProgressRoot>
</template>
