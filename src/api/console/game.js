import request from "@/utils/request";

/**
 * 游戏控制 API
 */

// ==================== 场次管理 ====================

/**
 * 获取场次列表
 */
export function getRoundList(activityId) {
  return request({
    url: "/console/rounds",
    method: "get",
    params: { activityId },
  });
}

/**
 * 获取当前进行中的场次（用于页面刷新恢复状态）
 */
export function getCurrentRound(activityId) {
  return request({
    url: "/console/game/current",
    method: "get",
    params: { activityId },
  });
}
/**
 * 获取场次详情
 */
export function getRoundDetail(roundId) {
  return request({
    url: `/console/rounds/${roundId}`,
    method: "get",
  });
}

// ==================== 游戏控制 ====================

/**
 * 开始游戏
 */
export function startGame(roundId, password) {
  return request({
    url: "/console/game/start",
    method: "post",
    data: { roundId, password },
  });
}

/**
 * 停止游戏
 */
export function stopGame(roundId) {
  return request({
    url: "/console/game/stop",
    method: "post",
    data: { roundId },
  });
}

/**
 * 取消游戏
 */
export function cancelGame(roundId) {
  return request({
    url: "/console/game/cancel",
    method: "post",
    data: { roundId },
  });
}

/**
 * 获取游戏状态
 */
export function getGameStatus(roundId) {
  return request({
    url: "/console/game/status",
    method: "get",
    params: { roundId },
  });
}

/**
 * 获取排行榜
 */
export function getRanking(roundId, limit = 20) {
  return request({
    url: "/console/game/ranking",
    method: "get",
    params: { roundId, limit },
  });
}

/**
 * 获取中奖名单
 */
export function getWinners(roundId) {
  return request({
    url: "/console/game/winners",
    method: "get",
    params: { roundId },
  });
}

/**
 * 随机抽奖
 */
export function randomDraw(activityId, count, prizeId = null) {
  return request({
    url: "/console/draw/random",
    method: "post",
    data: { activityId, count, prizeId },
  });
}
