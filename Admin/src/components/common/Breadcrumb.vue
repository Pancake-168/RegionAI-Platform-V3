<script setup lang="ts">
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Button from './Button.vue'
import styles from './Breadcrumb.module.css'
import { getIcon } from '@/icons'

interface BreadcrumbItem {
  label?: any
  onClick?: () => void
}

defineProps<{
  items: BreadcrumbItem[]
}>()
</script>

<template>
  <nav :class="styles.root" aria-label="面包屑">
    <span v-for="(item, index) in items" :key="index" :class="styles.itemWrap">
      <template v-if="index === items.length - 1">
        <span :class="styles.current" aria-current="page">
          <component
            :is="item.label"
            v-if="item.label && typeof item.label !== 'string'"
          />
          <template v-else>{{ item.label }}</template>
        </span>
      </template>
      <Button
        v-else-if="item.onClick"
        variant="subtle"
        :class="styles.link"
        @click="item.onClick"
      >
        <component
          :is="item.label"
          v-if="item.label && typeof item.label !== 'string'"
        />
        <template v-else>{{ item.label }}</template>
      </Button>
      <span v-else :class="styles.muted">
        <component
          :is="item.label"
          v-if="item.label && typeof item.label !== 'string'"
        />
        <template v-else>{{ item.label }}</template>
      </span>
      <IconContainer v-if="index < items.length - 1" :size="16"
        ><Icon
          :icon="getIcon('chevronRight')"
          :class="styles.separator"
          :width="16"
          :height="16"
      /></IconContainer>
    </span>
  </nav>
</template>
