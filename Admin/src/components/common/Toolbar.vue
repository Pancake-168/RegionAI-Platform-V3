<script setup lang="ts">
import { ToolbarRoot } from 'reka-ui'
import styles from './Toolbar.module.css'

withDefaults(
  defineProps<{
    ariaLabel?: string
  }>(),
  {
    ariaLabel: '工具栏',
  },
)
</script>

<template>
  <ToolbarRoot :aria-label="ariaLabel" :class="styles.root">
    <slot />
  </ToolbarRoot>
</template>
