import {
  getAllKeys,
  getSetting,
  removeSetting,
  setSetting,
} from '@/utils/storage'

class SystemStorage {
  // 账号私有字段全部按照username隔离
  // 顶层只保留当前激活账号用户名，用来决定冷启动默认进入哪个账号域
  private readonly ksyActiveUsername = 'RegionAI-Username'

  // 自动登录完成标记，布尔值，表示是否已经完成过自动登录流程（不区分成功与否），用于控制是否需要在启动时尝试自动登录
  private readonly fieldAutoLoginCompleted = 'RegionAI-AutoLogin-Completed'

  // 首次分类完成标记，布尔值：是否已经在当前设备完成首次登录
  private readonly fieldFirstClassificationCompleted =
    'RegionAI-Matrix-FirstClassification-Completed'

  // 账号用户名本身，冗余存储一份以方便查询和验证
  private readonly fieldUsername = 'RegionAI-SSO-Username'

  // Matrix 登录配置，JSON 字符串，包含 homeserver、matrixId、deviceId 等信息，用于登录流程和后续 API 调用
  private readonly fieldMatrixLoginConfig = 'RegionAI-Matrix-LoginConfig'

  // SSO 登录凭证，字符串，后端兑换 SSO code 后得到的 loginToken，用于后续接口鉴权
  private readonly fieldSSOLoginToken = 'RegionAI-SSO-LoginToken'

  // Matrix 访问令牌，字符串，登录成功后从 Matrix 服务器获取的 access token，用于调用 Matrix API
  private readonly fieldMatrixAccessToken = 'RegionAI-Matrix-AccessToken'

  // Matrix 登录配置原始对象，JSON 序列化后的字符串，直接存储 MatrixLoginConfigLite 对象，避免重复解析 JSON
  private readonly fieldMatrixLoginConfigRaw = 'RegionAI-Matrix-LoginConfig-Raw'

  // 以下是一些按用户名隔离的自由字段，供未来扩展使用，避免频繁修改 SystemStorage 的接口设计
  private readonly fieldUserConfig = 'RegionAI-UserConfig'

  // IDMap 缓存，提到顶层作为公用数据，不参与按用户名隔离
  private readonly fieldIDMapCache = 'IDMapCache'

  // 设备信息，提到顶层作为公用数据，不参与按用户名隔离
  private readonly fieldDeviceInfo = 'RegionAI-Device-Info'

  // 服务器地址（顶层公用数据，不参与按用户名隔离，登录前即可读写）
  private readonly keyServerApiBaseUrl = 'RegionAI-Server-ApiBaseUrl'
  private readonly keyServerMatrixUrl = 'RegionAI-Server-MatrixUrl'
  private readonly keyServerNocobaseUrl = 'RegionAI-Server-NocobaseUrl'

  // SSO 接口返回的用户信息（按用户名隔离）
  private readonly fieldSSOUserInfo = 'RegionAI-SSO-UserInfo'

  // 当前选中的组织（ApplicationV2 JSON，按用户名隔离）
  private readonly fieldCurrentOrganization = 'RegionAI-Current-Organization'

  // 组织详情列表（ApplicationV2[]，按用户名隔离，每次启动覆盖式更新）
  private readonly fieldOrganizationDetailsList =
    'RegionAI-Organization-Details-List'

  // agent thinking cache（按用户隔离的 bot 思考记录）
  private readonly fieldAgentThinkingCache = 'RegionAI-AgentThinkingCache'

  // new room cache（三个 New API 的房间列表缓存，按用户隔离）
  private readonly fieldNewRoomCache = 'RegionAI-NewRoomCache'

   // 记录用户登录过的目标 API 地址，仅在页面内点击退出登录时清除
  private readonly keyServerPinnedTarget = 'RegionAI-Server-PinnedTarget'




  // 此函数用于规范化用户名输入，确保它们是字符串并去除首尾空白
  private normalizeUsername(username: string): string {
    return typeof username === 'string' ? username.trim() : ''
  }

  // 此函数用于验证用户名输入，确保它们是有效的字符串并且不为空，否则抛出错误
  private requireUsername(username: string): string {
    const normalizedUsername = this.normalizeUsername(username)
    if (!normalizedUsername) {
      throw new Error(
        '[SystemStorage] 缺少 username，无法访问按用户名隔离的存储字段',
      )
    }
    return normalizedUsername
  }

  // 此函数用于构建按用户名隔离的存储键，格式为 "{fieldName}-{username}"
  private buildUsernameScopedKey(username: string, fieldName: string): string {
    return `${fieldName}-${this.requireUsername(username)}`
  }

