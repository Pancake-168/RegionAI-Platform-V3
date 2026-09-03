<script setup lang="ts">
import { computed } from 'vue'
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
import IconContainer from './IconContainer.vue'
import Button from './Button.vue'
import styles from './Dialog.module.css'
import { getIcon } from '@/icons'

const props = withDefaults(
  defineProps<{
    open?: boolean
    title?: string
    description?: string
    overlayClass?: string | Array<string | Record<string, boolean>>
    contentClass?: string | Array<string | Record<string, boolean>>
    bodyClass?: string | Array<string | Record<string, boolean>>
    contentStyle?: Record<string, unknown>
    hideClose?: boolean
    hideTitle?: boolean
    bareContent?: boolean
    bareBody?: boolean
  }>(),
  {
    hideClose: false,
    hideTitle: false,
    bareContent: false,
  },
)

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
    <DialogTrigger v-if="$slots.trigger" as-child>
      <span><slot name="trigger" /></span>
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay :class="[styles.overlay, overlayClass]" />
      <DialogContent
        :class="bareContent ? contentClass : [styles.content, contentClass]"
        :style="contentStyle"
      >
        <DialogTitle v-if="title && !hideTitle" :class="styles.title">{{
          title
        }}</DialogTitle>
        <DialogDescription v-if="description" :class="styles.description">
          {{ description }}
        </DialogDescription>
        <div :class="bareBody ? bodyClass : [styles.body, bodyClass]">
          <slot />
        </div>
        <DialogClose v-if="!hideClose" as-child>
          <Button
            variant="subtle"
            :class="['icon-btn', styles.closeButton]"
            aria-label="关闭"
          >
            <IconContainer :size="16"
              ><Icon :icon="getIcon('close')" :width="16" :height="16"
            /></IconContainer>
          </Button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
