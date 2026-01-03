<template>
  <div class="screen-draw">
    <!-- 标题 -->
    <div class="screen-title">
      <h1>幸运抽奖</h1>
    </div>
    
    <!-- 奖品展示 -->
    <div class="prize-showcase" v-if="currentPrize">
      <van-image
        width="200"
        height="200"
        radius="20"
        :src="currentPrize.image"
        fit="cover"
        class="prize-image"
      />
      <h2 class="prize-name">{{ currentPrize.name }}</h2>
      <van-tag :type="getLevelTagType(currentPrize.level)" size="large">
        {{ formatPrizeLevel(currentPrize.level) }}
      </van-tag>
    </div>
    
    <!-- 抽奖动画区域 -->
    <div class="draw-area">
      <!-- 滚动名单 -->
      <div v-if="isDrawing" class="rolling-names">
        <div 
          v-for="(item, index) in rollingUsers" 
          :key="index"
          class="rolling-item"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <van-image
            round
            width="60"
            height="60"
            :src="item.avatar || defaultAvatar"
            fit="cover"
          />
          <span class="name">{{ item.realName || item.nickname }}</span>
        </div>
      </div>
      
      <!-- 中奖者展示 -->
      <div v-else-if="winners.length" class="winners-display">
        <div 
          v-for="winner in winners" 
          :key="winner.id"
          class="winner-item celebrate"
        >
          <div class="winner-avatar">
            <van-image
              round
              width="100"
              height="100"
              :src="winner.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <div class="confetti">🎉</div>
          </div>
          <h3 class="winner-name">{{ winner.user?.realName }}</h3>
          <p class="winner-dept">{{ winner.user?.department }}</p>
        </div>
      </div>
      
      <!-- 等待状态 -->
      <div v-else class="waiting-state">
        <van-icon name="gift-o" size="80" color="rgba(255,255,255,0.5)" />
        <p>等待开始抽奖</p>
      </div>
    </div>
    
    <!-- 已中奖名单 -->
    <div class="winner-list" v-if="allWinners.length">
      <div class="list-header">
        <span>已中奖名单</span>
      </div>
      <div class="list-content">
        <div 
          v-for="item in allWinners" 
          :key="item.id"
          class="winner-tag"
        >
          <van-image
            round
            width="24"
            height="24"
            :src="item.user?.avatar || defaultAvatar"
            fit="cover"
          />
          <span>{{ item.user?.realName }}</span>
          <van-tag size="mini" type="warning">{{ item.prize?.name }}</van-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useActivityStore } from '@/store'
import { getRecentWinnings, getPrizeList } from '@/api/prize'
import { formatPrizeLevel } from '@/utils/format'
import websocket from '@/utils/websocket'

const activityStore = useActivityStore()
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const currentPrize = ref(null)
const isDrawing = ref(false)
const rollingUsers = ref([])
const winners = ref([])
const allWinners = ref([])

const getLevelTagType = (level) => {
  const types = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'success',
    5: 'default'
  }
  return types[level] || 'default'
}

// 获取最近中奖记录
const fetchRecentWinners = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getRecentWinnings(activityStore.activityId, 20)
    allWinners.value = res.data || []
  } catch (error) {
    console.error('获取中奖记录失败:', error)
  }
}

// 开始滚动动画
const startRolling = (users, prize) => {
  currentPrize.value = prize
  rollingUsers.value = users
  isDrawing.value = true
  winners.value = []
}

// 停止滚动，显示中奖者
const stopRolling = (winnerList) => {
  isDrawing.value = false
  winners.value = winnerList
  
  // 添加到已中奖名单
  allWinners.value = [...winnerList, ...allWinners.value]
}

// WebSocket 监听
const setupWebSocket = () => {
  const wsUrl = import.meta.env.VITE_APP_WS_URL + '/screen/draw'
  websocket.connect(wsUrl)
  
  // 开始抽奖
  websocket.on('draw_start', (data) => {
    startRolling(data.candidates, data.prize)
  })
  
  // 抽奖结果
  websocket.on('draw_result', (data) => {
    stopRolling(data.winners)
  })
  
  // 滚动更新（用于动画效果）
  websocket.on('rolling_update', (data) => {
    rollingUsers.value = data.users
  })
  
  // 重置
  websocket.on('draw_reset', () => {
    isDrawing.value = false
    winners.value = []
    currentPrize.value = null
  })
}

onMounted(async () => {
  await activityStore.fetchCurrentActivity()
  fetchRecentWinners()
  setupWebSocket()
})

onUnmounted(() => {
  websocket.close()
})
</script>

<style lang="scss" scoped>
.screen-draw {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.screen-title {
  margin-bottom: 40px;
  
  h1 {
    font-size: 48px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  }
}

.prize-showcase {
  text-align: center;
  margin-bottom: 40px;
  
  .prize-image {
    margin-bottom: 16px;
    box-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
  }
  
  .prize-name {
    font-size: 28px;
    color: #ffd700;
    margin-bottom: 12px;
  }
}

.draw-area {
  flex: 1;
  width: 100%;
  max-width: 800px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rolling-names {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  
  .rolling-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: rollIn 0.3s ease-out;
    
    .name {
      margin-top: 8px;
      font-size: 14px;
      color: #fff;
    }
  }
}

@keyframes rollIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.winners-display {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
  
  .winner-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .winner-avatar {
      position: relative;
      
      .confetti {
        position: absolute;
        top: -20px;
        right: -20px;
        font-size: 40px;
        animation: bounce 1s ease infinite;
      }
    }
    
    .winner-name {
      margin-top: 16px;
      font-size: 24px;
      font-weight: bold;
      color: #ffd700;
    }
    
    .winner-dept {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.waiting-state {
  text-align: center;
  
  p {
    margin-top: 20px;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.5);
  }
}

.winner-list {
  width: 100%;
  margin-top: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  
  .list-header {
    margin-bottom: 12px;
    
    span {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
  
  .list-content {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    
    .winner-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      
      span {
        font-size: 14px;
        color: #fff;
      }
    }
  }
}
</style>
