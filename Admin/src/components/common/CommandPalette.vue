<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Dialog from './Dialog.vue'
import Input from './Input.vue'
import Button from './Button.vue'
import styles from './CommandPalette.module.css'
import { getIcon } from '@/icons'

interface CommandItem {
  id: string
  label?: any
  keywords?: string
  onSelect?: () => void
}

const props = withDefaults(
  defineProps<{
    open: boolean
    items: CommandItem[]
    placeholder?: string
    emptyText?: string
  }>(),
  {
    placeholder: '输入命令或搜索...',
    emptyText: '没有匹配命令',
  },
)

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const query = ref('')
const activeIndex = ref(0)
const searchWrapRef = ref<HTMLElement | null>(null)

watch(
  () => props.open,
  async (next) => {
    if (next) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      searchWrapRef.value?.querySelector('input')?.focus()
    }
  },
)

// 用户输入过滤词时，让高亮回到第一项，和 React 版行为一致
watch(query, () => {
  activeIndex.value = 0
})

const filtered = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return props.items
  return props.items.filter((item) =>
    (item.keywords ?? (typeof item.label === 'string' ? item.label : ''))
      .toLowerCase()
      .includes(keyword),
  )
})

const safeActiveIndex = computed(() => {
  if (!filtered.value.length) return 0
  return Math.min(activeIndex.value, filtered.value.length - 1)
})

function runItem(item: CommandItem) {
  emit('update:open', false)
  item.onSelect?.()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    // 列表非空时向下循环，空列表保持 0
    activeIndex.value = filtered.value.length
      ? (activeIndex.value + 1) % filtered.value.length
      : 0
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    // 列表非空时向上循环，空列表保持 0
    activeIndex.value = filtered.value.length
      ? (activeIndex.value - 1 + filtered.value.length) % filtered.value.length
      : 0
  } else if (event.key === 'Enter') {
    const item = filtered.value[safeActiveIndex.value]
    if (item) {
      event.preventDefault()
      runItem(item)
    }
  } else if (event.key === 'Escape') {
    // Esc 关闭命令面板，和 React 版一致
    event.preventDefault()
    emit('update:open', false)
  }
}
</script>

<template>
  <Dialog
    :open="open"
    :overlay-class="styles.overlay"
    :content-class="styles.content"
    hide-title
    hide-close
    @update:open="$emit('update:open', $event)"
  >
    <div @keydown="handleKeydown">
      <div ref="searchWrapRef" :class="styles.searchBox">
        <IconContainer :size="16"
          ><Icon
            :icon="getIcon('search')"
            :class="styles.searchIcon"
            :width="16"
            :height="16"
        /></IconContainer>
        <Input
          v-model="query"
          :class="styles.input"
          :placeholder="placeholder"
        />
      </div>
      <div v-if="filtered.length" :class="styles.list">
        <Button
          v-for="(item, index) in filtered"
          :key="item.id"
          variant="subtle"
          block
          :class="[styles.item, index === safeActiveIndex ? styles.active : '']"
          @mouseenter="activeIndex = index"
          @click="runItem(item)"
        >
          <component
            :is="item.label"
            v-if="item.label && typeof item.label !== 'string'"
          />
          <template v-else>{{ item.label }}</template>
        </Button>
      </div>
      <div v-else :class="styles.empty">{{ emptyText }}</div>
    </div>
  </Dialog>
</template>
