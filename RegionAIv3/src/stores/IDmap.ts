import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IDMapUser } from '@/types/IDmap'
import { SystemStorageManager } from '@/utils/SystemStorage'

// 此函数用于规范化 IDMap 中的字符串输入，确保它们是字符串并去除首尾空白
const normalizeIDMapString = (value: unknown): string => {
  return typeof value === 'string' ? value.trim() : ''
}

// 此函数用于规范化 IDMapUser 对象中的字符串字段，并确保 type 字段的值合法
const normalizeIDMapUser = (user: IDMapUser): IDMapUser => {
  return {
    username: normalizeIDMapString(user.username),
    matrixId: normalizeIDMapString(user.matrixId),
    nickname: normalizeIDMapString(user.nickname),
    type: user.type === 'bot' ? 'bot' : 'user',
  }
}

// 此函数用于比较两个 IDMapUser 对象是否相等，基于它们的字段值进行比较
const areIDMapUsersEqual = (left: IDMapUser, right: IDMapUser): boolean => {
  return (
    left.username === right.username &&
    left.matrixId === right.matrixId &&
    left.nickname === right.nickname &&
    left.type === right.type
  )
}

// 此函数用于从一个 Matrix ID 中提取 localpart 部分，去除 '@' 前缀和 ':' 及其后的服务器部分
const getMatrixLocalpart = (value: string): string => {
  const normalized = normalizeIDMapString(value)
  if (!normalized) return ''
  const withoutAt = normalized.startsWith('@')
    ? normalized.slice(1)
    : normalized
  const separatorIndex = withoutAt.indexOf(':')
  return separatorIndex >= 0 ? withoutAt.slice(0, separatorIndex) : withoutAt
}

