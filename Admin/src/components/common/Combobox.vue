<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Popover from './Popover.vue'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Input from './Input.vue'
import Button from './Button.vue'
import ScrollArea from './ScrollArea.vue'
import styles from './Combobox.module.css'
import { getIcon } from '@/icons'

interface ComboboxOption {
  value: string
  label: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: ComboboxOption[]
    placeholder?: string
    label?: string
    disabled?: boolean
    emptyText?: string
  }>(),
  {
    disabled: false,
    emptyText: '无匹配选项',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const draft = ref<string | null>(null)
const committed = ref(props.modelValue)
const open = ref(false)

watch(
  () => props.modelValue,
  (value) => {
    if (committed.value !== value) {
      committed.value = value
      draft.value = null
    }
  },
)

const selectedLabel = computed(
  () =>
    props.options.find((option) => option.value === props.modelValue)?.label ??
    '',
)

const query = computed(() => draft.value ?? selectedLabel.value)

const filtered = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return props.options
  return props.options.filter((option) =>
    option.label.toLowerCase().includes(keyword),
  )
})

function selectOption(option: ComboboxOption) {
  draft.value = null
  emit('update:modelValue', option.value)
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
        <div :class="styles.trigger">
          <IconContainer :size="16" :class="styles.searchIcon"
            ><Icon :icon="getIcon('search')" :width="16" :height="16"
          /></IconContainer>
          <Input
            :class="styles.input"
            :model-value="query"
            :placeholder="placeholder"
            :disabled="disabled"
            @update:model-value="
              (value) => {
                draft = value
                open = true
              }
            "
          />
          <IconContainer :size="16" :class="styles.chevron"
            ><Icon :icon="getIcon('chevronDown')" :width="16" :height="16"
          /></IconContainer>
        </div>
      </template>
      <ScrollArea v-if="filtered.length" :max-height="220">
        <div :class="styles.list">
          <Button
            v-for="option in filtered"
            :key="option.value"
            variant="subtle"
            :class="styles.option"
            :disabled="option.disabled"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </Button>
        </div>
      </ScrollArea>
      <div v-else :class="styles.empty">{{ emptyText }}</div>
    </Popover>
  </div>
</template>
