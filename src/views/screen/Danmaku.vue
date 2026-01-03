<template>
  <div class="screen-danmaku">
    <!-- 标题 -->
    <div class="screen-title">
      <h1>{{ activityStore.activityTitle }}</h1>
      <p class="subtitle">弹幕互动墙</p>
    </div>
    
    <!-- 弹幕区域 -->
    <div class="danmaku-area" ref="danmakuAreaRef">
      <div 
        v-for="item in displayDanmaku" 
        :key="item.id"
        class="danmaku-item"
        :style="getDanmakuStyle(item)"
      >
        <div class="danmaku-content" :style="{ borderColor: item.color }">
          <van-image
            round
            width="32"
            height="32"
            :src="item.user?.avatar || defaultAvatar"
            fit="cover"
          />
          <span class="text" :style="{ color: item.color }">{{ item.content }}</span>
        </div>
      </div>
    </div>
    
    <!-- 置顶弹幕 -->
    <div class="top-danmaku" v-if="topDanmaku">
      <div class="top-content pulse">
        <van-icon name="fire-o" color="#ff5722" />
        <span>{{ topDanmaku.content }}</span>
        <span class="author">—— {{ topDanmaku.user?.realName }}</span>
      </div>
    </div>
    
    <!-- 二维码 -->
    <div class="qrcode-box">
      <qrcode-vue
        :value="danmakuUrl"
        :size="100"
        level="M"
      />
      <p>扫码发弹幕</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { useActivityStore } from '@/store'
import { getRecentDanmaku, getTopDanmaku } from '@/api/danmaku'
import websocket from '@/utils/websocket'

const activityStore = useActivityStore()
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const displayDanmaku = ref([])
const topDanmaku = ref(null)
const danmakuAreaRef = ref(null)

// 弹幕发送页面URL
const danmakuUrl = `${window.location.origin}/danmaku`

// 生成随机弹幕样式
const getDanmakuStyle = (item) => {
  return {
    top: `${item.top || Math.random() * 70 + 10}%`,
    animationDuration: `${12 + Math.random() * 6}s`,
    animationDelay: `${item.delay || 0}s`,
    fontSize: `${18 + Math.random() * 8}px`
  }
}

// 添加弹幕
const addDanmaku = (item) => {
  const danmaku = {
    ...item,
    id: item.id || Date.now() + Math.random(),
    top: Math.random() * 70 + 10,
    delay: 0
  }
  
  displayDanmaku.value.push(danmaku)
  
  // 动画结束后移除
  setTimeout(() => {
    const index = displayDanmaku.value.findIndex(d => d.id === danmaku.id)
    if (index > -1) {
      displayDanmaku.value.splice(index, 1)
    }
  }, 18000)
}

// 获取历史弹幕
const fetchDanmaku = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getRecentDanmaku(activityStore.activityId, 30)
    const list = res.data || []
    
    // 依次添加历史弹幕
    list.forEach((item, index) => {
      setTimeout(() => {
        addDanmaku(item)
      }, index * 800)
    })
  } catch (error) {
    console.error('获取弹幕失败:', error)
  }
}

// 获取置顶弹幕
const fetchTopDanmaku = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getTopDanmaku(activityStore.activityId)
    topDanmaku.value = res.data
  } catch (error) {
    console.error('获取置顶弹幕失败:', error)
  }
}

// WebSocket 监听
const setupWebSocket = () => {
  const wsUrl = import.meta.env.VITE_APP_WS_URL + '/screen/danmaku'
  websocket.connect(wsUrl)
  
  websocket.on('new_danmaku', (data) => {
    addDanmaku(data)
  })
  
  websocket.on('top_danmaku', (data) => {
    topDanmaku.value = data
  })
}

onMounted(async () => {
  await activityStore.fetchCurrentActivity()
  fetchDanmaku()
  fetchTopDanmaku()
  setupWebSocket()
})

onUnmounted(() => {
  websocket.close()
})
</script>

<style lang="scss" scoped>
.screen-danmaku {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  position: relative;
  overflow: hidden;
}

.screen-title {
  position: absolute;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 10;
  
  h1 {
    font-size: 42px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 2px 20px rgba(0, 0, 0, 0.5);
  }
  
  .subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 8px;
  }
}

.danmaku-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  
  .danmaku-item {
    position: absolute;
    left: 100%;
    white-space: nowrap;
    animation: danmakuFly 15s linear forwards;
    
    .danmaku-content {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px 8px 8px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 30px;
      border: 2px solid;
      
      .text {
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }
    }
  }
}

@keyframes danmakuFly {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100% - 100vw));
  }
}

.top-danmaku {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  
  .top-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 32px;
    background: linear-gradient(135deg, rgba(255, 87, 34, 0.9), rgba(255, 152, 0, 0.9));
    border-radius: 40px;
    box-shadow: 0 4px 30px rgba(255, 87, 34, 0.5);
    
    span {
      font-size: 24px;
      color: #fff;
      font-weight: bold;
    }
    
    .author {
      font-size: 16px;
      opacity: 0.8;
    }
  }
}

.qrcode-box {
  position: absolute;
  bottom: 40px;
  right: 40px;
  background: #fff;
  padding: 16px;
  border-radius: 16px;
  text-align: center;
  
  p {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
  }
}
</style>
