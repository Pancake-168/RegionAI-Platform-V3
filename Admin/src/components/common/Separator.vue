<script setup lang="ts">
import { Separator } from 'reka-ui'
import styles from './Separator.module.css'

withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical'
    decorative?: boolean
  }>(),
  {
    orientation: 'horizontal',
    decorative: true,
  },
)
</script>

<template>
  <Separator
    :orientation="orientation"
    :decorative="decorative"
    :class="[
      styles.root,
      orientation === 'horizontal' ? styles.horizontal : styles.vertical,
    ]"
  />
</template>
