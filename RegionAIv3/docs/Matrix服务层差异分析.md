# Matrix 服务层差异分析

> 对比项目：
>
> - **项目1（YanJing-Matrix-Platform）**: `D:\Region\YanJing-Matrix-Platform\YanJing-Matrix-Platform`
> - **项目2（RegionAI-Platform2）**: `D:\Region\RegionAI-Platform2\RegionAI-Platform`
>
> 分析日期：2026-07-06

---

## 一、文件级差异总览

### 1.1 项目1独有、项目2缺失的文件

| 文件                         | 说明                                 |
| ---------------------------- | ------------------------------------ |
| `Matrix/space.ts`            | Space（空间）父空间反查逻辑，约480行 |
| `Matrix/refreshRoomState.ts` | 房间状态统一刷新函数，约240行        |

### 1.2 项目2独有、项目1缺失的文件

| 文件                                          | 说明                                       |
| --------------------------------------------- | ------------------------------------------ |
| `Matrix/classification/classifier.ts`         | **房间分类核心算法**，约690行              |
| `Matrix/classification/displayResolver.ts`    | 分类结果→UI外显视图解析，约170行           |
| `Matrix/classification/memberTypeResolver.ts` | 成员类型（user/bot）批量解析，约130行      |
| `Matrix/classification/systemRoomRules.ts`    | 系统房间识别规则与外显名拼装，约120行      |
| `Matrix/incrementalClassify.ts`               | 增量房间分类事件监听与队列，约135行        |
| `Matrix/serverNotice.ts`                      | Server Notices 房间检测与信息dump，约300行 |

### 1.3 双方共有的Matrix文件

| 文件                                    | 项目1行数 | 项目2行数 | 差异程度                                            |
| --------------------------------------- | --------- | --------- | --------------------------------------------------- |
| `Matrix/client.ts`                      | 571       | 946       | **重大差异**                                        |
| `Matrix/eventManager.ts`                | 451       | 581       | 中等差异（日志替换+参数结构语义变化）               |
| `Matrix/indexeddbStore.ts`              | 93        | 103       | 微小差异（格式化）                                  |
| `Matrix/message.ts`                     | 821       | 1048      | **重大差异**（HTML化+turnId移除+指纹缓存+日志迁移） |
| `Matrix/profile.ts`                     | 88        | 97        | 微小差异（格式化）                                  |
| `Matrix/room.ts`                        | 341       | 405       | 中等差异                                            |
| `Matrix/roomManagement.ts`              | 404       | 554       | 微小差异（日志替换+格式化）                         |
| `Matrix/search.ts`                      | 146       | 193       | 微小差异（日志替换+格式化）                         |
| `Matrix/timeline.ts`                    | 377       | 433       | 微小差异（格式化）                                  |
| `Matrix/MSG/sendMessage.ts`             | 64        | 109       | 中等差异                                            |
| `Matrix/MSGOperations/MsgDelete.ts`     | 301       | 342       | 微小差异（格式化）                                  |
| `Matrix/MSGOperations/MsgForward.ts`    | 106       | 58        | **重大差异**                                        |
| `Matrix/MSGOperations/MsgViewSource.ts` | 53        | 69        | 微小差异（格式化）                                  |

---

## 二、Matrix核心文件逐文件详细对比

### 2.1 client.ts —— 最关键的差异

这是两个项目差异最大的文件，涉及架构级别的变更。

#### 2.1.1 日志系统替换（全文件级别）

| 方面     | 项目1                                            | 项目2                                                    |
| -------- | ------------------------------------------------ | -------------------------------------------------------- |
| 日志方式 | `console.log` / `console.warn` / `console.error` | `logInfo` / `logWarn` / `logError` from `@/utils/logger` |
| 日志格式 | `console.warn('[System:...] msg', data)`         | `logWarn("MatrixClient", "", "[System:...] msg", data)`  |
| 日志分类 | 无                                               | 带模块名（第一个参数）+ 子分类（第二个参数）             |

项目2的所有日志调用都增加了模块名和子分类，例如：

```typescript
// 项目1
console.warn('[System:MatrixClient:getAuthedClient] 尚未登录或客户端未初始化')

// 项目2
logWarn(
  'MatrixClient',
  '',
  '[System:MatrixClient:getAuthedClient] 尚未登录或客户端未初始化',
)
```