  private getSyncValue<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key)
      if (value === '' || value === null || value === undefined) {
        return null
      }

      try {
        return JSON.parse(value) as T
      } catch {
        return value as T
      }
    } catch {
      return null
    }
  }

  // 此函数用于同步获取存储中的字符串值，适用于需要在非异步上下文中访问的场景，如登录成功后的跳转逻辑
  private getSyncString(key: string): string | null {
    const value = this.getSyncValue<unknown>(key)
    return typeof value === 'string' && value.trim() ? value.trim() : null
  }

  // =====================
  // 顶层：当前激活账号用户名
  // 存储键：RegionAI-Username（不按用户隔离）
  // =====================

  // 获取当前激活账号用户名
  async getActiveUsername(): Promise<string | null> {
    const v = await getSetting<string>(this.ksyActiveUsername)
    return v ? v.trim() : null
  }

  // 同步获取当前激活账号用户名
  getActiveUsernameSync(): string | null {
    return this.getSyncString(this.ksyActiveUsername)
  }

  // 设置当前激活账号用户名
  async setActiveUsername(username: string): Promise<boolean> {
    return await setSetting(
      this.ksyActiveUsername,
      this.requireUsername(username),
    )
  }

  // 清除当前激活账号用户名
  async clearActiveUsername(): Promise<boolean> {
    return await removeSetting(this.ksyActiveUsername)
  }

  // =====================
  // 按用户名隔离：自动登录完成标记
  // 存储键：RegionAI-AutoLogin-Completed
  // =====================

  // 获取自动登录完成标记
  async getAutoLoginCompleted(username: string): Promise<boolean | null> {
    const v = await getSetting<boolean>(
      this.buildUsernameScopedKey(username, this.fieldAutoLoginCompleted),
    )
    return v ?? null
  }

  // 同步获取自动登录完成标记
  getAutoLoginCompletedSync(username: string): boolean | null {
    return this.getSyncValue<boolean>(
      this.buildUsernameScopedKey(username, this.fieldAutoLoginCompleted),
    )
  }

  // 设置自动登录完成标记
  async setAutoLoginCompleted(
    username: string,
    completed: boolean,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldAutoLoginCompleted),
      completed,
    )
  }

  // 清除自动登录完成标记
  async clearAutoLoginCompleted(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldAutoLoginCompleted),
    )
  }

  // =====================
  // 按用户名隔离：首次分类完成标记
  // 存储键：RegionAI-Matrix-FirstClassification-Completed
  // =====================

  // 获取首次分类完成标记
  async getFirstClassificationCompleted(
    username: string,
  ): Promise<boolean | null> {
    const v = await getSetting<boolean>(
      this.buildUsernameScopedKey(
        username,
        this.fieldFirstClassificationCompleted,
      ),
    )
    return v ?? null
  }

  // 同步获取首次分类完成标记
  getFirstClassificationCompletedSync(username: string): boolean | null {
    return this.getSyncValue<boolean>(
      this.buildUsernameScopedKey(
        username,
        this.fieldFirstClassificationCompleted,
      ),
    )
  }

  // 设置首次分类完成标记
  async setFirstClassificationCompleted(
    username: string,
    completed: boolean,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(
        username,
        this.fieldFirstClassificationCompleted,
      ),
      completed,
    )
  }

  // 清除首次分类完成标记
  async clearFirstClassificationCompleted(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(
        username,
        this.fieldFirstClassificationCompleted,
      ),
    )
  }

  // =====================
  // 按用户名隔离：账号用户名
  // 存储键：RegionAI-SSO-Username
  // =====================

  // 获取账号用户名
  async getUsername(username: string): Promise<string | null> {
    const v = await getSetting<string>(
      this.buildUsernameScopedKey(username, this.fieldUsername),
    )
    return v ?? null
  }

  // 同步获取账号用户名
  getUsernameSync(username: string): string | null {
    return this.getSyncString(
      this.buildUsernameScopedKey(username, this.fieldUsername),
    )
  }

  // 设置账号用户名
  async setUsername(username: string): Promise<boolean> {
    const normalized = this.requireUsername(username)
    return await setSetting(
      this.buildUsernameScopedKey(normalized, this.fieldUsername),
      normalized,
    )
  }

  // 清除账号用户名
  async clearUsername(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldUsername),
    )
  }

  // =====================
  // 按用户名隔离：Matrix 登录配置（base64 JSON 字符串）
  // 存储键：RegionAI-Matrix-LoginConfig
  // =====================

  // 获取 Matrix 登录配置字符串
  async getMatrixLoginConfig(username: string): Promise<string | null> {
    const v = await getSetting<string>(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfig),
    )
    return v ?? null
  }

  // 同步获取 Matrix 登录配置字符串
  getMatrixLoginConfigSync(username: string): string | null {
    return this.getSyncString(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfig),
    )
  }

  // 设置 Matrix 登录配置字符串
  async setMatrixLoginConfig(
    username: string,
    config: string,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfig),
      config,
    )
  }

  // 清除 Matrix 登录配置字符串
  async clearMatrixLoginConfig(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfig),
    )
  }

  // =====================
  // 按用户名隔离：SSO 登录凭证
  // 存储键：RegionAI-SSO-LoginToken
  // =====================

  // 获取 SSO 登录凭证
  async getLoginToken(username: string): Promise<string | null> {
    const v = await getSetting<string>(
      this.buildUsernameScopedKey(username, this.fieldSSOLoginToken),
    )
    return v ?? null
  }

  // 同步获取 SSO 登录凭证
  getLoginTokenSync(username: string): string | null {
    return this.getSyncString(
      this.buildUsernameScopedKey(username, this.fieldSSOLoginToken),
    )
  }

  // 设置 SSO 登录凭证
  async setLoginToken(username: string, token: string): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldSSOLoginToken),
      token,
    )
  }

  // 清除 SSO 登录凭证
  async clearLoginToken(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldSSOLoginToken),
    )
  }

  // =====================
  // 按用户名隔离：Matrix 访问令牌
  // 存储键：RegionAI-Matrix-AccessToken
  // =====================

  // 获取 Matrix 访问令牌
  async getMatrixAccessToken(username: string): Promise<string | null> {
    const v = await getSetting<string>(
      this.buildUsernameScopedKey(username, this.fieldMatrixAccessToken),
    )
    return v ?? null
  }

  // 同步获取 Matrix 访问令牌
  getMatrixAccessTokenSync(username: string): string | null {
    return this.getSyncString(
      this.buildUsernameScopedKey(username, this.fieldMatrixAccessToken),
    )
  }

  // 设置 Matrix 访问令牌
  async setMatrixAccessToken(
    username: string,
    token: string,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldMatrixAccessToken),
      token,
    )
  }

  // 清除 Matrix 访问令牌
  async clearMatrixAccessToken(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldMatrixAccessToken),
    )
  }

  // =====================
  // 按用户名隔离：Matrix 登录配置原始对象
  // 存储键：RegionAI-Matrix-LoginConfig-Raw
  // =====================

  // 获取 Matrix 登录配置原始对象
  async getMatrixLoginConfigRaw<T = unknown>(
    username: string,
  ): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfigRaw),
    )
    return v ?? null
  }

  // 同步获取 Matrix 登录配置原始对象
  getMatrixLoginConfigRawSync<T = unknown>(username: string): T | null {
    return this.getSyncValue<T>(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfigRaw),
    )
  }

  // 设置 Matrix 登录配置原始对象
  async setMatrixLoginConfigRaw(
    username: string,
    config: unknown,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfigRaw),
      config,
    )
  }

  // 清除 Matrix 登录配置原始对象
  async clearMatrixLoginConfigRaw(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldMatrixLoginConfigRaw),
    )
  }

  // =====================
  // 按用户名隔离：用户配置
  // 存储键：RegionAI-UserConfig
  // =====================

  // 获取用户配置
  async getUserConfig<T = unknown>(username: string): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, this.fieldUserConfig),
    )
    return v ?? null
  }

  // 同步获取用户配置
  getUserConfigSync<T = unknown>(username: string): T | null {
    return this.getSyncValue<T>(
      this.buildUsernameScopedKey(username, this.fieldUserConfig),
    )
  }

  // 设置用户配置
  async setUserConfig(username: string, config: unknown): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldUserConfig),
      config,
    )
  }

  // 清除用户配置
  async clearUserConfig(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldUserConfig),
    )
  }

  // =====================
  // 按用户名隔离：SSO 用户信息
  // 存储键：RegionAI-SSO-UserInfo
  // =====================

  // 获取 SSO 用户信息
  async getSSOUserInfo<T = unknown>(username: string): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, this.fieldSSOUserInfo),
    )
    return v ?? null
  }

  // 同步获取 SSO 用户信息
  getSSOUserInfoSync<T = unknown>(username: string): T | null {
    return this.getSyncValue<T>(
      this.buildUsernameScopedKey(username, this.fieldSSOUserInfo),
    )
  }

  // 设置 SSO 用户信息
  async setSSOUserInfo(username: string, info: unknown): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldSSOUserInfo),
      info,
    )
  }

  // 清除 SSO 用户信息
  async clearSSOUserInfo(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldSSOUserInfo),
    )
  }

  // =====================
  // 按用户名隔离：当前组织
  // 存储键：RegionAI-Current-Organization
  // =====================

  // 获取当前选中的组织
  async getCurrentOrganization<T = unknown>(
    username: string,
  ): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, this.fieldCurrentOrganization),
    )
    return v ?? null
  }

  // 同步获取当前选中的组织
  getCurrentOrganizationSync<T = unknown>(username: string): T | null {
    return this.getSyncValue<T>(
      this.buildUsernameScopedKey(username, this.fieldCurrentOrganization),
    )
  }

  // 设置当前选中的组织
  async setCurrentOrganization(
    username: string,
    value: unknown,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldCurrentOrganization),
      value,
    )
  }

  // 清除当前选中的组织
  async clearCurrentOrganization(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldCurrentOrganization),
    )
  }

  // =====================
  // 按用户名隔离：组织详情列表
  // 存储键：RegionAI-Organization-Details-List
  // =====================

  // 获取组织详情列表
  async getOrganizationDetailsList<T = unknown>(
    username: string,
  ): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, this.fieldOrganizationDetailsList),
    )
    return v ?? null
  }

  // 同步获取组织详情列表
  getOrganizationDetailsListSync<T = unknown>(username: string): T | null {
    return this.getSyncValue<T>(
      this.buildUsernameScopedKey(username, this.fieldOrganizationDetailsList),
    )
  }

  // 设置组织详情列表
  async setOrganizationDetailsList(
    username: string,
    value: unknown,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldOrganizationDetailsList),
      value,
    )
  }

  // 清除组织详情列表
  async clearOrganizationDetailsList(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldOrganizationDetailsList),
    )
  }

  // =====================
  // 按用户名隔离：AgentThinking 缓存
  // 存储键：RegionAI-AgentThinkingCache
  // =====================

  // 获取 bot 思考记录缓存
  async getAgentThinkingCache<T = unknown>(
    username: string,
  ): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, this.fieldAgentThinkingCache),
    )
    return v ?? null
  }

  // 同步获取 bot 思考记录缓存
  getAgentThinkingCacheSync<T = unknown>(username: string): T | null {
    return this.getSyncValue<T>(
      this.buildUsernameScopedKey(username, this.fieldAgentThinkingCache),
    )
  }

  // 设置 bot 思考记录缓存
  async setAgentThinkingCache(
    username: string,
    value: unknown,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldAgentThinkingCache),
      value,
    )
  }

  // 清除 bot 思考记录缓存
  async clearAgentThinkingCache(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldAgentThinkingCache),
    )
  }

  // =====================
  // 按用户名隔离：NewRoom 缓存
  // 存储键：RegionAI-NewRoomCache
  // =====================

  // 获取房间列表缓存
  async getNewRoomCache<T = unknown>(username: string): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, this.fieldNewRoomCache),
    )
    return v ?? null
  }

  // 同步获取房间列表缓存
  getNewRoomCacheSync<T = unknown>(username: string): T | null {
    return this.getSyncValue<T>(
      this.buildUsernameScopedKey(username, this.fieldNewRoomCache),
    )
  }

  // 设置房间列表缓存
  async setNewRoomCache(username: string, value: unknown): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, this.fieldNewRoomCache),
      value,
    )
  }

  // 清除房间列表缓存
  async clearNewRoomCache(username: string): Promise<boolean> {
    return await removeSetting(
      this.buildUsernameScopedKey(username, this.fieldNewRoomCache),
    )
  }

  // =====================
  // 顶层共享：IDMap 缓存（不按用户隔离）
  // 存储键：IDMapCache
  // =====================

  // 获取 IDMap 缓存
  async getIDMapCache<T = unknown>(): Promise<T | null> {
    const v = await getSetting<T>(this.fieldIDMapCache)
    return v ?? null
  }

  // 同步获取 IDMap 缓存
  getIDMapCacheSync<T = unknown>(): T | null {
    return this.getSyncValue<T>(this.fieldIDMapCache)
  }

  // 设置 IDMap 缓存
  async setIDMapCache(value: unknown): Promise<boolean> {
    return await setSetting(this.fieldIDMapCache, value)
  }

  // 清除 IDMap 缓存
  async clearIDMapCache(): Promise<boolean> {
    return await removeSetting(this.fieldIDMapCache)
  }

  // =====================
  // 顶层共享：设备信息（不按用户隔离）
  // 存储键：RegionAI-Device-Info
  // =====================

  // 获取设备信息
  async getDeviceInfo<T = unknown>(): Promise<T | null> {
    const v = await getSetting<T>(this.fieldDeviceInfo)
    return v ?? null
  }

  // 同步获取设备信息
  getDeviceInfoSync<T = unknown>(): T | null {
    return this.getSyncValue<T>(this.fieldDeviceInfo)
  }

  // 设置设备信息
  async setDeviceInfo(value: unknown): Promise<boolean> {
    return await setSetting(this.fieldDeviceInfo, value)
  }

  // 清除设备信息
  async clearDeviceInfo(): Promise<boolean> {
    return await removeSetting(this.fieldDeviceInfo)
  }

  // =====================
  // 通用自由字段 API
  // 为未预定义字段提供开放接口，调用方自行传 fieldName，
  // 不需要每次加新字段都改 SystemStorage
  // =====================

  // 按用户名隔离的通用字段读取
  async getUserField<T = unknown>(
    username: string,
    fieldName: string,
  ): Promise<T | null> {
    const v = await getSetting<T>(
      this.buildUsernameScopedKey(username, fieldName),
    )
    return v ?? null
  }

  // 按用户名隔离的通用字段写入
  async setUserField(
    username: string,
    fieldName: string,
    value: unknown,
  ): Promise<boolean> {
    return await setSetting(
      this.buildUsernameScopedKey(username, fieldName),
      value,
    )
  }

  // 按用户名隔离的通用字段删除
  async removeUserField(username: string, fieldName: string): Promise<boolean> {
    return await removeSetting(this.buildUsernameScopedKey(username, fieldName))
  }

  // 列出某用户下的所有自定义字段名
  async listUserFieldKeys(username: string): Promise<string[]> {
    const suffix = `-${this.requireUsername(username)}`
    const keys = await getAllKeys()
    return keys
      .filter((k) => k.endsWith(suffix))
      .map((k) => k.slice(0, -suffix.length))
  }

  // 清除某用户下的所有存储字段（包括结构化字段和自由字段）
  async clearAllUserFields(username: string): Promise<void> {
    const suffix = `-${this.requireUsername(username)}`
    const keys = await getAllKeys()
    await Promise.all(
      keys.filter((k) => k.endsWith(suffix)).map((k) => removeSetting(k)),
    )
  }

  // === 服务器地址（顶层公用，不参与按用户名隔离） ===

  async getServerApiBaseUrl(): Promise<string | null> {
    const v = await getSetting<string>(this.keyServerApiBaseUrl)
    return v || null
  }
  getServerApiBaseUrlSync(): string | null {
    return this.getSyncString(this.keyServerApiBaseUrl)
  }
  async setServerApiBaseUrl(url: string): Promise<boolean> {
    return await setSetting(this.keyServerApiBaseUrl, url)
  }
  async getServerMatrixUrl(): Promise<string | null> {
    const v = await getSetting<string>(this.keyServerMatrixUrl)
    return v || null
  }
  getServerMatrixUrlSync(): string | null {
    return this.getSyncString(this.keyServerMatrixUrl)
  }
  async setServerMatrixUrl(url: string): Promise<boolean> {
    return await setSetting(this.keyServerMatrixUrl, url)
  }
  async getServerNocobaseUrl(): Promise<string | null> {
    const v = await getSetting<string>(this.keyServerNocobaseUrl)
    return v || null
  }
  getServerNocobaseUrlSync(): string | null {
    return this.getSyncString(this.keyServerNocobaseUrl)
  }
  async setServerNocobaseUrl(url: string): Promise<boolean> {
    return await setSetting(this.keyServerNocobaseUrl, url)
  }



  async getServerPinnedTarget(): Promise<string | null> {
    const v = await getSetting<string>(this.keyServerPinnedTarget)
    return v || null
  }
  async setServerPinnedTarget(url: string): Promise<boolean> {
    return await setSetting(this.keyServerPinnedTarget, url)
  }
  async clearServerPinnedTarget(): Promise<boolean> {
    return await removeSetting(this.keyServerPinnedTarget)
  }
}

export const SystemStorageManager = new SystemStorage()
