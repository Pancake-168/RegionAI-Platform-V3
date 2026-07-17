import { API_URLS } from '@/apiUrls'
import { useIDmapStore } from "@/stores/IDmap";
import type { IDMapUser, GetIMUserInfoApiResponse } from "@/types/IDmap";
import type { ApiResult } from '@/types/ApiResult';
import { SystemStorageManager } from "@/utils/SystemStorage";
import { createLogger } from '@/utils/logger';



export interface UserApp {
    app_id: string
    app_tag: string
    app_name: string
}

// 用户个人信息及拥有的应用列表
export interface UserProfile {
    username: string
    nickname: string | null
    credit?: number
    apps: UserApp[]
}




// 拉取当前登录账号的 SSO 用户信息，并按用户名写入 SystemStorage
type data = UserProfile
let userInfoInflightPromise: Promise<ApiResult<data>> | null = null;
export async function UserInfo() {
    if (userInfoInflightPromise) {
        return userInfoInflightPromise;
    }
    const log = createLogger('UserInfo.ts', 'UserInfo');
    let error: string | undefined;
    const task = (async (): Promise<ApiResult<data>> => {
        const activeUsername = await SystemStorageManager.getActiveUsername()
        if (!activeUsername) {
            error = "未获取到当前激活账号用户名，无法获取当前用户信息"
            log.error(error)
            return { ok: false, data: null, error: error ?? '未知错误' };
        }

        const token =
            (await SystemStorageManager.getLoginToken(activeUsername)) || "";

        if (!token) {
            error = "未获取到有效token，无法获取当前用户信息"
            log.error(error)
            return { ok: false, data: null, error: error ?? '未知错误' };
        }

        try {
            log.info("开始获取当前用户信息")
            const apiurl = API_URLS.UserInfo();
            const res = await fetch(apiurl, {
                method: "POST",
                headers: {
                    accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                const data = await res.json() as data;
                log.info('获取当前用户信息成功', data);
                try {
                    await SystemStorageManager.setSSOUserInfo(activeUsername, data);
                    log.info("当前用户信息写入本地成功成功")
                }
                catch (e) {
                    log.error('当前用户信息写入本地失败', e);
                    error = String(e);
                }
                return { ok: true, data };
            }
            error = `HTTP ${res.status}`;

        } catch (e) {
            log.error('获取当前用户信息失败', e);
            error = String(e);
        }
        return { ok: false, data: null, error: error ?? '未知错误' };
    })()

    userInfoInflightPromise = task;

    try {
        return await task;
    } finally {
        if (userInfoInflightPromise === task) {
            userInfoInflightPromise = null;
        }
    }
}



// 修改当前登录账号昵称，并同步更新 SystemStorage 中缓存的 SSO 用户信息
export async function userdetail(nickname: string) {

    const log = createLogger('UserInfo.ts', 'userdetail');
    let error: string | undefined;

    const activeUsername = await SystemStorageManager.getActiveUsername()
    if (!activeUsername) {
        error = "未获取到当前激活账号用户名，无法更新当前用户信息"
        log.error(error)
        return { ok: false, data: null, error: error ?? '未知错误' };
    }

    const token =
        (await SystemStorageManager.getLoginToken(activeUsername)) || "";

    if (!token) {
        error = "未获取到有效token，无法更新当前用户信息"
        log.error(error)
        return { ok: false, data: null, error: error ?? '未知错误' };
    }

    try {
        log.info("开始更新当前用户信息")
        const body = {
            nickname: nickname,
        };
        const apiurl = API_URLS.userdetail();
        const res = await fetch(apiurl, {
            method: "PUT",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        })

        if (res.ok) {
            const data = await res.json() as data;
            log.info('更新当前用户信息成功', data);

            try {
                const ssoInfo =
                    (await SystemStorageManager.getSSOUserInfo<any>(activeUsername))
                if (!ssoInfo) {
                    error = "未获取到当前用户本地信息，无法覆盖当前用户信息"
                    log.error(error)
                }
                if (ssoInfo && typeof ssoInfo === "object") {
                    ssoInfo.nickname = nickname;
                    await SystemStorageManager.setSSOUserInfo(activeUsername, ssoInfo);
                    log.info("覆盖当前用户信息成功")
                }
            }
            catch (e) {
                log.error('更新当前用户信息成功但本地刷新失败', e);
                error = String(e);
            }
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;
    } catch (e) {
        log.error('更新当前用户信息失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };
}




// 强制走远程接口获取 IM 用户信息；成功后会顺手刷新本地 IDMap 缓存
export async function GetIMUserInfo(username: string): Promise<ApiResult<GetIMUserInfoApiResponse>> {

    const log = createLogger('UserInfo.ts', 'GetIMUserInfo');
    let error: string | undefined;

    const activeUsername = await SystemStorageManager.getActiveUsername()
    if (!activeUsername) {
        error = "未获取到当前激活账号用户名，无法获取目标用户IDMAP信息"
        log.error(error)
        return { ok: false, data: null, error: error ?? '未知错误' };
    }

    const token =
        (await SystemStorageManager.getLoginToken(activeUsername)) || "";

    if (!token) {
        error = "未获取到有效token，无法获取目标用户IDMAP信息"
        log.error(error)
        return { ok: false, data: null, error: error ?? '未知错误' };
    }

    try {
        log.info("开始获取目标用户IDMAP信息")
        const apiurl = API_URLS.GetIMUserInfo(username);
        const res = await fetch(apiurl, {
            method: "GET",
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${token}`,
            }
        })

        if (res.ok) {
            const data = await res.json() as GetIMUserInfoApiResponse;

            if (data) {
                // 把远程数据直接立即写回本地IDmap
                await updateIDmapInGetIMUserInfo(data);
            }

            log.info('获取目标用户IDMAP信息成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;
    } catch (e) {
        log.error('获取目标用户IDMAP信息失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };
}


export async function updateIDmapInGetIMUserInfo(data: GetIMUserInfoApiResponse): Promise<void> {
    const log = createLogger('UserInfo.ts', 'updateIDmapInGetIMUserInfo');
    let error: string | undefined;

    try {
        const user = mapIDMapUserFromIMUserInfo(data)
        if (!user) return;
        const idmapStore = await getLoadedIDMapStore();
        idmapStore.set(user);
    } catch (e) {
        error = String(e)
        log.error("更新本地IDmap失败", error)
    }
}



// 优先从本地 IDMap 缓存返回 IM 接口格式数据，未命中时再走远程接口
// source 用来标识本次结果来自本地缓存还是远程接口
export async function GetIMUserInfoPreferLocal(username: string): Promise<{
    ok: boolean;
    data: GetIMUserInfoApiResponse | null;
    source: "idmap" | "remote" | "error";
}> {
    const normalizedUsername = normalizeIMString(username);
    if (!normalizedUsername) {
        return { ok: false, data: null, source: "error" };
    }
    const cachedUser = await getCachedIDMapUser(normalizedUsername, true);
    const cachedData = cachedUser ? mapIMUserInfoFromIDMapUser(cachedUser) : null;
    if (cachedData) {
        return { ok: true, data: cachedData, source: "idmap" };
    }
    const remoteResult = await GetIMUserInfo(normalizedUsername);
    return {
        ok: remoteResult.ok,
        data: remoteResult.data,
        source: "remote",
    };
}


// 统一从本地 IDMap 缓存取用户，可按需允许 localpart 反查
const getCachedIDMapUser = async (
    username: string,
    allowLocalpart = false,
): Promise<IDMapUser | null> => {
    const normalizedUsername = normalizeIMString(username);
    if (!normalizedUsername) {
        return null;
    }

    const idmapStore = await getLoadedIDMapStore();
    return (
        idmapStore.getByUsername(normalizedUsername) ||
        (allowLocalpart ? idmapStore.getByLocalpart(normalizedUsername) : null) ||
        null
    );
};



// 强制刷新指定用户名在本地 IDMap 中的缓存，不向调用方返回用户数据
// 语义上用于"只想更新缓存"，实现上复用 GetIMUserInfo 的远程获取与回写逻辑
export async function updateIDmap(username: string): Promise<void> {
    const log = createLogger('UserInfo.ts', 'updateIDmap');
    let error: string | undefined;

    try {
        const normalizedUsername = normalizeIMString(username);
        if (!normalizedUsername) return;

        const { ok, data } = await GetIMUserInfo(normalizedUsername);
        if (!ok || !data) return;
    } catch (e) {
        error = String(e)
        log.error("强制更新本地IDmap失败", error)

    }
}



/**
 * 此函数专门为微信环境提供，因为微信登录流程中没有明确的获取用户名的步骤，无法像其他平台一样先拿到用户名，所以只能直接调用接口拿到用户信息后顺便写入 SystemStorage；而其他平台则是拿到用户名后写入 SystemStorage，再调用 UserInfo 接口获取用户信息并覆盖写入 SystemStorage
 */
// 拉取当前登录账号的 SSO 用户信息，并按用户名写入 SystemStorage
type UserInfoByTokenResult = {
    ok: boolean;
    data: any;
    username: string | null;
};
export async function UserInfoForWeChatBecauseNoUsername(
    LoginToken: string,
): Promise<UserInfoByTokenResult> {
    const log = createLogger('UserInfo.ts', 'UserInfoForWeChatBecauseNoUsername');
    let error: string | undefined;
    const token = LoginToken.trim();
    if (!token) {
        error = "未获取到有效token，无法获取目标用户IDMAP信息"
        log.error(error)
        return { ok: false, data: null, username: null };
    }
    try {
        log.info("开始获取当前用户信息")
        const apiurl = API_URLS.UserInfo();
        const res = await fetch(apiurl, {
            method: "POST",
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        if (res.ok) {
            const data = await res.json() as data;
            log.info('获取当前用户信息成功', data);
            const username = normalizeIMString(data?.username);
            try {
                await SystemStorageManager.setActiveUsername(username);
                await SystemStorageManager.setUsername(username);
                await SystemStorageManager.setSSOUserInfo(username, data);
                log.info("当前用户信息写入本地成功成功")
            }
            catch (e) {
                log.error('当前用户信息写入本地失败', e);
                error = String(e);
            }
            return { ok: true, data, username: username };
        }
        error = `HTTP ${res.status}`;

    } catch (e) {
        log.error('获取当前用户信息失败', e);
        error = String(e);
    }
    return { ok: false, data: null, username: null };
}

























// 规范化 IM 相关字符串字段，统一转成去除首尾空白后的字符串
const normalizeIMString = (value: unknown): string => {
    return typeof value === 'string' ? value.trim() : ''
}


// 将 IM 接口返回的数据映射成项目内部统一使用的 IDMapUser
const mapIDMapUserFromIMUserInfo = (
    data: GetIMUserInfoApiResponse,
): IDMapUser | null => {
    const username = normalizeIMString(data.username);
    const matrixId = normalizeIMString(data.im);

    if (!username || !matrixId) {
        return null;
    }

    return {
        username,
        matrixId,
        nickname: normalizeIMString(data.nickname),
        type: data.atype === "bot" ? "bot" : "user",
    };
};



// 将本地 IDMapUser 映射回 IM 接口格式，便于复用本地缓存结果
const mapIMUserInfoFromIDMapUser = (
    user: IDMapUser,
): GetIMUserInfoApiResponse | null => {
    const username = normalizeIMString(user.username);
    const im = normalizeIMString(user.matrixId);

    if (!username || !im) {
        return null;
    }

    return {
        username,
        atype: user.type === "bot" ? "bot" : "user",
        im,
        nickname: normalizeIMString(user.nickname),
    };
};



// 统一确保 IDMapStore 已完成加载，避免每个函数重复写 ensureLoaded
const getLoadedIDMapStore = async () => {
    const idmapStore = useIDmapStore();
    await idmapStore.ensureLoaded();
    return idmapStore;
};



