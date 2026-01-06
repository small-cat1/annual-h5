// 活动相关接口
import { get } from "@/utils/request";

/**
 * 获取活动详情
 * @param {number} id 活动ID
 * @returns {Promise}
 */
export function getActivityDetail(id) {
  return get("/h5/activity", { id });
}
