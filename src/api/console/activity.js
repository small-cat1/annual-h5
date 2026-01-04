import request from '@/utils/request'

/**
 * 活动配置 API
 */

/**
 * 获取活动详情配置
 */
export function getActivityDetail(activityId) {
  return request({
    url: `/console/activity/${activityId}`,
    method: 'get'
  })
}

/**
 * 获取奖品列表
 */
export function getPrizeList(activityId) {
  return request({
    url: '/console/prizes',
    method: 'get',
    params: { activityId }
  })
}