#### 2.1.2 多账号支持（架构级差异）

项目2引入了多账号体系，所有存储操作都需传入 `username` 参数：

```typescript
// 项目1 —— 无账号区分
await SystemStorageManager.setMatrixAccessToken(data.access_token)
await SystemStorageManager.getMatrixAccessToken()
await SystemStorageManager.setLoginToken(LoginToken)

// 项目2 —— 按账号隔离
await SystemStorageManager.setMatrixAccessToken(
  LoginConfig.username,
  data.access_token,
)
await SystemStorageManager.getMatrixAccessToken(activeUsername)
await SystemStorageManager.setLoginToken(LoginConfig.username, LoginToken)
```

项目2新增了 `getActiveUsername()` 私有方法：

```typescript
// 项目2独有
private async getActiveUsername(): Promise<string> {
  const username = await SystemStorageManager.getActiveUsername();
  if (!username) throw new Error("[System:MatrixClient] 缺少激活账号用户名");
  return username;
}
```

#### 2.1.3 启动性能测量（startupTiming）

项目2在关键登录/验证路径中加入了性能打点：

```typescript
// 项目2独有
import { failTiming, finishTiming, startTiming } from '@/utils/startupTiming'

// 在 useAccessTokenLogin、validateAccessToken、autoLogin、
// ensureValidMatrixAccessToken 中均有打点
const _uatl = startTiming('MatrixClient', 'useAccessTokenLogin', 'total')
// ... 业务逻辑 ...
finishTiming('MatrixClient', 'useAccessTokenLogin', 'total', _uatl, {
  actualUserId,
})
// 或失败时
failTiming('MatrixClient', 'useAccessTokenLogin', 'total', _uatl, error)
```

#### 2.1.4 useAccessTokenLogin 签名变化

```typescript
// 项目1
async useAccessTokenLogin(
  token: string,
  homeserver: string,
  userId?: string,
  deviceId?: string
): Promise<MatrixUser>

// 项目2 —— 新增 options 参数支持复用 whoami 结果
async useAccessTokenLogin(
  token: string,
  homeserver: string,
  userId?: string,
  deviceId?: string,
  options?: { verifiedUserId?: string },
): Promise<MatrixUser>
```

项目2中，如果 `options.verifiedUserId` 已提供，则跳过 `validateAccessToken` 内部的 whoami 调用，直接复用外部校验结果，避免重复网络请求。

#### 2.1.5 startClient 调用时机分离（关键架构变更）

| 方面                 | 项目1                                | 项目2                                                               |
| -------------------- | ------------------------------------ | ------------------------------------------------------------------- |
| startClient 调用位置 | `useAccessTokenLogin` 方法内直接调用 | **不在** `useAccessTokenLogin` 中调用                               |
| 调用时机             | 登录完成后立即启动 /sync             | 由 `projectStart.ts` 在本地数据恢复完成后调用 `startSyncIfNeeded()` |

```typescript
// 项目1 —— useAccessTokenLogin 内直接 startClient
this.AuthenticatedMatrixClient.startClient()

// 项目2 —— useAccessTokenLogin 内只绑定事件，不启动同步
// 绑定事件管理器与时间线服务
matrixEventManager.bindClient(this.AuthenticatedMatrixClient);
matrixTimelineService.bindClient(this.AuthenticatedMatrixClient);
// startClient() 推迟到 projectStart 本地数据恢复完成后调用

// 项目2独有 —— 新增独立方法
startSyncIfNeeded(): void {
  if (typeof this.AuthenticatedMatrixClient?.startClient === "function") {
    this.AuthenticatedMatrixClient.startClient();
  }
}
```

**原因**：避免 SDK 首轮 `/sync` 与本地数据（如 IndexedDB）读取产生竞争条件。

#### 2.1.6 autoLogin —— 新增 active-username 守卫 + whoami 复用

项目2 的 `autoLogin` 有两处项目1没有的变更：

**变更A：active-username 早退守卫**

