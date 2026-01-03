// 奖品相关接口
import { get } from '@/utils/request'

/**
 * 获取奖品列表
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getPrizeList(activityId) {
  return get(`/h5/prize/list/${activityId}`)
}

/**
 * 获取奖品详情
 * @param {number} prizeId 奖品ID
 * @returns {Promise}
 */
export function getPrizeDetail(prizeId) {
  return get(`/h5/prize/${prizeId}`)
}

/**
 * 获取我的中奖记录
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getMyWinnings(activityId) {
  return get(`/h5/prize/my/${activityId}`)
}

/**
 * 获取中奖详情
 * @param {number} winnerId 中奖记录ID
 * @returns {Promise}
 */
export function getWinningDetail(winnerId) {
  return get(`/h5/prize/winning/${winnerId}`)
}

/**
 * 获取最新中奖（大屏滚动显示）
 * @param {number} activityId 活动ID
 * @param {number} limit 数量
 * @returns {Promise}
 */
export function getRecentWinnings(activityId, limit = 10) {
  return get(`/h5/prize/recent/${activityId}`, { limit })
}

/**
 * 获取领奖二维码
 * @param {number} winnerId 中奖记录ID
 * @returns {Promise}
 */
export function getReceiveQrCode(winnerId) {
  return get(`/h5/prize/qrcode/${winnerId}`)
}
