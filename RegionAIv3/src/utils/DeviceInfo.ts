// 桌面端/Web 端设备信息收集（Tauri / Web）
// 仅保留设备名与设备 id，统一存储到 systemstorage

import { invoke } from "@tauri-apps/api/core";
import { getSetting, setSetting } from "@/utils/storage";
import { isTauri } from "@/utils/isTauri";

const STORAGE_KEY = "RegionAI-Device-Info";

export interface DesktopDeviceInfo {
  deviceName: string;
  deviceId: string;
}
function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}


function createWebFallbackInfo(
  storedInfo: DesktopDeviceInfo | null,
): DesktopDeviceInfo {
  const deviceName =
    safe(() => navigator.platform || "", "") ||
    safe(() => navigator.userAgent || "", "") ||
    storedInfo?.deviceName ||
    "";
  const deviceId = storedInfo?.deviceId || safe(() => crypto.randomUUID(), "");

  return {
    deviceName,
    deviceId,
  };
}

export async function collectDeviceInfo(): Promise<DesktopDeviceInfo> {
  if (isTauri()) {
    const mainInfo = await safe(
      () => invoke<DesktopDeviceInfo>("get_device_info"),
      Promise.resolve(null) as Promise<DesktopDeviceInfo | null>,
    );

    return {
      deviceName: mainInfo?.deviceName ?? "",
      deviceId: mainInfo?.deviceId ?? "",
    };
  }

  return createWebFallbackInfo(await getStoredDeviceInfo());
}

// 收集并存储设备信息
export async function collectAndStoreDeviceInfo(): Promise<DesktopDeviceInfo> {
  const info = await collectDeviceInfo();
  await setSetting(STORAGE_KEY, info);
  return info;
}

// 读取已存储的设备信息
export async function getStoredDeviceInfo(): Promise<DesktopDeviceInfo | null> {
  return await getSetting<DesktopDeviceInfo>(STORAGE_KEY);
}
