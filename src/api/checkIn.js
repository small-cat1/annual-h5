// 签到相关接口
import { post, get } from '@/utils/request'

/**
 * 用户签到
 * @param {object} data { activityId }
 * @returns {Promise}
 */
export function checkIn(data) {
  return post('/h5/checkIn', data)
}

/**
 * 获取签到状态
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getCheckInStatus(activityId) {
  return get(`/h5/checkIn/status/${activityId}`)
}

/**
 * 获取签到列表（大屏用）
 * @param {number} activityId 活动ID
 * @param {object} params { page, pageSize }
 * @returns {Promise}
 */
export function getCheckInList(activityId, params) {
  return get(`/h5/checkIn/list/${activityId}`, params)
}

/**
 * 获取签到统计
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getCheckInStats(activityId) {
  return get(`/h5/checkIn/stats/${activityId}`)
}

/**
 * 获取最新签到（大屏滚动显示）
 * @param {number} activityId 活动ID
 * @param {number} limit 数量
 * @returns {Promise}
 */
export function getRecentCheckIns(activityId, limit = 20) {
  return get(`/h5/checkIn/recent/${activityId}`, { limit })
}
