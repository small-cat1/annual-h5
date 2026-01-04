// 授权相关接口
import { post, get } from '@/utils/request'

/**
 * 微信授权登录
 * @param {object} data { code }
 * @returns {Promise}
 */
export function wechatLogin(data) {
  return post('/h5/auth/wechat', data)
}


/**
 * 获取微信AppID（用于OAuth授权登录）
 * @returns {Promise}
 */
export function getWxAppId() {
  return get('/h5/config/wechat', {}, { showLoading: false, showError: false })
}

/**
 * 获取微信授权配置
 * @param {object} params { url }
 * @returns {Promise}
 */
export function getWxConfig(params) {
  return get('/h5/auth/wxConfig', params)
}

/**
 * 刷新Token
 * @returns {Promise}
 */
export function refreshToken() {
  return post('/h5/auth/refresh')
}

/**
 * 退出登录
 * @returns {Promise}
 */
export function logout() {
  return post('/h5/auth/logout')
}
