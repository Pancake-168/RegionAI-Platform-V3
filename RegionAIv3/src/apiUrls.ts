// =====================
// NocoBase 目标地址 — 运行时从登录页持久化的地址动态获取
// =====================
import { SystemStorageManager } from '@/utils/SystemStorage'

/**
 * 获取 NocoBase 基础 URL（去掉末尾斜杠）。
 * 优先使用登录时保存的服务器地址，未配置则返回空字符串。
 */
export function getNocobaseUrl(): string {
  return (SystemStorageManager.getServerNocobaseUrlSync() || '').replace(
    /\/+$/,
    '',
  )
}

/**
 * 获取 NocoBase 代理 URL。
 * 优先级：已保存的 NocoBase 地址 → 空字符串。
 */
export function getNocobaseProxyUrl(): string {
  return (SystemStorageManager.getServerNocobaseUrlSync() || '').replace(
    /\/+$/,
    '',
  )
}

// =====================
// SSO / IM / UserConfig 接口
// =====================

function getApiBase(): string {
  const apiUrl = SystemStorageManager.getServerApiBaseUrlSync()
  return apiUrl ? apiUrl.replace(/\/+$/, '') : ''
}

export const API_URLS = {
  // 获取图片验证码
  GenerateCaptcha: () => `${getApiBase()}/api/auth/captcha/generate`,

  // SSO-Login 账号密码登录接口
  Login: () => `${getApiBase()}/api/auth/login`,

  // SSO-Register 账号密码注册接口
  Register: () => `${getApiBase()}/api/auth/register`,

  // SSO-发送验证码
  SendCode: () => `${getApiBase()}/api/auth/sms/send-code`,

  // SSO-手机号注册
  SmsRegister: () => `${getApiBase()}/api/auth/sms/register`,

  //SSO-手机号登录
  SmsLogin: () => `${getApiBase()}/api/auth/sms/login`,

  // SSO-LoginTokenToAccessToken 登录token换取access_token
  GenerateMatrixToken: () => `${getApiBase()}/api/auth/msyanc`,

  // SSO-返回个人用户信息
  UserInfo: () => `${getApiBase()}/api/auth/userinfo`,

  // SSO-更改个人信息
  userdetail: () => `${getApiBase()}/api/auth/userdetail`,

  /**
   * IM
   */
  //获取用户信息
  GetIMUserInfo: (user: string) => `${getApiBase()}/api/v2/im/user/${user}`,

  /**
   * UserConfig
   */
  //获取用户配置 get请求
  GetUserConfig: () => `${getApiBase()}/api/auth/userconfig`,

  //更新用户配置 post请求
  UpdateUserConfig: () => `${getApiBase()}/api/auth/userconfig`,
}
