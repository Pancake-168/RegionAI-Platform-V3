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
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
  }>(),
  {
    side: 'bottom',
    align: 'center',
  },
)
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <span><slot name="trigger" /></span>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        :class="styles.content"
        :side="side"
        :align="align"
        :side-offset="6"
      >
        <slot />
        <PopoverArrow :class="styles.arrow" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
