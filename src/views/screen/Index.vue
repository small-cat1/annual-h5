<template>
  <div class="screen-index">
    <div class="screen-header">
      <h1>{{ activityStore.activityTitle }}</h1>
      <p class="subtitle">年会互动大屏</p>
    </div>
    
    <div class="screen-menu">
      <div class="menu-item" @click="goScreen('checkin')">
        <div class="menu-icon" style="background: linear-gradient(135deg, #4caf50, #8bc34a)">
          <van-icon name="certificate" size="48" />
        </div>
        <h3>签到墙</h3>
        <p>实时展示签到信息</p>
      </div>
      
      <div class="menu-item" @click="goScreen('danmaku')">
        <div class="menu-icon" style="background: linear-gradient(135deg, #2196f3, #03a9f4)">
          <van-icon name="comment-o" size="48" />
        </div>
        <h3>弹幕墙</h3>
        <p>互动弹幕展示</p>
      </div>
      
      <div class="menu-item" @click="goScreen('shake')">
        <div class="menu-icon" style="background: linear-gradient(135deg, #ff5722, #ff9800)">
          <van-icon name="fire-o" size="48" />
        </div>
        <h3>摇一摇</h3>
        <p>实时排行榜</p>
      </div>
      
      <div class="menu-item" @click="goScreen('draw')">
        <div class="menu-icon" style="background: linear-gradient(135deg, #9c27b0, #e91e63)">
          <van-icon name="gift-o" size="48" />
        </div>
        <h3>抽奖大屏</h3>
        <p>幸运抽奖展示</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivityStore } from '@/store'

const router = useRouter()
const activityStore = useActivityStore()

const goScreen = (type) => {
  router.push(`/screen/${type}`)
}

onMounted(() => {
  activityStore.fetchCurrentActivity()
})
</script>

<style lang="scss" scoped>
.screen-index {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 40px 20px;
}

.screen-header {
  text-align: center;
  margin-bottom: 60px;
  
  h1 {
    font-size: 36px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 12px;
  }
  
  .subtitle {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
  }
}

.screen-menu {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 600px;
  margin: 0 auto;
  
  .menu-item {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 30px 20px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.3s, background 0.3s;
    
    &:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.15);
    }
    
    .menu-icon {
      width: 80px;
      height: 80px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: #fff;
    }
    
    h3 {
      font-size: 20px;
      font-weight: bold;
      color: #fff;
      margin-bottom: 8px;
    }
    
    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
}
</style>
