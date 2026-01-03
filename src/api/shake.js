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
 * 获取场次详情
 * @param {number} roundId 场次ID
 * @returns {Promise}
 */
export function getRoundDetail(roundId) {
  return get(`/h5/shake/round/${roundId}`)
}

/**
 * 获取场次列表
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getRoundList(activityId) {
  return get(`/h5/shake/round/list/${activityId}`)
}

/**
 * 加入游戏
 * @param {object} data { roundId }
 * @returns {Promise}
 */
export function joinGame(data) {
  return post('/h5/shake/join', data)
}

/**
 * 提交分数
 * @param {object} data { roundId, score }
 * @returns {Promise}
 */
export function submitScore(data) {
  return post('/h5/shake/score', data)
}

/**
 * 获取实时排名
 * @param {number} roundId 场次ID
 * @param {number} limit 数量
 * @returns {Promise}
 */
export function getRanking(roundId, limit = 10) {
  return get(`/h5/shake/ranking/${roundId}`, { limit })
}

/**
 * 获取我的成绩
 * @param {number} roundId 场次ID
 * @returns {Promise}
 */
export function getMyScore(roundId) {
  return get(`/h5/shake/my/${roundId}`)
}

/**
 * 获取最终结果
 * @param {number} roundId 场次ID
 * @returns {Promise}
 */
export function getRoundResult(roundId) {
  return get(`/h5/shake/result/${roundId}`)
}
