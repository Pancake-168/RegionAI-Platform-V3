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

  // 允许 NOCOBASE_ 前缀的环境变量注入前端（默认只注入 VITE_ 前缀）
  // 不在此处添加 Login_/MATRIX_ 等前缀 — 它们属于 SSO/IM 模块，不在后台管理范围
  envPrefix: ['VITE_', 'NOCOBASE_'],

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
    // 代理规则 — 开发环境将 API 请求转发到后端，避免 CORS
    // =====================
    proxy: {
      // NocoBase API 代理：
      // 前端发往 /nocobase-proxy/xxx 的请求 → 去掉前缀后转发到 NOCOBASE_URL
      '/nocobase-proxy': {
        target: process.env.NOCOBASE_URL || 'https://t8960.zheshu.tech',
        changeOrigin: true, // 修改请求头中的 Host 为目标地址
        // 去掉 /nocobase-proxy 前缀，只保留路径部分
        rewrite: (path) => path.replace(/^\/nocobase-proxy/, ''),
        secure: false, // 不校验 SSL 证书（局域网自签证书场景）
        ws: true, // 支持 WebSocket 代理
      },

      // 通用 API 代理：
      // 前端发往 /api/xxx 的请求 → 转发到 VITE_API_BASE
      '/api': {
        target: process.env.VITE_API_BASE || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}))