```typescript
// 项目2独有 —— autoLogin 开头新增的守卫
const activeUsername = await SystemStorageManager.getActiveUsername()
if (!activeUsername) {
  // 项目1 没有这个早退；项目2 找不到激活用户直接返回 null
  return null
}
```

此后所有存储读取都改为 `getMatrixAccessToken(activeUsername)`、`getLoginToken(activeUsername)`，不再是无参调用。

**变更B：whoami 复用的跨方法数据流（完整链路）**

```
autoLogin()
  │
  ├─ 1) validateAccessToken(token, homeserver)  → 返回 { userId }
  │      （临时客户端 whoami 请求）
  │
  └─ 2) useAccessTokenLogin(token, homeserver, matrixId, deviceId,
         { verifiedUserId: validated.userId })   ← 把步骤1的结果传入
              │
              ├─ if (options?.verifiedUserId) → 直接使用，跳过内部 whoami()
              └─ else → 调用 this.validateAccessToken(token, homeserver) 再查一次
```

即：`autoLogin` 先单独做 whoami 校验拿到 userId，然后通过 `options.verifiedUserId` 传入 `useAccessTokenLogin`，使后者避免重复发送 whoami 请求。项目1 没有这个传递机制，`useAccessTokenLogin` 无论如何都会自己调一次 whoami。

#### 2.1.7 validateCurrentSession —— token 读取改为按用户隔离

```typescript
// 项目1 —— 无用户参数
const token =
  client.getAccessToken?.() ||
  (await SystemStorageManager.getMatrixAccessToken())

// 项目2 —— 按当前激活用户读取
const activeSessionUser = await SystemStorageManager.getActiveUsername()
const token =
  client.getAccessToken?.() ||
  (activeSessionUser
    ? await SystemStorageManager.getMatrixAccessToken(activeSessionUser)
    : null)
```

#### 2.1.8 ensureValidMatrixAccessToken —— 三项遗漏变更

项目2 的 `ensureValidMatrixAccessToken` 相比项目1有3处具体变更：

**① 新增 active-username 守卫**

```typescript
// 项目2独有
const activeUsername = await SystemStorageManager.getActiveUsername()
if (!activeUsername) {
  logWarn('MatrixClient', '', '...缺少激活账号用户名')
  return null
}
```

**② 所有存储操作改为按用户隔离**

```typescript
// 项目1
const currentToken = (await SystemStorageManager.getMatrixAccessToken()) || null
const loginToken = (await SystemStorageManager.getLoginToken()) || null
await SystemStorageManager.setMatrixAccessToken(freshToken)

// 项目2
const currentToken =
  (await SystemStorageManager.getMatrixAccessToken(activeUsername)) || null
const loginToken =
  (await SystemStorageManager.getLoginToken(activeUsername)) || null
await SystemStorageManager.setMatrixAccessToken(activeUsername, freshToken)
```

**③ 失败路径增加 failTiming**

```typescript
// 项目2独有 —— 整个函数最外层增加了失败打点
const result = await this.ensureValidTokenInflight
if (!result)
  failTiming(
    'MatrixClient',
    'ensureValidMatrixAccessToken',
    'total',
    _evt,
    new Error('refresh failed'),
  )
return result
```

#### 2.1.9 性能打点覆盖的具体方法和分支标签

项目2的 startupTiming 除了打点方法外，`autoLogin` 还带有**分支标签**用于排查走到了哪个分支：

```
autoLogin 打点分支：
  ├─ branch: "noUsername"      → 无激活用户，直接返回 null
  ├─ branch: "noTokens"        → 既无 AccessToken 也无 LoginToken
  ├─ branch: "MatrixAccessToken" → 用已有 AccessToken 成功登录
  ├─ branch: "noLoginToken"    → AccessToken 失效且无 LoginToken 可兑换
  └─ branch: "LoginToken"      → 用 LoginToken 兑换成功登录（含失败打点）
```

打点覆盖的4个方法：`useAccessTokenLogin`、`validateAccessToken`、`autoLogin`、`ensureValidMatrixAccessToken`。

#### 2.1.10 loadLoginConfigLite 多账号适配

```typescript
// 项目1 —— 无用户参数
const config = await SystemStorageManager.getMatrixLoginConfig()

// 项目2 —— 按当前激活用户读取
const activeUsername = await SystemStorageManager.getActiveUsername()
const config = await SystemStorageManager.getMatrixLoginConfig(activeUsername)
```

