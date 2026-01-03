<template>
  <div class="screen-shake">
    <!-- 标题区域 -->
    <div class="header-section">
      <h1>{{ currentRound?.roundName || '摇一摇' }}</h1>
      <div class="round-info" v-if="currentRound">
        <span class="prize-name">{{ currentRound.prize?.name }}</span>
        <van-tag type="warning">{{ formatPrizeLevel(currentRound.prize?.level) }}</van-tag>
      </div>
    </div>
    
    <!-- 游戏状态 -->
    <div class="status-section">
      <!-- 等待开始 -->
      <div v-if="gameStatus === 'idle'" class="status-box idle">
        <van-icon name="clock-o" size="64" />
        <p>等待游戏开始</p>
      </div>
      
      <!-- 准备中 -->
      <div v-else-if="gameStatus === 'waiting'" class="status-box waiting">
        <div class="countdown-text blink">即将开始</div>
        <p>请准备好您的手机</p>
      </div>
      
      <!-- 进行中 -->
      <div v-else-if="gameStatus === 'playing'" class="status-box playing">
        <div class="countdown-ring pulse">
          <span class="time">{{ remainTime }}</span>
        </div>
        <p class="tips">正在进行中...</p>
      </div>
      
      <!-- 已结束 -->
      <div v-else-if="gameStatus === 'finished'" class="status-box finished">
        <van-icon name="passed" size="64" />
        <p>本轮已结束</p>
      </div>
    </div>
    
    <!-- 排行榜 -->
    <div class="ranking-section">
      <div class="ranking-header">
        <span class="title">实时排行榜</span>
        <span class="winner-count" v-if="currentRound">
          前 {{ currentRound.winnerCount }} 名获奖
        </span>
      </div>
      
      <div class="ranking-list">
        <!-- 前三名 -->
        <div class="top-three" v-if="ranking.length >= 3">
          <div class="top-item second">
            <van-image
              round
              width="60"
              height="60"
              :src="ranking[1]?.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <span class="name">{{ ranking[1]?.user?.realName || '***' }}</span>
            <span class="score">{{ ranking[1]?.score }} 次</span>
            <div class="medal">🥈</div>
          </div>
          <div class="top-item first">
            <van-image
              round
              width="80"
              height="80"
              :src="ranking[0]?.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <span class="name">{{ ranking[0]?.user?.realName || '***' }}</span>
            <span class="score">{{ ranking[0]?.score }} 次</span>
            <div class="medal">🥇</div>
          </div>
          <div class="top-item third">
            <van-image
              round
              width="60"
              height="60"
              :src="ranking[2]?.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <span class="name">{{ ranking[2]?.user?.realName || '***' }}</span>
            <span class="score">{{ ranking[2]?.score }} 次</span>
            <div class="medal">🥉</div>
          </div>
        </div>
        
        <!-- 其他排名 -->
        <div class="other-ranking">
          <div 
            v-for="(item, index) in ranking.slice(3, 10)" 
            :key="item.userId"
            class="ranking-item"
            :class="{ 'is-winner': index + 3 < currentRound?.winnerCount }"
          >
            <span class="rank">{{ index + 4 }}</span>
            <van-image
              round
              width="40"
              height="40"
              :src="item.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <span class="name">{{ item.user?.realName || item.user?.nickname }}</span>
            <span class="score">{{ item.score }} 次</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 奖品展示 -->
    <div class="prize-display" v-if="currentRound?.prize">
      <van-image
        width="120"
        height="120"
        radius="16"
        :src="currentRound.prize.image"
        fit="cover"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useActivityStore } from '@/store'
import { getCurrentRound, getRanking } from '@/api/shake'
import { formatPrizeLevel } from '@/utils/format'
import websocket from '@/utils/websocket'

const activityStore = useActivityStore()
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const currentRound = ref(null)
const gameStatus = ref('idle')
const remainTime = ref(0)
const ranking = ref([])

let countdownTimer = null

