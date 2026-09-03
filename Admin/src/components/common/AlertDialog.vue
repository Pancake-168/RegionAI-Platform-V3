<script setup lang="ts">
import {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from 'reka-ui'
import Button from './Button.vue'
import styles from './Dialog.module.css'

withDefaults(
  defineProps<{
    open?: boolean
    title: string
    description?: string
    cancelLabel?: string
    actionLabel?: string
  }>(),
  {
    cancelLabel: '取消',
    actionLabel: '确定',
  },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
  cancel: []
  action: []
}>()
</script>

<template>
  <AlertDialogRoot :open="open" @update:open="$emit('update:open', $event)">
    <AlertDialogTrigger as-child>
      <slot name="trigger" />
    </AlertDialogTrigger>
    <AlertDialogPortal>
      <AlertDialogOverlay :class="styles.overlay" />
      <AlertDialogContent :class="styles.content">
        <AlertDialogTitle :class="styles.title">{{ title }}</AlertDialogTitle>
        <AlertDialogDescription v-if="description" :class="styles.description">
          {{ description }}
        </AlertDialogDescription>
        <div v-if="$slots.default" :class="styles.body">
          <slot />
        </div>
        <div :class="styles.footer">
          <AlertDialogCancel as-child>
            <Button variant="subtle" @click="emit('cancel')">{{
              cancelLabel
            }}</Button>
          </AlertDialogCancel>
          <AlertDialogAction as-child>
            <Button variant="primary" @click="emit('action')">{{
              actionLabel
            }}</Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
