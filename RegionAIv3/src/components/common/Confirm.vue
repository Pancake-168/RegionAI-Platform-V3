<script setup lang="ts">
import Button from './Button.vue'
import Dialog from './Dialog.vue'
import styles from './Dialog.module.css'
import type { ButtonVariant } from './types'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    variant?: 'default' | 'danger'
    confirmLabel?: string
    cancelLabel?: string
    extraButtons?: {
      label: string
      variant: ButtonVariant
      onClick: () => void
    }[]
  }>(),
  {
    variant: 'default',
    confirmLabel: '确认',
    cancelLabel: '取消',
  },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
  confirm: []
  cancel: []
}>()

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}

function handleConfirm() {
  emit('confirm')
  emit('update:open', false)
}
</script>

<template>
  <Dialog
    :open="open"
    :title="title"
    :description="description"
    @update:open="$emit('update:open', $event)"
  >
    <slot />
    <div :class="styles.footer">
      <div :class="styles.footerLeft">
        <Button
          v-for="(btn, i) in extraButtons"
          :key="i"
          :variant="btn.variant"
          @click="btn.onClick"
        >
          {{ btn.label }}
        </Button>
      </div>
      <Button variant="subtle" @click="handleCancel">
        {{ cancelLabel }}
      </Button>
      <Button
        :variant="variant === 'danger' ? 'danger' : 'primary'"
        @click="handleConfirm"
      >
        {{ confirmLabel }}
      </Button>
    </div>
  </Dialog>
</template>
