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