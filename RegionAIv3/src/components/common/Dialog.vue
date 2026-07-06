<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { Icon } from '@iconify/vue'
import styles from './Dialog.module.css'

const props = defineProps<{
  open?: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const rootBindings = computed(() => {
  const onUpdateOpen = (val: boolean) => emit('update:open', val)
  if (props.open !== undefined) {
    return { open: props.open, 'onUpdate:open': onUpdateOpen }
  }
  return { 'onUpdate:open': onUpdateOpen }
})
</script>

<template>
  <DialogRoot v-bind="rootBindings">
    <DialogPortal>
      <DialogOverlay :class="styles.overlay" />
      <DialogContent :class="styles.content">
        <DialogTitle :class="styles.title">{{ title }}</DialogTitle>
        <DialogDescription v-if="description" :class="styles.description">
          {{ description }}
        </DialogDescription>
        <div :class="styles.body">
          <slot />
        </div>
        <DialogClose as-child>
          <button
            class="icon-btn"
            aria-label="关闭"
            :style="{ position: 'absolute', top: 'var(--spacing-lg)', right: 'var(--spacing-lg)' }"
          >
            <Icon icon="codicon:close" :width="16" />
          </button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
