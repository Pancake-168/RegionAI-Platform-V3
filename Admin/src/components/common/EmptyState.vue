<script setup lang="ts">
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import { getIcon } from '@/icons'
import styles from './EmptyState.module.css'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div :class="styles.root">
    <div :class="styles.icon">
      <slot name="icon">
        <IconContainer :size="48"
          ><Icon :icon="getIcon('folderOpened')" :width="48"
        /></IconContainer>
      </slot>
    </div>
    <span :class="styles.title">
      {{ title }}
    </span>
    <span v-if="description" :class="styles.description">
      {{ description }}
    </span>
    <div v-if="$slots.action" :class="styles.action">
      <slot name="action" />
    </div>
  </div>
</template>
