<script setup lang="ts">
import {
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
} from 'reka-ui'
import styles from './ScrollArea.module.css'

defineProps<{
  maxHeight?: number | string
}>()
</script>

<template>
  <ScrollAreaRoot :class="styles.root">
    <ScrollAreaViewport :class="styles.viewport" :style="maxHeight ? { maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight } : undefined">
      <slot />
    </ScrollAreaViewport>
    <ScrollAreaScrollbar :class="styles.scrollbar" orientation="vertical">
      <ScrollAreaThumb :class="styles.thumb" />
    </ScrollAreaScrollbar>
    <ScrollAreaScrollbar :class="styles.scrollbar" orientation="horizontal">
      <ScrollAreaThumb :class="styles.thumb" />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
