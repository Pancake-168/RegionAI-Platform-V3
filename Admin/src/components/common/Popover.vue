<script setup lang="ts">
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
} from 'reka-ui'
import styles from './Popover.module.css'

withDefaults(
  defineProps<{
    open?: boolean
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
    contentClass?: string
    showArrow?: boolean
    bareContent?: boolean
  }>(),
  {
    side: 'bottom',
    align: 'center',
    sideOffset: 6,
    showArrow: true,
    bareContent: false,
  },
)
</script>

<template>
  <PopoverRoot :open="open" @update:open="$emit('update:open', $event)">
    <PopoverTrigger as-child>
      <span><slot name="trigger" /></span>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :class="bareContent ? contentClass : [styles.content, contentClass]"
        :side="side"
        :align="align"
        :side-offset="sideOffset"
      >
        <slot />
        <PopoverArrow v-if="showArrow" :class="styles.arrow" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
