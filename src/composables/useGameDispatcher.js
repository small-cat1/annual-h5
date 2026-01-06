import { getCurrentRound } from "@/api/shake";
import { useActivityStore, useGameStore, useUserStore } from "@/store";
import { onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

// 轮询间隔（毫秒）
const POLLING_INTERVAL = 3000;

// 单例状态（确保全局只有一个调度中心）
let isInitialized = false;

export function useGameDispatcher() {
  const router = useRouter();
  const userStore = useUserStore();
  const gameStore = useGameStore();
  const activityStore = useActivityStore();

  // 轮询定时器
  const pollingTimer = ref(null);
  // 是否正在轮询
  const isPolling = ref(false);
  // 上次处理的场次ID（去重）
  const lastProcessedRoundId = ref(null);
  // 页面可见性
  const isPageVisible = ref(true);

  /**
   * 启动调度中心
   */
  function start() {
    if (isInitialized) {
      console.log("[GameDispatcher] 已初始化，跳过");
      return;
    }

    isInitialized = true;
    console.log("[GameDispatcher] 启动");

    // 监听页面可见性
    document.addEventListener("visibilitychange", onVisibilityChange);

    // 开始轮询
    startPolling();
  }

  /**
   * 停止调度中心
   */
  function stop() {
    console.log("[GameDispatcher] 停止");
    isInitialized = false;
    stopPolling();
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }

  /**
   * 开始轮询
   */
  function startPolling() {
    if (isPolling.value) return;

    isPolling.value = true;
    console.log("[GameDispatcher] 开始轮询");

    // 立即执行一次
    pollCurrentRound();

    // 定时轮询
    pollingTimer.value = setInterval(() => {
      if (isPageVisible.value) {
        pollCurrentRound();
      }
    }, POLLING_INTERVAL);
  }

  /**
   * 停止轮询
   */
  function stopPolling() {
    if (pollingTimer.value) {
      clearInterval(pollingTimer.value);
      pollingTimer.value = null;
    }
    isPolling.value = false;
    console.log("[GameDispatcher] 停止轮询");
  }

  /**
   * 单次轮询当前场次
   */
  async function pollCurrentRound() {
    const activityId = activityStore.activityId;
    if (!activityId) {
      return;
    }

    try {
      const res = await getCurrentRound(activityId);
      const round = res.data;

      // 没有返回数据或游戏已结束
      if (!round || round.status === 2) {
        handleGameEnd();
        return;
      }

      // 游戏进行中 (status === 1)
      if (round.status === 1) {
        handleGameStart(round);
      }
      // status === 0 表示等待中，不做处理
    } catch (e) {
      console.error("[GameDispatcher] 轮询失败:", e);
    }
  }

  /**
   * 处理游戏开始
   */
  function handleGameStart(round) {
    // 去重：同一场游戏不重复处理
    if (lastProcessedRoundId.value === round.ID) {
      // ⭐ 即使是同一场游戏，也要更新 endTime（防止页面恢复时没有 endTime）
      if (round.endTimeMs && !gameStore.endTime) {
        console.log("[GameDispatcher] 补充 endTime:", round.endTimeMs);
        gameStore.setEndTime(round.endTimeMs);
        gameStore.setTotalTime(round.duration || 30);
      }
      return;
    }

    console.log("[GameDispatcher] 发现游戏进行中:", round.roundName);
    console.log("[GameDispatcher] endTimeMs:", round.endTimeMs);

    // 检查权限
    if (!userStore.canJoinActivity) {
      console.log("[GameDispatcher] 用户无权限参与");
      return;
    }

    // 检查当前是否已在游戏页
    const currentPath = router.currentRoute.value.path;
    if (currentPath === "/shake") {
      // 已在游戏页，更新场次信息（可能是新一轮）
      gameStore.setCurrentRound(round);
      // ⭐ 传递 endTimeMs
      gameStore.startGame(round.endTimeMs, round.duration || 30);
      lastProcessedRoundId.value = round.ID;
      return;
    }

    // 保存场次信息
    gameStore.setCurrentRound(round);
    // ⭐ 传递 endTimeMs
    gameStore.startGame(round.endTimeMs, round.duration || 30);
    lastProcessedRoundId.value = round.ID;

    // 跳转到游戏页
    console.log("[GameDispatcher] 跳转到游戏页");
    router.push("/shake");
  }

  /**
   * 处理游戏结束
   * 注意：Playing.vue 自己会处理倒计时结束的跳转
   * 这里只处理用户不在游戏页时的状态重置
   */
  function handleGameEnd() {
    const currentPath = router.currentRoute.value.path;

    // 如果在游戏页，让 Playing.vue 自己处理跳转
    // 这里不做任何事情，避免冲突
    if (currentPath === "/shake") {
      return;
    }

    // 如果不在游戏页，只重置状态
    if (gameStore.gameStatus === "playing") {
      console.log("[GameDispatcher] 游戏已结束，重置状态");
      gameStore.setGameStatus("idle");
    }
  }

  /**
   * 重置状态（用于结果页确认后）
   */
  function resetForNextRound() {
    lastProcessedRoundId.value = null;
    gameStore.resetGame();
    console.log("[GameDispatcher] 重置状态，等待下一场");
  }

  /**
   * 页面可见性变化
   */
  function onVisibilityChange() {
    isPageVisible.value = !document.hidden;

    if (isPageVisible.value) {
      console.log("[GameDispatcher] 页面恢复可见，立即轮询");
      pollCurrentRound();
    }
  }

  // 组件卸载时清理（虽然调度中心不应该被卸载）
  onUnmounted(() => {
    // 注意：不调用 stop()，因为调度中心应该持续运行
  });

  return {
    // 状态
    isPolling,
    isPageVisible,

    // 方法
    start,
    stop,
    pollCurrentRound,
    resetForNextRound,
  };
}
