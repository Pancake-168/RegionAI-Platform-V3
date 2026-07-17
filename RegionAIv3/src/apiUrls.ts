// todo
export const BASE_URL = ''

// =====================
// NocoBase 目标地址 — 从环境变量读取，支持局域网模式动态切换
// =====================

// NocoBase 直连地址（如 https://t8960.zheshu.tech/）
export const NOCOBASE_URL = import.meta.env.NOCOBASE_URL as string | undefined
// NocoBase 代理地址（Electron/Tauri 打包后走此地址绕过 CORS）
export const NOCOBASE_PROXY_URL = import.meta.env.NOCOBASE_PROXY_URL as
  string | undefined

/**
 * 获取 NocoBase 基础 URL（去掉末尾斜杠）。
 * 优先使用环境变量 NOCOBASE_URL，未配置则返回空字符串。
 * 返回值不包含末尾 /，例如 https://db.zheshu.tech
 */
export function getNocobaseUrl(): string {
  // 读取环境变量，trim 后去掉末尾所有斜杠
  return (NOCOBASE_URL || '').replace(/\/+$/, '')
}

/**
 * 获取 NocoBase 代理 URL。
 * 优先级：NOCOBASE_PROXY_URL → NOCOBASE_URL → 空字符串。
 * 用于 Electron/Tauri 打包后直连场景（无 Vite proxy 时走 Nginx 反代）。
 */
export function getNocobaseProxyUrl(): string {
  // 依次回退：代理地址 → 直连地址 → 空
  return (NOCOBASE_PROXY_URL || NOCOBASE_URL || '').replace(/\/+$/, '')
}

export const API_URLS = {
  // 获取图片验证码
  GenerateCaptcha: () => `${BASE_URL}/api/auth/captcha/generate`,

  // SSO-Login 账号密码登录接口
  Login: () => `${BASE_URL}/api/auth/login`,

  // SSO-Register 账号密码注册接口
  Register: () => `${BASE_URL}/api/auth/register`,

  // SSO-发送验证码
  SendCode: () => `${BASE_URL}/api/auth/sms/send-code`,

  // SSO-手机号注册
  SmsRegister: () => `${BASE_URL}/api/auth/sms/register`,

  //SSO-手机号登录
  SmsLogin: () => `${BASE_URL}/api/auth/sms/login`,

  // SSO-LoginTokenToAccessToken 登录token换取access_token
  GenerateMatrixToken: () => `${BASE_URL}/api/auth/msyanc`,

  // SSO-返回个人用户信息
  UserInfo: () => `${BASE_URL}/api/auth/userinfo`,

  // SSO-更改个人信息
  userdetail: () => `${BASE_URL}/api/auth/userdetail`,

  /**
   * IM
   */
  //获取用户信息
  GetIMUserInfo: (user: string) => `${BASE_URL}/api/v2/im/user/${user}`,

  /**
   * UserConfig
   */
  //获取用户配置 get请求
  GetUserConfig: () => `${BASE_URL}/api/auth/userconfig`,

  //更新用户配置 post请求
  UpdateUserConfig: () => `${BASE_URL}/api/auth/userconfig`,
}