---

### 2.2 message.ts —— 富文本HTML支持

#### 2.2.1 两个 Options 类型都增加了 htmlBody

```typescript
// 项目1
type SendTextOptions = {
  replyToEventId?: string
}
type SendCompositeOptions = {
  textFirst?: boolean
  replyToEventId?: string
  mentions?: Array<{ userId: string; displayName?: string }>
}

// 项目2 —— SendTextOptions 和 SendCompositeOptions 都增加了 htmlBody 字段
type SendTextOptions = {
  replyToEventId?: string
  htmlBody?: string
}
type SendCompositeOptions = {
  textFirst?: boolean
  replyToEventId?: string
  mentions?: Array<{ userId: string; displayName?: string }>
  htmlBody?: string
}
```

#### 2.2.2 三处文本发送路径全部 HTML 化

不仅是 `sendText`，以下三个方法在项目2中都新增了 `format` + `formatted_body`：

| 方法                              | 项目1               | 项目2                                                                                           |
| --------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `sendText`                        | 纯文本              | `format: "org.matrix.custom.html"` + `formatted_body`                                           |
| `editText`                        | 纯文本              | `format: "org.matrix.custom.html"` + `formatted_body`                                           |
| `sendTextWithMentions`            | 纯文本              | `format: "org.matrix.custom.html"` + `formatted_body`                                           |
| `sendCompositeMessage` (text部分) | 仅 `msgtype + body` | `format` + `formatted_body`，且支持 `mentions` 分支选择 `buildMentionHtml` 还是 `buildRichHtml` |

```typescript
// 项目2 —— sendCompositeMessage 中 text 片段的构建逻辑
const textContent = text
  ? {
      msgtype: 'm.text',
      body: text,
      format: 'org.matrix.custom.html',
      formatted_body:
        options?.htmlBody ||
        (options?.mentions?.length
          ? this.buildMentionHtml(text, options.mentions)
          : this.buildRichHtml(text)),
      ...(options?.mentions?.length
        ? { 'm.mentions': { user_ids: options.mentions.map((m) => m.userId) } }
        : {}),
      ...baseExtra,
      'com.yanjing.bundle_index': textIndex,
    }
  : null
```

#### 2.2.3 新增HTML构建方法（项目2独有）

| 方法                               | 功能                                      |
| ---------------------------------- | ----------------------------------------- |
| `escapeHtml(text)`                 | 转义 `& < > " '` 为 HTML 实体             |
| `buildRichHtml(text)`              | 转义后把 `\n` 替换为 `<br />`             |
| `buildMentionHtml(text, mentions)` | 把 `@displayName` 替换为 `matrix.to` 链接 |
| `escapeRegExp(text)`               | 转义正则特殊字符                          |

#### 2.2.4 消息指纹缓存（项目2独有）

`getRoomMessages` 中增加了指纹机制，避免触发不必要的响应式计算：

```typescript
// 项目2独有 —— 指纹对比，无变化则跳过 store 写入
const cached = store.messageFingerprints.get(roomId)
const fingerprint =
  items.map((m) => m.id).join(',') +
  '|' +
  items.reduce((s, m) => s + m.content.length, 0)

if (cached === fingerprint) return items

store.setRoomMessages(roomId, items)
```

#### 2.2.5 turnId 字段被移除（行为变更）

`buildMessageItem` 中原本会提取 `m.relates_to['io.shayu.turn_id']` 并放入返回的消息对象：

```typescript
// 项目1 —— 提取 turnId 并写入消息对象
const turnId = (content as { 'm.relates_to'?: Record<string, unknown> })?.[
  'm.relates_to'
]?.['io.shayu.turn_id'] as string | undefined

return {
  // ...
  turnId,
  // ...
}
```

项目2 的 `buildMessageItem` **完全删除了**这个字段的提取逻辑和返回值中的 `turnId` 属性。下游消费者如果依赖消息项中的 shayu turn 标识来关联对话轮次，将会失效。

#### 2.2.6 全文件日志迁移

和 `room.ts` 同理，`message.ts` 的 **全部 8 个方法** 的 `console.warn` 都替换为了 `logWarn("message", "", ...)`：