// 定义 IDMap 的 Pinia store，负责管理用户 ID 映射列表
export const useIDmapStore = defineStore('idmap', () => {
  const list = ref<IDMapUser[]>([])
  const cacheLoaded = ref(false)
  let loadPromise: Promise<void> | null = null

  // 此函数确保 IDMap 数据已加载到 store 中，如果需要可以强制重新加载
  // 具体逻辑是：
  // 1. 判断是否需要加载（强制加载或未加载）
  // 2. 如果正在加载中，等待加载完成
  // 3. 否则开始加载，从 SystemStorageManager 获取顶层公用 IDMap 缓存并规范化后存储到 list 中
  async function ensureLoaded(forceReload: boolean = false): Promise<void> {
    const shouldReload = forceReload || !cacheLoaded.value
    if (!shouldReload) return

    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      const cached = await SystemStorageManager.getIDMapCache<IDMapUser[]>()
      list.value = Array.isArray(cached)
        ? cached
            .filter((item): item is IDMapUser => Boolean(item))
            .map(normalizeIDMapUser)
            .filter((item) => item.username || item.matrixId)
        : []
      cacheLoaded.value = true
    })()

    try {
      await loadPromise
    } finally {
      loadPromise = null
    }
  }

  // 此函数将当前 IDMap 列表持久化到 SystemStorageManager 顶层公用缓存中
  async function persist(): Promise<void> {
    await SystemStorageManager.setIDMapCache(list.value)
  }

  // 此函数用于查找与给定 IDMapUser 匹配的索引，匹配条件是 username 或 matrixId 字段相等
  function findIndexes(user: IDMapUser): number[] {
    return list.value.reduce<number[]>((indexes, current, index) => {
      if (
        (user.username && current.username === user.username) ||
        (user.matrixId && current.matrixId === user.matrixId)
      ) {
        indexes.push(index)
      }
      return indexes
    }, [])
  }

  // 此函数用于设置一个 IDMapUser，如果列表中已存在匹配的用户则合并更新，否则添加新用户
  // 具体逻辑是：
  // 1. 规范化输入用户对象
  // 2. 如果规范化后没有有效的 username 或 matrixId，返回 false
  // 3. 查找列表中匹配的用户索引
  // 4. 构建一个合并后的用户对象，优先使用输入的字段，其次是现有用户的字段，最后是默认值"",并确保 type 字段合法，此处优先级是为了支持部分更新，例如只提供了 matrixId 就不覆盖原有的 username
  // 5. 如果合并后的用户与现有用户完全相同，返回 false，此处返回 false 是为了避免不必要的持久化操作
  // 6. 否则更新列表中的第一个匹配项，并删除其他重复项，如果没有匹配项则添加新用户
  // 7. 持久化更新后的列表并返回 true
  function set(user: IDMapUser): boolean {
    try {
      if (!user) return false

      const normalized = normalizeIDMapUser(user)
      if (!normalized.username && !normalized.matrixId) return false

      const indexes = findIndexes(normalized)
      const existingUsers = indexes
        .map((index) => list.value[index]!)
        .filter(Boolean)

      const merged: IDMapUser = {
        username:
          normalized.username ||
          existingUsers.find((item) => item.username)?.username ||
          '',
        matrixId:
          normalized.matrixId ||
          existingUsers.find((item) => item.matrixId)?.matrixId ||
          '',
        nickname:
          normalized.nickname ||
          existingUsers.find((item) => item.nickname)?.nickname ||
          '',
        type: normalized.type || existingUsers[0]?.type || 'user',
      }

      if (
        existingUsers.length > 0 &&
        existingUsers.some((item) => areIDMapUsersEqual(item, merged))
      ) {
        return false
      }

      if (indexes.length > 0) {
        const firstIndex = indexes[0]!
        list.value[firstIndex] = merged
        for (let index = indexes.length - 1; index >= 1; index -= 1) {
          list.value.splice(indexes[index]!, 1)
        }
      } else {
        list.value.push(merged)
      }

      void persist()
      return true
    } catch {
      // 不抛错，避免影响其他程序运行
      return false
    }
  }

  // 此函数用于批量设置 IDMapUser，依次调用 set 函数并返回是否有任何更改
  function setMany(users: IDMapUser[]): boolean {
    let changed = false
    for (const user of users) {
      changed = set(user) || changed
    }
    return changed
  }

  // 此函数用于清空 IDMap 列表，并重置缓存状态，通常在用户登出时调用
  function clear() {
    try {
      list.value = []
      cacheLoaded.value = false
    } catch {
      // 不抛错，避免影响其他程序运行
    }
  }

  // 此函数用于根据 username 查找对应的 IDMapUser，返回 undefined 如果未找到或发生错误
  function getByUsername(username: string): IDMapUser | undefined {
    try {
      return list.value.find((u) => u.username === username)
    } catch {
      return undefined
    }
  }

  // 此函数用于根据 matrixId 查找对应的 IDMapUser，输入会被规范化，返回 undefined 如果未找到或发生错误
  function getByMatrixId(matrixId: string): IDMapUser | undefined {
    try {
      const normalized = normalizeIDMapString(matrixId)
      return list.value.find((u) => u.matrixId === normalized)
    } catch {
      return undefined
    }
  }

  // 此函数用于根据输入的身份标识查找对应的 IDMapUser，输入会被规范化，首先尝试作为 matrixId 查找，如果未找到再尝试作为 localpart 查找，最后尝试作为 username 查找，返回 undefined 如果未找到或发生错误
  function getByMatrixIdentity(identity: string): IDMapUser | undefined {
    try {
      const normalized = normalizeIDMapString(identity)
      if (!normalized) return undefined

      return (
        getByMatrixId(normalized) ||
        getByLocalpart(normalized) ||
        getByUsername(normalized)
      )
    } catch {
      return undefined
    }
  }

  // 此函数用于根据 localpart 查找对应的 IDMapUser，输入会被规范化，首先从 matrixId 中提取 localpart 进行比较，如果未找到再尝试直接与 username 比较，返回 undefined 如果未找到或发生错误
  // localpart指的是Matrix ID 中 '@' 和 ':' 之间的部分，例如 '@alice:example.com' 的 localpart 是 'alice'，此函数的目的是为了支持用户输入 localpart 来查找对应的用户
  function getByLocalpart(localpart: string): IDMapUser | undefined {
    try {
      const normalized = normalizeIDMapString(localpart)
      if (!normalized) return undefined
      return list.value.find(
        (u) =>
          getMatrixLocalpart(u.matrixId) === normalized ||
          u.username === normalized,
      )
    } catch {
      return undefined
    }
  }

  return {
    list,
    cacheLoaded,
    ensureLoaded,
    persist,
    set,
    setMany,
    clear,
    getByUsername,
    getByMatrixId,
    getByMatrixIdentity,
    getByLocalpart,
  }
})
