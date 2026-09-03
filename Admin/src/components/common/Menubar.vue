<script setup lang="ts">
import {
  MenubarRoot,
  MenubarMenu,
  MenubarTrigger,
  MenubarPortal,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
} from 'reka-ui'
import menuStyles from './DropdownMenu.module.css'
import styles from './Menubar.module.css'

interface MenubarItemType {
  label: string
  disabled?: boolean
  danger?: boolean
  separator?: true
  onClick?: () => void
}

interface MenubarMenuType {
  label: string
  items?: MenubarItemType[]
  content?: any
}

defineProps<{
  menus: MenubarMenuType[]
}>()
</script>

<template>
  <MenubarRoot :class="styles.root">
    <MenubarMenu v-for="menu in menus" :key="menu.label">
      <MenubarTrigger :class="styles.trigger">{{ menu.label }}</MenubarTrigger>
      <MenubarPortal>
        <MenubarContent
          :class="menuStyles.content"
          align="start"
          :side-offset="4"
        >
          <component
            :is="menu.content"
            v-if="menu.content && typeof menu.content !== 'string'"
          />
          <template v-else-if="typeof menu.content === 'string'">{{
            menu.content
          }}</template>
          <template v-for="(item, index) in menu.items" :key="index">
            <MenubarSeparator
              v-if="item.separator"
              :class="menuStyles.separator"
            />
            <MenubarItem
              v-else
              :class="[
                menuStyles.item,
                item.danger ? menuStyles.itemDanger : '',
              ]"
              :disabled="item.disabled"
              @select="item.onClick"
            >
              <span :class="menuStyles.itemLabel">{{ item.label }}</span>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarPortal>
    </MenubarMenu>
  </MenubarRoot>
</template>