`getRoomMessages`、`sendText`、`editText`、`sendTextWithMentions`、`uploadFile`、`sendFile`、`sendCompositeMessage`、`getDownloadUrl`

---

### 2.3 room.ts —— 未读计数与读标记

#### 2.3.1 未读计数来源不同

```typescript
// 项目1 —— 本地 store 维护
getUnreadCount(room: MatrixRoom | Room): number {
  const timelineStore = useMatrixTimelineStore();
  const roomId = this.getRoomId(room);
  return timelineStore.unreadCountByRoomId[roomId] ?? 0;
}

// 项目2 —— 直接用 SDK 的 notification count
getUnreadCount(room: MatrixRoom | Room): number {
  const sdkRoom = this.resolveSdkRoom(room);
  return sdkRoom?.getUnreadNotificationCount?.() ?? 0;
}
```

#### 2.3.2 新增 getReadMarkerEventId（项目2独有）

```typescript
getReadMarkerEventId(room: MatrixRoom | Room, userId?: string): string | null {
  const sdkRoom = this.resolveSdkRoom(room);
  if (!sdkRoom) return null;
  const uid = userId || matrixClient.getAuthedClient()?.getUserId?.();
  if (!uid) return null;
  return sdkRoom.getEventReadUpTo(uid) ?? null;
}
```

#### 2.3.3 消息预览差异

```typescript
// 项目1 —— 去除HTML标签
getPreview(room): string {
  const stripHtml = (text: string) => text.replace(/<[^>]*>/g, '')
  // ...
  return stripHtml(rawPreview)
}

// 项目2 —— 不再去除HTML标签（因为自身已发送HTML格式消息）
getPreview(room): string {
  // 没有 stripHtml
  return lastMessage?.content || timelineStore.previewByRoomId[roomId] || "暂无消息"
}
```

#### 2.3.4 全类日志系统替换

这并非仅仅是 `getOriginalRooms` "增加了日志输出"，而是 **room.ts 全类所有方法** 的日志从 `console` 迁移到了 `logInfo`/`logWarn`。以下方法全部做了替换（项目1均为 `console.warn`，项目2均为 `logWarn("room", "", ...)`）：

| 方法                 | 项目1               | 项目2                                                    |
| -------------------- | ------------------- | -------------------------------------------------------- |
| `getOriginalRooms`   | `console.warn(...)` | `logWarn("room", "", ...)` + 新增 `logInfo` 输出房间列表 |
| `isSpaceRoom`        | `console.warn(...)` | `logWarn("room", "", ...)`                               |
| `isDirectRoom`       | `console.warn(...)` | `logWarn("room", "", ...)`                               |
| `getAllRoomMembers`  | `console.warn(...)` | `logWarn("room", "", ...)`                               |
| `getRoomMembers`     | `console.warn(...)` | `logWarn("room", "", ...)`                               |
| `getRoomMembersById` | `console.warn(...)` | `logWarn("room", "", ...)`                               |

此外 `isDirectRoom` 中注释掉的日志代码也同步从 `console.log` 改为了 `logInfo`。

---

### 2.4 roomManagement.ts —— 日志迁移（无逻辑差异）

404行 vs 554行（差150行），差异全部来自：

- 全文件 `console.log` → `logInfo("roomManagement", "", ...)`
- `console.warn` → `logWarn("roomManagement", "", ...)`
- 代码格式化（缩进、引号）

逻辑、方法签名、类型定义完全一致，无新增/移除的方法。

---

### 2.5 MSG/sendMessage.ts —— 新增 MentionPayload 类型 + buildMentionPayload 函数

项目2新增了一个类型和函数：

**① 新增 MentionPayload 类型（项目2独有）**

```typescript
export type MentionPayload = {
  plainText: string
  htmlText: string
  hasMentions: boolean
  mentions: Array<{ userId: string; displayName: string }>
}
```

**② 新增 buildMentionPayload 函数**

用于解析 `@[displayName](userId)` 格式的提及占位：

```typescript
// 项目2独有
export function buildMentionPayload(message: string): MentionPayload {
  const mentionRegex = /@\[(.*?)\]\((.*?)\)/g
  // 同时生成 plainText 和 htmlText 两个版本
}
```

