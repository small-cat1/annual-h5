// 活动相关接口
import { get } from '@/utils/request'

/**
 * 获取当前活动信息
 * @returns {Promise}
 */
export function getCurrentActivity() {
  return get('/h5/activity/current')
}

/**
 * 获取活动详情
 * @param {number} id 活动ID
 * @returns {Promise}
 */
export function getActivityDetail(id) {
  return get(`/h5/activity/${id}`)
}

/**
 * 获取活动列表
 * @returns {Promise}
 */
export function getActivityList() {
  return get('/h5/activity/list')
}
