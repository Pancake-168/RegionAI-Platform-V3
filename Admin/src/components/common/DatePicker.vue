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
    defaultValue?: Date
    placeholder?: string
    label?: string
    disabled?: boolean
    min?: Date
    max?: Date
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
  const display = props.modelValue ?? props.defaultValue
  if (!display) return ''
  const y = display.getFullYear()
  const m = String(display.getMonth() + 1).padStart(2, '0')
  const d = String(display.getDate()).padStart(2, '0')
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
          aria-label="选择日期"
        >
          <IconContainer :size="16"
            ><Icon
              :icon="getIcon('calendar')"
              :class="styles.icon"
              :width="16"
              :height="16"
          /></IconContainer>
          <span
            :class="
              modelValue || defaultValue ? styles.text : styles.placeholder
            "
          >
            {{ formatted || placeholder }}
          </span>
        </Button>
      </template>
      <Calendar
        :model-value="modelValue"
        :default-value="defaultValue"
        :min="min"
        :max="max"
        @update:model-value="selectDate"
      />
    </Popover>
  </div>
</template>
