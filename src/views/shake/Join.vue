<template>
  <div class="shake-join-page">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-state">
      <van-loading size="48" color="#fff" />
      <p>正在加入游戏...</p>
    </div>

    <!-- 等待开始 -->
    <div v-else-if="gameStatus === 0" class="waiting-state">
      <div class="round-info">
        <h1>{{ roundInfo?.roundName || '摇一摇' }}</h1>
        <div class="prize-card" v-if="roundInfo?.prize">
          <img :src="roundInfo.prize.image" class="prize-img" />
          <span class="prize-name">{{ roundInfo.prize.name }}</span>
        </div>
      </div>
      
      <div class="waiting-animation">
        <div class="pulse-circle"></div>
        <div class="pulse-circle delay-1"></div>
        <div class="pulse-circle delay-2"></div>
        <van-icon name="phone-o" size="60" class="phone-icon" />
      </div>
      
      <p class="waiting-text">等待主持人开始游戏</p>
      <p class="waiting-hint">请握紧手机，准备摇动！</p>
      
      <div class="player-count">
        <span>当前参与人数: {{ playerCount }}</span>
      </div>
    </div>

    <!-- 游戏中 -->
    <div v-else-if="gameStatus === 1" class="playing-state">
      <div class="countdown-ring">
        <svg viewBox="0 0 100 100">
          <circle class="bg" cx="50" cy="50" r="45" />
          <circle 
            class="progress" 
            cx="50" cy="50" r="45" 
            :style="{ strokeDashoffset: countdownOffset }"
          />
        </svg>
        <span class="countdown-text">{{ remainTime }}</span>
      </div>
      
      <div class="score-display">
        <span class="score-value">{{ shakeCount }}</span>
        <span class="score-label">次</span>
      </div>
      
      <div class="shake-hint">
        <van-icon name="fire-o" size="24" />
        <span>疯狂摇动手机！</span>
      </div>
    </div>

    <!-- 游戏结束 -->
    <div v-else-if="gameStatus === 2" class="finished-state">
      <div class="result-icon">🎮</div>
      <h1>游戏结束</h1>
      <div class="my-score">
        <span>我的成绩: {{ shakeCount }} 次</span>
      </div>
      <van-button type="primary" round block @click="goToResult">
        查看结果
      </van-button>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="errorMsg" class="error-state">
      <van-icon name="warning-o" size="60" color="#ff9800" />
      <p>{{ errorMsg }}</p>
      <van-button type="primary" round @click="goHome">返回首页</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useShake } from '@/hooks/useShake'
import { getRoundDetail } from '@/api/shake'
import { getGameStatus } from '@/api/console'

const router = useRouter()
const route = useRoute()

// 配置
const WS_BASE = import.meta.env.VITE_APP_WS_URL || `ws://${window.location.host}`

// 获取Token
const getToken = () => localStorage.getItem('token') || ''

// 状态
const loading = ref(true)
const errorMsg = ref('')
const gameStatus = ref(-1) // -1初始 0等待 1进行中 2已结束
const roundInfo = ref(null)
const playerCount = ref(0)
const startTime = ref(0)
const duration = ref(30)
const remainTime = ref(0)

// 摇一摇
const { shakeCount, startListening, stopListening, resetCount } = useShake()

// WebSocket
let ws = null
let countdownTimer = null
let uploadTimer = null
let lastUploadedScore = 0

// 路由参数
const roundId = computed(() => route.query.roundId)

// 倒计时环形进度
const countdownOffset = computed(() => {
  const circumference = 2 * Math.PI * 45
  const progress = remainTime.value / duration.value
  return circumference * (1 - progress)
})

// 获取场次信息
const fetchRoundInfo = async () => {
  try {
    const res = await getRoundDetail(roundId.value)
    if (res.code === 0) {
      roundInfo.value = res.data
      duration.value = res.data.duration || 30
    }
  } catch (e) {
    console.error('获取场次信息失败', e)
  }
}

// 连接WebSocket
const connectWebSocket = () => {
  const token = getToken()
  const wsUrl = `${WS_BASE}/ws/game?roundId=${roundId.value}&token=${token}`
  
  try {
    ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log('[WS] 游戏连接成功')
      loading.value = false
    }
    
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleMessage(msg)
      } catch (e) {
        console.error('[WS] 消息解析错误', e)
      }
    }
    
    ws.onclose = () => {
      console.log('[WS] 连接断开')
      // 游戏中断线重连
      if (gameStatus.value === 1) {
        setTimeout(connectWebSocket, 2000)
      }
    }
    
    ws.onerror = (e) => {
      console.error('[WS] 连接错误', e)
      loading.value = false
      errorMsg.value = '连接失败，请重试'
    }
  } catch (e) {
    console.error('[WS] 创建连接失败', e)
    loading.value = false
    errorMsg.value = '连接失败'
  }
}

// 处理消息
const handleMessage = (msg) => {
  switch (msg.type) {
    case 'joined':
      handleJoined(msg.payload)
      break
      
    case 'status':
      handleStatusChange(msg.payload)
      break
      
    case 'error':
      errorMsg.value = msg.payload.message
      break
      
    case 'pong':
      break
  }
}

