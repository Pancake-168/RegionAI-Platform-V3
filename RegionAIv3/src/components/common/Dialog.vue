<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'reka-ui'
import { Icon } from '@iconify/vue'
import styles from './Dialog.module.css'

defineProps<{
  open?: boolean
  title: string
  description?: string
}>()

defineEmits<{
  'update:open': [open: boolean]
}>()
</script>

<template>
  <DialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
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
