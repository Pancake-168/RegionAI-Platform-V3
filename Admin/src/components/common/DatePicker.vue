<script setup lang="ts">
import { computed, ref } from 'vue'
import Popover from './Popover.vue'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Button from './Button.vue'
import Calendar from './Calendar.vue'
import styles from './DatePicker.module.css'
import { getIcon } from '@/icons'

const props = withDefaults(
  defineProps<{
    modelValue?: Date
    placeholder?: string
    label?: string
    disabled?: boolean
  }>(),
  {
    placeholder: '选择日期',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [date: Date]
}>()

const open = ref(false)

const formatted = computed(() => {
  if (!props.modelValue) return ''
  const y = props.modelValue.getFullYear()
  const m = String(props.modelValue.getMonth() + 1).padStart(2, '0')
  const d = String(props.modelValue.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
})

function selectDate(date: Date) {
  emit('update:modelValue', date)
  open.value = false
}
</script>

<template>
  <div :class="styles.wrapper">
    <span v-if="label" :class="styles.label">{{ label }}</span>
    <Popover
      v-model:open="open"
      :content-class="styles.content"
      bare-content
      align="start"
      :side-offset="4"
      :show-arrow="false"
    >
      <template #trigger>
        <Button
          variant="secondary"
          :class="styles.trigger"
          :disabled="disabled"
        >
          <IconContainer :size="14"
            ><Icon
              :icon="getIcon('calendar')"
              :class="styles.icon"
              :width="14"
              :height="14"
          /></IconContainer>
          <span :class="modelValue ? styles.text : styles.placeholder">
            {{ modelValue ? formatted : placeholder }}
          </span>
        </Button>
      </template>
      <Calendar :model-value="modelValue" @update:model-value="selectDate" />
    </Popover>
  </div>
</template>
