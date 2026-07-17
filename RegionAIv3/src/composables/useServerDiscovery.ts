// 局域网服务器自动发现 composable
// 启动后持续轮询扫描，直到发现服务器或组件卸载
import { ref, computed, onBeforeUnmount } from 'vue' // Vue 响应式：ref 状态、computed 派生、onBeforeUnmount 清理
import { invoke } from '@tauri-apps/api/core' // Tauri IPC：调用 Rust 侧 discover_server command
import { isTauri } from '@/utils/isTauri' // 运行时环境检测
import { createLogger } from '@/utils/logger' // 项目日志体系

// ============================================================================
// 类型定义
// ============================================================================

/// 扫描到的服务器信息，字段名与 Rust 侧 DiscoveredServer 序列化一致
export interface DiscoveredServer {
  ip: string // 服务器 IPv4 地址
  apiPort: string // API 端口（指纹正则提取）
  dbPort: string // NocoBase 端口（/regionai/identify 返回）
  imPort: string // Matrix 端口（/regionai/identify 返回）
}

// ============================================================================
// composable 入口
// ============================================================================

export function useServerDiscovery() {
  // ===== 日志 =====
  const scanOnceLog = createLogger('useServerDiscovery.ts', 'scanOnce')
  const startScanLog = createLogger('useServerDiscovery.ts', 'startScan')

  // ===== 响应式状态 =====
  const isDiscovering = ref(false) // 是否正在扫描（用于 UI 加载指示器）
  const discoveredServer = ref<DiscoveredServer | null>(null) // 扫描到的第一台服务器
  const scanRound = ref(0) // 已完成的扫描轮数（用于 UI 展示 "第 N 轮"）
  let timer: ReturnType<typeof setTimeout> | null = null // 轮询定时器句柄
  let stopped = false // 终止标志：组件卸载或扫描成功时置 true

  // ===== 运行时检测 =====
  const isTauriRuntime = isTauri() // Tauri 桌面端才启用扫描，浏览器 dev 模式不扫描

  // ===== 派生状态 =====
  /// UI 展示用的服务器标签：有结果时展示 IP，否则空字符串
  const displayLabel = computed(() => {
    if (!discoveredServer.value) {
      return '' // 尚未扫描到
    }
    return discoveredServer.value.ip // 展示 IP，如 "192.168.10.11"
  })

  // ===== 核心逻辑 =====

  /// 执行一轮扫描：调用 Rust 侧 discover_server 命令
  async function scanOnce(): Promise<boolean> {
    const scanStart = performance.now() // 计时开始
    try {
      // 调用 Tauri command，等待 Rust 侧返回结果
      const servers = await invoke<DiscoveredServer[]>('discover_server')
      const elapsed = Math.round(performance.now() - scanStart) // 耗时（ms）
      scanOnceLog.info(
        `扫描完成，耗时 ${elapsed}ms，发现 ${servers.length} 台`,
        { servers },
      )
      // 取第一个结果（Rust 侧目前只返回第一个匹配的服务器）
      const first = servers[0]
      // 服务器存在且扫描未被终止
      if (first && !stopped) {
        discoveredServer.value = first // 写入响应式状态
        scanOnceLog.info('发现服务器并写入状态', {
          ip: first.ip,
          apiPort: first.apiPort,
        })
        return true // 扫描成功
      }
    } catch (e) {
      scanOnceLog.error('discover_server invoke 异常', e)
    }
    return false // 本轮未发现
  }

  /// 启动扫描循环：反复 scanOnce，发现后停止
  async function startScan() {
    // 非 Tauri 环境不扫描
    if (!isTauriRuntime || stopped) {
      return
    }
    startScanLog.info('开始局域网扫描')
    isDiscovering.value = true // 进入扫描中状态

    // 无限循环直到发现服务器或组件卸载
    while (!stopped) {
      scanRound.value++ // 递增轮次计数器
      startScanLog.info(`开始第 ${scanRound.value} 轮扫描`)
      const found = await scanOnce() // 执行一轮扫描
      if (found) {
        isDiscovering.value = false // 扫描成功，退出加载状态
        startScanLog.info('扫描成功，停止循环')
        return // 停止循环
      }
      // 未发现 → 等待 2 秒后重试
      await new Promise<void>((resolve) => {
        timer = setTimeout(resolve, 2000) // 2 秒间隔
      })
    }
  }

  /// 终止扫描（组件卸载时调用）
  function stop() {
    stopped = true // 设置终止标志，打断 while 循环
    if (timer) {
      clearTimeout(timer) // 清除等待定时器
      timer = null
    }
  }

  // ===== 生命周期 =====
  onBeforeUnmount(() => {
    stop() // 组件卸载时清理定时器和循环
  })

  // ===== 导出 =====
  return {
    isDiscovering, // 是否扫描中
    discoveredServer, // 扫描结果
    displayLabel, // UI 展示 IP
    scanRound, // 当前轮次
    startScan, // 启动扫描（LoginPage onMounted 调用）
  }
}
