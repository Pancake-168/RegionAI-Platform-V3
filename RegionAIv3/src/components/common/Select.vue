<script setup lang="ts">
import { useId, ref } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
} from 'reka-ui'
import { Icon } from '@iconify/vue'
import styles from './Select.module.css'
import type { SelectOption } from './types'

withDefaults(
  defineProps<{
    modelValue: string
    options: SelectOption[]
    placeholder?: string
    label?: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

defineEmits<{
  'update:modelValue': [v: string]
}>()

const inputId = useId()
const isOpen = ref(false)
</script>

<template>
  <div :class="styles.wrapper">
    <span v-if="label" :class="styles.label" :id="`${inputId}-label`">{{ label }}</span>
    <SelectRoot
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event)"
      @update:open="isOpen = $event"
    >
      <SelectTrigger
        :class="styles.trigger"
        :aria-labelledby="label ? `${inputId}-label` : undefined"
      >
        <SelectValue :placeholder="placeholder">
          {{ options.find((o) => o.value === modelValue)?.label }}
        </SelectValue>
        <SelectIcon>
          <Icon icon="codicon:chevron-down" :class="[styles.chevron, { [styles.chevronOpen]: isOpen }]" />
        </SelectIcon>
      </SelectTrigger>

      <SelectPortal>
        <SelectContent :class="styles.content" position="popper" :side-offset="4">
          <SelectViewport>
            <SelectItem
              v-for="opt in options"
              :key="opt.value"
              :class="styles.item"
              :value="opt.value"
              :disabled="opt.disabled"
            >
              <SelectItemText>{{ opt.label }}</SelectItemText>
            </SelectItem>
          </SelectViewport>
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  </div>
</template>
