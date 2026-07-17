<script setup lang="ts">
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'reka-ui'
import styles from './Tooltip.module.css'

withDefaults(
  defineProps<{
    content: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    delayDuration?: number
  }>(),
  {
    side: 'top',
    delayDuration: 300,
  },
)
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot>
      <TooltipTrigger as="span">
        <slot />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent :class="styles.content" :side="side" :side-offset="4">
          {{ content }}
          <TooltipArrow :class="styles.arrow" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
