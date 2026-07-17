import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import removeConsole from 'vite-plugin-remove-console'
import { fileURLToPath, URL } from 'node:url'

// Tauri 开发模式下由 CLI 传入 TAURI_DEV_HOST 环境变量
const host = process.env.TAURI_DEV_HOST as string | undefined
// __TAURI_BUILD 标记：true 表示正在执行 tauri build
const isTauriBuild = process.env.__TAURI_BUILD === 'true'

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [
    vue(),
    // Tauri 打包时不移除 console，保留日志输出到 Rust 后端
    ...(!isTauriBuild ? [removeConsole()] : []),
  ],

  resolve: {
    alias: {
      // @ 别名指向 src 目录
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  envPrefix: ['VITE_'],

  // Vite options tailored for Tauri development
  clearScreen: false,

  server: {
    // Tauri 期望固定端口，端口被占用则报错
    port: 1420,
    strictPort: true,
    // host: TAURI_DEV_HOST 或 false（仅本机访问）
    host: host || false,
    // HMR 配置：通过 ws 协议连接 TAURI_DEV_HOST
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 忽略 src-tauri 目录，避免 Rust 编译触发 Vite 重载
      ignored: ['**/src-tauri/**'],
    },

    // =====================
    // 代理规则
    // =====================
    proxy: {},
  },
}))
