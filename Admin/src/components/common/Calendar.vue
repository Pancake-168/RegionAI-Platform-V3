<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from './Button.vue'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import styles from './Calendar.module.css'
import { getIcon } from '@/icons'

const props = withDefaults(
  defineProps<{
    modelValue?: Date
    defaultValue?: Date
    min?: Date
    max?: Date
  }>(),
  {},
)

const emit = defineEmits<{
  'update:modelValue': [date: Date]
}>()

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日']

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isSameDay(a: Date | undefined, b: Date) {
  return (
    a !== undefined &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const today = startOfDay(new Date())
const initial = startOfDay(props.modelValue ?? props.defaultValue ?? today)
const selectedInternal = ref<Date | undefined>(props.defaultValue)
const viewDate = ref(new Date(initial.getFullYear(), initial.getMonth(), 1))

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      viewDate.value = new Date(val.getFullYear(), val.getMonth(), 1)
    }
  },
)

const selected = computed(() => props.modelValue ?? selectedInternal.value)
const year = computed(() => viewDate.value.getFullYear())
const month = computed(() => viewDate.value.getMonth())

const cells = computed(() => {
  const firstDay = new Date(year.value, month.value, 1)
  const leadingBlanks = (firstDay.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year.value, month.value, index - leadingBlanks + 1)
    const inCurrentMonth = date.getMonth() === month.value
    const disabled =
      (props.min !== undefined && date < startOfDay(props.min)) ||
      (props.max !== undefined && date > startOfDay(props.max))
    return { date, inCurrentMonth, disabled }
  })
})

function changeMonth(delta: number) {
  viewDate.value = new Date(year.value, month.value + delta, 1)
}

function selectDate(date: Date) {
  if (props.min !== undefined && date < startOfDay(props.min)) return
  if (props.max !== undefined && date > startOfDay(props.max)) return
  selectedInternal.value = date
  emit('update:modelValue', date)
}
</script>

<template>
  <div :class="styles.root">
    <div :class="styles.header">
      <Button
        variant="subtle"
        :class="styles.navBtn"
        aria-label="上个月"
        @click="changeMonth(-1)"
      >
        <IconContainer :size="16"
          ><Icon :icon="getIcon('chevronLeft')" :width="16" :height="16"
        /></IconContainer>
      </Button>
      <span :class="styles.title">{{ year }} 年 {{ month + 1 }} 月</span>
      <Button
        variant="subtle"
        :class="styles.navBtn"
        aria-label="下个月"
        @click="changeMonth(1)"
      >
        <IconContainer :size="16"
          ><Icon :icon="getIcon('chevronRight')" :width="16" :height="16"
        /></IconContainer>
      </Button>
    </div>
    <div :class="styles.weekRow">
      <span
        v-for="label in WEEK_LABELS"
        :key="label"
        :class="styles.weekLabel"
        >{{ label }}</span
      >
    </div>
    <div :class="styles.grid">
      <Button
        v-for="({ date, inCurrentMonth, disabled }, index) in cells"
        :key="index"
        variant="subtle"
        :class="[
          styles.day,
          inCurrentMonth ? '' : styles.outside,
          isSameDay(today, date) ? styles.today : '',
          isSameDay(selected, date) ? styles.selected : '',
        ]"
        :disabled="disabled"
        @click="selectDate(date)"
      >
        {{ date.getDate() }}
      </Button>
    </div>
  </div>
</template>
