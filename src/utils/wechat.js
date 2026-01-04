import { getWxAppId } from '@/api/auth'

// 缓存微信配置
let wxConfigCache = null

/**
 * 获取微信配置（AppID等）
 * @returns {Promise<object>}
 */
export async function getWxAppConfig() {
  if (wxConfigCache) return wxConfigCache
  
  try {
    const res = await getWxAppId()
    wxConfigCache = res.data
    return res.data
  } catch (e) {
    console.error('获取微信配置失败:', e)
    return null
  }
}

/**
 * 获取微信授权URL
 * @param {string} appId 微信AppID
 * @param {string} redirectUri 回调地址
 * @param {string} scope 授权范围 snsapi_base | snsapi_userinfo
 * @param {string} state 自定义参数
 * @returns {string}
 */
export function getAuthUrl(appId, redirectUri, scope = 'snsapi_userinfo', state = '') {
  const encodedUri = encodeURIComponent(redirectUri)
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${encodedUri}&response_type=code&scope=${scope}&state=${state}#wechat_redirect`
}

/**
 * 跳转微信授权
 * @param {string} redirectUri 回调地址
 * @param {string} scope 授权范围
 */
export async function redirectToAuth(redirectUri, scope = 'snsapi_userinfo') {
  const config = await getWxAppConfig()
  if (!config || !config.appId) {
    console.error('无法获取微信AppID')
    return
  }
  const url = getAuthUrl(config.appId, redirectUri || window.location.href, scope)
  window.location.href = url
}

/**
 * 从URL中获取code
 * @returns {string|null}
 */
export function getCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('code')
}

/**
 * 检查是否在微信环境
 * @returns {boolean}
 */
export function isWechat() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

/**
 * 初始化微信 JSSDK
 * @param {object} config 配置
 */
export async function initWxConfig(config) {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined') {
      reject(new Error('微信JSSDK未加载'))
      return
    }

    wx.config({
      debug: false,
      appId: config.appId,
      timestamp: config.timestamp,
      nonceStr: config.nonceStr,
      signature: config.signature,
      jsApiList: [
        'updateAppMessageShareData',
        'updateTimelineShareData',
        'onMenuShareTimeline',
        'onMenuShareAppMessage',
        'hideMenuItems',
        'showMenuItems',
        'scanQRCode'
      ]
    })

    wx.ready(() => {
      resolve()
    })

    wx.error((err) => {
      reject(err)
    })
  })
}

/**
 * 设置分享内容
 * @param {object} options 分享配置
 */
export function setShareInfo(options) {
  const { title, desc, link, imgUrl } = options

  if (typeof wx === 'undefined') return

  wx.ready(() => {
    // 分享给朋友
    wx.updateAppMessageShareData({
      title,
      desc,
      link,
      imgUrl,
      success: () => {},
      fail: () => {}
    })

    // 分享到朋友圈
    wx.updateTimelineShareData({
      title,
      link,
      imgUrl,
      success: () => {},
      fail: () => {}
    })
  })
}

/**
 * 隐藏菜单项
 * @param {string[]} menuList 菜单列表
 */
export function hideMenuItems(menuList) {
  if (typeof wx === 'undefined') return

  wx.ready(() => {
    wx.hideMenuItems({
      menuList
    })
  })
}

/**
 * 扫描二维码
 * @returns {Promise<string>}
 */
export function scanQRCode() {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined') {
      reject(new Error('微信JSSDK未加载'))
      return
    }

    wx.scanQRCode({
      needResult: 1,
      scanType: ['qrCode', 'barCode'],
      success: (res) => {
        resolve(res.resultStr)
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}