正则解析 `@[name](id)` 后：

- `plainText`: `@displayName` 格式的纯文本
- `htmlText`: `<a href="https://matrix.to/#/userId">@displayName</a>` 格式的HTML
- `mentions`: 去重后的提及用户列表
- `hasMentions`: 是否包含任何提及

其余函数（`normalizeFile`、`collectClipboardFiles`、`collectDragFiles`、`fileKind`）双方完全一致。

---

### 2.6 MSGOperations/MsgForward.ts —— 功能裁剪

项目2**移除了 `forwardMessageIndividual` 函数**（逐条转发），只保留了 `forwardMessageBundle`（合集转发）。

同时移除了 `mapMsgType` 辅助函数。

---

### 2.7 indexeddbStore.ts —— 逻辑一致

代码格式化差异（缩进风格、引号风格），逻辑完全相同。

---

### 2.8 profile.ts —— 一致

逻辑完全相同，仅格式化差异。

---

### 2.9 search.ts —— 一致

逻辑完全相同，仅日志方式差异（`console.log` → `logInfo/logWarn`）。

---

### 2.10 timeline.ts —— 一致

逻辑完全相同，仅格式化差异。

### 2.11 eventManager.ts —— 日志迁移 + 一处语义差异

全文件的 `console.log`/`console.warn`/`console.error` 替换为 `logInfo`/`logWarn`/`logError`（与其他文件一致）。

**一处真实语义差异：tryParseExtensible 的异常日志参数结构**

```typescript
// 项目1 —— event 和 error 作为两个独立参数传入
console.warn(
  '[System:MatrixEventManager:tryParseExtensible] 解析事件失败',
  event,
  error,
)

// 项目2 —— event 和 error 被包裹成一个数组
logWarn(
  'eventManager',
  '',
  '[System:MatrixEventManager:tryParseExtensible] 解析事件失败',
  [event, error],
)
```

这不是纯格式化。`console.warn` 接收多个独立参数时，浏览器 DevTools 可以分别展开每个对象。而 `[event, error]` 包裹成数组后，`logWarn` 如果内部做 `JSON.stringify` 序列化，`event`（一个 MatrixEvent 实例）可能产出完全不同的输出（如 `{}` 或循环引用错误），而 `console.warn` 则直接渲染可交互的对象树。

---

## 三、项目2独有模块详解

### 3.1 房间分类系统（classification/）

这是项目2相对于项目1最大的架构增量，包含4个模块：

#### 3.1.1 classifier.ts —— 核心分类算法

**4步算法流程**：

```
Step A: 系统房间短路
  └→ AIAdmin / AISupport / ServerNotice → kind='system'

Step B: DM列表命中
  └→ 'uu' → kind='user', subKind='private1v1'
  └→ 'ub' → kind='bot',  subKind='private1v1'

Step C: 遍历join成员（排除自己），按 user/total 分5支
  └→ user=1, total=1  → kind='user', subKind='self'
  └→ user=2          → kind='user', subKind='private1v1'
  └→ user>2          → kind='user', subKind='group'
  └→ user=1, total=2 → kind='bot',  subKind='private1v1'
  └→ user=1, total>2 → kind='bot',  subKind='group'

Step D: unknown成员回退 → kind 降级为 'user'
```

**输出结构 RoomClassDisplayRow**：

```typescript
interface RoomClassDisplayRow {
  roomId: string
  kind: 'system' | 'user' | 'bot'
  subKind: 'self' | 'private1v1' | 'group' | null
  systemTag: 'AIAdmin' | 'AISupport' | 'ServerNotice' | null
  targetUserId: string | null
  targetUsername: string | null
  displayName: string // 外显名
  displayAvatarMxc: string | null // 头像mxc
  memberSignature: string | null // 成员签名（用于增量判重）
  // ...
}
```

**外显名四级回退规则**：

- user/group → room.name → "群聊"
- user/private1v1 & self → 目标对象nickname → room.name → ""
- bot/任意 → room.name → room.topic → target.nickname → "任务"

**导出函数**：