// 处理加入成功
const handleJoined = (payload) => {
  gameStatus.value = payload.status
  playerCount.value = payload.playerCount
  duration.value = payload.duration || 30
  
  // 如果游戏已在进行中
  if (payload.status === 1 && payload.startTime > 0) {
    startTime.value = payload.startTime
    startGame()
  }
}

// 处理状态变化
const handleStatusChange = (payload) => {
  gameStatus.value = payload.status
  
  if (payload.status === 1) {
    startTime.value = payload.startTime
    duration.value = payload.duration
    startGame()
  } else if (payload.status === 2) {
    endGame()
  }
}

// 开始游戏
const startGame = () => {
  resetCount()
  startListening()
  
  // 计算剩余时间
  const now = Math.floor(Date.now() / 1000)
  const elapsed = now - startTime.value
  remainTime.value = Math.max(0, duration.value - elapsed)
  
  // 启动客户端倒计时
  countdownTimer = setInterval(() => {
    remainTime.value--
    if (remainTime.value <= 0) {
      endGame()
    }
  }, 1000)
  
  // 定时上报分数（每500ms）
  uploadTimer = setInterval(() => {
    uploadScore()
  }, 500)
}

// 结束游戏
const endGame = () => {
  stopListening()
  gameStatus.value = 2
  
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  
  if (uploadTimer) {
    clearInterval(uploadTimer)
    uploadTimer = null
  }
  
  // 最后上报一次
  uploadScore()
}

// 上报分数
const uploadScore = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) return
  if (gameStatus.value !== 1) return
  
  // 只上报增量
  const delta = shakeCount.value - lastUploadedScore
  if (delta > 0) {
    ws.send(JSON.stringify({
      type: 'shake',
      payload: { score: delta }
    }))
    lastUploadedScore = shakeCount.value
  }
}

// 跳转
const goHome = () => router.push('/')
const goToResult = () => router.push(`/shake/result?roundId=${roundId.value}`)

// 初始化
onMounted(async () => {
  if (!roundId.value) {
    errorMsg.value = '无效的游戏链接'
    loading.value = false
    return
  }
  
  // 获取场次信息
  await fetchRoundInfo()
  
  // 连接WebSocket
  connectWebSocket()
})

// 清理
onUnmounted(() => {
  stopListening()
  
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  
  if (uploadTimer) {
    clearInterval(uploadTimer)
  }
  
  if (ws) {
    ws.close()
    ws = null
  }
})
</script>

<style lang="scss" scoped>
.shake-join-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5722, #ff9800);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #fff;
}

// 加载中
.loading-state {
  text-align: center;
  
  p {
    margin-top: 16px;
    font-size: 16px;
  }
}

// 等待开始
.waiting-state {
  text-align: center;
  width: 100%;
  max-width: 400px;
  
  .round-info {
    margin-bottom: 40px;
    
    h1 {
      font-size: 28px;
      margin-bottom: 20px;
    }
    
    .prize-card {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.2);
      padding: 16px 24px;
      border-radius: 16px;
      
      .prize-img {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        object-fit: cover;
      }
      
      .prize-name {
        font-size: 16px;
        font-weight: 600;
      }
    }
  }
  
  .waiting-animation {
    position: relative;
    width: 150px;
    height: 150px;
    margin: 0 auto 30px;
    
    .pulse-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid rgba(255, 255, 255, 0.5);
      animation: pulse-out 2s ease-out infinite;
      
      &.delay-1 { animation-delay: 0.6s; }
      &.delay-2 { animation-delay: 1.2s; }
    }
    
    .phone-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: shake-phone 0.5s ease-in-out infinite;
    }
  }
  
  .waiting-text {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 10px;
  }
  
  .waiting-hint {
    font-size: 14px;
    opacity: 0.8;
  }
  
  .player-count {
    margin-top: 40px;
    padding: 12px 24px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    font-size: 14px;
  }
}

// 游戏中
.playing-state {
  text-align: center;
  
  .countdown-ring {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 30px;
    
    svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
      
      circle {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        
        &.bg {
          stroke: rgba(255, 255, 255, 0.2);
        }
        
        &.progress {
          stroke: #fff;
          stroke-dasharray: 282.74;
          transition: stroke-dashoffset 1s linear;
        }
      }
    }
    
    .countdown-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 36px;
      font-weight: bold;
    }
  }
  
  .score-display {
    margin-bottom: 20px;
    
    .score-value {
      font-size: 80px;
      font-weight: bold;
      line-height: 1;
    }
    
    .score-label {
      font-size: 24px;
      margin-left: 8px;
    }
  }
  
  .shake-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 18px;
    animation: blink 0.5s infinite;
  }
}

// 游戏结束
.finished-state {
  text-align: center;
  width: 100%;
  max-width: 400px;
  
  .result-icon {
    font-size: 80px;
    margin-bottom: 20px;
  }
  
  h1 {
    font-size: 28px;
    margin-bottom: 20px;
  }
  
  .my-score {
    margin-bottom: 30px;
    font-size: 18px;
  }
}

// 错误状态
.error-state {
  text-align: center;
  
  p {
    margin: 20px 0 30px;
    font-size: 16px;
  }
}

// 动画
@keyframes pulse-out {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes shake-phone {
  0%, 100% { transform: translate(-50%, -50%) rotate(-10deg); }
  50% { transform: translate(-50%, -50%) rotate(10deg); }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
