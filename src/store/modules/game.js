// 游戏状态管理
import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    // 当前场次
    currentRound: null,
    // 游戏状态 idle | waiting | playing | finished
    gameStatus: 'idle',
    // 摇动次数
    shakeCount: 0,
    // 实时排名
    ranking: [],
    // 我的排名
    myRank: 0,
    // 剩余时间（秒）
    remainTime: 0,
    // 是否中奖
    isWinner: false,
    // 中奖信息
    winInfo: null
  }),

  getters: {
    // 场次ID
    roundId: (state) => state.currentRound?.ID,
    
    // 场次名称
    roundName: (state) => state.currentRound?.roundName || '',
    
    // 游戏时长
    duration: (state) => state.currentRound?.duration || 30,
    
    // 获奖人数
    winnerCount: (state) => state.currentRound?.winnerCount || 1,
    
    // 关联奖品
    prize: (state) => state.currentRound?.prize,
    
    // 是否正在游戏
    isPlaying: (state) => state.gameStatus === 'playing',
    
    // 是否等待中
    isWaiting: (state) => state.gameStatus === 'waiting',
    
    // 是否已结束
    isFinished: (state) => state.gameStatus === 'finished'
  },

  actions: {
    /**
     * 设置当前场次
     */
    setCurrentRound(round) {
      this.currentRound = round
      if (round) {
        this.remainTime = round.duration || 30
      }
    },

    /**
     * 设置游戏状态
     */
    setGameStatus(status) {
      this.gameStatus = status
    },

    /**
     * 开始游戏
     */
    startGame() {
      this.gameStatus = 'playing'
      this.shakeCount = 0
      this.myRank = 0
      this.isWinner = false
      this.winInfo = null
    },

    /**
     * 结束游戏
     */
    endGame() {
      this.gameStatus = 'finished'
    },

    /**
     * 增加摇动次数
     */
    addShakeCount(count = 1) {
      this.shakeCount += count
    },

    /**
     * 设置摇动次数
     */
    setShakeCount(count) {
      this.shakeCount = count
    },

    /**
     * 更新排名
     */
    updateRanking(ranking) {
      this.ranking = ranking
    },

    /**
     * 更新我的排名
     */
    updateMyRank(rank) {
      this.myRank = rank
    },

    /**
     * 更新剩余时间
     */
    updateRemainTime(time) {
      this.remainTime = time
    },

    /**
     * 设置中奖信息
     */
    setWinInfo(isWinner, info = null) {
      this.isWinner = isWinner
      this.winInfo = info
    },

    /**
     * 重置游戏状态
     */
    resetGame() {
      this.currentRound = null
      this.gameStatus = 'idle'
      this.shakeCount = 0
      this.ranking = []
      this.myRank = 0
      this.remainTime = 0
      this.isWinner = false
      this.winInfo = null
    }
  }
})
