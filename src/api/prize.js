// 奖品相关接口
import { get } from "@/utils/request";

/**
 * 获取我的中奖记录
 * @param {number} activityId 活动ID
 * @returns {Promise}
 */
export function getMyWinnings(activityId) {
  return get("/h5/prize/my", { activityId });
}

/**
 * 获取中奖详情
 * @param {number} winnerId 中奖记录ID
 * @returns {Promise}
 */
export function getWinningDetail(winnerId) {
  return get("/h5/prize/winning", { winnerId });
}