| 函数                                | 用途                         |
| ----------------------------------- | ---------------------------- |
| `classifyOneRoom(roomId, context?)` | 分类单个房间                 |
| `classifyAllRooms(context?)`        | 遍历所有房间全量分类（并发） |
| `classifyRooms(roomIds, context?)`  | 批量分类指定房间列表         |
| `loadDMRoomIndex()`                 | 加载DM房间索引               |

#### 3.1.2 displayResolver.ts —— 外显视图解析

把 `RoomClassDisplayRow` 转换为 UI 可直接使用的 `RoomDisplayView`：

- 头像本地化：mxc → 本地文件路径（依赖 `matrixAvatar` 工具）
- 占位类型判定：`avatar` / `groupGlyph` / `systemGlyph` / `defaultAvatar`
- 兜底文案："未命名会话"

#### 3.1.3 memberTypeResolver.ts —— 成员类型解析

判定 Matrix 成员是 user 还是 bot：

- 输入：Matrix ID（`@u:server`）或 localpart（`u`）
- 数据源：`GetIMUserInfoPreferLocal` → `GetIMUserInfo`（两级兜底）
- 并发去重：同一次分类周期内同一用户只请求一次
- 失败返回 `'unknown'`，分类器会因此将整个房间降级为 user 大类

#### 3.1.4 systemRoomRules.ts —— 系统房间判定

识别3种系统房间：

- **AIAdmin**：从 `specialRoomStore.config.AIAdminByOrg` 反查（有 appId）或 `AIAdmin` 列表命中（无 appId）
- **AISupport**：从 `specialRoomStore.config.AISupport` 列表命中
- **ServerNotice**：通过 `room.tags["m.server_notice"]` 检测

外显文案：

- AIAdmin → `{组织名}组织助手`
- AISupport → `客服小研`
- ServerNotice → `系统通知`

---

### 3.2 incrementalClassify.ts —— 增量分类

监听 `eventManager` 的房间事件，自动触发增量重分类：

- 监听 `ROOM_JOINED` / `ROOM_INVITED` / `ROOM_UPDATED`
- 500ms 防抖批量 flush
- 首登分类未完成时入队等待
- 分类结果写入 `ClassDisplayCache`（按用户名隔离）
- 完成后调用 `useSystemStore().refreshFromClassification()`

**与项目1的交叉引用：这些事件在项目1中是如何处理的？**

项目1 和项目2 都有 `eventManager.ts`，两者对 ROOM_JOINED/ROOM_INVITED/ROOM_UPDATED 这些事件的**底层产生机制完全相同**（都是 `handleSync`、`handleTimeline`、`handleMyMembership` 等 SDK 事件回调触发）。区别在于**消费侧**：

| 事件           | 项目1的消费者                   | 项目2的消费者                                             |
| -------------- | ------------------------------- | --------------------------------------------------------- |
| `ROOM_JOINED`  | `timeline.ts` (更新时间线store) | `timeline.ts` + **`incrementalClassify.ts` (触发重分类)** |
| `ROOM_INVITED` | `timeline.ts` (更新时间线store) | `timeline.ts` + **`incrementalClassify.ts` (触发重分类)** |
| `ROOM_UPDATED` | `timeline.ts` (更新时间线store) | `timeline.ts` + **`incrementalClassify.ts` (触发重分类)** |

即：项目2在项目1的 `timeline.ts` 消费者之上**叠加了**增量分类消费者。这不是替代关系，是新增一层监听。

项目1 没有 classification 体系，所有房间的外显名/头像由 `room.ts` 的 `getRoomName`/`getAvatarUrl` 直接从 SDK Room 对象读取，不经过分类器。项目2 则通过分类器预先计算 `RoomClassDisplayRow` 并缓存在 `ClassDisplayCache` 中，UI 从缓存读取而非实时查 SDK。

---

### 3.3 serverNotice.ts —— 服务器通知房间

功能：

- `findServerNoticeRoom()`：遍历所有房间，查找 `tags["m.server_notice"]` 标记的房间
- `inspectServerNoticeRoom()`：完整 dump 房间信息（成员、状态事件、时间线、账号数据、tags）
- 用于调试 Synapse `server_notices` 配置

---

## 四、项目1独有模块详解

### 4.1 space.ts —— 空间反查

