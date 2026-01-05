import request from '@/utils/request'

/**
 * 签到管理 API
 */



/**
 * 获取签到统计（包含状态）
 * 返回：isOpen, checkedIn, total, rate
 */
export function getCheckInStats(activityId) {
  return request({
    url: '/console/checkin/stats',
    method: 'get',
    params: { activityId }
  })
}

/**
 * 开启签到
 */
export function openCheckIn(activityId) {
  return request({
    url: '/console/checkin/open',
    method: 'post',
    data: { activityId }
  })
}

/**
 * 关闭签到
 */
export function closeCheckIn(activityId) {
  return request({
    url: '/console/checkin/close',
    method: 'post',
    data: { activityId }
  })
}
