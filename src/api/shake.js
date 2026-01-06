// 摇一摇相关接口
import { post, get } from '@/utils/request'

/**
 * 获取当前场次
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getCurrentRound(activityId) {
  return get(`/h5/shake/round/current/${activityId}`)
}

/**
 * 获取最终结果
 * @param {number} roundId 场次ID
 * @returns {Promise}
 */
export function getRoundResult(roundId) {
  return get(`/h5/shake/result/${roundId}`)
}
