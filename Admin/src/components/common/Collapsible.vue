<script setup lang="ts">
import {
  CollapsibleRoot,
  CollapsibleTrigger,
  CollapsibleContent,
} from 'reka-ui'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import styles from './Collapsible.module.css'
import { getIcon } from '@/icons'

withDefaults(
  defineProps<{
    open?: boolean
    defaultOpen?: boolean
  }>(),
  {},
)
</script>

<template>
  <CollapsibleRoot
    :class="styles.root"
    :open="open"
    :default-open="defaultOpen"
    @update:open="$emit('update:open', $event)"
  >
    <CollapsibleTrigger :class="styles.trigger">
      <span><slot name="trigger" /></span>
      <IconContainer :size="16"
        ><Icon
          :icon="getIcon('chevronDown')"
          :class="styles.chevron"
          :width="16"
          :height="16"
      /></IconContainer>
    </CollapsibleTrigger>
    <CollapsibleContent :class="styles.content">
      <div :class="styles.contentInner">
        <slot />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
