<script setup lang="ts">
import { AspectRatio } from 'reka-ui'
import styles from './AspectRatio.module.css'

withDefaults(
  defineProps<{
    ratio?: number
  }>(),
  {
    ratio: 16 / 9,
  },
)
</script>

<template>
  <AspectRatio :ratio="ratio" :class="styles.root">
    <slot />
  </AspectRatio>
</template>
