<template>
  <div class="screen-checkin">
    <!-- 标题 -->
    <div class="screen-title">
      <h1>签到墙</h1>
      <div class="stats">
        <span class="count">{{ stats.checkedCount }}</span>
        <span class="label">人已签到</span>
      </div>
    </div>
    
    <!-- 签到头像墙 -->
    <div class="avatar-wall">
      <div 
        v-for="(item, index) in checkInList" 
        :key="item.id"
        class="avatar-item fade-in-up"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <van-image
          round
          width="60"
          height="60"
          :src="item.user?.avatar || defaultAvatar"
          fit="cover"
        />
        <span class="name">{{ item.user?.realName || item.user?.nickname }}</span>
      </div>
    </div>
    
    <!-- 最新签到滚动 -->
    <div class="recent-scroll" v-if="recentCheckIns.length">
      <div class="scroll-content">
        <div 
          v-for="item in recentCheckIns" 
          :key="item.id"
          class="scroll-item"
        >
          <van-image
            round
            width="32"
            height="32"
            :src="item.user?.avatar || defaultAvatar"
            fit="cover"
          />
          <span>{{ item.user?.realName || item.user?.nickname }} 签到成功</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useActivityStore } from '@/store'
import { getCheckInList, getCheckInStats, getRecentCheckIns } from '@/api/checkIn'
import websocket from '@/utils/websocket'

const activityStore = useActivityStore()
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const checkInList = ref([])
const recentCheckIns = ref([])
const stats = reactive({
  checkedCount: 0,
  totalCount: 0
})

let refreshTimer = null

// 获取签到列表
const fetchCheckInList = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getCheckInList(activityStore.activityId, { page: 1, pageSize: 100 })
    checkInList.value = res.data?.list || []
  } catch (error) {
    console.error('获取签到列表失败:', error)
  }
}

// 获取统计
const fetchStats = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getCheckInStats(activityStore.activityId)
    Object.assign(stats, res.data)
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

// 获取最新签到
const fetchRecent = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getRecentCheckIns(activityStore.activityId, 10)
    recentCheckIns.value = res.data || []
  } catch (error) {
    console.error('获取最新签到失败:', error)
  }
}

// WebSocket 监听新签到
const setupWebSocket = () => {
  const wsUrl = import.meta.env.VITE_APP_WS_URL + '/screen/checkin'
  websocket.connect(wsUrl)
  
  websocket.on('new_checkin', (data) => {
    // 添加到列表头部
    checkInList.value.unshift(data)
    recentCheckIns.value.unshift(data)
    
    // 保持列表长度
    if (checkInList.value.length > 100) {
      checkInList.value.pop()
    }
    if (recentCheckIns.value.length > 10) {
      recentCheckIns.value.pop()
    }
    
    // 更新统计
    stats.checkedCount++
  })
}

onMounted(async () => {
  await activityStore.fetchCurrentActivity()
  fetchCheckInList()
  fetchStats()
  fetchRecent()
  setupWebSocket()
  
  // 定时刷新
  refreshTimer = setInterval(() => {
    fetchStats()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  websocket.close()
})
</script>

<style lang="scss" scoped>
.screen-checkin {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 40px;
  display: flex;
  flex-direction: column;
}

.screen-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  
  h1 {
    font-size: 36px;
    font-weight: bold;
    color: #fff;
  }
  
  .stats {
    text-align: right;
    
    .count {
      font-size: 48px;
      font-weight: bold;
      color: #4caf50;
    }
    
    .label {
      display: block;
      font-size: 16px;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.avatar-wall {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-content: flex-start;
  overflow: hidden;
  
  .avatar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .name {
      margin-top: 8px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.recent-scroll {
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  overflow: hidden;
  margin-top: 20px;
  
  .scroll-content {
    display: flex;
    gap: 40px;
    padding: 14px 20px;
    animation: scrollLeft 20s linear infinite;
  }
  
  .scroll-item {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    
    span {
      font-size: 14px;
      color: #fff;
    }
  }
}

@keyframes scrollLeft {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}
</style>
