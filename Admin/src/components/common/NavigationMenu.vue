<script setup lang="ts">
import {
  NavigationMenuRoot,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
} from 'reka-ui'
import styles from './NavigationMenu.module.css'

interface NavigationMenuItemType {
  label: string
  content?: any
  onClick?: () => void
}

defineProps<{
  items: NavigationMenuItemType[]
}>()
</script>

<template>
  <NavigationMenuRoot :class="styles.root">
    <NavigationMenuList :class="styles.list">
      <NavigationMenuItem
        v-for="item in items"
        :key="item.label"
        :class="styles.item"
      >
        <template v-if="item.content">
          <NavigationMenuTrigger :class="styles.trigger">{{
            item.label
          }}</NavigationMenuTrigger>
          <NavigationMenuContent :class="styles.panel">
            <component
              :is="item.content"
              v-if="typeof item.content !== 'string'"
            />
            <template v-else>{{ item.content }}</template>
          </NavigationMenuContent>
        </template>
        <NavigationMenuLink
          v-else
          :class="styles.trigger"
          @select="item.onClick"
        >
          {{ item.label }}
        </NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
    <NavigationMenuViewport :class="styles.viewport" />
  </NavigationMenuRoot>
</template>
