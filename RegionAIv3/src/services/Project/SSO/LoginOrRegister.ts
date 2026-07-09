import { API_URLS } from "@/apiUrls";
import type { ApiResult } from '@/types/ApiResult';
import { getStoredDeviceInfo } from "@/utils/DeviceInfo";
import { isTauri } from "@/utils/isTauri";
import { createLogger } from '@/utils/logger';
import { SystemStorageManager } from "@/utils/SystemStorage";


export type SmsCodeScene = "login" | "register" | "bind";
export type CaptchaResponse = {
    captchaId: string;
    image: string;
};
export type CaptchaVerificationPayload = {
    captchaId: string;
    captchaText: string;
};
export type SmsAuthResponse = {
    message: string;
    token: string;
    matrix_token?: string | null;
    expires_at?: string;
};

export type MatrixAccessTokenExchange = {
    access_token: string;
    user_id?: string;
    device_id?: string;
    home_server?: string;
    [key: string]: unknown;
};


async function buildSSODeviceHeaders(): Promise<Record<string, string>> {
    const platform = isTauri() ? "pc" : "web";
    const storedDeviceInfo = await getStoredDeviceInfo();
    const storedUsername = await SystemStorageManager.getActiveUsername();
    const usernameDeviceName =
        typeof storedUsername === "string" && storedUsername.trim()
            ? `${storedUsername.trim()}${platform}`
            : "未知";
    const headerDeviceName =
        typeof storedDeviceInfo?.deviceName === "string" &&
            storedDeviceInfo.deviceName.trim()
            ? storedDeviceInfo.deviceName.trim()
            : usernameDeviceName;

    return {
        "X-Platform": platform,
        "X-Device-Name": headerDeviceName,
    };
}


// 获取图片验证码
export async function generateCaptcha(): Promise<ApiResult<CaptchaResponse>> {

    const log = createLogger('LoginOrRegister.ts', 'generateCaptcha');
    let error: string | undefined;
    try {
        log.info('开始获取图片验证码');
        const apiurl = API_URLS.GenerateCaptcha();
        const res = await fetch(apiurl, {
            method: "GET",
            headers: {
                accept: "application/json",
            },
        });
        if (res.ok) {
            const data = await res.json() as CaptchaResponse;
            log.info('获取图片验证码成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;

    } catch (e) {
        log.error('获取图片验证码失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };

}




/**
 * 调用后端统一的登录接口获取 SSO LoginToken (JWT)
 * 使用 application/x-www-form-urlencoded 格式
 */
export async function login(
    username: string,
    password: string,
    captcha?: CaptchaVerificationPayload
): Promise<ApiResult<{ token: string; message: string }>> {
    const log = createLogger('LoginOrRegister.ts', 'login');
    let error: string | undefined;



    try {
        log.info('开始登录', { username, captcha });
        const apiurl = API_URLS.Login();

        const deviceHeaders = await buildSSODeviceHeaders();


        const params = new URLSearchParams();

        params.append("username", username);
        params.append("password", password);
        if (captcha?.captchaId) {
            params.append("captcha_id", captcha.captchaId);
        }
        if (captcha?.captchaText) {
            params.append("captcha_text", captcha.captchaText);
        }
        const res = await fetch(apiurl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                accept: "application/json",
                ...deviceHeaders,
            },
            body: params.toString(),
        });
        if (res.ok) {
            const data = await res.json() as { token: string; message: string };
            log.info('登录成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;


    } catch (e) {
        log.error('登录失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };
}



export async function register(
    username: string,
    password: string,
): Promise<ApiResult<unknown>> {
    const log = createLogger('LoginOrRegister.ts', 'register');
    let error: string | undefined;


    try {
        log.info('开始注册', { username });
        const apiurl = API_URLS.Register();
        const res = await fetch(apiurl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
            const data = await res.json();
            log.info('注册成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;


    } catch (e) {
        log.error('注册失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };


}


export async function sendSmsCode(
    phone: string,
    scene: SmsCodeScene,
    captcha: CaptchaVerificationPayload,
): Promise<ApiResult<{ message: string; cooldown_seconds: number }>> {
    const log = createLogger('LoginOrRegister.ts', 'sendSmsCode');
    let error: string | undefined;

    try {
        const apiurl = API_URLS.SendCode();
        const res = await fetch(apiurl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json",
            },
            body: JSON.stringify({
                phone,
                scene,
                captcha_id: captcha.captchaId,
                captcha_text: captcha.captchaText,
            }),
        });
        if (res.ok) {
            const data = await res.json() as { message: string; cooldown_seconds: number };
            log.info('发送短信验证码成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;

    } catch (e) {
        log.error('发送短信验证码失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };



}


export async function smsLogin(
    phone: string,
    code: string,
): Promise<ApiResult<SmsAuthResponse>> {
    const log = createLogger('LoginOrRegister.ts', 'smsLogin');
    let error: string | undefined;
    try {

        const apiurl = API_URLS.SmsLogin();
        const deviceHeaders = await buildSSODeviceHeaders();
        const res = await fetch(apiurl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json",
                ...deviceHeaders,
            },
            body: JSON.stringify({ phone, code }),
        });
        if (res.ok) {
            const data = await res.json() as SmsAuthResponse;
            log.info('短信登录成功', data);
            return { ok: true, data };
        }


        error = `HTTP ${res.status}`;
    } catch (e) {
        log.error('短信登录失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };


}


export async function smsRegister(
    phone: string,
    code: string,
    nickname: string,
): Promise<ApiResult<SmsAuthResponse>> {
    const log = createLogger('LoginOrRegister.ts', 'smsRegister');
    let error: string | undefined;

    try {
        const apiurl = API_URLS.SmsRegister();
        const deviceHeaders = await buildSSODeviceHeaders();
        const res = await fetch(apiurl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                accept: "application/json",
                ...deviceHeaders,
            },
            body: JSON.stringify({ phone, code, nickname }),
        });
        if (res.ok) {
            const data = await res.json() as SmsAuthResponse;
            log.info('短信注册成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;
    } catch (e) {
        log.error('短信注册失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };


}


export async function LoginTokenToAccessToken(
    loginToken: string,
): Promise<ApiResult<{ accessData: MatrixAccessTokenExchange }>> {
    const log = createLogger('LoginOrRegister.ts', 'LoginTokenToAccessToken');
    let error: string | undefined;

    try {
        const apiurl = API_URLS.GenerateMatrixToken();

        const res = await fetch(apiurl, {
            method: "POST",
            headers: {
                accept: "application/json",
                Authorization: `Bearer ${loginToken}`,
            },
            body: "", // POST 请求通常需要 body，即使为空
        });

        if (res.ok) {
            const data = await res.json() as { accessData: MatrixAccessTokenExchange };
            log.info('LoginTokenToAccessToken转换成功', data);
            return { ok: true, data };
        }
        error = `HTTP ${res.status}`;
    } catch (e) {
        log.error('LoginTokenToAccessToken转换失败', e);
        error = String(e);
    }
    return { ok: false, data: null, error: error ?? '未知错误' };


}