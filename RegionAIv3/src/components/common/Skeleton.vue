<script setup lang="ts">
import { computed } from 'vue'
import styles from './Skeleton.module.css'

const props = withDefaults(
  defineProps<{
    variant?: 'text' | 'circle' | 'rect'
    width?: number | string
    height?: number | string
    count?: number
  }>(),
  {
    variant: 'text',
    count: 1,
  },
)

const variantClass = computed(() => {
  if (props.variant === 'circle') return styles.circle
  if (props.variant === 'rect') return styles.rect
  return styles.text
})

const baseStyle = computed(() => ({
  width: resolveSize(props.width, props.variant === 'circle' ? props.height || 32 : '100%'),
  height: resolveSize(props.height, props.variant === 'circle' ? props.width || 32 : props.variant === 'rect' ? 60 : 14),
}))

function resolveSize(value: number | string | undefined, fallback: number | string): string {
  if (value !== undefined) return typeof value === 'number' ? `${value}px` : value
  return typeof fallback === 'number' ? `${fallback}px` : fallback
}
</script>

<template>
  <!-- Multi-line text: last line 70% width -->
  <div v-if="variant === 'text' && count > 1" :class="styles.wrapper">
    <div
      v-for="i in count"
      :key="i"
      :class="[styles.root, variantClass, styles.shimmer, styles.row]"
      :style="{ ...baseStyle, width: i === count ? '70%' : '100%' }"
    />
  </div>

  <!-- Single item or non-text variants -->
  <template v-else>
    <div
      v-for="i in count"
      :key="i"
      :class="[styles.root, variantClass, styles.shimmer]"
      :style="baseStyle"
    />
  </template>
</template>
