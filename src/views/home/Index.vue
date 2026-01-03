<template>
  <div class="home-page">
    <!-- 头部 -->
    <div class="home-header">
      <div class="user-info" @click="goProfile">
        <van-image
          round
          width="44"
          height="44"
          :src="userStore.avatar || defaultAvatar"
          fit="cover"
        />
        <div class="user-name">
          <span class="nickname">{{ userStore.userInfo?.realName || userStore.nickname }}</span>
          <span class="department">{{ userStore.userInfo?.department }}</span>
        </div>
      </div>
      <div class="activity-title">
        <h1>{{ activityStore.activityTitle }}</h1>
        <van-tag v-if="activityStore.isOngoing" type="success">进行中</van-tag>
        <van-tag v-else-if="activityStore.activityStatus === 0" type="warning">未开始</van-tag>
        <van-tag v-else type="default">已结束</van-tag>
      </div>
    </div>

    <!-- 功能菜单 -->
    <div class="menu-grid">
      <div class="menu-item" @click="goCheckIn" v-if="activityStore.checkInEnabled">
        <div class="menu-icon checkin">
          <van-icon name="certificate" size="32" />
        </div>
        <span class="menu-text">签到</span>
      </div>
      
      <div class="menu-item" @click="goDanmaku" v-if="activityStore.danmakuEnabled">
        <div class="menu-icon danmaku">
          <van-icon name="comment-o" size="32" />
        </div>
        <span class="menu-text">弹幕互动</span>
      </div>
      
      <div class="menu-item" @click="goShake">
        <div class="menu-icon shake">
          <van-icon name="gift-o" size="32" />
        </div>
        <span class="menu-text">摇一摇</span>
      </div>
      
      <div class="menu-item" @click="goPrize">
        <div class="menu-icon prize">
          <van-icon name="award-o" size="32" />
        </div>
        <span class="menu-text">我的奖品</span>
      </div>
    </div>

    <!-- 活动信息 -->
    <van-cell-group inset class="activity-info">
      <van-cell title="活动时间">
        <template #value>
          <span v-if="activityStore.startTime">
            {{ formatDate(activityStore.startTime, 'MM-DD HH:mm') }}
            至
            {{ formatDate(activityStore.endTime, 'MM-DD HH:mm') }}
          </span>
          <span v-else>待定</span>
        </template>
      </van-cell>
    </van-cell-group>

    <!-- 公告栏 -->
    <van-notice-bar
      v-if="notice"
      left-icon="volume-o"
      :text="notice"
      class="notice-bar"
    />

    <!-- 最新动态 -->
    <div class="recent-section">
      <div class="section-header">
        <span class="title">最新动态</span>
      </div>
      <div class="recent-list">
        <div v-for="item in recentList" :key="item.id" class="recent-item">
          <van-image
            round
            width="32"
            height="32"
            :src="item.avatar || defaultAvatar"
            fit="cover"
          />
          <div class="recent-content">
            <span class="name">{{ item.name }}</span>
            <span class="action">{{ item.action }}</span>
          </div>
          <span class="time">{{ formatRelativeTime(item.time) }}</span>
        </div>
        <van-empty v-if="!recentList.length" description="暂无动态" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useActivityStore } from '@/store'
import { formatDate, formatRelativeTime } from '@/utils/format'

const router = useRouter()
const userStore = useUserStore()
const activityStore = useActivityStore()

const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const notice = ref('欢迎参加公司年会，祝大家新年快乐！')
const recentList = ref([])

// 导航方法
const goProfile = () => {
  // 可以跳转到个人中心
}

const goCheckIn = () => {
  router.push('/checkin')
}

const goDanmaku = () => {
  router.push('/danmaku')
}

const goShake = () => {
  router.push('/shake')
}

const goPrize = () => {
  router.push('/prize')
}

// 加载数据
onMounted(async () => {
  // 获取当前活动
  await activityStore.fetchCurrentActivity()
  
  // 模拟最新动态数据
  recentList.value = [
    { id: 1, name: '张三', action: '完成了签到', time: new Date(), avatar: '' },
    { id: 2, name: '李四', action: '发送了弹幕', time: new Date(Date.now() - 60000), avatar: '' },
    { id: 3, name: '王五', action: '在摇一摇中获得三等奖', time: new Date(Date.now() - 120000), avatar: '' }
  ]
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.home-header {
  background: linear-gradient(135deg, #ff5722 0%, #ff8a65 100%);
  padding: 20px 16px 40px;
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    .user-name {
      margin-left: 12px;
      
      .nickname {
        display: block;
        font-size: 16px;
        font-weight: bold;
        color: #fff;
      }
      
      .department {
        display: block;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.8);
        margin-top: 2px;
      }
    }
  }
  
  .activity-title {
    display: flex;
    align-items: center;
    gap: 8px;
    
    h1 {
      font-size: 22px;
      color: #fff;
      font-weight: bold;
    }
  }
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin: -30px 16px 0;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .menu-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .menu-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 8px;
      
      &.checkin {
        background: linear-gradient(135deg, #4caf50, #8bc34a);
        color: #fff;
      }
      
      &.danmaku {
        background: linear-gradient(135deg, #2196f3, #03a9f4);
        color: #fff;
      }
      
      &.shake {
        background: linear-gradient(135deg, #ff5722, #ff9800);
        color: #fff;
      }
      
      &.prize {
        background: linear-gradient(135deg, #9c27b0, #e91e63);
        color: #fff;
      }
    }
    
    .menu-text {
      font-size: 12px;
      color: #333;
    }
  }
}

.activity-info {
  margin: 16px;
}

.notice-bar {
  margin: 0 16px;
  border-radius: 8px;
}

.recent-section {
  margin: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  
  .section-header {
    margin-bottom: 16px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
  }
  
  .recent-list {
    .recent-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .recent-content {
        flex: 1;
        margin-left: 12px;
        
        .name {
          font-size: 14px;
          color: #333;
          margin-right: 4px;
        }
        
        .action {
          font-size: 14px;
          color: #666;
        }
      }
      
      .time {
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
