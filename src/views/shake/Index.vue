<template>
  <div class="shake-page">
    <van-nav-bar title="摇一摇" left-arrow @click-left="$router.back()" />
    
    <div class="shake-content">
      <!-- 当前场次信息 -->
      <div v-if="currentRound" class="round-info">
        <div class="prize-preview" v-if="currentRound.prize">
          <van-image
            width="120"
            height="120"
            radius="12"
            :src="currentRound.prize.image"
            fit="cover"
          />
          <div class="prize-detail">
            <h3>{{ currentRound.roundName }}</h3>
            <p class="prize-name">{{ currentRound.prize.name }}</p>
            <van-tag type="warning">{{ formatPrizeLevel(currentRound.prize.level) }}</van-tag>
          </div>
        </div>
        
        <!-- 等待中 -->
        <div v-if="gameStatus === 'waiting'" class="waiting-box">
          <van-icon name="clock-o" size="48" color="#ff9800" />
          <p>游戏即将开始</p>
          <p class="tips">请准备好您的手机</p>
        </div>
        
        <!-- 进行中 -->
        <div v-else-if="gameStatus === 'playing'" class="playing-box">
          <div class="countdown-wrap">
            <CountDown 
              ref="countdownRef"
              :time="gameStore.remainTime" 
              large
              @finish="onGameEnd"
            />
          </div>
          <div class="score-wrap">
            <span class="label">我的次数</span>
            <span class="score">{{ gameStore.shakeCount }}</span>
          </div>
          <div class="phone-icon phone-shake">
            <van-icon name="phone-o" size="64" />
          </div>
          <p class="tips">用力摇动手机！</p>
        </div>
        
        <!-- 已结束 -->
        <div v-else-if="gameStatus === 'finished'" class="finished-box">
          <van-icon name="passed" size="48" color="#4caf50" />
          <p>本轮游戏已结束</p>
          <van-button type="primary" @click="viewResult">查看结果</van-button>
        </div>
        
        <!-- 未开始 -->
        <div v-else class="idle-box">
          <van-icon name="clock-o" size="48" color="#999" />
          <p>等待游戏开始</p>
          <p class="tips">游戏开始后请用力摇动手机</p>
        </div>
      </div>
      
      <!-- 无场次 -->
      <div v-else class="no-round">
        <van-empty description="暂无进行中的场次" />
      </div>
      
      <!-- 实时排名 -->
      <div v-if="gameStore.ranking.length" class="ranking-section">
        <div class="section-header">
          <span class="title">实时排名</span>
        </div>
        <div class="ranking-list">
          <div 
            v-for="(item, index) in gameStore.ranking" 
            :key="item.userId"
            class="ranking-item"
            :class="{ 'is-me': item.userId === userStore.userId }"
          >
            <span class="rank">{{ formatRank(index + 1) }}</span>
            <van-image
              round
              width="32"
              height="32"
              :src="item.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <span class="name">{{ item.user?.realName || item.user?.nickname }}</span>
            <span class="score">{{ item.score }} 次</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore, useActivityStore, useGameStore } from '@/store'
import { getCurrentRound, joinGame, submitScore, getRanking } from '@/api/shake'
import { formatPrizeLevel, formatRank } from '@/utils/format'
import { getShakeDetector, destroyShakeDetector } from '@/utils/shake'
import websocket from '@/utils/websocket'
import CountDown from '@/components/common/CountDown.vue'

const router = useRouter()
const userStore = useUserStore()
const activityStore = useActivityStore()
const gameStore = useGameStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const countdownRef = ref(null)

const currentRound = computed(() => gameStore.currentRound)
const gameStatus = computed(() => gameStore.gameStatus)

let shakeDetector = null
let scoreTimer = null

// 初始化摇一摇检测
const initShakeDetector = async () => {
  shakeDetector = getShakeDetector({
    threshold: 15,
    onShake: (count) => {
      if (gameStore.isPlaying) {
        gameStore.setShakeCount(count)
      }
    }
  })
  
  const started = await shakeDetector.start()
  if (!started) {
    showToast('无法获取设备权限')
  }
}

// 定时提交分数
const startScoreTimer = () => {
  stopScoreTimer()
  scoreTimer = setInterval(async () => {
    if (gameStore.isPlaying && gameStore.shakeCount > 0) {
      try {
        await submitScore({
          roundId: gameStore.roundId,
          score: gameStore.shakeCount
        })
        // 获取最新排名
        const res = await getRanking(gameStore.roundId, 10)
        gameStore.updateRanking(res.data || [])
      } catch (e) {
        console.error('提交分数失败:', e)
      }
    }
  }, 2000)
}

