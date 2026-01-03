<template>
  <div class="playing-page">
    <!-- 倒计时 -->
    <div class="countdown-section">
      <div class="countdown-ring">
        <CountDown 
          ref="countdownRef"
          :time="gameStore.remainTime" 
          large
          format="ss"
          @finish="onGameEnd"
          @change="onTimeChange"
        />
      </div>
    </div>

    <!-- 分数显示 -->
    <div class="score-section">
      <div class="score-box">
        <span class="label">我的次数</span>
        <span class="score">{{ gameStore.shakeCount }}</span>
      </div>
      <div class="rank-box" v-if="gameStore.myRank > 0">
        <span class="label">当前排名</span>
        <span class="rank">第 {{ gameStore.myRank }} 名</span>
      </div>
    </div>

    <!-- 手机摇动动画 -->
    <div class="shake-animation">
      <div class="phone-wrap" :class="{ 'phone-shake': isShaking }">
        <van-icon name="phone-o" size="120" color="#fff" />
      </div>
      <p class="tips">用力摇动手机！</p>
    </div>

    <!-- 实时排名（底部） -->
    <div class="mini-ranking" v-if="gameStore.ranking.length">
      <div class="ranking-header">
        <span>实时排名</span>
      </div>
      <div class="ranking-scroll">
        <div 
          v-for="(item, index) in gameStore.ranking.slice(0, 5)" 
          :key="item.userId"
          class="ranking-item"
          :class="{ 'is-me': item.userId === userStore.userId }"
        >
          <span class="rank">{{ index + 1 }}</span>
          <span class="name">{{ item.user?.realName || '***' }}</span>
          <span class="score">{{ item.score }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useGameStore } from '@/store'
import { submitScore, getRanking } from '@/api/shake'
import { getShakeDetector, destroyShakeDetector } from '@/utils/shake'
import CountDown from '@/components/common/CountDown.vue'

const router = useRouter()
const userStore = useUserStore()
const gameStore = useGameStore()

const countdownRef = ref(null)
const isShaking = ref(false)

let shakeDetector = null
let scoreTimer = null
let shakeTimer = null

// 初始化摇一摇
const initShake = async () => {
  shakeDetector = getShakeDetector({
    threshold: 12,
    onShake: (count) => {
      gameStore.setShakeCount(count)
      triggerShakeAnimation()
    }
  })
  
  await shakeDetector.start()
}

// 触发摇动动画
const triggerShakeAnimation = () => {
  isShaking.value = true
  if (shakeTimer) clearTimeout(shakeTimer)
  shakeTimer = setTimeout(() => {
    isShaking.value = false
  }, 200)
}

// 定时提交分数
const startScoreTimer = () => {
  scoreTimer = setInterval(async () => {
    if (gameStore.shakeCount > 0) {
      try {
        await submitScore({
          roundId: gameStore.roundId,
          score: gameStore.shakeCount
        })
        // 获取排名
        const res = await getRanking(gameStore.roundId, 10)
        gameStore.updateRanking(res.data || [])
        
        // 更新我的排名
        const myRank = res.data?.findIndex(r => r.userId === userStore.userId)
        if (myRank > -1) {
          gameStore.updateMyRank(myRank + 1)
        }
      } catch (e) {
        console.error('提交分数失败:', e)
      }
    }
  }, 1500)
}

// 时间变化
const onTimeChange = (time) => {
  gameStore.updateRemainTime(time)
}

// 游戏结束
const onGameEnd = async () => {
  // 提交最终分数
  try {
    await submitScore({
      roundId: gameStore.roundId,
      score: gameStore.shakeCount
    })
  } catch (e) {
    console.error('提交最终分数失败:', e)
  }
  
  gameStore.endGame()
  router.replace('/shake/result')
}

onMounted(() => {
  initShake()
  startScoreTimer()
})

onUnmounted(() => {
  if (scoreTimer) clearInterval(scoreTimer)
  if (shakeTimer) clearTimeout(shakeTimer)
  destroyShakeDetector()
})
</script>

<style lang="scss" scoped>
.playing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5722 0%, #e91e63 100%);
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.countdown-section {
  margin-bottom: 30px;
  
  .countdown-ring {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid #fff;
    
    :deep(.countdown-number) {
      font-size: 56px;
      color: #fff;
    }
  }
}

.score-section {
  display: flex;
  gap: 40px;
  margin-bottom: 40px;
  
  .score-box,
  .rank-box {
    text-align: center;
    
    .label {
      display: block;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 8px;
    }
    
    .score {
      font-size: 48px;
      font-weight: bold;
      color: #fff;
    }
    
    .rank {
      font-size: 24px;
      font-weight: bold;
      color: #ffeb3b;
    }
  }
}

.shake-animation {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  .phone-wrap {
    width: 160px;
    height: 160px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    transition: transform 0.1s;
    
    &.phone-shake {
      animation: phoneShake 0.15s ease-in-out;
    }
  }
  
  .tips {
    font-size: 18px;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
}

@keyframes phoneShake {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

.mini-ranking {
  width: 100%;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 16px;
  
  .ranking-header {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 12px;
  }
  
  .ranking-scroll {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .ranking-item {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    
    &.is-me {
      background: rgba(255, 235, 59, 0.3);
    }
    
    .rank {
      width: 24px;
      font-size: 14px;
      font-weight: bold;
      color: #ffeb3b;
    }
    
    .name {
      flex: 1;
      font-size: 14px;
      color: #fff;
    }
    
    .score {
      font-size: 14px;
      font-weight: bold;
      color: #fff;
    }
  }
}
</style>
