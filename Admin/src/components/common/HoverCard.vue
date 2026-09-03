<script setup lang="ts">
import {
  HoverCardRoot,
  HoverCardTrigger,
  HoverCardPortal,
  HoverCardContent,
  HoverCardArrow,
} from 'reka-ui'
import styles from './Popover.module.css'

withDefaults(
  defineProps<{
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
    openDelay?: number
    closeDelay?: number
  }>(),
  {
    side: 'bottom',
    align: 'center',
    sideOffset: 6,
    openDelay: 300,
    closeDelay: 200,
  },
)
</script>

<template>
  <HoverCardRoot :open-delay="openDelay" :close-delay="closeDelay">
    <HoverCardTrigger as-child>
      <span><slot name="trigger" /></span>
    </HoverCardTrigger>
    <HoverCardPortal>
      <HoverCardContent
        :class="styles.content"
        :side="side"
        :align="align"
        :side-offset="sideOffset"
      >
        <slot />
        <HoverCardArrow :class="styles.arrow" />
      </HoverCardContent>
    </HoverCardPortal>
  </HoverCardRoot>
</template>
