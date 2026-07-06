<script setup lang="ts">
import { type VNode } from 'vue'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from 'reka-ui'
import MenuItemRenderer from './MenuItemRenderer.vue'
import styles from './DropdownMenu.module.css'
import type { MenuItem } from './types'

withDefaults(
  defineProps<{
    items: MenuItem[]
    trigger: VNode
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
  }>(),
  {
    side: 'bottom',
    align: 'start',
  },
)
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <component :is="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <DropdownMenuContent :class="styles.content" :side="side" :align="align" :side-offset="4">
        <MenuItemRenderer
          v-for="(item, i) in items"
          :key="i"
          :item="item"
          :menu-item="DropdownMenuItem"
          :menu-separator="DropdownMenuSeparator"
        />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
