// 弹幕相关接口
import { get, post } from "@/utils/request";

/**
 * 发送弹幕
 * @param {object} data { activityId, content, color }
 * @returns {Promise}
 */
export function sendDanmaku(data) {
  return post("/h5/danmaku", data);
}

/**
 * 获取弹幕列表
 * @param {number} activityId 活动ID
 * @param {object} params { page, pageSize }
 * @returns {Promise}
 */
export function getRecentDanmaku(activityId, params) {
  return get("/h5/danmaku/list", { activityId, ...params });
}
