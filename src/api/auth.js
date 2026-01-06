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
