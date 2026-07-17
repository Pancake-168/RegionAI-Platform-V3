<script setup lang="ts">
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import styles from './Tabs.module.css'
import type { TabItem } from './types'

withDefaults(
  defineProps<{
    tabs: TabItem[]
    defaultTab?: string
  }>(),
  {},
)

defineEmits<{
  change: [id: string]
}>()
</script>

<template>
  <TabsRoot
    :class="styles.root"
    :default-value="defaultTab ?? tabs[0]?.id"
    @update:model-value="$emit('change', $event)"
  >
    <TabsList :class="styles.list">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.id"
        :class="styles.trigger"
        :value="tab.id"
      >
        <component :is="tab.icon" v-if="tab.icon" />
        {{ tab.label }}
      </TabsTrigger>
    </TabsList>

    <TabsContent
      v-for="tab in tabs"
      :key="tab.id"
      :class="styles.panel"
      :value="tab.id"
    >
      <component :is="tab.content" v-if="typeof tab.content !== 'string'" />
      <template v-else>{{ tab.content }}</template>
    </TabsContent>
  </TabsRoot>
</template>
