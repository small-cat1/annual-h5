import { getCurrentRound } from "@/api/shake";
import { useActivityStore, useGameStore } from "@/store";
import { ref } from "vue";

/**
 * 游戏工具函数（不再轮询，改为按需调用）
 */
export function useGameDispatcher() {
  const gameStore = useGameStore();
  const activityStore = useActivityStore();

  // 是否有进行中的游戏
  const hasActiveGame = ref(false);
  // 当前游戏信息
  const activeRound = ref(null);
  // 加载状态
  const loading = ref(false);

  /**
   * 检查当前是否有进行中的游戏（单次请求）
   */
  async function checkCurrentGame() {
    const activityId = activityStore.activityId;
    if (!activityId) {
      return null;
    }

    loading.value = true;
    try {
      const res = await getCurrentRound(activityId);
      const round = res.data;

      if (round && round.status === 1) {
        // 游戏进行中
        hasActiveGame.value = true;
        activeRound.value = round;
        return round;
      } else {
        // 无游戏或已结束
        hasActiveGame.value = false;
        activeRound.value = null;
        return null;
      }
    } catch (e) {
      console.error("[GameDispatcher] 获取当前游戏失败:", e);
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 处理游戏开始事件（WebSocket 推送）
   */
  function handleGameStart(data) {
    console.log("[GameDispatcher] 游戏开始:", data);
    hasActiveGame.value = true;
    activeRound.value = data.round || null;
  }

  /**
   * 处理游戏结束事件（WebSocket 推送）
   */
  function handleGameStop(data) {
    console.log("[GameDispatcher] 游戏结束:", data);
    hasActiveGame.value = false;
    activeRound.value = null;
  }

  /**
   * 重置状态
   */
  function reset() {
    hasActiveGame.value = false;
    activeRound.value = null;
    gameStore.resetGame();
  }

  return {
    // 状态
    hasActiveGame,
    activeRound,
    loading,

    // 方法
    checkCurrentGame,
    handleGameStart,
    handleGameStop,
    reset,
  };
}
