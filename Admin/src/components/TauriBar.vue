<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Icon } from '@iconify/vue'
import IconContainer from '@/components/common/IconContainer.vue'
import type { Window } from '@tauri-apps/api/window'
import { isTauri } from '@/utils/isTauri'
import { useTheme } from '@/composables/useTheme'
import { createLogger } from '@/utils/logger'
import styles from './TauriBar.module.css'
import { getIcon } from '@/icons'

const log = createLogger('TauriBar.vue', 'TauriBar')

const BASE_URL = import.meta.env.BASE_URL
const { theme, toggleTheme } = useTheme()
const route = useRoute()

let appWindow: Window | null = null
const maximized = ref(false)
let unlistenResize: (() => void) | undefined

const isHome = computed(() => route.path === '/')
const themeIcon = computed(() =>
  theme.value === 'dark' ? getIcon('lightMode') : getIcon('darkMode'),
)

onMounted(async () => {
  if (!isTauri()) return
  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    appWindow = getCurrentWindow()
    maximized.value = await appWindow.isMaximized()
    unlistenResize = await appWindow.onResized(() => {
      appWindow!.isMaximized().then((v) => (maximized.value = v))
    })
  } catch (e) {
    log.error('初始化窗口 API 失败', e)
  }
})

onUnmounted(() => {
  unlistenResize?.()
})

function minimize() {
  appWindow?.minimize()
}
function toggleMaximize() {
  appWindow?.toggleMaximize()
}
function close() {
  appWindow?.close()
}
</script>

<template>
  <header v-if="isTauri()" :class="styles.bar">
    <span :class="styles.left">
      <IconContainer
        :size="16"
        :class="styles.logo"
        :src="`${BASE_URL}yanjing-logo.png`"
        alt=""
      />
      <span :class="styles.title">RegionAI</span>
    </span>
    <span :class="styles.spacer" />
    <button
      v-if="!isHome"
      :class="styles.btn"
      title="切换主题"
      @click="toggleTheme"
    >
      <IconContainer :size="16"
        ><Icon :icon="themeIcon" :width="16"
      /></IconContainer>
    </button>
    <button :class="styles.btn" title="最小化" @mousedown.prevent="minimize">
      <IconContainer :size="14"
        ><Icon :icon="getIcon('chromeMinimize')" :width="14"
      /></IconContainer>
    </button>
    <button
      :class="styles.btn"
      title="最大化"
      @mousedown.prevent="toggleMaximize"
    >
      <IconContainer :size="14">
        <Icon
          :icon="
            maximized ? getIcon('chromeRestore') : getIcon('chromeMaximize')
          "
          :width="14"
        />
      </IconContainer>
    </button>
    <button
      :class="[styles.btn, styles.btnClose]"
      title="关闭"
      @mousedown.prevent="close"
    >
      <IconContainer :size="14"
        ><Icon :icon="getIcon('chromeClose')" :width="14"
      /></IconContainer>
    </button>
  </header>
</template>
