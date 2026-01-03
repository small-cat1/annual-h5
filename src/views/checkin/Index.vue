<template>
  <div class="checkin-page">
    <van-nav-bar title="签到" left-arrow @click-left="$router.back()" />
    
    <div class="checkin-content">
      <!-- 签到状态 -->
      <div class="checkin-status">
        <!-- 已签到 -->
        <div v-if="isCheckedIn" class="status-box checked">
          <div class="check-icon checkin-success">
            <van-icon name="success" size="64" />
          </div>
          <h2>签到成功</h2>
          <p>签到时间：{{ formatDate(checkInTime) }}</p>
        </div>
        
        <!-- 未签到 -->
        <div v-else class="status-box unchecked">
          <div 
            class="check-btn" 
            :class="{ disabled: !canCheckIn, pulse: canCheckIn }"
            @click="handleCheckIn"
          >
            <span class="btn-text">{{ canCheckIn ? '点击签到' : '暂未开放' }}</span>
          </div>
          <p class="tips">{{ canCheckIn ? '点击上方按钮完成签到' : '签到功能暂未开放' }}</p>
        </div>
      </div>

      <!-- 签到统计 -->
      <van-cell-group inset class="stats-group">
        <van-cell title="已签到人数" :value="`${stats.checkedCount} 人`" />
        <van-cell title="签到率" :value="`${stats.checkRate}%`" />
      </van-cell-group>

      <!-- 签到动态 -->
      <div class="checkin-list">
        <div class="list-header">
          <span class="title">签到动态</span>
        </div>
        <div class="list-content">
          <div v-for="item in recentCheckIns" :key="item.id" class="checkin-item">
            <van-image
              round
              width="36"
              height="36"
              :src="item.user?.avatar || defaultAvatar"
              fit="cover"
            />
            <div class="item-info">
              <span class="name">{{ item.user?.realName || item.user?.nickname }}</span>
              <span class="time">{{ formatRelativeTime(item.checkInTime) }}</span>
            </div>
          </div>
          <van-empty v-if="!recentCheckIns.length" description="暂无签到记录" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { useActivityStore } from '@/store'
import { checkIn, getCheckInStatus, getRecentCheckIns, getCheckInStats } from '@/api/checkIn'
import { formatDate, formatRelativeTime } from '@/utils/format'

const activityStore = useActivityStore()
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const isCheckedIn = ref(false)
const checkInTime = ref(null)
const loading = ref(false)
const recentCheckIns = ref([])
const stats = reactive({
  checkedCount: 0,
  totalCount: 0,
  checkRate: 0
})

const canCheckIn = computed(() => {
  return activityStore.isOngoing && activityStore.checkInEnabled
})

const handleCheckIn = async () => {
  if (!canCheckIn.value || loading.value || isCheckedIn.value) return
  
  loading.value = true
  try {
    const res = await checkIn({ activityId: activityStore.activityId })
    isCheckedIn.value = true
    checkInTime.value = res.data.checkInTime || new Date()
    
    showSuccessToast('签到成功')
    
    // 刷新统计
    fetchStats()
    fetchRecentCheckIns()
  } catch (error) {
    console.error('签到失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchCheckInStatus = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getCheckInStatus(activityStore.activityId)
    isCheckedIn.value = res.data.isCheckedIn
    checkInTime.value = res.data.checkInTime
  } catch (error) {
    console.error('获取签到状态失败:', error)
  }
}

const fetchStats = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getCheckInStats(activityStore.activityId)
    Object.assign(stats, res.data)
  } catch (error) {
    console.error('获取统计失败:', error)
  }
}

const fetchRecentCheckIns = async () => {
  if (!activityStore.activityId) return
  
  try {
    const res = await getRecentCheckIns(activityStore.activityId, 20)
    recentCheckIns.value = res.data || []
  } catch (error) {
    console.error('获取签到列表失败:', error)
  }
}

onMounted(async () => {
  await activityStore.fetchCurrentActivity()
  fetchCheckInStatus()
  fetchStats()
  fetchRecentCheckIns()
})
</script>

<style lang="scss" scoped>
.checkin-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.checkin-content {
  padding: 20px 16px;
}

.checkin-status {
  background: #fff;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  margin-bottom: 16px;
  
  .status-box {
    &.checked {
      .check-icon {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4caf50, #8bc34a);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }
      
      h2 {
        font-size: 24px;
        color: #4caf50;
        margin-bottom: 8px;
      }
      
      p {
        font-size: 14px;
        color: #666;
      }
    }
    
    &.unchecked {
      .check-btn {
        width: 140px;
        height: 140px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff5722, #ff8a65);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 4px 20px rgba(255, 87, 34, 0.4);
        
        &:active {
          transform: scale(0.95);
        }
        
        &.disabled {
          background: #ccc;
          box-shadow: none;
          cursor: not-allowed;
        }
        
        .btn-text {
          font-size: 20px;
          font-weight: bold;
          color: #fff;
        }
      }
      
      .tips {
        font-size: 14px;
        color: #999;
      }
    }
  }
}

.stats-group {
  margin-bottom: 16px;
}

.checkin-list {
  background: #fff;
  border-radius: 16px;
  padding: 16px;
  
  .list-header {
    margin-bottom: 16px;
    
    .title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
  }
  
  .list-content {
    max-height: 400px;
    overflow-y: auto;
    
    .checkin-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-info {
        flex: 1;
        margin-left: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .name {
          font-size: 14px;
          color: #333;
        }
        
        .time {
          font-size: 12px;
          color: #999;
        }
      }
    }
  }
}
</style>
