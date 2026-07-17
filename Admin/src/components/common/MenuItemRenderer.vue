<script setup lang="ts">
import type { Component } from 'vue'
import styles from './DropdownMenu.module.css'
import type { MenuItem } from './types'

defineProps<{
  item: MenuItem
  menuItem: Component
  menuSeparator: Component
}>()
</script>

<template>
  <component
    :is="menuSeparator"
    v-if="item.separator"
    :class="styles.separator"
  />
  <component
    :is="menuItem"
    v-else
    :class="[styles.item, { [styles.itemDanger]: item.danger }]"
    :disabled="item.disabled"
    @select="item.onClick?.()"
  >
    <component :is="item.icon" v-if="item.icon" />
    <span :class="styles.itemLabel">{{ item.label }}</span>
    <span v-if="item.shortcut" :class="styles.shortcut">{{
      item.shortcut
    }}</span>
  </component>
</template>
