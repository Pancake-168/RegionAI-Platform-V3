
//matrix的服务器地址
export const Login_MATRIX_SERVER_URL = import.meta.env.Login_MATRIX_SERVER_URL
export const Login_MATRIX_SERVER_URL_TAIL = import.meta.env.Login_MATRIX_SERVER_URL_TAIL
export const Login_MATRIX_SERVER_URL_ALL = import.meta.env.Login_MATRIX_SERVER_URL_ALL


export const MATRIX_SERVER_URL = import.meta.env.MATRIX_SERVER_URL
export const MATRIX_SERVER_URL_TAIL = import.meta.env.MATRIX_SERVER_URL_TAIL
export const MATRIX_SERVER_URL_ALL = import.meta.env.MATRIX_SERVER_URL_ALL

// NocoBase 目标地址 (局域网)
export const NOCOBASE_URL = import.meta.env.NOCOBASE_URL

// Matrix 代理目标（用于开发环境代理媒体、API请求等）
export const matrixProxyTarget = import.meta.env.matrixProxyTarget

// 辅助后端地址（Office 预览 / App 版本管理等）
const AUX_API_BASE = (import.meta.env.VITE_AUX_API_BASE as unknown as string) || ''

// 后端业务基础wss地址
export const VITE_API_WSS_BASE = import.meta.env.VITE_API_WSS_BASE

// 微信回调链接开头
export const VITE_API_WECHAT_URL = import.meta.env.VITE_API_WECHAT_URL




// todo
export const BASE_URL = ''







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





}