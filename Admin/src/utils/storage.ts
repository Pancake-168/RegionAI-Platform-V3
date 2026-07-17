// 渲染进程统一存储适配层
// - Web / Tauri：统一使用 Chromium 默认 localStorage，并做 JSON 序列化
//   Tauri 的 lib.rs 已配置 data_directory，localStorage 数据不会丢失。

import { isProxy, isRef, toRaw, unref } from 'vue'

// localStorage 只能安全存放普通可序列化值。
// Vue/Pinia 的 ref/reactive/proxy 直接写入时行为不可控，
// 这里统一先转成普通数据，避免每个业务调用点各自手写 deep clone。
function normalizeForStorage(
  value: unknown,
  seen: WeakMap<object, unknown> = new WeakMap(),
): unknown {
  if (value === null || value === undefined) return value

  if (typeof value !== 'object') return value

  if (isRef(value)) {
    return normalizeForStorage(unref(value), seen)
  }

  const source = isProxy(value) ? toRaw(value) : value

  if (source instanceof Date) {
    return new Date(source.getTime())
  }

  if (Array.isArray(source)) {
    if (seen.has(source)) return seen.get(source)
    const normalizedArray: unknown[] = []
    seen.set(source, normalizedArray)
    for (const item of source) {
      normalizedArray.push(normalizeForStorage(item, seen))
    }
    return normalizedArray
  }

  if (source instanceof Map) {
    if (seen.has(source)) return seen.get(source)
    const normalizedMap: Record<string, unknown> = {}
    seen.set(source, normalizedMap)
    for (const [entryKey, entryValue] of source.entries()) {
      normalizedMap[String(entryKey)] = normalizeForStorage(entryValue, seen)
    }
    return normalizedMap
  }

  if (source instanceof Set) {
    if (seen.has(source)) return seen.get(source)
    const normalizedSet: unknown[] = []
    seen.set(source, normalizedSet)
    for (const item of source.values()) {
      normalizedSet.push(normalizeForStorage(item, seen))
    }
    return normalizedSet
  }

  if (seen.has(source)) return seen.get(source)

  const normalizedObject: Record<string, unknown> = {}
  seen.set(source, normalizedObject)

  for (const [entryKey, entryValue] of Object.entries(
    source as Record<string, unknown>,
  )) {
    normalizedObject[entryKey] = normalizeForStorage(entryValue, seen)
  }

  return normalizedObject
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  try {
    const v = localStorage.getItem(key)
    if (v === null) return null
    try {
      // localStorage 中对象/数组等值统一按 JSON 恢复
      return JSON.parse(v) as T
    } catch {
      return v as unknown as T
    }
  } catch {
    return null
  }
}

export async function setSetting(
  key: string,
  value: unknown,
): Promise<boolean> {
  const normalizedValue = normalizeForStorage(value)

  try {
    // 写入前统一序列化，兼容对象、数组、布尔、数字等值。
    const valToStore = JSON.stringify(normalizedValue)
    localStorage.setItem(key, valToStore)
    return true
  } catch {
    return false
  }
}

export async function removeSetting(key: string): Promise<boolean> {
  try {
    localStorage.removeItem(key)
    return true
  } catch {
    return false
  }
}

export async function getAllKeys(): Promise<string[]> {
  try {
    return Object.keys(localStorage)
  } catch {
    return []
  }
}
