// 游戏状态管理
import { getSession, removeSession, setSession } from "@/utils/storage";
import { defineStore } from "pinia";

export const useGameStore = defineStore("game", {
  state: () => ({
    // ⭐ 新增：是否有进行中的游戏（首页入口显示用）
    hasActiveGame: false,
    // ⭐ 新增：进行中的游戏简要信息
    activeRoundInfo: null,
    // 当前场次
    currentRound: null,
    // 场次ID（单独存储，方便恢复）
    roundId: null,
    // 游戏状态 idle | waiting | playing | finished
    gameStatus: "idle",
    // 摇动次数
    shakeCount: 0,
    // 实时排名
    ranking: [],
    // 我的排名
    myRank: 0,
    // ⭐ 游戏结束时间戳（毫秒）- 替代 remainTime
    endTime: 0,
    // ⭐ 游戏总时长（秒）
    totalTime: 30,
    // 是否中奖
    isWinner: false,
    // 中奖信息
    winInfo: null,
  }),

  getters: {
    // 场次名称
    roundName: (state) => state.currentRound?.roundName || "",

    // 游戏时长
    duration: (state) => state.currentRound?.duration || 30,

    // 获奖人数
    winnerCount: (state) => state.currentRound?.winnerCount || 1,

    // 关联奖品
    prize: (state) => state.currentRound?.prize,

    // 是否正在游戏
    isPlaying: (state) => state.gameStatus === "playing",

    // 是否等待中
    isWaiting: (state) => state.gameStatus === "waiting",

    // 是否已结束
    isFinished: (state) => state.gameStatus === "finished",

    // ⭐ 剩余时间（秒）- 改为 getter，自动计算
    remainTime: (state) => {
      if (!state.endTime || state.gameStatus !== "playing") return 0;
      const remain = Math.ceil((state.endTime - Date.now()) / 1000);
      return Math.max(0, remain);
    },
  },

  actions: {
    // ⭐ 新增：设置活动游戏状态（首页用）
    setActiveGame(hasActive, roundInfo = null) {
      this.hasActiveGame = hasActive;
      this.activeRoundInfo = roundInfo;
    },
    /**
     * 设置当前场次
     */
    setCurrentRound(round) {
      this.currentRound = round;
      if (round) {
        this.roundId = round.ID || round.id;
        this.totalTime = round.duration || 30;
        // 持久化
        setSession("game_round", round);
        setSession("game_roundId", this.roundId);
      }
    },

    /**
     * 设置场次ID
     */
    setRoundId(id) {
      this.roundId = id;
      setSession("game_roundId", id);
    },

    /**
     * 设置游戏状态
     */
    setGameStatus(status) {
      this.gameStatus = status;
      setSession("game_status", status);
    },

    /**
     * ⭐ 设置结束时间
     */
    setEndTime(endTime) {
      this.endTime = endTime;
      setSession("game_endTime", endTime);
    },

    /**
     * ⭐ 设置总时长
     */
    setTotalTime(totalTime) {
      this.totalTime = totalTime;
      setSession("game_totalTime", totalTime);
    },

    /**
     * 开始游戏
     */
    startGame(endTime, totalTime) {
      this.gameStatus = "playing";
      this.shakeCount = 0;
      this.myRank = 0;
      this.isWinner = false;
      this.winInfo = null;

      if (endTime) {
        this.endTime = endTime;
        setSession("game_endTime", endTime);
      }
      if (totalTime) {
        this.totalTime = totalTime;
        setSession("game_totalTime", totalTime);
      }

      setSession("game_status", "playing");
      setSession("game_shakeCount", 0); // ⭐ 新增：清零
    },

    /**
     * 结束游戏
     */
    endGame() {
      this.gameStatus = "finished";
      this.endTime = 0;

      // 清除持久化的游戏状态
      removeSession("game_status");
      removeSession("game_endTime");
    },

    /**
     * 增加摇动次数
     */
    addShakeCount(count = 1) {
      this.shakeCount += count;
      setSession("game_shakeCount", this.shakeCount);
    },

    /**
     * 设置摇动次数
     */
    setShakeCount(count) {
      this.shakeCount = count;
      setSession("game_shakeCount", count);
    },

    /**
     * 更新排名
     */
    updateRanking(ranking) {
      this.ranking = ranking;
    },

    /**
     * 更新我的排名
     */
    updateMyRank(rank) {
      this.myRank = rank;
    },

    /**
     * 设置中奖信息
     */
    setWinInfo(isWinner, info = null) {
      this.isWinner = isWinner;
      this.winInfo = info;
    },

    /**
     * ⭐ 从 sessionStorage 恢复状态（页面刷新时调用）
     */
    restoreFromSession() {
      const status = getSession("game_status");
      const endTime = getSession("game_endTime");
      const totalTime = getSession("game_totalTime");
      const round = getSession("game_round");
      const roundId = getSession("game_roundId");
      const shakeCount = getSession("game_shakeCount"); // ⭐ 新增

      if (status === "playing" && endTime) {
        // 检查游戏是否已结束
        const remain = Math.ceil((endTime - Date.now()) / 1000);
        if (remain > 0) {
          // 游戏还在进行中，恢复状态
          this.gameStatus = status;
          this.endTime = endTime;
          this.totalTime = totalTime || 30;
          this.currentRound = round;
          this.roundId = roundId;
          this.shakeCount = shakeCount || 0; // ⭐ 恢复摇动次数
          return true;
        } else {
          // 游戏已结束，清除状态
          this.clearSession();
          return false;
        }
      }
      return false;
    },

    /**
     * ⭐ 清除 session 存储
     */
    clearSession() {
      removeSession("game_status");
      removeSession("game_endTime");
      removeSession("game_totalTime");
      removeSession("game_round");
      removeSession("game_roundId");
      removeSession("game_shakeCount"); // ⭐ 新增
    },

    /**
     * 重置游戏状态
     */
    resetGame() {
      this.currentRound = null;
      this.roundId = null;
      this.gameStatus = "idle";
      this.shakeCount = 0;
      this.ranking = [];
      this.myRank = 0;
      this.endTime = 0;
      this.totalTime = 30;
      this.isWinner = false;
      this.winInfo = null;

      // 清除持久化
      this.clearSession();
    },
  },
});
