<script setup lang="ts">
import { computed, h } from 'vue'
import { Icon } from '@iconify/vue'
import RadioGroup from './RadioGroup.vue'
import styles from './Rating.module.css'
import { getIcon } from '@/icons'

const props = withDefaults(
  defineProps<{
    modelValue: number
    max?: number
    disabled?: boolean
  }>(),
  {
    max: 5,
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const current = computed(() =>
  Math.min(props.max, Math.max(0, Math.round(props.modelValue))),
)

const radioOptions = computed(() =>
  Array.from({ length: props.max }, (_, index) => {
    const starValue = index + 1
    return {
      value: String(starValue),
      content: h(Icon, {
        icon: getIcon('starFull'),
        class: styles.star,
        width: 18,
        height: 18,
      }),
      itemClass: starValue <= current.value ? styles.active : '',
    }
  }),
)
</script>

<template>
  <RadioGroup
    :model-value="String(current)"
    :options="radioOptions"
    :disabled="disabled"
    bare
    :group-class="styles.root"
    :item-class="styles.item"
    @update:model-value="emit('update:modelValue', Number($event))"
  />
</template>
