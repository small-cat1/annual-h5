// 弹幕相关接口
import { post, get } from '@/utils/request'

/**
 * 发送弹幕
 * @param {object} data { activityId, content, color }
 * @returns {Promise}
 */
export function sendDanmaku(data) {
  return post('/h5/danmaku', data)
}

/**
 * 获取弹幕列表
 * @param {number} activityId 活动ID
 * @param {object} params { page, pageSize }
 * @returns {Promise}
 */
export function getDanmakuList(activityId, params) {
  return get(`/h5/danmaku/list/${activityId}`, params)
}

/**
 * 获取最新弹幕（大屏用）
 * @param {number} activityId 活动ID
 * @param {number} limit 数量
 * @returns {Promise}
 */
export function getRecentDanmaku(activityId, limit = 50) {
  return get(`/h5/danmaku/recent/${activityId}`, { limit })
}

/**
 * 获取置顶弹幕
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getTopDanmaku(activityId) {
  return get(`/h5/danmaku/top/${activityId}`)
}

/**
 * 获取我发送的弹幕
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getMyDanmaku(activityId) {
  return get(`/h5/danmaku/my/${activityId}`)
}
