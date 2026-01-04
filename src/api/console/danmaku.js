import request from '@/utils/request'

/**
 * 弹幕管理 API
 */

/**
 * 获取弹幕列表
 */
export function getDanmakuList(activityId, params = {}) {
  return request({
    url: '/console/danmaku/list',
    method: 'get',
    params: { activityId, ...params }
  })
}

/**
 * 审核弹幕
 */
export function auditDanmaku(danmakuId, status) {
  return request({
    url: '/console/danmaku/audit',
    method: 'post',
    data: { danmakuId, status }
  })
}

/**
 * 弹幕抽奖
 */
export function danmakuDraw(activityId, count, prizeId = null) {
  return request({
    url: '/console/draw/danmaku',
    method: 'post',
    data: { activityId, count, prizeId }
  })
}