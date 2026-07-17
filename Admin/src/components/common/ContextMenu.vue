<script setup lang="ts">
import {
  ContextMenuRoot,
  ContextMenuTrigger,
  ContextMenuPortal,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from 'reka-ui'
import MenuItemRenderer from './MenuItemRenderer.vue'
import styles from './DropdownMenu.module.css'
import type { MenuItem } from './types'

defineProps<{
  items: MenuItem[]
  disabled?: boolean
}>()
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger :disabled="disabled">
      <slot />
    </ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent :class="styles.content">
        <MenuItemRenderer
          v-for="(item, i) in items"
          :key="i"
          :item="item"
          :menu-item="ContextMenuItem"
          :menu-separator="ContextMenuSeparator"
        />
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