const stopScoreTimer = () => {
  if (scoreTimer) {
    clearInterval(scoreTimer)
    scoreTimer = null
  }
}

// 游戏结束
const onGameEnd = () => {
  gameStore.endGame()
  stopScoreTimer()
  shakeDetector?.stop()
  
  // 提交最终分数
  submitScore({
    roundId: gameStore.roundId,
    score: gameStore.shakeCount
  })
}

// 查看结果
const viewResult = () => {
  router.push('/shake/result')
}

// WebSocket 事件处理
const setupWebSocket = () => {
  const wsUrl = import.meta.env.VITE_APP_WS_URL + '/shake'
  websocket.connect(wsUrl)
  
  // 游戏开始
  websocket.on('game_start', (data) => {
    gameStore.setCurrentRound(data.round)
    gameStore.startGame()
    shakeDetector?.resetCount()
    shakeDetector?.start()
    startScoreTimer()
  })
  
  // 游戏结束
  websocket.on('game_end', (data) => {
    onGameEnd()
    gameStore.setWinInfo(data.isWinner, data.winInfo)
  })
  
  // 排名更新
  websocket.on('ranking_update', (data) => {
    gameStore.updateRanking(data.ranking)
    gameStore.updateMyRank(data.myRank)
  })
  
  // 场次状态变化
  websocket.on('round_status', (data) => {
    if (data.status === 1) {
      gameStore.setGameStatus('waiting')
    }
  })
}

// 获取当前场次
const fetchCurrentRound = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getCurrentRound(activityStore.activityId)
    if (res.data) {
      gameStore.setCurrentRound(res.data)
      
      // 根据场次状态设置游戏状态
      const status = res.data.status
      if (status === 0) {
        gameStore.setGameStatus('idle')
      } else if (status === 1) {
        gameStore.setGameStatus('playing')
        initShakeDetector()
        startScoreTimer()
      } else {
        gameStore.setGameStatus('finished')
      }
    }
  } catch (error) {
    console.error('获取场次失败:', error)
  }
}

onMounted(async () => {
  await activityStore.fetchCurrentActivity()
  await fetchCurrentRound()
  setupWebSocket()
})

onUnmounted(() => {
  stopScoreTimer()
  destroyShakeDetector()
  websocket.close()
})
</script>

<style lang="scss" scoped>
.shake-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5722 0%, #ff8a65 100%);
  
  :deep(.van-nav-bar) {
    background: transparent;
    
    .van-nav-bar__title,
    .van-nav-bar__arrow {
      color: #fff;
    }
  }
}

.shake-content {
  padding: 20px 16px;
}

.round-info {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

.prize-preview {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  
  .prize-detail {
    flex: 1;
    
    h3 {
      font-size: 18px;
      font-weight: bold;
      color: #333;
      margin-bottom: 8px;
    }
    
    .prize-name {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
  }
}

.waiting-box,
.playing-box,
.finished-box,
.idle-box {
  text-align: center;
  padding: 20px 0;
  
  p {
    font-size: 16px;
    color: #333;
    margin-top: 16px;
  }
  
  .tips {
    font-size: 14px;
    color: #999;
    margin-top: 8px;
  }
}

.playing-box {
  .countdown-wrap {
    margin-bottom: 20px;
  }
  
  .score-wrap {
    margin-bottom: 20px;
    
    .label {
      display: block;
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .score {
      font-size: 48px;
      font-weight: bold;
      color: #ff5722;
    }
  }
  
  .phone-icon {
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #ff5722, #ff8a65);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: #fff;
  }
}

.no-round {
  background: #fff;
  border-radius: 16px;
  padding: 40px;
}

.ranking-section {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  
  .section-header {
    margin-bottom: 16px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
  }
  
  .ranking-list {
    .ranking-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.is-me {
        background: #fff5f0;
        margin: 0 -16px;
        padding: 12px 16px;
        border-radius: 8px;
      }
      
      .rank {
        width: 40px;
        font-size: 16px;
        font-weight: bold;
        color: #ff5722;
      }
      
      .name {
        flex: 1;
        margin-left: 12px;
        font-size: 14px;
        color: #333;
      }
      
      .score {
        font-size: 14px;
        color: #666;
      }
    }
  }
}
</style>
