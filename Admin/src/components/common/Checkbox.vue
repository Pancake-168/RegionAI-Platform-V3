<script setup lang="ts">
import { useId } from 'vue'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Label from './Label.vue'
import styles from './Checkbox.module.css'
import { getIcon } from '@/icons'

withDefaults(
  defineProps<{
    modelValue: boolean
    label?: string
    disabled?: boolean
  }>(),
  {
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const inputId = useId()

function onCheckedChange(next: boolean | 'indeterminate') {
  emit('update:modelValue', next === true)
}
</script>

<template>
  <div :class="styles.wrapper">
    <CheckboxRoot
      :id="inputId"
      :class="styles.root"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="onCheckedChange"
    >
      <CheckboxIndicator :class="styles.indicator">
        <IconContainer :size="12"
          ><Icon :icon="getIcon('check')" :width="12"
        /></IconContainer>
      </CheckboxIndicator>
    </CheckboxRoot>
    <Label v-if="label" :html-for="inputId" :class="styles.label">{{
      label
    }}</Label>
  </div>
</template>