// 获取当前场次
const fetchCurrentRound = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getCurrentRound(activityStore.activityId)
    currentRound.value = res.data
    
    if (res.data) {
      const status = res.data.status
      if (status === 0) {
        gameStatus.value = 'idle'
      } else if (status === 1) {
        gameStatus.value = 'playing'
        remainTime.value = res.data.remainTime || res.data.duration
        startCountdown()
      } else {
        gameStatus.value = 'finished'
      }
    }
  } catch (error) {
    console.error('获取场次失败:', error)
  }
}

// 获取排名
const fetchRanking = async () => {
  if (!currentRound.value?.ID) return
  
  try {
    const res = await getRanking(currentRound.value.ID, 20)
    ranking.value = res.data || []
  } catch (error) {
    console.error('获取排名失败:', error)
  }
}

// 开始倒计时
const startCountdown = () => {
  stopCountdown()
  countdownTimer = setInterval(() => {
    if (remainTime.value > 0) {
      remainTime.value--
    } else {
      stopCountdown()
      gameStatus.value = 'finished'
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// WebSocket 监听
const setupWebSocket = () => {
  const wsUrl = import.meta.env.VITE_APP_WS_URL + '/screen/shake'
  websocket.connect(wsUrl)
  
  websocket.on('round_start', (data) => {
    currentRound.value = data.round
    gameStatus.value = 'playing'
    remainTime.value = data.round.duration
    ranking.value = []
    startCountdown()
  })
  
  websocket.on('round_end', (data) => {
    gameStatus.value = 'finished'
    stopCountdown()
    ranking.value = data.ranking || []
  })
  
  websocket.on('ranking_update', (data) => {
    ranking.value = data.ranking || []
  })
  
  websocket.on('countdown', (data) => {
    remainTime.value = data.time
  })
}

onMounted(async () => {
  await activityStore.fetchCurrentActivity()
  await fetchCurrentRound()
  fetchRanking()
  setupWebSocket()
})

onUnmounted(() => {
  stopCountdown()
  websocket.close()
})
</script>

<style lang="scss" scoped>
.screen-shake {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5722 0%, #e91e63 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.header-section {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 42px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .round-info {
    margin-top: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    
    .prize-name {
      font-size: 20px;
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.status-section {
  text-align: center;
  margin-bottom: 30px;
  
  .status-box {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 40px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    
    p {
      margin-top: 12px;
      font-size: 18px;
      color: #fff;
    }
    
    .countdown-text {
      font-size: 36px;
      font-weight: bold;
      color: #ffeb3b;
    }
    
    .countdown-ring {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px solid #fff;
      
      .time {
        font-size: 48px;
        font-weight: bold;
        color: #fff;
      }
    }
  }
}

.ranking-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 24px;
  
  .ranking-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    
    .winner-count {
      font-size: 16px;
      color: #ff5722;
      font-weight: bold;
    }
  }
  
  .top-three {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 30px;
    margin-bottom: 30px;
    
    .top-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      
      .name {
        margin-top: 8px;
        font-size: 14px;
        color: #333;
        font-weight: bold;
      }
      
      .score {
        font-size: 16px;
        color: #ff5722;
        font-weight: bold;
      }
      
      .medal {
        position: absolute;
        top: -10px;
        right: -10px;
        font-size: 24px;
      }
      
      &.first {
        .medal {
          font-size: 32px;
        }
      }
    }
  }
  
  .other-ranking {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .ranking-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: #f5f5f5;
      border-radius: 12px;
      
      &.is-winner {
        background: #fff5f0;
        border: 1px solid #ffccbc;
      }
      
      .rank {
        width: 30px;
        font-size: 18px;
        font-weight: bold;
        color: #999;
      }
      
      .name {
        flex: 1;
        margin-left: 12px;
        font-size: 16px;
        color: #333;
      }
      
      .score {
        font-size: 16px;
        font-weight: bold;
        color: #ff5722;
      }
    }
  }
}

.prize-display {
  position: fixed;
  bottom: 40px;
  left: 40px;
  background: #fff;
  padding: 12px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
</style>
