<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'
import styles from './IconContainer.module.css'

const props = withDefaults(
  defineProps<{
    size: number
    shape?: 'rounded' | 'circle'
    src?: string
    alt?: string
  }>(),
  {
    shape: 'rounded',
    alt: '',
  },
)

const imgError = ref(false)

const shapeClass = computed(() =>
  props.shape === 'circle' ? styles.circle : styles.rounded,
)

const containerStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  minWidth: `${props.size}px`,
  minHeight: `${props.size}px`,
}))

const fallbackSize = computed(() => Math.round(props.size * 0.45))
</script>

<template>
  <!-- Image mode: src is a string URL -->
  <div
    v-if="src && !imgError"
    :class="[styles.container, shapeClass]"
    :style="containerStyle"
  >
    <img :class="styles.image" :src="src" :alt="alt" @error="imgError = true" />
  </div>

  <!-- Error fallback for image mode -->
  <div
    v-else-if="src && imgError"
    :class="[styles.container, shapeClass]"
    :style="containerStyle"
  >
    <slot name="fallback">
      <div :class="styles.fallback">
        <Icon
          icon="codicon:question"
          :width="fallbackSize"
          :height="fallbackSize"
        />
      </div>
    </slot>
  </div>

  <!-- Component mode: default slot content (icon component) -->
  <div v-else :class="[styles.container, shapeClass]" :style="containerStyle">
    <slot />
  </div>
</template>