基于 Matrix 协议的 Space（空间）功能：

- `getParentSpacesByRoomId(roomId)`: 从子房间的 `m.space.parent` 状态事件反查所有父空间
- `getCanonicalParentSpace(roomId)`: 优先 m.space.parent → 失败则反向查 m.space.child
- `findParentSpaceByChildRoomId(roomId)`: 遍历所有 Space 的 m.space.child 反向查找

返回的 `SpaceInfo` 包含：

- 基础信息：name, topic, avatarUrl, membership, isJoined
- 成员统计：joinedMemberCount, totalMemberCount
- 子房间：childRoomCount, childRoomIds
- 创建信息：creator, createTs, joinRule
- 墓碑：isTombstoned, replacementRoomId
- 别名：canonicalAlias, altAliases

### 4.2 refreshRoomState.ts —— 房间状态刷新

统一刷新"消息页房间域状态"的核心函数：

```
流程：
1. 显示全局遮罩（可选）
2. 清除 changedRoomId 的 peer 缓存
3. 确保 specialRoomStore 已加载
4. 按 currentFunction 获取房间列表（Mission/AIAdmin/AISupport/Message）
5. 选择下一个活跃房间（优先 preferredRoomId）
6. 预拉取房间外显信息
7. 更新 currentSystemRoomId
8. 刷新当前房间消息
```

需要注意：当前代码中 `BYPASS = true` 是硬编码的，跳过了 `roomClassificationStore` 的实际分类逻辑。

---

## 五、非Matrix服务层差异

### 5.1 文件差异

| 项目1有、项目2无                                      | 项目2有、项目1无                    |
| ----------------------------------------------------- | ----------------------------------- |
| `Project/Approval/data.ts`                            | `Project/Ensure/Secretary.ts`       |
| `Project/CC/AIEmployee.ts`                            |                                     |
| `Project/Ensure/Ensure.ts`                            |                                     |
| `Project/Ensure/EnsureDirectRoom copy.ts`（副本文件） |                                     |
| `Project/KnowledgeBase/mockService.ts`                |                                     |
| `Project/Organization/adapter.ts`                     |                                     |
| `Project/SystemNotification.ts`                       |                                     |
| `Project/UserBot/AuthorizeUserBot.ts`                 |                                     |
| `SocketIO/1.json`                                     |                                     |
| `services/1.json` 等根级JSON文件                      |                                     |
| `services/ProjectStart.ts`（大写P）                   | `services/projectStart.ts`（小写p） |

---

## 六、架构差异总结

### 6.1 项目2相比项目1的核心演进

| 维度              | 项目1            | 项目2                              |
| ----------------- | ---------------- | ---------------------------------- |
| **账号体系**      | 单账号           | 多账号（所有存储按 username 隔离） |
| **日志系统**      | console 直接输出 | 结构化日志（模块+子分类+数据）     |
| **性能监控**      | 无               | startupTiming 全链路打点           |
| **房间分类**      | 无分类系统       | 完整的三分类+增量体系              |
| **消息格式**      | 纯文本           | HTML富文本（格式化+@提及链接）     |
| **未读计数**      | 本地 store 维护  | SDK notification count             |
| **/sync启动**     | 登录后立即启动   | 延迟到本地数据恢复后（避免竞争）   |
| **消息预览**      | 去除HTML标签     | 保留HTML（因为自身发HTML）         |
| **转发功能**      | 合集+逐条        | 仅合集转发                         |
| **Space空间**     | 完整空间反查     | 无（未使用space功能）              |
| **Server Notice** | 无               | 完整检测+dump                      |

### 6.2 核心差异原因推测

1. **多账号支持**：项目2需要支持用户切换账号，因此存储层全部重构为按用户名隔离
2. **房间分类系统**：项目2引入了AI助手、Bot、普通用户的三分类体系，需要独立的分类模块来区分不同类型的对话
3. **富文本消息**：项目2需要更好的消息展示（@提及链接、换行保留），因此统一发送 HTML 格式
4. **/sync延迟启动**：为解决 SDK 首轮同步与本地数据恢复的竞争条件
5. **服务端通知**：项目2需要处理 Synapse server notices（如服务器维护通知、资源警告等）
