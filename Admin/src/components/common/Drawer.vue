<script setup lang="ts">
import { computed } from 'vue'
import Dialog from './Dialog.vue'
import styles from './Drawer.module.css'

type DrawerSide = 'left' | 'right' | 'top' | 'bottom'

const props = withDefaults(
  defineProps<{
    open?: boolean
    title?: string
    side?: DrawerSide
    size?: number | string
  }>(),
  {
    side: 'right',
    size: 320,
  },
)

const sideClass = computed(() => {
  if (props.side === 'left') return styles.sideLeft
  if (props.side === 'top') return styles.sideTop
  if (props.side === 'bottom') return styles.sideBottom
  return styles.sideRight
})

const contentClass = computed(() => [styles.content, sideClass.value])

const contentStyle = computed(() => {
  if (props.side === 'top' || props.side === 'bottom') {
    return { height: props.size, width: '100%' }
  }
  return { width: props.size, maxWidth: '100vw', height: '100%' }
})
</script>

<template>
  <Dialog
    :open="open"
    :overlay-class="styles.overlay"
    :content-class="contentClass"
    :content-style="contentStyle"
    :body-class="styles.body"
    hide-title
    bare-content
    bare-body
    @update:open="$emit('update:open', $event)"
  >
    <template #trigger>
      <slot name="trigger" />
    </template>
    <div v-if="$slots.title || title" :class="styles.header">
      <slot name="title">{{ title }}</slot>
    </div>
    <slot />
  </Dialog>
</template>
