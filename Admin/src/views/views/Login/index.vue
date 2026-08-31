<template>
  <!-- 登录页父级容器：默认走 if 当前扫描路线，手动切换后才走 else 手动输入路线 -->
  <div class="login-page-switch">
    <LoginPage v-if="!useManualMode" />
    <LoginPage2 v-else />

    <!-- 切换登录模式入口：使用项目内统一的 codicon 图标写法 -->
    <button class="login-mode-switch" type="button" @click="toggleMode">
      <IconContainer :size="18" shape="rounded">
        <Icon icon="codicon:arrow-swap" :width="18" />
      </IconContainer>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import { IconContainer } from '@/components/common'
import LoginPage from '@/views/views/LoginPage'
import LoginPage2 from '@/views/views/LoginPage2'

// 默认 false：优先使用 if 当前扫描路线
const useManualMode = ref(false)

// 切换 if / else 登录路线
function toggleMode() {
  useManualMode.value = !useManualMode.value
}
</script>

<style scoped>
.login-page-switch {
  position: relative;
  width: 100%; /* 占满父容器宽度 */
  height: 100%; /* 占满父容器高度 */
}

.login-mode-switch {
  position: fixed;
  left: 10px;
  bottom: 10px;
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-elev);
  color: var(--text);
  font-size: var(--text-sm);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
}

.login-mode-switch:hover {
  color: var(--accent);
}
</style>
